-- Enable Realtime for user_profiles table
-- This allows real-time subscriptions to changes in the user_profiles table

-- Enable Realtime replication for user_profiles table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'user_profiles'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
  END IF;
END $$;

-- Note: If the above doesn't work, you may need to:
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Enable replication for INSERT, UPDATE, DELETE on user_profiles table
-- 3. Or use the Supabase CLI: supabase db remote commit
