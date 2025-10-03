-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing entry embeddings (semantic search)
CREATE TABLE IF NOT EXISTS public.entry_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS entry_embeddings_user_id_idx ON public.entry_embeddings(user_id);
CREATE INDEX IF NOT EXISTS entry_embeddings_embedding_idx ON public.entry_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE public.entry_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embeddings"
  ON public.entry_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own embeddings"
  ON public.entry_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table for session summaries
CREATE TABLE IF NOT EXISTS public.session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  entry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_summaries_user_id_idx ON public.session_summaries(user_id);
CREATE INDEX IF NOT EXISTS session_summaries_created_at_idx ON public.session_summaries(created_at DESC);

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON public.session_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
  ON public.session_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table for user personalization traits
CREATE TABLE IF NOT EXISTS public.user_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  themes JSONB DEFAULT '[]'::jsonb,
  values JSONB DEFAULT '[]'::jsonb,
  tone_preference TEXT DEFAULT 'balanced',
  recurring_patterns JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_traits_user_id_idx ON public.user_traits(user_id);

ALTER TABLE public.user_traits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own traits"
  ON public.user_traits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own traits"
  ON public.user_traits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traits"
  ON public.user_traits FOR UPDATE
  USING (auth.uid() = user_id);

-- Table for surprise reflections (variable reward)
CREATE TABLE IF NOT EXISTS public.surprise_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reflection_type TEXT NOT NULL, -- 'quote', 'mirror', 'challenge', 'echo'
  content TEXT NOT NULL,
  context JSONB,
  shown_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS surprise_reflections_user_id_idx ON public.surprise_reflections(user_id);
CREATE INDEX IF NOT EXISTS surprise_reflections_shown_at_idx ON public.surprise_reflections(shown_at);

ALTER TABLE public.surprise_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections"
  ON public.surprise_reflections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
  ON public.surprise_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
  ON public.surprise_reflections FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to search similar entries
CREATE OR REPLACE FUNCTION search_similar_entries(
  query_embedding vector(1536),
  match_user_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    entry_embeddings.id,
    entry_embeddings.content,
    1 - (entry_embeddings.embedding <=> query_embedding) AS similarity,
    entry_embeddings.created_at
  FROM entry_embeddings
  WHERE entry_embeddings.user_id = match_user_id
    AND 1 - (entry_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY entry_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;