import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { generateUserId } from '../../utils/userId';
import { logger } from '../../utils/logger';

// Mapper functions
function mapUserFromDB(row: any): User {
  // Ensure friends is always an array
  let friends: string[] = [];
  if (row.friends) {
    if (Array.isArray(row.friends)) {
      friends = row.friends;
    } else if (typeof row.friends === 'string') {
      try {
        friends = JSON.parse(row.friends);
      } catch {
        friends = [row.friends];
      }
    }
  }
  
  // Ensure friend_requests is always an array
  let friendRequests: string[] = [];
  if (row.friend_requests) {
    if (Array.isArray(row.friend_requests)) {
      friendRequests = row.friend_requests;
    } else if (typeof row.friend_requests === 'string') {
      try {
        friendRequests = JSON.parse(row.friend_requests);
      } catch {
        friendRequests = [row.friend_requests];
      }
    }
  }
  
  return {
    id: row.clerk_id,
    userId: row.user_id || '',
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar,
    location: row.location,
    sports: row.sports,
    stats: row.stats,
    level: row.level,
    friends: friends,
    friendRequests: friendRequests,
    createdAt: row.created_at,
  };
}

function mapUserToDB(user: Partial<User>): any {
  return {
    email: user.email,
    user_id: user.userId,
    first_name: user.firstName,
    last_name: user.lastName,
    avatar: user.avatar,
    location: user.location,
    sports: user.sports,
    stats: user.stats,
    level: user.level,
    friends: user.friends,
    friend_requests: user.friendRequests,
  };
}

export const getUserProfile = async (clerkId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data ? mapUserFromDB(data) : null;
};

export const createUserProfile = async (userData: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  sports?: string[];
  location?: string;
}): Promise<User> => {
  // Generate unique user ID
  const username = `${userData.firstName}${userData.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  let userId = generateUserId(username);
  
  // Check if userId already exists and generate a new one if needed
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    
    if (!existing) break; // userId is unique
    userId = generateUserId(username);
    attempts++;
  }

  // Try using the database function first (more secure)
  const { data: functionData, error: functionError } = await supabase
    .rpc('create_user_profile', {
      p_clerk_id: userData.clerkId,
      p_email: userData.email,
      p_user_id: userId,
      p_first_name: userData.firstName,
      p_last_name: userData.lastName,
      p_avatar: userData.avatar || null,
      p_location: userData.location || null,
      p_sports: userData.sports || [],
    });

  if (!functionError && functionData) {
    logger.log('Profile created via function');
    const mapped = mapUserFromDB(functionData);
    return mapped;
  }

  // Fallback to direct insert if function doesn't exist
  // userId is already generated above
  logger.warn('create_user_profile function not found, using direct insert. Error:', functionError);
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      clerk_id: userData.clerkId,
      email: userData.email,
      user_id: userId,
      first_name: userData.firstName,
      last_name: userData.lastName,
      avatar: userData.avatar || null,
      sports: userData.sports || [],
      location: userData.location || null,
      stats: {
        matches: 0,
        reliability: 100,
        mvps: 0,
      },
      level: 1,
      friends: [],
      friend_requests: [],
    })
    .select()
    .single();
  
  if (error) {
    logger.error('Error creating user profile:', error);
    throw error;
  }
  logger.log('Profile created via direct insert');
  const mapped = mapUserFromDB(data);
  return mapped;
};

export const getUserByUserId = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return mapUserFromDB(data);
};

export const updateUserProfile = async (clerkId: string, updates: Partial<User>): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update(mapUserToDB(updates))
    .eq('clerk_id', clerkId);
  
  if (error) throw error;
};
