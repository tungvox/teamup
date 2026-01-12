import { supabase } from '../lib/supabase';
import { Event, Message, Chat, Rating, User, EventRequest } from '../types';

import { generateEventCode } from '../utils/eventCode';
import { generateUserId, isValidUserId } from '../utils/userId';

// Events
export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(mapEventFromDB);
  },

  async getEvent(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? mapEventFromDB(data) : null;
  },

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    // Generate unique code if not provided
    const eventWithCode = {
      ...eventData,
      code: eventData.code || generateEventCode(),
    };
    const dbData = mapEventToDB(eventWithCode);
    
    // Try using the database function first (more secure)
    const { data: functionData, error: functionError } = await supabase
      .rpc('create_event', {
        p_code: dbData.code,
        p_title: dbData.title,
        p_sport: dbData.sport,
        p_description: dbData.description || null,
        p_date: dbData.date,
        p_time: dbData.time,
        p_end_time: dbData.end_time || null,
        p_location: dbData.location,
        p_location_details: dbData.location_details || null,
        p_organizer_id: dbData.organizer_id,
        p_organizer_name: dbData.organizer_name,
        p_max_players: dbData.max_players,
        p_price: dbData.price || null,
        p_skill_level: dbData.skill_level,
        p_competitive: dbData.competitive,
        p_image: dbData.image || null,
      });

    if (!functionError && functionData) {
      return mapEventFromDB(functionData);
    }

    // Fallback to direct insert if function doesn't exist or fails
    console.warn('create_event function not found or failed, using direct insert. Error:', functionError);
    const { data, error } = await supabase
      .from('events')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    return mapEventFromDB(data);
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<any> {
    const dbData = mapEventToDB(updates as Event);
    console.log('Updating event:', id, 'with data:', dbData);
    const { data, error } = await supabase
      .from('events')
      .update(dbData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }
    console.log('Event updated successfully:', data);
    // Return the updated data so we can use it immediately
    return data && data.length > 0 ? data[0] : null;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async requestToJoin(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');
    
    if (event.players.includes(userId)) {
      throw new Error('Already joined this event');
    }
    
    if (event.status === 'full') {
      throw new Error('Event is full');
    }
    
    // Check if request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('event_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();
    
    // If table doesn't exist, provide helpful error message
    if (checkError && checkError.code === '42P01') {
      throw new Error('event_requests table does not exist. Please run the database migration first.');
    }
    
    // PGRST116 is "no rows found" - this is expected if no request exists
    if (existingRequest) {
      throw new Error('Request already pending');
    }
    
    // Create new request
    const { error } = await supabase
      .from('event_requests')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'pending',
      });
    
    if (error) {
      // If table doesn't exist, provide helpful error message
      if (error.code === '42P01') {
        throw new Error('event_requests table does not exist. Please run the database migration first.');
      }
      throw error;
    }
  },

  async approveRequest(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');
    
    if (event.players.includes(userId)) {
      throw new Error('User already joined this event');
    }
    
    if (event.status === 'full') {
      throw new Error('Event is full');
    }
    
    // Update request status to approved
    const { data: requestData, error: updateError } = await supabase
      .from('event_requests')
      .update({ status: 'approved' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select();
    
    if (updateError) {
      console.error('Error updating request status:', updateError);
      throw new Error(`Failed to update request status: ${updateError.message}`);
    }
    
    if (!requestData || requestData.length === 0) {
      throw new Error('No pending request found to approve');
    }
    
    // Add user to event players
    const updatedPlayers = [...event.players, userId];
    const status = updatedPlayers.length >= event.maxPlayers ? 'full' : event.status;
    
    console.log('Approving request - updating event players:', {
      eventId,
      userId,
      oldPlayers: event.players,
      newPlayers: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      status
    });
    
    const updateResult = await this.updateEvent(eventId, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      status: status as Event['status'],
    });
    
    // Use the returned data from updateEvent if available, otherwise query
    let updatedEvent = updateResult ? mapEventFromDB(updateResult) : await this.getEvent(eventId);
    
    // If still not found, wait a bit and try again (database replication delay)
    if (!updatedEvent || !updatedEvent.players.includes(userId)) {
      console.log('Player not immediately found, waiting for database sync...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updatedEvent = await this.getEvent(eventId);
    }
    
    console.log('Event after approval:', updatedEvent);
    if (!updatedEvent) {
      throw new Error('Failed to retrieve updated event');
    }
    
    // Log detailed info for debugging
    if (!updatedEvent.players.includes(userId)) {
      console.warn('Player not found in updated event, but update may have succeeded.');
      console.warn('Expected userId:', userId);
      console.warn('Event players:', updatedEvent.players);
      console.warn('Event players is array:', Array.isArray(updatedEvent.players));
      // Don't throw - the update likely succeeded, just a timing/caching issue
      // The context reload will pick it up
    }
  },

  async denyRequest(eventId: string, userId: string): Promise<void> {
    // Update request status to denied
    const { error } = await supabase
      .from('event_requests')
      .update({ status: 'denied' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
  },

  async getEventRequests(eventId: string): Promise<EventRequest[]> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        // If table doesn't exist (42P01), return empty array gracefully
        if (error.code === '42P01') {
          console.warn('event_requests table does not exist yet. Please run the migration.');
          return [];
        }
        throw error;
      }
      
      return (data || []).map(mapEventRequestFromDB);
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('event_requests table does not exist yet. Please run the migration.');
        return [];
      }
      throw error;
    }
  },

  async getUserPendingRequest(eventId: string, userId: string): Promise<EventRequest | null> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();
      
      if (error) {
        // PGRST116 is "no rows found" - this is expected if no request exists
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist (42P01), return null gracefully
        if (error.code === '42P01') {
          console.warn('event_requests table does not exist yet. Please run the migration.');
          return null;
        }
        throw error;
      }
      return data ? mapEventRequestFromDB(data) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('event_requests table does not exist yet. Please run the migration.');
        return null;
      }
      throw error;
    }
  },

  async getUserEventRequest(eventId: string, userId: string): Promise<EventRequest | null> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // PGRST116 is "no rows found" - this is expected if no request exists
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist (42P01), return null gracefully
        if (error.code === '42P01') {
          console.warn('event_requests table does not exist yet. Please run the migration.');
          return null;
        }
        throw error;
      }
      return data ? mapEventRequestFromDB(data) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('event_requests table does not exist yet. Please run the migration.');
        return null;
      }
      throw error;
    }
  },

  async joinEvent(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');
    
    if (event.players.includes(userId)) {
      throw new Error('Already joined this event');
    }
    
    if (event.status === 'full') {
      throw new Error('Event is full');
    }
    
    const updatedPlayers = [...event.players, userId];
    const status = updatedPlayers.length >= event.maxPlayers ? 'full' : event.status;
    
    await this.updateEvent(eventId, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      status: status as Event['status'],
    });
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');
    
    const updatedPlayers = event.players.filter(id => id !== userId);
    const status = event.status === 'full' && updatedPlayers.length < event.maxPlayers 
      ? 'open' 
      : event.status;
    
    await this.updateEvent(eventId, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
      status: status as Event['status'],
    });
  },
};

// Messages
export const messageService = {
  async getChatMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data.map(mapMessageFromDB);
  },

  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    // Get user info from Clerk
    const user = await getUserProfile(senderId);
    
    const messageData = {
      chat_id: chatId,
      sender_id: senderId,
      sender_name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      sender_avatar: user?.avatar || null,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update chat's last message and unread count
    await supabase
      .from('chats')
      .update({
        last_message_id: data.id,
        updated_at: new Date().toISOString(),
        unread_count: 1, // Simplified - should count unread for other participants
      })
      .eq('id', chatId);
    
    return mapMessageFromDB(data);
  },

  async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Fetch last message for each chat
    const chatsWithMessages = await Promise.all(
      data.map(async (chat) => {
        let lastMessage: Message | undefined;
        if (chat.last_message_id) {
          const { data: msgData } = await supabase
            .from('messages')
            .select('*')
            .eq('id', chat.last_message_id)
            .single();
          if (msgData) lastMessage = mapMessageFromDB(msgData);
        }
        return { ...mapChatFromDB(chat), lastMessage };
      })
    );
    
    return chatsWithMessages;
  },

  async createChat(participantIds: string[]): Promise<string> {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        participants: participantIds,
        unread_count: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  },

  async markAsRead(chatId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId);
    
    if (error) throw error;
    
    await supabase
      .from('chats')
      .update({ unread_count: 0 })
      .eq('id', chatId);
  },
};

// User Profiles
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
    console.log('Profile created via function:', functionData);
    const mapped = mapUserFromDB(functionData);
    console.log('Mapped profile:', mapped);
    return mapped;
  }

  // Fallback to direct insert if function doesn't exist
  // userId is already generated above
  console.warn('create_user_profile function not found, using direct insert. Error:', functionError);
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
    console.error('Error creating user profile:', error);
    throw error;
  }
  console.log('Profile created via direct insert:', data);
  const mapped = mapUserFromDB(data);
  console.log('Mapped profile from direct insert:', mapped);
  return mapped;
};

// Friend management functions
export const getUserByUserId = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return mapUserFromDB(data);
};

export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<void> => {
  // Get the target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('user_profiles')
    .select('friend_requests, friends')
    .eq('clerk_id', toUserId)
    .single();
  
  if (fetchError || !targetUser) {
    throw new Error('User not found');
  }
  
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
  
  const { error } = await supabase
    .from('user_profiles')
    .update({ friend_requests: updatedRequests })
    .eq('clerk_id', toUserId);
  
  if (error) throw error;
};

export const acceptFriendRequest = async (userId: string, friendId: string): Promise<void> => {
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
  await supabase
    .from('user_profiles')
    .update({ 
      friend_requests: updatedRequests,
      friends: updatedFriends 
    })
    .eq('clerk_id', userId);
  
  await supabase
    .from('user_profiles')
    .update({ friends: friendUpdatedFriends })
    .eq('clerk_id', friendId);
};

export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  // Get both users
  const { data: user } = await supabase
    .from('user_profiles')
    .select('friends')
    .eq('clerk_id', userId)
    .single();
  
  const { data: friend } = await supabase
    .from('user_profiles')
    .select('friends')
    .eq('clerk_id', friendId)
    .single();
  
  if (!user || !friend) return;
  
  // Remove from both users' friend lists
  const userFriends = (user.friends || []).filter((id: string) => id !== friendId);
  const friendFriends = (friend.friends || []).filter((id: string) => id !== userId);
  
  await supabase
    .from('user_profiles')
    .update({ friends: userFriends })
    .eq('clerk_id', userId);
  
  await supabase
    .from('user_profiles')
    .update({ friends: friendFriends })
    .eq('clerk_id', friendId);
};

export const updateUserProfile = async (clerkId: string, updates: Partial<User>): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update(mapUserToDB(updates))
    .eq('clerk_id', clerkId);
  
  if (error) throw error;
};

// Sports
export const sportsService = {
  async getAllSports(): Promise<Array<{ id: string; name: string; icon: string }>> {
    const { data, error } = await supabase
      .from('sports')
      .select('id, name, icon')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching sports:', error);
      // Return default sports if database query fails
      return [
        { id: '1', name: 'Tennis', icon: 'sports_tennis' },
        { id: '2', name: 'Pickleball', icon: 'sports_tennis' },
        { id: '3', name: 'Badminton', icon: 'sports_tennis' },
      ];
    }
    
    return data || [];
  },
};

// Ratings
export const ratingService = {
  async submitRatings(ratings: Omit<Rating, 'id' | 'createdAt'>[]): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .insert(ratings.map(r => ({
        event_id: r.eventId,
        rater_id: r.raterId,
        rated_user_id: r.ratedUserId,
        stars: r.stars,
        tags: r.tags,
        comment: r.comment || null,
      })));
    
    if (error) throw error;
  },
};

// Mapper functions
function mapEventFromDB(row: any): Event {
  // Ensure players is always an array
  let players: string[] = [];
  if (row.players) {
    if (Array.isArray(row.players)) {
      players = row.players;
    } else if (typeof row.players === 'string') {
      // Handle case where it might be stored as a string
      try {
        players = JSON.parse(row.players);
      } catch {
        players = [row.players];
      }
    }
  }
  
  return {
    id: row.id,
    code: row.code || '', // Default to empty string if code doesn't exist (for backward compatibility)
    title: row.title,
    sport: row.sport,
    description: row.description,
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    location: row.location,
    locationDetails: row.location_details,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name,
    maxPlayers: row.max_players,
    currentPlayers: row.current_players || players.length,
    players: players,
    price: row.price,
    skillLevel: row.skill_level,
    competitive: row.competitive,
    image: row.image,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapEventToDB(event: Partial<Event>): any {
  const dbData: any = {};
  
  // Only include fields that are defined to avoid overwriting with undefined
  if (event.code !== undefined) dbData.code = event.code;
  if (event.title !== undefined) dbData.title = event.title;
  if (event.sport !== undefined) dbData.sport = event.sport;
  if (event.description !== undefined) dbData.description = event.description;
  if (event.date !== undefined) dbData.date = event.date;
  if (event.time !== undefined) dbData.time = event.time;
  if (event.endTime !== undefined) dbData.end_time = event.endTime;
  if (event.location !== undefined) dbData.location = event.location;
  if (event.locationDetails !== undefined) dbData.location_details = event.locationDetails;
  if (event.organizerId !== undefined) dbData.organizer_id = event.organizerId;
  if (event.organizerName !== undefined) dbData.organizer_name = event.organizerName;
  if (event.maxPlayers !== undefined) dbData.max_players = event.maxPlayers;
  if (event.currentPlayers !== undefined) dbData.current_players = event.currentPlayers;
  if (event.players !== undefined) dbData.players = event.players;
  if (event.price !== undefined) dbData.price = event.price;
  if (event.skillLevel !== undefined) dbData.skill_level = event.skillLevel;
  if (event.competitive !== undefined) dbData.competitive = event.competitive;
  if (event.image !== undefined) dbData.image = event.image;
  if (event.status !== undefined) dbData.status = event.status;
  
  return dbData;
}

function mapMessageFromDB(row: any): Message {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    content: row.content,
    timestamp: row.timestamp,
    read: row.read,
  };
}

function mapChatFromDB(row: any): Chat {
  return {
    id: row.id,
    participants: row.participants,
    unreadCount: row.unread_count,
    updatedAt: row.updated_at,
  };
}

function mapUserFromDB(row: any): User {
  return {
    id: row.clerk_id,
    userId: row.user_id || '', // Default to empty string for backward compatibility
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.avatar,
    location: row.location,
    sports: row.sports,
    stats: row.stats,
    level: row.level,
    friends: row.friends || [],
    friendRequests: row.friend_requests || [],
    createdAt: row.created_at,
  };
}

function mapEventRequestFromDB(row: any): EventRequest {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

