-- Rename diary_entries to memories and update structure
ALTER TABLE diary_entries RENAME TO memories;

-- Add new columns to memories table
ALTER TABLE memories 
  ADD COLUMN IF NOT EXISTS lens_scores JSONB DEFAULT '{"love":0,"energy":0,"work":0,"growth":0,"satisfaction":0}'::jsonb,
  ADD COLUMN IF NOT EXISTS dominant_lens TEXT,
  ADD COLUMN IF NOT EXISTS sentiment NUMERIC DEFAULT 0;

-- Migrate existing lens_insights to lens_scores format
UPDATE memories
SET lens_scores = COALESCE(
  jsonb_build_object(
    'love', CASE WHEN lens_insights->>'love' IS NOT NULL THEN 0.5 ELSE 0 END,
    'energy', CASE WHEN lens_insights->>'energy' IS NOT NULL THEN 0.5 ELSE 0 END,
    'work', CASE WHEN lens_insights->>'work' IS NOT NULL THEN 0.5 ELSE 0 END,
    'growth', CASE WHEN lens_insights->>'growth' IS NOT NULL THEN 0.5 ELSE 0 END,
    'satisfaction', CASE WHEN lens_insights->>'satisfaction' IS NOT NULL THEN 0.5 ELSE 0 END
  ),
  '{"love":0,"energy":0,"work":0,"growth":0,"satisfaction":0}'::jsonb
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  lens TEXT NOT NULL,
  signal TEXT,
  interpretation TEXT,
  reflection_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on insights
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for insights
CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE
  USING (auth.uid() = user_id);

-- Update user_traits to match spec
ALTER TABLE user_traits
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS tone_preference TEXT DEFAULT 'balanced';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insights_memory_id ON insights(memory_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_lens ON insights(lens);