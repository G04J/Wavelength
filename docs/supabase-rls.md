# Supabase RLS for Profile & Interests

The profile page reads and writes `public.profiles` and `public.user_interests`. The save API also writes `public.user_embeddings`. Enable RLS so users can only access their own rows.

**Schema requirement:** `user_embeddings.embedding` must be `vector(1536)` to match the app (Google Gemini gemini-embedding-001 with `outputDimensionality: 1536`). pgvector ivfflat indexes support up to 2000 dimensions. To migrate from 3072 or 768, run the incremental migration in `supabase/migrations/20250314160000_embedding_vector_1536.sql` (drops index, clears rows, alters column, recreates index with `vector_cosine_ops`).

Run in the Supabase SQL editor (after your schema is applied).

```sql
-- Profiles: users can read/insert/update their own row
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- User interests: users can read/insert/update/delete their own interests
alter table public.user_interests enable row level security;

create policy "Users can view own interests"
  on public.user_interests for select
  using (auth.uid() = user_id);

create policy "Users can insert own interests"
  on public.user_interests for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own interests"
  on public.user_interests for delete
  using (auth.uid() = user_id);

-- User embeddings: used by profile save API (server uses user session)
alter table public.user_embeddings enable row level security;

create policy "Users can view own embeddings"
  on public.user_embeddings for select
  using (auth.uid() = user_id);

create policy "Users can insert own embeddings"
  on public.user_embeddings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own embeddings"
  on public.user_embeddings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own embeddings"
  on public.user_embeddings for delete
  using (auth.uid() = user_id);
```

After this, the profile page and the profile save API (using the user's session) can read/write profile, interests, and embeddings for the logged-in user. The save API deletes the user's embedding row when they clear all interests (no stale embeddings).
