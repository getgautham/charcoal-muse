-- Ensure user_id has a default value that uses auth.uid()
ALTER TABLE memories 
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Update RLS policies to be more permissive for inserts
DROP POLICY IF EXISTS "Users can create own entries" ON memories;

CREATE POLICY "Users can create own entries"
  ON memories FOR INSERT
  WITH CHECK (
    CASE 
      WHEN user_id IS NULL THEN auth.uid() IS NOT NULL
      ELSE auth.uid() = user_id
    END
  );