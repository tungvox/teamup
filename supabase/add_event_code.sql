-- Add code column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS code TEXT;

-- Create unique index on code for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_code ON events(code) WHERE code IS NOT NULL;

-- Generate codes for existing events that don't have one
-- This uses a function to generate random codes
DO $$
DECLARE
    event_record RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    FOR event_record IN SELECT id FROM events WHERE code IS NULL OR code = '' LOOP
        LOOP
            -- Generate a code: 3 letters + 3 numbers
            new_code := 
                chr(65 + floor(random() * 26)::int) ||
                chr(65 + floor(random() * 26)::int) ||
                chr(65 + floor(random() * 26)::int) ||
                floor(random() * 10)::text ||
                floor(random() * 10)::text ||
                floor(random() * 10)::text;
            
            -- Check if code already exists
            SELECT EXISTS(SELECT 1 FROM events WHERE code = new_code) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        -- Update the event with the new code
        UPDATE events SET code = new_code WHERE id = event_record.id;
    END LOOP;
END $$;
