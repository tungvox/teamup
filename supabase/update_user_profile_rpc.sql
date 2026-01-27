-- RPC to update user_profiles when using Clerk (no Supabase JWT)
-- RLS "Users can update own profile" uses auth.jwt() ->> 'sub' which is NULL
-- when using Clerk + anon key, so direct UPDATE is blocked. This SECURITY DEFINER
-- function bypasses RLS. The client must pass the correct clerk_id (from Clerk).

CREATE OR REPLACE FUNCTION update_user_profile(
  p_clerk_id TEXT,
  p_updates JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_profiles
  SET
    first_name     = CASE WHEN p_updates ? 'first_name'      THEN (p_updates->>'first_name')::TEXT      ELSE first_name     END,
    last_name      = CASE WHEN p_updates ? 'last_name'       THEN (p_updates->>'last_name')::TEXT       ELSE last_name      END,
    avatar         = CASE WHEN p_updates ? 'avatar'          THEN (p_updates->>'avatar')::TEXT          ELSE avatar         END,
    location       = CASE WHEN p_updates ? 'location'        THEN (p_updates->>'location')::TEXT        ELSE location       END,
    user_id        = CASE WHEN p_updates ? 'user_id'         THEN (p_updates->>'user_id')::TEXT         ELSE user_id        END,
    sports         = CASE
                      WHEN NOT (p_updates ? 'sports')        THEN sports
                      WHEN p_updates->'sports' IS NULL       THEN NULL
                      ELSE ARRAY(SELECT jsonb_array_elements_text(p_updates->'sports'))
                     END,
    stats          = CASE WHEN p_updates ? 'stats'           THEN (p_updates->'stats')::jsonb           ELSE stats          END,
    level          = CASE WHEN p_updates ? 'level'           THEN (p_updates->>'level')::INTEGER        ELSE level          END,
    tier           = CASE WHEN p_updates ? 'tier'            THEN (p_updates->>'tier')::TEXT            ELSE tier           END,
    friends        = CASE
                      WHEN NOT (p_updates ? 'friends')       THEN friends
                      WHEN p_updates->'friends' IS NULL      THEN NULL
                      ELSE ARRAY(SELECT jsonb_array_elements_text(p_updates->'friends'))
                     END,
    friend_requests= CASE
                      WHEN NOT (p_updates ? 'friend_requests') THEN friend_requests
                      WHEN p_updates->'friend_requests' IS NULL THEN NULL
                      ELSE ARRAY(SELECT jsonb_array_elements_text(p_updates->'friend_requests'))
                     END
  WHERE clerk_id = p_clerk_id;
END;
$$;

-- Allow anon and authenticated to call (app uses anon + Clerk)
GRANT EXECUTE ON FUNCTION update_user_profile(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION update_user_profile(TEXT, JSONB) TO authenticated;
