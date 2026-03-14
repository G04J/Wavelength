-- Migration: Reduce user_embeddings.embedding to vector(1536) for pgvector ivfflat compatibility.
-- pgvector ivfflat indexes support up to 2000 dimensions; Gemini default is 3072.
-- App now uses gemini-embedding-001 with outputDimensionality: 1536.
-- Run in Supabase SQL editor.
--
-- Backfill: This migration deletes all rows in user_embeddings. After running it,
-- embeddings are regenerated when each user next saves their profile (POST /api/profile/save).
-- No separate backfill script is required.

-- 1) Drop existing ivfflat index on embedding (if it exists)
drop index if exists public.user_embeddings_embedding_idx;

-- 2) Clear existing embeddings so we can change column size (3072/768 -> 1536 incompatible in place)
delete from public.user_embeddings;

-- 3) Change column to vector(1536)
alter table public.user_embeddings
  alter column embedding type vector(1536);

-- 4) Recreate cosine similarity index for ANN search
create index user_embeddings_embedding_idx
  on public.user_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
