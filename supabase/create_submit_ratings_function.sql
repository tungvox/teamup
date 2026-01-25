-- Function to submit ratings (bypasses RLS for Clerk authentication)
CREATE OR REPLACE FUNCTION submit_ratings(
  p_ratings JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rating_record JSONB;
BEGIN
  -- Loop through each rating in the array
  FOR rating_record IN SELECT * FROM jsonb_array_elements(p_ratings)
  LOOP
    INSERT INTO ratings (
      event_id,
      rater_id,
      rated_user_id,
      stars,
      skill,
      satisfaction,
      tags,
      comment
    ) VALUES (
      (rating_record->>'event_id')::UUID,
      rating_record->>'rater_id',
      rating_record->>'rated_user_id',
      (rating_record->>'stars')::INTEGER,
      CASE 
        WHEN rating_record->>'skill' IS NOT NULL THEN (rating_record->>'skill')::INTEGER
        ELSE NULL
      END,
      CASE 
        WHEN rating_record->>'satisfaction' IS NOT NULL THEN (rating_record->>'satisfaction')::INTEGER
        ELSE NULL
      END,
      COALESCE((rating_record->'tags')::TEXT[], '{}'::TEXT[]),
      rating_record->>'comment'
    );
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION submit_ratings(JSONB) TO authenticated, anon;
