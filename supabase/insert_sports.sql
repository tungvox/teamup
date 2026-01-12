-- Insert default sports if they don't exist
INSERT INTO sports (name, icon, display_order) VALUES
  ('Tennis', 'sports_tennis', 1),
  ('Pickleball', 'sports_tennis', 2),
  ('Badminton', 'sports_tennis', 3)
ON CONFLICT (name) DO NOTHING;

-- You can add more sports later:
-- INSERT INTO sports (name, icon, display_order) VALUES
--   ('Basketball', 'sports_basketball', 4),
--   ('Soccer', 'sports_soccer', 5),
--   ('Volleyball', 'sports_volleyball', 6)
-- ON CONFLICT (name) DO NOTHING;

