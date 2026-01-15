-- Add 'invited' status to event_requests table
-- This allows organizers to invite friends to events

-- Update the check constraint to include 'invited'
ALTER TABLE event_requests 
DROP CONSTRAINT IF EXISTS event_requests_status_check;

ALTER TABLE event_requests
ADD CONSTRAINT event_requests_status_check 
CHECK (status IN ('pending', 'approved', 'denied', 'invited'));

-- Add invited_by field to track who sent the invitation (organizer)
ALTER TABLE event_requests
ADD COLUMN IF NOT EXISTS invited_by TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_requests_invited_by ON event_requests(invited_by);
