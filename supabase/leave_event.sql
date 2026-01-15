-- Function to allow players to leave events
-- This bypasses RLS so players can remove themselves from the players array
CREATE OR REPLACE FUNCTION leave_event(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION leave_event(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_event(UUID, TEXT) TO anon;
