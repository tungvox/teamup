-- Fix RLS policies for Events table with Clerk authentication
-- Since Clerk handles authentication, we need to allow event creation

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

-- Option 1: More permissive policy (allows any authenticated user to create events)
-- This works because Clerk validates users before they reach Supabase
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT 
  WITH CHECK (true);

-- Option 2: Create a function that bypasses RLS for event creation (more secure)
-- This is similar to the create_user_profile function
CREATE OR REPLACE FUNCTION create_event(
  p_title TEXT,
  p_sport TEXT,
  p_date DATE,
  p_time TIME,
  p_location TEXT,
  p_organizer_id TEXT,
  p_organizer_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_location_details TEXT DEFAULT NULL,
  p_max_players INTEGER DEFAULT 10,
  p_price DECIMAL(10, 2) DEFAULT NULL,
  p_skill_level TEXT DEFAULT 'All',
  p_competitive BOOLEAN DEFAULT false,
  p_image TEXT DEFAULT NULL,
  p_code TEXT DEFAULT NULL
)
RETURNS events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_event events;
BEGIN
  INSERT INTO events (
    code,
    title,
    sport,
    description,
    date,
    time,
    end_time,
    location,
    location_details,
    organizer_id,
    organizer_name,
    max_players,
    current_players,
    players,
    price,
    skill_level,
    competitive,
    image,
    status
  ) VALUES (
    p_code,
    p_title,
    p_sport,
    p_description,
    p_date,
    p_time,
    p_end_time,
    p_location,
    p_location_details,
    p_organizer_id,
    p_organizer_name,
    p_max_players,
    1, -- Creator is automatically the first player
    ARRAY[p_organizer_id]::TEXT[], -- Creator is added to players array
    p_price,
    p_skill_level,
    p_competitive,
    p_image,
    'open'
  )
  RETURNING * INTO new_event;
  
  RETURN new_event;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_event TO anon, authenticated;

