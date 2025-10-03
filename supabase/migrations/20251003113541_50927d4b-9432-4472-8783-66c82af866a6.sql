-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.search_similar_entries(
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    entry_embeddings.id,
    entry_embeddings.content,
    1 - (entry_embeddings.embedding <=> query_embedding) AS similarity,
    entry_embeddings.created_at
  FROM public.entry_embeddings
  WHERE entry_embeddings.user_id = match_user_id
    AND 1 - (entry_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY entry_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;