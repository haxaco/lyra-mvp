-- Safe additive columns for storing generation context and FLAC key
alter table public.tracks
  add column if not exists meta jsonb,
  add column if not exists flac_r2_key text;

-- (No RLS changes; inserts will use service role key on server)

