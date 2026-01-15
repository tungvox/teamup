-- Fix RLS INSERT policy for event_requests to allow friend invitations
-- This fixes the issue where organizers cannot invite friends to events

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create their own requests" ON event_requests;

-- Create a new INSERT policy that allows:
-- 1. Users to create requests for themselves (status = 'pending')
-- 2. Organizers to invite friends (status = 'invited' AND invited_by matches organizer)
CREATE POLICY "Users can create their own requests" ON event_requests
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      -- Case 1: Users can create requests for themselves (status = 'pending')
      (user_id = auth.jwt() ->> 'sub' AND status = 'pending')
      OR
      -- Case 2: Organizers can invite friends
      -- Check: status is 'invited', invited_by matches current user, and user is the organizer of the event
      (
        status = 'invited'
        AND invited_by = auth.jwt() ->> 'sub'
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_id  -- Reference the NEW row's event_id column
          AND events.organizer_id = auth.jwt() ->> 'sub'
        )
      )
    )
  );
