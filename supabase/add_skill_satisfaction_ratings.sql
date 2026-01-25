-- Add skill and satisfaction fields to ratings table
ALTER TABLE ratings 
ADD COLUMN IF NOT EXISTS skill INTEGER CHECK (skill >= 1 AND skill <= 5),
ADD COLUMN IF NOT EXISTS satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5);

-- Add comment explaining the fields
COMMENT ON COLUMN ratings.skill IS 'Skill rating from 1-5';
COMMENT ON COLUMN ratings.satisfaction IS 'Satisfaction rating from 1-5';
COMMENT ON COLUMN ratings.stars IS 'Overall rating from 1-5 (can be calculated from skill and satisfaction)';
