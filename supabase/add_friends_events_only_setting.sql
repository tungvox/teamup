-- Add friends_events_only preference to user_settings
-- Run this directly in Supabase: Dashboard → SQL Editor → New query → paste → Run
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS friends_events_only BOOLEAN DEFAULT false;
