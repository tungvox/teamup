-- Create event_requests table
CREATE TABLE IF NOT EXISTS event_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- clerk_id of the requester
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id) -- Prevent duplicate requests
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_requests_event_id ON event_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_user_id ON event_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);

-- Enable RLS
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests for events they organize or their own requests
-- Note: Since we're using Clerk, we'll use service role or handle auth in application layer
-- For now, allow all authenticated users (RLS will be handled by application logic)
CREATE POLICY "Users can view requests for events they organize or their own requests"
  ON event_requests
  FOR SELECT
  USING (true); -- Application layer will filter

-- Policy: Users can create their own requests
CREATE POLICY "Users can create their own requests"
  ON event_requests
  FOR INSERT
  WITH CHECK (true); -- Application layer will validate

-- Policy: Only event organizers can update request status
CREATE POLICY "Event organizers can update request status"
  ON event_requests
  FOR UPDATE
  USING (true); -- Application layer will validate

-- Policy: Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
  ON event_requests
  FOR DELETE
  USING (true); -- Application layer will validate

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_event_requests_updated_at
  BEFORE UPDATE ON event_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_event_requests_updated_at();
