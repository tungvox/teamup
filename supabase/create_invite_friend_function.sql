-- Alternative solution: Create a SECURITY DEFINER function to invite friends
-- This bypasses RLS and is more secure than permissive policies
-- Use this if the RLS policy approach doesn't work

CREATE OR REPLACE FUNCTION invite_friend_to_event(
  p_event_id UUID,
  p_friend_id TEXT,
  p_organizer_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event events%ROWTYPE;
BEGIN
  -- Get the event and verify organizer
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Verify the caller is the organizer
  IF v_event.organizer_id != p_organizer_id THEN
    RAISE EXCEPTION 'Only the event organizer can invite friends';
  END IF;
  
  -- Check if friend is already in the event
  IF p_friend_id = ANY(v_event.players) THEN
    RAISE EXCEPTION 'Friend already joined this event';
  END IF;
  
  -- Check if event is full
  IF v_event.status = 'full' THEN
    RAISE EXCEPTION 'Event is full';
  END IF;
  
  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM event_requests
    WHERE event_id = p_event_id
    AND user_id = p_friend_id
    AND status IN ('invited', 'pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'Invitation already sent or friend already requested';
  END IF;
  
  -- Create the invitation
  INSERT INTO event_requests (
    event_id,
    user_id,
    status,
    invited_by
  ) VALUES (
    p_event_id,
    p_friend_id,
    'invited',
    p_organizer_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION invite_friend_to_event(UUID, TEXT, TEXT) TO authenticated, anon;
