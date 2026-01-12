-- Function to approve a player request and add them to the event
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION approve_player_request(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_player_request(UUID, TEXT) TO authenticated, anon;
