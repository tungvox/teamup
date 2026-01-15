-- Function to get user invitations
-- This bypasses RLS so users can see their own invitations
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_invitations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_invitations(TEXT) TO anon;
