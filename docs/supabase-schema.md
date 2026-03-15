# Supabase schema (current)

## Changes you need on Supabase

1. **Add 3 columns to `profiles`** (required for social links on the map):
   - `facebook_url` (text, nullable)
   - `instagram_handle` (text, nullable)
   - `show_social_to_nearby` (boolean, not null, default false)

2. **Optional:** Drop the chat-related tables if you no longer need them:  
   `connection_intents`, `matches`, `messages`.  
   The app no longer uses them.

---

## Migration to run (profiles only)

Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query):

```sql
-- Add social links and permission to profiles for map popup
alter table public.profiles
  add column if not exists facebook_url text,
  add column if not exists instagram_handle text,
  add column if not exists show_social_to_nearby boolean not null default false;

comment on column public.profiles.facebook_url is 'Full Facebook profile URL or page name';
comment on column public.profiles.instagram_handle is 'Instagram username (without @)';
comment on column public.profiles.show_social_to_nearby is 'If true, show social links to nearby users when they tap your heart on the map';
```

---

## Optional: drop chat tables

If you want to remove the old chat tables entirely, run **after** the migration above:

```sql
drop table if exists public.messages;
drop table if exists public.matches;
drop table if exists public.connection_intents;
```

---

## Full schema (reference after changes)

```sql
create extension if not exists vector;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer check (age >= 18),
  email text not null unique,
  facebook_url text,
  instagram_handle text,
  show_social_to_nearby boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.facebook_url is 'Full Facebook profile URL or page name';
comment on column public.profiles.instagram_handle is 'Instagram username (without @)';
comment on column public.profiles.show_social_to_nearby is 'If true, show social links to nearby users when they tap your heart on the map';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table public.user_interests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest text not null,
  category text,
  created_at timestamptz not null default now(),
  unique (user_id, interest)
);

create index user_interests_user_id_idx on public.user_interests(user_id);
create index user_interests_interest_idx on public.user_interests(interest);

create table public.user_embeddings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  profile_text text not null,
  embedding vector(1536),
  model_name text not null,
  updated_at timestamptz not null default now()
);

create trigger set_user_embeddings_updated_at
before update on public.user_embeddings
for each row
execute function public.set_updated_at();

create index user_embeddings_embedding_idx
on public.user_embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Chat tables (no longer used by the app; optional to keep or drop)
create table public.connection_intents (
  id bigint generated always as identity primary key,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'ignored', 'matched')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create index connection_intents_from_user_idx on public.connection_intents(from_user_id);
create index connection_intents_to_user_idx on public.connection_intents(to_user_id);

create table public.matches (
  id bigint generated always as identity primary key,
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user1_id <> user2_id),
  check (user1_id < user2_id),
  unique (user1_id, user2_id)
);

create index matches_user1_idx on public.matches(user1_id);
create index matches_user2_idx on public.matches(user2_id);

create table public.messages (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_match_id_idx on public.messages(match_id);
create index messages_created_at_idx on public.messages(created_at);
```

**Summary of differences from your old schema**

| Item | Old | New |
|------|-----|-----|
| `profiles` | name, age, email, created_at, updated_at | Same **plus** `facebook_url`, `instagram_handle`, `show_social_to_nearby` |
| `user_embeddings.embedding` | `vector(768)` | `vector(1536)` (from your existing migration) |
| `connection_intents`, `matches`, `messages` | Used by chat | Unused; safe to drop if you want |
