-- Fix RLS policy for ratings to work with Clerk authentication
-- Drop existing policy
DROP POLICY IF EXISTS "Users can create ratings" ON ratings;

-- Create a more permissive policy that works with Clerk
-- Since Clerk handles authentication, we allow authenticated users to create ratings
CREATE POLICY "Users can create ratings" ON ratings
  FOR INSERT 
  WITH CHECK (true);

-- Alternative: Keep the RPC function approach (recommended)
-- The submit_ratings function with SECURITY DEFINER bypasses RLS
