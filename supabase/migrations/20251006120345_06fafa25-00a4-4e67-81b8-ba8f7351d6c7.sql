-- Add lens_insights column to diary_entries to store structured lens analysis
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS lens_insights jsonb DEFAULT '{}'::jsonb;

-- Add index for lens insights queries
CREATE INDEX IF NOT EXISTS idx_diary_entries_lens_insights ON diary_entries USING gin(lens_insights);

COMMENT ON COLUMN diary_entries.lens_insights IS 'Structured analysis through 5 lenses: love, energy, work, growth, satisfaction';