import { supabase } from '../../lib/supabase';
import { Event, EventRequest } from '../../types';
import { generateEventCode } from '../../utils/eventCode';
import { logger } from '../../utils/logger';

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
    code: row.code || '',
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

function mapEventRequestFromDB(row: any): EventRequest {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
    logger.warn('create_event function not found or failed, using direct insert. Error:', functionError);
    const { data, error } = await supabase
      .from('events')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
    return mapEventFromDB(data);
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<any> {
    const dbData = mapEventToDB(updates as Event);
    
    // Ensure players is a proper array
    if (dbData.players !== undefined) {
      if (!Array.isArray(dbData.players)) {
        logger.warn('Players is not an array, converting:', dbData.players);
        dbData.players = [dbData.players];
      }
      // Ensure all values are strings and filter out any empty/null values
      dbData.players = dbData.players
        .map((p: any) => String(p))
        .filter((p: string) => p && p.trim() !== '');
    }
    
    const { data, error } = await supabase
      .from('events')
      .update(dbData)
      .eq('id', id)
      .select();
    
    if (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
    
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
    // First, get the current event state directly from database to ensure we have latest data
    const { data: currentEventData, error: fetchError } = await supabase
      .from('events')
      .select('players, current_players, max_players, status')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !currentEventData) {
      throw new Error('Event not found');
    }
    
    // Ensure players is an array
    let currentPlayers: string[] = [];
    if (currentEventData.players) {
      if (Array.isArray(currentEventData.players)) {
        currentPlayers = currentEventData.players.map(p => String(p));
      } else {
        currentPlayers = [String(currentEventData.players)];
      }
    }
    
    if (currentPlayers.includes(String(userId))) {
      throw new Error('User already joined this event');
    }
    
    if (currentEventData.status === 'full') {
      throw new Error('Event is full');
    }
    
    // Update request status to approved (works for both 'pending' requests and 'invited' invitations)
    const { data: requestData, error: updateError } = await supabase
      .from('event_requests')
      .update({ status: 'approved' })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('status', ['pending', 'invited'])
      .select();
    
    if (updateError) {
      logger.error('Error updating request status:', updateError);
      throw new Error(`Failed to update request status: ${updateError.message}`);
    }
    
    if (!requestData || requestData.length === 0) {
      throw new Error('No pending request or invitation found to approve');
    }
    
    // Add user to event players - use the current players from database
    const updatedPlayers = [...currentPlayers, String(userId)];
    const status = updatedPlayers.length >= currentEventData.max_players ? 'full' : currentEventData.status;
    
    // Try using the database function first (bypasses RLS and handles array properly)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('approve_player_request', {
        p_event_id: eventId,
        p_user_id: userId
      });
    
    if (!functionError && functionResult) {
      // Verify the update worked
      const verifyResult = await supabase
        .from('events')
        .select('players')
        .eq('id', eventId)
        .single();
      
      if (verifyResult.data) {
        const dbPlayers = Array.isArray(verifyResult.data.players)
          ? verifyResult.data.players.map(p => String(p))
          : [String(verifyResult.data.players)];
        
        if (dbPlayers.includes(String(userId))) {
          return;
        }
      }
    }
    
    // Fallback to direct update if function doesn't exist or failed
    logger.warn('Database function not available or failed, using direct update. Error:', functionError);
    
    const { data: updateData, error: eventUpdateError } = await supabase
      .from('events')
      .update({ 
        players: updatedPlayers,
        current_players: updatedPlayers.length,
        status: status
      })
      .eq('id', eventId)
      .select('players, current_players, status');
    
    if (eventUpdateError) {
      logger.error('Failed to update event:', eventUpdateError);
      throw new Error(`Failed to update event: ${eventUpdateError.message}. Check RLS policies - you must be the event organizer. If this persists, run the approve_player_request.sql migration.`);
    }
    
    // Immediately verify by querying the database
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for DB sync
    
    const verifyResult = await supabase
      .from('events')
      .select('players, current_players')
      .eq('id', eventId)
      .single();
    
    if (verifyResult.error) {
      logger.error('Verification query error:', verifyResult.error);
      throw new Error(`Failed to verify player addition: ${verifyResult.error.message}`);
    }
    
    if (verifyResult.data) {
      const dbPlayers = verifyResult.data.players || [];
      
      // Normalize for comparison
      const normalizedDbPlayers = Array.isArray(dbPlayers) 
        ? dbPlayers.map(p => String(p))
        : [String(dbPlayers)];
      const normalizedUserId = String(userId);
      
      if (normalizedDbPlayers.includes(normalizedUserId)) {
        return; // Success!
      } else {
        // The update didn't work - the array wasn't updated
        logger.error('CRITICAL: Player was NOT added to database!', {
          expected: updatedPlayers,
          actual: normalizedDbPlayers
        });
        throw new Error(`Failed to add player to event. Expected players: ${JSON.stringify(updatedPlayers)}, but database shows: ${JSON.stringify(normalizedDbPlayers)}. This is likely an RLS policy issue. Please run the approve_player_request.sql migration to create a database function that bypasses RLS.`);
      }
    } else {
      throw new Error('Verification query returned no data');
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
          logger.warn('event_requests table does not exist yet. Please run the migration.');
          return [];
        }
        // For 406 errors (RLS issues), return empty array gracefully
        if (error.code === 'PGRST301' || error.status === 406) {
          logger.warn('RLS blocked query for event requests, returning empty array');
          return [];
        }
        throw error;
      }
      
      return (data || []).map(mapEventRequestFromDB);
    } catch (error: any) {
      // If table doesn't exist, return empty array instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return [];
      }
      // For 406 errors (RLS issues), return empty array gracefully
      if (error?.code === 'PGRST301' || error?.status === 406) {
        logger.warn('RLS blocked query for event requests, returning empty array');
        return [];
      }
      logger.error('Error getting event requests:', error);
      return [];
    }
  },

  async getUserPendingRequest(eventId: string, userId: string): Promise<EventRequest | null> {
    try {
      // Try using the database function first (bypasses RLS)
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_pending_request', { 
          p_event_id: eventId,
          p_user_id: userId 
        });
      
      if (!functionError && functionData && functionData.length > 0) {
        return mapEventRequestFromDB(functionData[0]);
      }
      
      if (functionError && functionError.code !== '42883') {
        // If it's not a "function doesn't exist" error, return null
        if (functionError.code === 'PGRST116' || functionError.message?.includes('no rows')) {
          return null;
        }
        logger.warn('Error calling get_user_pending_request function:', functionError);
      }
      
      // Fallback to direct query if function doesn't exist
      // Use .limit(1) instead of .single() to avoid 406 errors
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .limit(1);
      
      if (error) {
        // If table doesn't exist (42P01), return null gracefully
        if (error.code === '42P01') {
          logger.warn('event_requests table does not exist yet. Please run the migration.');
          return null;
        }
        // For 406 errors (RLS issues), return null gracefully
        if (error.code === 'PGRST301' || error.status === 406) {
          logger.warn('RLS blocked query for pending request, returning null');
          return null;
        }
        throw error;
      }
      // Return first result if exists, otherwise null
      return data && data.length > 0 ? mapEventRequestFromDB(data[0]) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return null;
      }
      // For 406 errors (RLS issues), return null gracefully
      if (error?.code === 'PGRST301' || error?.status === 406) {
        logger.warn('RLS blocked query for pending request, returning null');
        return null;
      }
      logger.error('Error getting user pending request:', error);
      return null;
    }
  },

  async getUserEventRequest(eventId: string, userId: string): Promise<EventRequest | null> {
    try {
      // Use .limit(1) instead of .single() to avoid 406 errors
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        // If table doesn't exist (42P01), return null gracefully
        if (error.code === '42P01') {
          logger.warn('event_requests table does not exist yet. Please run the migration.');
          return null;
        }
        // For 406 errors (RLS issues), return null gracefully
        if (error.code === 'PGRST301' || error.status === 406) {
          logger.warn('RLS blocked query for event request, returning null');
          return null;
        }
        throw error;
      }
      // Return first result if exists, otherwise null
      return data && data.length > 0 ? mapEventRequestFromDB(data[0]) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return null;
      }
      // For 406 errors (RLS issues), return null gracefully
      if (error?.code === 'PGRST301' || error?.status === 406) {
        logger.warn('RLS blocked query for event request, returning null');
        return null;
      }
      logger.error('Error getting user event request:', error);
      return null;
    }
  },

  async getUserApprovedRequest(eventId: string, userId: string): Promise<EventRequest | null> {
    try {
      // Use .limit(1) instead of .single() to avoid 406 errors
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        // If table doesn't exist (42P01), return null gracefully
        if (error.code === '42P01') {
          logger.warn('event_requests table does not exist yet. Please run the migration.');
          return null;
        }
        // For 406 errors (RLS issues), return null gracefully
        if (error.code === 'PGRST301' || error.status === 406) {
          logger.warn('RLS blocked query for approved request, returning null');
          return null;
        }
        throw error;
      }
      // Return first result if exists, otherwise null
      return data && data.length > 0 ? mapEventRequestFromDB(data[0]) : null;
    } catch (error: any) {
      // If table doesn't exist, return null instead of throwing
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return null;
      }
      // For 406 errors (RLS issues), return null gracefully
      if (error?.code === 'PGRST301' || error?.status === 406) {
        logger.warn('RLS blocked query for approved request, returning null');
        return null;
      }
      logger.error('Error getting user approved request:', error);
      return null;
    }
  },

  async inviteFriendToEvent(eventId: string, friendId: string, organizerId: string): Promise<void> {
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');

    if (event.players.includes(friendId)) {
      throw new Error('Friend already joined this event');
    }

    if (event.status === 'full') {
      throw new Error('Event is full');
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: checkError } = await supabase
      .from('event_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', friendId)
      .in('status', ['invited', 'pending', 'approved'])
      .single();

    if (existingInvitation) {
      throw new Error('Invitation already sent or friend already requested');
    }

    // Try using the database function first (bypasses RLS, more secure)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('invite_friend_to_event', {
        p_event_id: eventId,
        p_friend_id: friendId,
        p_organizer_id: organizerId
      });

    if (!functionError) {
      logger.log('Friend invitation sent successfully via database function');
      return;
    }

    // Fallback to direct insert if function doesn't exist
    logger.warn('Database function not available, using direct insert. Error:', functionError);
    
    // If function doesn't exist (42883 error code), try direct insert
    if (functionError.code === '42883' || functionError.message?.includes('does not exist')) {
      // Create invitation via direct insert
      const { error } = await supabase
        .from('event_requests')
        .insert({
          event_id: eventId,
          user_id: friendId,
          status: 'invited',
          invited_by: organizerId,
        });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('event_requests table does not exist. Please run the database migration first.');
        }
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS policy violation. Please run fix_event_requests_rls_insert.sql or create_invite_friend_function.sql migration.');
        }
        throw error;
      }
      return;
    }

    // If function exists but returned an error, throw it
    throw functionError;
  },

  async getEventInvitations(eventId: string): Promise<EventRequest[]> {
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'invited')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          logger.warn('event_requests table does not exist yet. Please run the migration.');
          return [];
        }
        throw error;
      }
      
      return (data || []).map(mapEventRequestFromDB);
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return [];
      }
      throw error;
    }
  },

  async getUserInvitations(userId: string): Promise<EventRequest[]> {
    try {
      // Try using the database function first (bypasses RLS)
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_user_invitations', { p_user_id: userId });
      
      if (!functionError && functionData) {
        return functionData.map(mapEventRequestFromDB);
      }
      
      // Fallback to direct query if function doesn't exist
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'invited')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01' || error.code === '42883') {
          logger.warn('get_user_invitations function does not exist yet. Please run the migration.');
          // Try direct query as fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('event_requests')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'invited')
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            logger.error('Error loading invitations:', fallbackError);
            return [];
          }
          
          return (fallbackData || []).map(mapEventRequestFromDB);
        }
        throw error;
      }
      
      return (data || []).map(mapEventRequestFromDB);
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('event_requests table does not exist yet. Please run the migration.');
        return [];
      }
      logger.error('Error loading invitations:', error);
      return [];
    }
  },

  async denyInvitation(eventId: string, userId: string): Promise<void> {
    // Try using the database function first (bypasses RLS, more secure)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('deny_invitation', {
        p_event_id: eventId,
        p_user_id: userId
      });

    if (!functionError) {
      logger.log('Invitation denied successfully via database function');
      return;
    }

    // Fallback to direct delete if function doesn't exist
    logger.warn('Database function not available, using direct delete. Error:', functionError);
    
    // If function doesn't exist (42883 error code), try direct delete
    if (functionError.code === '42883' || functionError.message?.includes('does not exist')) {
      const { error } = await supabase
        .from('event_requests')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'invited');
      
      if (error) {
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS policy violation. Please run deny_invitation_function.sql migration.');
        }
        logger.error('Error denying invitation:', error);
        throw error;
      }
      return;
    }

    // If function exists but returned an error, throw it
    throw functionError;
  },

  async acceptInvitation(eventId: string, userId: string): Promise<void> {
    // First verify the invitation exists
    const { data: invitation, error: inviteError } = await supabase
      .from('event_requests')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'invited')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Update invitation status to approved and add user to event
    // This reuses the approveRequest logic
    await this.approveRequest(eventId, userId);
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
    logger.log('Leaving event:', { eventId, userId });

    // Try using the database function first (bypasses RLS)
    const { data: functionResult, error: functionError } = await supabase
      .rpc('leave_event', {
        p_event_id: eventId,
        p_user_id: userId
      });

    if (!functionError) {
      logger.log('Successfully left event via database function');
      return;
    }

    // Fallback to direct update if function doesn't exist
    logger.warn('Database function not available, using direct update. Error:', functionError);
    logger.warn('Please run the leave_event.sql migration to enable this feature.');
    
    // Get fresh event data from database
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !eventData) {
      throw new Error('Event not found');
    }
    
    // Ensure players is an array
    let currentPlayers: string[] = [];
    if (eventData.players) {
      if (Array.isArray(eventData.players)) {
        currentPlayers = eventData.players.map(p => String(p));
      } else {
        currentPlayers = [String(eventData.players)];
      }
    }
    
    logger.debug('Current players before leaving:', currentPlayers);
    logger.debug('User ID to remove:', userId);
    
    // Check if user is in the event
    if (!currentPlayers.includes(String(userId))) {
      throw new Error('You are not part of this event');
    }
    
    // Remove user from players array
    const updatedPlayers = currentPlayers.filter(id => String(id) !== String(userId));
    logger.debug('Updated players after leaving:', updatedPlayers);
    
    // Update status if event was full and now has space
    const status = eventData.status === 'full' && updatedPlayers.length < eventData.max_players 
      ? 'open' 
      : eventData.status;
    
    // Update the event (this will fail if RLS blocks it)
    const { data: updatedData, error: updateError } = await supabase
      .from('events')
      .update({
      players: updatedPlayers,
        current_players: updatedPlayers.length,
        status: status,
      })
      .eq('id', eventId)
      .select();
    
    if (updateError) {
      logger.error('Error leaving event:', updateError);
      if (updateError.code === '42501' || updateError.message?.includes('permission denied') || updateError.message?.includes('policy')) {
        throw new Error('Permission denied. Please run the leave_event.sql migration in your Supabase database to enable leaving events.');
      }
      throw new Error(`Failed to leave event: ${updateError.message}`);
    }
    
    logger.log('Successfully left event');
    
    // Also delete or update the event request if it exists
    const { error: requestError } = await supabase
      .from('event_requests')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .in('status', ['approved', 'pending', 'invited']);
    
    if (requestError) {
      logger.warn('Error cleaning up event request (non-critical):', requestError);
      // Don't throw - this is not critical
    }
  },
};
