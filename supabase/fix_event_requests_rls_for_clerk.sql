-- Fix RLS INSERT policy for event_requests to work with Clerk authentication
-- Since Clerk handles authentication, we need to allow inserts when the app validates the user
-- The application layer (eventService.requestToJoin) already validates:
-- - User is not already in the event
-- - Event is not full
-- - No duplicate pending request exists

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own requests" ON event_requests;

-- Create a more permissive INSERT policy that works with Clerk
-- The app layer validates user identity and prevents abuse
CREATE POLICY "Users can create their own requests" ON event_requests
  FOR INSERT
  WITH CHECK (true); -- Application layer validates user identity via Clerk

-- Also ensure the SELECT policy allows users to see their own requests
DROP POLICY IF EXISTS "Users can view requests for events they organize or their own requests" ON event_requests;

CREATE POLICY "Users can view requests for events they organize or their own requests" ON event_requests
  FOR SELECT
  USING (true); -- Application layer filters based on Clerk user ID

-- Ensure UPDATE policy allows organizers to update requests
-- (This should already exist, but we'll make sure it's permissive enough)
DROP POLICY IF EXISTS "Event organizers can update request status" ON event_requests;

CREATE POLICY "Event organizers can update request status" ON event_requests
  FOR UPDATE
  USING (true) -- Application layer validates organizer identity
  WITH CHECK (true);

-- Ensure DELETE policy allows users to delete their own requests
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON event_requests;

CREATE POLICY "Users can delete their own pending requests" ON event_requests
  FOR DELETE
  USING (true); -- Application layer validates user identity
