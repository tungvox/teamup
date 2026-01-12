-- Add user_id and friends columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS friends TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS friend_requests TEXT[] DEFAULT '{}';

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Generate user_ids for existing users if they don't have one
-- This will generate IDs like "firstnamelastname#1234"
DO $$
DECLARE
  user_record RECORD;
  base_username TEXT;
  discriminator TEXT;
  new_user_id TEXT;
  counter INTEGER;
BEGIN
  FOR user_record IN SELECT id, first_name, last_name, clerk_id FROM user_profiles WHERE user_id IS NULL OR user_id = '' LOOP
    -- Generate base username from first and last name
    base_username := LOWER(REGEXP_REPLACE(COALESCE(user_record.first_name, '') || COALESCE(user_record.last_name, ''), '[^a-z0-9]', '', 'g'));
    
    -- If empty, use a default
    IF base_username = '' THEN
      base_username := 'user';
    END IF;
    
    -- Limit to 20 characters
    base_username := LEFT(base_username, 20);
    
    -- Generate unique discriminator
    counter := 0;
    LOOP
      discriminator := LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0');
      new_user_id := base_username || '#' || discriminator;
      
      -- Check if this user_id already exists
      IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = new_user_id) THEN
        EXIT;
      END IF;
      
      counter := counter + 1;
      IF counter > 100 THEN
        -- Fallback: use timestamp-based discriminator
        discriminator := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
        new_user_id := base_username || '#' || discriminator;
        EXIT;
      END IF;
    END LOOP;
    
    -- Update the user with the new user_id
    UPDATE user_profiles
    SET user_id = new_user_id
    WHERE id = user_record.id;
  END LOOP;
END $$;
