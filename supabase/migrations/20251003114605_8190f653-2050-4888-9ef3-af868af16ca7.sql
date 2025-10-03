-- Add indexes for faster memory queries
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_created ON public.diary_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_null_insights ON public.diary_entries(user_id) WHERE ai_insights IS NULL;

-- Add session summary tracking
ALTER TABLE public.session_summaries ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_session_summaries_unprocessed ON public.session_summaries(user_id) WHERE processed = FALSE;