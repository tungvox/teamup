-- Add pending_requests column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS pending_requests TEXT[] DEFAULT '{}';

-- Update existing events to have empty pending_requests array if null
UPDATE events
SET pending_requests = '{}'
WHERE pending_requests IS NULL;
