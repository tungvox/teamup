-- Fix RLS policies for Clerk authentication
-- Since Clerk handles authentication, we need to allow profile creation

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create a more permissive insert policy for profile creation
-- In production, you might want to add additional checks
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (true);

-- Alternative: Create a function that bypasses RLS for profile creation
-- This is more secure but requires calling the function
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO anon, authenticated;

