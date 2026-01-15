-- Function to deny/delete an invitation
-- This bypasses RLS so users can delete their own invitations
CREATE OR REPLACE FUNCTION deny_invitation(
  p_event_id UUID,
  p_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete the invitation
  DELETE FROM event_requests
  WHERE event_id = p_event_id
    AND user_id = p_user_id
    AND status = 'invited';
  
  -- Check if any rows were deleted
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already deleted';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION deny_invitation(UUID, TEXT) TO authenticated, anon;
