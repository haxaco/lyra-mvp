-- 004_brand_allow_explicit.sql
alter table public.brand_profiles
  add column if not exists allow_explicit boolean default false;

comment on column public.brand_profiles.allow_explicit
  is 'Org-level default to allow explicit content. UI/config can override per playlist.';
