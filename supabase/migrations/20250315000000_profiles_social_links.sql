-- Add social links and permission to profiles for map popup.
-- Run in Supabase SQL editor or via supabase db push.

alter table public.profiles
  add column if not exists facebook_url text,
  add column if not exists instagram_handle text,
  add column if not exists show_social_to_nearby boolean not null default false;

comment on column public.profiles.facebook_url is 'Full Facebook profile URL or page name';
comment on column public.profiles.instagram_handle is 'Instagram username (without @)';
comment on column public.profiles.show_social_to_nearby is 'If true, show social links to nearby users when they tap your heart on the map';
