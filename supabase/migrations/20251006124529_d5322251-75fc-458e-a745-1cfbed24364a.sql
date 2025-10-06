-- Create user_focus table for Compass weekly focus feature
CREATE TABLE IF NOT EXISTS public.user_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_lens TEXT NOT NULL,
  direction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Enable RLS
ALTER TABLE public.user_focus ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own focus"
ON public.user_focus
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus"
ON public.user_focus
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus"
ON public.user_focus
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus"
ON public.user_focus
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_user_focus_user_id ON public.user_focus(user_id);
CREATE INDEX idx_user_focus_expires_at ON public.user_focus(expires_at);