-- infra/migrations/099_dev_seed_mock_user.sql
-- Optional dev seed that creates a mock auth user + sample data.
-- Safe to run in dev; avoid in prod. No psql meta-commands used.

create extension if not exists "pgcrypto";

with
u as (
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values (
    gen_random_uuid(),
    'testuser_' || floor(random()*100000)::text || '@lyra.local',
    '{"name":"Test User","provider":"manual-seed"}'::jsonb,
    'authenticated',
    'authenticated'
  )
  returning id as user_id
),
org as (
  insert into public.organizations (name, created_by)
  select 'Lyra Test Organization', u.user_id from u
  returning id as org_id
),
m as (
  insert into public.user_memberships (user_id, organization_id, role)
  select u.user_id, org.org_id, 'owner' from u join org on true
  returning user_id, organization_id
),
loc as (
  insert into public.locations (organization_id, name, timezone)
  select org.org_id, 'Main Studio', 'America/New_York' from org
  returning id as loc_id, organization_id
),
dev as (
  insert into public.devices (location_id, name, last_seen_at)
  select loc.loc_id, 'Studio Speaker', now() from loc
  returning id as device_id
),
pl as (
  insert into public.playlists (organization_id, location_id, name)
  select loc.organization_id, loc.loc_id, 'Morning Vibes' from loc
  returning id as playlist_id, organization_id
),
tr as (
  insert into public.tracks (organization_id, title, duration_seconds, genre, energy, provider_id, r2_key, watermark)
  select (select org_id from org), 'Sunrise Groove', 180, 'lofi', 5, null, 'test/sunrise-groove.mp3', false
  returning id as track_id, organization_id
),
pli as (
  insert into public.playlist_items (playlist_id, track_id, position)
  select pl.playlist_id, tr.track_id, 1 from pl, tr
  returning playlist_id, track_id
),
pbs as (
  insert into public.playback_sessions (device_id, playlist_id, seconds_streamed, skips, likes)
  select dev.device_id, pl.playlist_id, 120, 0, 1 from dev, pl
  returning id as playback_id
),
sub as (
  insert into public.subscriptions (organization_id, plan, status)
  select org.org_id, 'pro', 'trialing' from org
  on conflict (organization_id) do nothing
  returning organization_id
)
select
  (select user_id from u) as user_id,
  (select org_id from org) as organization_id,
  (select loc_id from loc) as location_id,
  (select device_id from dev) as device_id,
  (select playlist_id from pl) as playlist_id,
  (select track_id from tr) as track_id,
  (select playback_id from pbs) as playback_session_id;

notify pgrst, 'reload schema';