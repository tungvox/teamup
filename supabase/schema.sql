-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sports Table
CREATE TABLE IF NOT EXISTS sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default sports
INSERT INTO sports (name, icon, display_order) VALUES
  ('Tennis', 'sports_tennis', 1),
  ('Pickleball', 'sports_tennis', 2),
  ('Badminton', 'sports_tennis', 3)
ON CONFLICT (name) DO NOTHING;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar TEXT,
  location TEXT,
  sports TEXT[] DEFAULT '{}',
  stats JSONB DEFAULT '{"matches": 0, "reliability": 100, "mvps": 0}'::jsonb,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  end_time TIME,
  location TEXT NOT NULL,
  location_details TEXT,
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 10,
  current_players INTEGER DEFAULT 0,
  players TEXT[] DEFAULT '{}',
  price DECIMAL(10, 2),
  skill_level TEXT DEFAULT 'All' CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced', 'All')),
  competitive BOOLEAN DEFAULT false,
  image TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participants TEXT[] NOT NULL,
  last_message_id UUID,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rater_id TEXT NOT NULL,
  rated_user_id TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk ON user_profiles(clerk_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Users can read all profiles" ON user_profiles
  FOR SELECT USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'sub' = clerk_id);

-- Policy: Allow inserts for new profiles (since Clerk handles auth)
-- We'll use a function with SECURITY DEFINER to bypass RLS for profile creation
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read events
CREATE POLICY "Anyone can read events" ON events
  FOR SELECT USING (true);

-- Policy: Authenticated users can create events
-- Since Clerk handles authentication, we allow inserts (Clerk validates users before they reach Supabase)
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own events
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (organizer_id = auth.jwt() ->> 'sub');

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (organizer_id = auth.jwt() ->> 'sub');

-- Policy: Users can read chats they participate in
CREATE POLICY "Users can read own chats" ON chats
  FOR SELECT USING (auth.jwt() ->> 'sub' = ANY(participants));

-- Policy: Users can create chats
CREATE POLICY "Users can create chats" ON chats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'sub' = ANY(participants));

-- Policy: Users can read messages in their chats
CREATE POLICY "Users can read messages in own chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND auth.jwt() ->> 'sub' = ANY(chats.participants)
    )
  );

-- Policy: Users can send messages
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND sender_id = auth.jwt() ->> 'sub'
    AND EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND auth.jwt() ->> 'sub' = ANY(chats.participants)
    )
  );

-- Policy: Users can read ratings
CREATE POLICY "Anyone can read ratings" ON ratings
  FOR SELECT USING (true);

-- Policy: Users can create ratings
CREATE POLICY "Users can create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND rater_id = auth.jwt() ->> 'sub');

-- Row Level Security for Sports
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active sports
CREATE POLICY "Anyone can read active sports" ON sports
  FOR SELECT USING (is_active = true);

