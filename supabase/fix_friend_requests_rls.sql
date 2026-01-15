-- Fix RLS for friend requests
-- The issue: Users can only update their own profile, but we need to update the target user's profile
-- Solution: Create a function with SECURITY DEFINER that bypasses RLS

-- Function to send a friend request (updates target user's friend_requests)
CREATE OR REPLACE FUNCTION send_friend_request(
  p_from_user_id TEXT,
  p_to_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend_request(
  p_user_id TEXT,
  p_friend_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to remove a friend
CREATE OR REPLACE FUNCTION remove_friend(
  p_user_id TEXT,
  p_friend_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION send_friend_request(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION accept_friend_request(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION remove_friend(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend(TEXT, TEXT) TO anon;