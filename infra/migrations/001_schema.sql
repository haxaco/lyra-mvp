-- infra/migrations/001_schema.sql
-- Lyra MVP — Core schema (tables + indexes). No RLS here.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ── Core
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.user_memberships (
  user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  timezone text not null default 'America/New_York',
  address jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Brand intake
create table if not exists public.brand_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null check (type in ('website','instagram','youtube','tiktok','manual')),
  url text,
  raw_text text,
  embedding vector(1536),
  extracted_at timestamptz not null default now(),
  ttl_expires_at timestamptz
);

create table if not exists public.brand_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  keywords text[],
  moods text[],
  banned_terms text[],
  preferred_energy int2 default 5,
  family_friendly boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ── Provider registry
create table if not exists public.provider_compliance (
  id text primary key,               -- 'mureka','suno','musicgen'
  display_name text not null,
  allowed_for_b2b boolean not null default false,
  allowed_public_performance boolean not null default false,
  requires_attribution boolean not null default false,
  watermarking_available boolean not null default false,
  notes text
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.provider_compliance(id) on delete cascade,
  name text not null,
  version text,
  enabled boolean not null default false,
  default_params jsonb,
  created_at timestamptz not null default now()
);

-- ── Generation & playback
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model_id uuid not null references public.models(id),
  prompt text not null,
  params jsonb,
  status text not null check (status in ('queued','running','succeeded','failed')),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  cost_cents int4 not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.generation_jobs(id) on delete set null,
  title text,
  duration_seconds int4,
  genre text,
  energy int2,
  provider_id text references public.provider_compliance(id),
  r2_key text not null,
  sample_rate int2 default 44,
  bitrate_kbps int2 default 256,
  watermark boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  name text not null,
  schedule jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position int4 not null,
  primary key (playlist_id, position)
);

create table if not exists public.playback_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  seconds_streamed int4 not null default 0,
  skips int2 not null default 0,
  likes int2 not null default 0,
  model_cost_cents int4 not null default 0
);

-- ── Billing
create table if not exists public.subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'pro',
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ── Indexes
create index if not exists idx_user_memberships_org on public.user_memberships (organization_id);
create index if not exists idx_locations_org on public.locations (organization_id);
create index if not exists idx_devices_loc on public.devices (location_id);
create index if not exists idx_brand_sources_org on public.brand_sources (organization_id);
create index if not exists idx_models_provider on public.models (provider_id);
create index if not exists idx_jobs_org on public.generation_jobs (organization_id);
create index if not exists idx_tracks_org on public.tracks (organization_id);
create index if not exists idx_playlists_org on public.playlists (organization_id);
create index if not exists idx_playlist_items_track on public.playlist_items (track_id);
create index if not exists idx_playback_sessions_device on public.playback_sessions (device_id);
create index if not exists idx_playback_sessions_playlist on public.playback_sessions (playlist_id);

-- Make the API see the new schema right away
notify pgrst, 'reload schema';