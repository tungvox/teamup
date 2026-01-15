-- Fix Security Warnings
-- This migration addresses:
-- 1. Function search_path mutable warnings
-- 2. Overly permissive RLS policies

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATH (Prevent search path manipulation attacks)
-- ============================================================================

-- Drop existing functions first to avoid conflicts
-- Use CASCADE to drop all overloads if they exist
DROP FUNCTION IF EXISTS get_user_invitations(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_pending_request(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile CASCADE; -- Drop all overloads
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_event CASCADE; -- Drop all overloads
DROP FUNCTION IF EXISTS update_event_requests_updated_at() CASCADE;
DROP FUNCTION IF EXISTS send_friend_request(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS accept_friend_request(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS remove_friend(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS leave_event(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS approve_player_request(UUID, TEXT) CASCADE;

-- Fix get_user_invitations
CREATE OR REPLACE FUNCTION get_user_invitations(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  user_id TEXT,
  status TEXT,
  invited_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.event_id,
    er.user_id,
    er.status,
    er.invited_by,
    er.created_at,
    er.updated_at
  FROM event_requests er
  WHERE er.user_id = p_user_id
    AND er.status = 'invited'
  ORDER BY er.created_at DESC;
END;
$$;

-- Fix get_user_pending_request
CREATE OR REPLACE FUNCTION get_user_pending_request(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  user_id TEXT,
  status TEXT,
  invited_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.event_id,
    er.user_id,
    er.status,
    er.invited_by,
    er.created_at,
    er.updated_at
  FROM event_requests er
  WHERE er.event_id = p_event_id
    AND er.user_id = p_user_id
    AND er.status = 'pending'
  LIMIT 1;
END;
$$;

-- Fix create_user_profile
CREATE OR REPLACE FUNCTION create_user_profile(
  p_clerk_id TEXT,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_avatar TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_sports TEXT[] DEFAULT '{}',
  p_user_id TEXT DEFAULT NULL
)
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_profile user_profiles;
  generated_user_id TEXT;
  base_username TEXT;
  discriminator TEXT;
  counter INTEGER;
BEGIN
  -- Generate user_id if not provided
  IF p_user_id IS NULL OR p_user_id = '' THEN
    base_username := LOWER(REGEXP_REPLACE(COALESCE(p_first_name, '') || COALESCE(p_last_name, ''), '[^a-z0-9]', '', 'g'));
    IF base_username = '' THEN
      base_username := 'user';
    END IF;
    base_username := LEFT(base_username, 20);
    
    counter := 0;
    LOOP
      discriminator := LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0');
      generated_user_id := base_username || '#' || discriminator;
      
      IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = generated_user_id) THEN
        EXIT;
      END IF;
      
      counter := counter + 1;
      IF counter > 100 THEN
        discriminator := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
        generated_user_id := base_username || '#' || discriminator;
        EXIT;
      END IF;
    END LOOP;
  ELSE
    generated_user_id := p_user_id;
  END IF;

  INSERT INTO user_profiles (
    clerk_id,
    email,
    user_id,
    first_name,
    last_name,
    avatar,
    location,
    sports,
    stats,
    level,
    friends,
    friend_requests
  ) VALUES (
    p_clerk_id,
    p_email,
    generated_user_id,
    p_first_name,
    p_last_name,
    p_avatar,
    p_location,
    p_sports,
    '{"matches": 0, "reliability": 100, "mvps": 0}'::jsonb,
    1,
    '{}'::TEXT[],
    '{}'::TEXT[]
  )
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix create_event
CREATE OR REPLACE FUNCTION create_event(
  p_title TEXT,
  p_sport TEXT,
  p_date DATE,
  p_time TIME,
  p_location TEXT,
  p_organizer_id TEXT,
  p_organizer_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_location_details TEXT DEFAULT NULL,
  p_max_players INTEGER DEFAULT 10,
  p_price DECIMAL(10, 2) DEFAULT NULL,
  p_skill_level TEXT DEFAULT 'All',
  p_competitive BOOLEAN DEFAULT false,
  p_image TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL
)
RETURNS events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_event events;
BEGIN
  INSERT INTO events (
    code,
    title,
    sport,
    description,
    date,
    time,
    end_time,
    location,
    location_details,
    organizer_id,
    organizer_name,
    max_players,
    current_players,
    players,
    price,
    skill_level,
    competitive,
    image,
    status
  ) VALUES (
    p_code,
    p_title,
    p_sport,
    p_description,
    p_date,
    p_time,
    p_end_time,
    p_location,
    p_location_details,
    p_organizer_id,
    p_organizer_name,
    p_max_players,
    1, -- Creator is automatically the first player
    ARRAY[p_organizer_id]::TEXT[], -- Creator is added to players array
    p_price,
    p_skill_level,
    p_competitive,
    p_image,
    'open'
  )
  RETURNING * INTO new_event;
  
  RETURN new_event;
END;
$$;

-- Fix update_event_requests_updated_at
CREATE OR REPLACE FUNCTION update_event_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix send_friend_request
CREATE OR REPLACE FUNCTION send_friend_request(
  p_from_user_id TEXT,
  p_to_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_user user_profiles%ROWTYPE;
  v_updated_requests TEXT[];
BEGIN
  -- Get the target user
  SELECT * INTO v_target_user
  FROM user_profiles
  WHERE clerk_id = p_to_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if already friends
  IF v_target_user.friends IS NOT NULL AND p_from_user_id = ANY(v_target_user.friends) THEN
    RAISE EXCEPTION 'Already friends';
  END IF;
  
  -- Check if request already sent
  IF v_target_user.friend_requests IS NOT NULL AND p_from_user_id = ANY(v_target_user.friend_requests) THEN
    RAISE EXCEPTION 'Friend request already sent';
  END IF;
  
  -- Add to friend requests
  v_updated_requests := COALESCE(v_target_user.friend_requests, ARRAY[]::TEXT[]) || ARRAY[p_from_user_id];
  
  -- Update the target user's friend_requests
  UPDATE user_profiles
  SET friend_requests = v_updated_requests
  WHERE clerk_id = p_to_user_id;
END;
$$;

-- Fix accept_friend_request
CREATE OR REPLACE FUNCTION accept_friend_request(
  p_user_id TEXT,
  p_friend_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user user_profiles%ROWTYPE;
  v_friend user_profiles%ROWTYPE;
  v_updated_requests TEXT[];
  v_updated_friends TEXT[];
  v_friend_updated_friends TEXT[];
BEGIN
  -- Get both users
  SELECT * INTO v_user
  FROM user_profiles
  WHERE clerk_id = p_user_id;
  
  SELECT * INTO v_friend
  FROM user_profiles
  WHERE clerk_id = p_friend_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Remove from friend requests and add to friends for user
  v_updated_requests := array_remove(COALESCE(v_user.friend_requests, ARRAY[]::TEXT[]), p_friend_id);
  v_updated_friends := COALESCE(v_user.friends, ARRAY[]::TEXT[]) || ARRAY[p_friend_id];
  
  -- Add to friends for the other user
  v_friend_updated_friends := COALESCE(v_friend.friends, ARRAY[]::TEXT[]) || ARRAY[p_user_id];
  
  -- Update both users
  UPDATE user_profiles
  SET 
    friend_requests = v_updated_requests,
    friends = v_updated_friends
  WHERE clerk_id = p_user_id;
  
  UPDATE user_profiles
  SET friends = v_friend_updated_friends
  WHERE clerk_id = p_friend_id;
END;
$$;

-- Fix remove_friend
CREATE OR REPLACE FUNCTION remove_friend(
  p_user_id TEXT,
  p_friend_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user user_profiles%ROWTYPE;
  v_friend user_profiles%ROWTYPE;
  v_user_friends TEXT[];
  v_friend_friends TEXT[];
BEGIN
  -- Get both users
  SELECT * INTO v_user
  FROM user_profiles
  WHERE clerk_id = p_user_id;
  
  SELECT * INTO v_friend
  FROM user_profiles
  WHERE clerk_id = p_friend_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Remove from both users' friend lists
  v_user_friends := array_remove(COALESCE(v_user.friends, ARRAY[]::TEXT[]), p_friend_id);
  v_friend_friends := array_remove(COALESCE(v_friend.friends, ARRAY[]::TEXT[]), p_user_id);
  
  -- Update both users
  UPDATE user_profiles
  SET friends = v_user_friends
  WHERE clerk_id = p_user_id;
  
  UPDATE user_profiles
  SET friends = v_friend_friends
  WHERE clerk_id = p_friend_id;
END;
$$;

-- Fix leave_event
CREATE OR REPLACE FUNCTION leave_event(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_updated_players TEXT[];
BEGIN
  -- Get the event
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Check if user is in the event
  IF NOT (p_user_id = ANY(v_event.players)) THEN
    RAISE EXCEPTION 'You are not part of this event';
  END IF;

  -- Remove user from players array
  v_updated_players := array_remove(v_event.players, p_user_id);

  -- Update the event
  UPDATE events
  SET 
    players = v_updated_players,
    current_players = array_length(v_updated_players, 1),
    status = CASE 
      WHEN v_event.status = 'full' AND array_length(v_updated_players, 1) < v_event.max_players 
      THEN 'open' 
      ELSE v_event.status 
    END
  WHERE id = p_event_id;

  -- Delete or update event requests for this user
  DELETE FROM event_requests
  WHERE event_id = p_event_id
    AND user_id = p_user_id
    AND status IN ('approved', 'pending', 'invited');
END;
$$;

-- Fix approve_player_request
CREATE OR REPLACE FUNCTION approve_player_request(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_players TEXT[];
  v_max_players INTEGER;
  v_current_count INTEGER;
  v_status TEXT;
  v_updated_players TEXT[];
BEGIN
  -- Get current event data
  SELECT players, max_players, current_players, status
  INTO v_current_players, v_max_players, v_current_count, v_status
  FROM events
  WHERE id = p_event_id;
  
  -- Check if event exists
  IF v_current_players IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Check if user is already in players array
  IF p_user_id = ANY(v_current_players) THEN
    RAISE EXCEPTION 'User already joined this event';
  END IF;
  
  -- Check if event is full
  IF v_status = 'full' THEN
    RAISE EXCEPTION 'Event is full';
  END IF;
  
  -- Add user to players array
  v_updated_players := array_append(v_current_players, p_user_id);
  
  -- Update event
  UPDATE events
  SET 
    players = v_updated_players,
    current_players = array_length(v_updated_players, 1),
    status = CASE 
      WHEN array_length(v_updated_players, 1) >= v_max_players THEN 'full'
      ELSE v_status
    END,
    updated_at = NOW()
  WHERE id = p_event_id;
  
  -- Update request status to approved
  UPDATE event_requests
  SET status = 'approved'
  WHERE event_id = p_event_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  -- Return the updated players array
  RETURN jsonb_build_object(
    'success', true,
    'players', v_updated_players,
    'current_players', array_length(v_updated_players, 1)
  );
END;
$$;

-- ============================================================================
-- 2. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================================================

-- Fix event_requests policies
DROP POLICY IF EXISTS "Event organizers can update request status" ON event_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON event_requests;
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON event_requests;

-- UPDATE policy: Organizers can update request status OR users can update their own requests
CREATE POLICY "Event organizers can update request status" ON event_requests
  FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Organizers can update any request for their events
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_requests.event_id
        AND events.organizer_id = auth.jwt() ->> 'sub'
      )
      OR
      -- Users can update their own requests (e.g., to change status)
      user_id = auth.jwt() ->> 'sub'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      -- Organizers can update any request for their events
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_requests.event_id
        AND events.organizer_id = auth.jwt() ->> 'sub'
      )
      OR
      -- Users can update their own requests
      user_id = auth.jwt() ->> 'sub'
    )
  );

-- INSERT policy: Users can create requests for themselves OR organizers can invite friends
CREATE POLICY "Users can create their own requests" ON event_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      -- Users can create requests for themselves (status = 'pending')
      (user_id = auth.jwt() ->> 'sub' AND status = 'pending')
      OR
      -- Organizers can invite friends (status = 'invited' AND invited_by matches organizer)
      -- In WITH CHECK, we reference the NEW row columns directly
      (
        status = 'invited'
        AND invited_by = auth.jwt() ->> 'sub'
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_id  -- Reference NEW.event_id directly
          AND events.organizer_id = auth.jwt() ->> 'sub'
        )
      )
    )
  );

-- DELETE policy: Users can delete their own pending requests OR organizers can delete invitations they sent
CREATE POLICY "Users can delete their own pending requests" ON event_requests
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND (
      -- Users can delete their own pending requests
      (user_id = auth.jwt() ->> 'sub' AND status = 'pending')
      OR
      -- Organizers can delete invitations they sent
      (
        status = 'invited'
        AND invited_by = auth.jwt() ->> 'sub'
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_requests.event_id
          AND events.organizer_id = auth.jwt() ->> 'sub'
        )
      )
      OR
      -- Users can delete their own invitations (when denying)
      (user_id = auth.jwt() ->> 'sub' AND status = 'invited')
    )
  );

-- Fix events INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

-- More restrictive INSERT policy: Users can only create events with themselves as organizer
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND organizer_id = auth.jwt() ->> 'sub'
  );

-- Fix user_profiles INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- More restrictive INSERT policy: Users can only create their own profile
-- Note: Since Clerk handles auth, we allow inserts but check clerk_id matches
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND clerk_id = auth.jwt() ->> 'sub'
  );

-- ============================================================================
-- GRANT PERMISSIONS (Ensure functions are accessible)
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_invitations(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_pending_request(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_event(TEXT, TEXT, DATE, TIME, TEXT, TEXT, TEXT, TEXT, TIME, TEXT, INTEGER, DECIMAL, TEXT, BOOLEAN, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_player_request(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION send_friend_request(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION accept_friend_request(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION remove_friend(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION leave_event(UUID, TEXT) TO authenticated, anon;
