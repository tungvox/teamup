import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<void> => {
  logger.log('Sending friend request:', { fromUserId, toUserId });
  
  // Try using the database function first (bypasses RLS)
  const { data: functionResult, error: functionError } = await supabase
    .rpc('send_friend_request', {
      p_from_user_id: fromUserId,
      p_to_user_id: toUserId
    });
  
  if (!functionError) {
    logger.log('Friend request sent successfully via database function');
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select('friend_requests')
      .eq('clerk_id', toUserId)
      .single();
    
    if (verifyError) {
      logger.error('Error verifying friend request:', verifyError);
    } else {
      logger.debug('Verified friend_requests in database');
    }
    return;
  }
  
  // Fallback to direct update if function doesn't exist
  logger.warn('Database function not available, using direct update. Error:', functionError);
  
  // If function doesn't exist (42883 error code), provide helpful message
  if (functionError.code === '42883' || functionError.message?.includes('does not exist')) {
    throw new Error('Database function send_friend_request does not exist. Please run the fix_friend_requests_rls.sql migration in Supabase SQL Editor.');
  }
  
  // Get the target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('user_profiles')
    .select('friend_requests, friends')
    .eq('clerk_id', toUserId)
    .single();
  
  if (fetchError || !targetUser) {
    logger.error('Error fetching target user:', fetchError);
    throw new Error('User not found');
  }
  
  logger.debug('Target user current friend_requests:', targetUser.friend_requests);
  
  // Check if already friends
  if (targetUser.friends?.includes(fromUserId)) {
    throw new Error('Already friends');
  }
  
  // Check if request already sent
  if (targetUser.friend_requests?.includes(fromUserId)) {
    throw new Error('Friend request already sent');
  }
  
  // Add to friend requests
  const updatedRequests = [...(targetUser.friend_requests || []), fromUserId];
  logger.debug('Updated friend_requests array:', updatedRequests);
  
  const { data: updateData, error } = await supabase
    .from('user_profiles')
    .update({ friend_requests: updatedRequests })
    .eq('clerk_id', toUserId)
    .select('friend_requests');
  
  if (error) {
    logger.error('Error updating friend requests:', error);
    
    // Check if it's an RLS error
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error('Permission denied: RLS policy is blocking the update. Please run the fix_friend_requests_rls.sql migration in Supabase SQL Editor to create the database function that bypasses RLS.');
    }
    
    throw new Error(`Failed to send friend request: ${error.message}. Error code: ${error.code}. Please run the fix_friend_requests_rls.sql migration.`);
  }
  
  logger.log('Friend request saved successfully');
  
  // Verify the update
  const { data: verifyData, error: verifyError } = await supabase
    .from('user_profiles')
    .select('friend_requests')
    .eq('clerk_id', toUserId)
    .single();
  
  if (verifyError) {
    logger.error('Error verifying friend request:', verifyError);
    throw new Error('Friend request may not have been saved. Please check the database.');
  } else {
    logger.debug('Verified friend_requests in database');
    if (!verifyData?.friend_requests?.includes(fromUserId)) {
      logger.error('CRITICAL: Friend request was not saved to database!');
      throw new Error('Friend request was not saved to the database. This is likely an RLS policy issue. Please run the fix_friend_requests_rls.sql migration.');
    }
  }
};

export const acceptFriendRequest = async (userId: string, friendId: string): Promise<void> => {
  // Try using the database function first (bypasses RLS)
  const { data: functionResult, error: functionError } = await supabase
    .rpc('accept_friend_request', {
      p_user_id: userId,
      p_friend_id: friendId
    });
  
  if (!functionError) {
    logger.log('Friend request accepted successfully via database function');
    return;
  }
  
  // Fallback to direct update if function doesn't exist
  logger.warn('Database function not available, using direct update. Error:', functionError);
  
  // Get both users
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('friend_requests, friends')
    .eq('clerk_id', userId)
    .single();
  
  const { data: friend, error: friendError } = await supabase
    .from('user_profiles')
    .select('friends')
    .eq('clerk_id', friendId)
    .single();
  
  if (userError || friendError || !user || !friend) {
    throw new Error('Error updating friendship');
  }
  
  // Remove from friend requests and add to friends for user
  const updatedRequests = (user.friend_requests || []).filter((id: string) => id !== friendId);
  const updatedFriends = [...(user.friends || []), friendId];
  
  // Add to friends for the other user
  const friendUpdatedFriends = [...(friend.friends || []), userId];
  
  // Update both users
  const { error: updateError1 } = await supabase
    .from('user_profiles')
    .update({ 
      friend_requests: updatedRequests,
      friends: updatedFriends 
    })
    .eq('clerk_id', userId);
  
  if (updateError1) {
    logger.error('Error updating user profile:', updateError1);
    throw new Error(`Failed to accept friend request: ${updateError1.message}. Please run the fix_friend_requests_rls.sql migration.`);
  }
  
  const { error: updateError2 } = await supabase
    .from('user_profiles')
    .update({ friends: friendUpdatedFriends })
    .eq('clerk_id', friendId);
  
  if (updateError2) {
    logger.error('Error updating friend profile:', updateError2);
    throw new Error(`Failed to accept friend request: ${updateError2.message}. Please run the fix_friend_requests_rls.sql migration.`);
  }
};

export const denyFriendRequest = async (userId: string, friendId: string): Promise<void> => {
  logger.log('Denying friend request:', { userId, friendId });
  
  // Get user's current friend_requests
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('friend_requests')
    .eq('clerk_id', userId)
    .single();
  
  if (userError || !user) {
    throw new Error('Error fetching user profile');
  }
  
  // Remove friendId from friend_requests array
  const updatedRequests = (user.friend_requests || []).filter((id: string) => id !== friendId);
  
  // Update user profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ friend_requests: updatedRequests })
    .eq('clerk_id', userId);
  
  if (updateError) {
    logger.error('Error denying friend request:', updateError);
    throw new Error(`Failed to deny friend request: ${updateError.message}`);
  }
  
  logger.log('Friend request denied successfully');
};

export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  logger.log('Removing friend:', { userId, friendId });
  
  // Try using the database function first (bypasses RLS)
  const { data: functionResult, error: functionError } = await supabase
    .rpc('remove_friend', {
      p_user_id: userId,
      p_friend_id: friendId
    });
  
  if (!functionError) {
    logger.log('Friend removed successfully via database function');
    return;
  }
  
  // Fallback to direct update if function doesn't exist
  logger.warn('Database function not available, using direct update. Error:', functionError);
  
  // If function doesn't exist (42883 error code), provide helpful message
  if (functionError.code === '42883' || functionError.message?.includes('does not exist')) {
    throw new Error('Database function remove_friend does not exist. Please run the fix_friend_requests_rls.sql migration in Supabase SQL Editor.');
  }
  
  // Get both users
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('friends')
    .eq('clerk_id', userId)
    .single();
  
  const { data: friend, error: friendError } = await supabase
    .from('user_profiles')
    .select('friends')
    .eq('clerk_id', friendId)
    .single();
  
  if (userError || friendError || !user || !friend) {
    throw new Error('Error fetching user profiles');
  }
  
  // Remove from both users' friend lists
  const userFriends = (user.friends || []).filter((id: string) => id !== friendId);
  const friendFriends = (friend.friends || []).filter((id: string) => id !== userId);
  
  const { error: updateError1 } = await supabase
    .from('user_profiles')
    .update({ friends: userFriends })
    .eq('clerk_id', userId);
  
  if (updateError1) {
    logger.error('Error updating user profile:', updateError1);
    throw new Error(`Failed to remove friend: ${updateError1.message}. Please run the fix_friend_requests_rls.sql migration.`);
  }
  
  const { error: updateError2 } = await supabase
    .from('user_profiles')
    .update({ friends: friendFriends })
    .eq('clerk_id', friendId);
  
  if (updateError2) {
    logger.error('Error updating friend profile:', updateError2);
    throw new Error(`Failed to remove friend: ${updateError2.message}. Please run the fix_friend_requests_rls.sql migration.`);
  }
  
  logger.log('Friend removed successfully');
};
