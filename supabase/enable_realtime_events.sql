-- Enable Realtime for events and event_requests tables
-- This allows real-time subscriptions to changes in these tables

-- Enable Realtime replication for events table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'events'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
END $$;

-- Enable Realtime replication for event_requests table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'event_requests'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_requests;
  END IF;
END $$;

-- Note: If the above doesn't work, you may need to:
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Enable replication for INSERT, UPDATE, DELETE on both tables
-- 3. Or use the Supabase CLI: supabase db remote commit
