-- Enable Row Level Security for sports table
-- This migration ensures RLS is enabled and proper policies are in place

-- Enable RLS on sports table
ALTER TABLE IF EXISTS public.sports ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read active sports" ON public.sports;
DROP POLICY IF EXISTS "Public read access for active sports" ON public.sports;

-- Policy: Anyone (including anonymous users) can read active sports
-- This is safe because sports is a reference table with no sensitive data
CREATE POLICY "Public read access for active sports" ON public.sports
  FOR SELECT
  USING (is_active = true);

-- Optional: Allow authenticated users to read all sports (including inactive ones)
-- Uncomment if you need to show inactive sports to authenticated users
-- CREATE POLICY "Authenticated users can read all sports" ON public.sports
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Note: INSERT, UPDATE, DELETE operations should be restricted to admins
-- If you need admin operations, create a separate policy or use SECURITY DEFINER functions
-- For now, we only allow reads, which is the primary use case
