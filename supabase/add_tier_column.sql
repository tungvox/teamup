-- Add tier column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'challenger'));

-- Create index on tier for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON user_profiles(tier);

-- Update existing users to have bronze tier by default
UPDATE user_profiles
SET tier = 'bronze'
WHERE tier IS NULL;
