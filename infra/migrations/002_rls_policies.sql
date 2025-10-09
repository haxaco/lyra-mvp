-- infra/migrations/002_rls_policies.sql
-- Lyra MVP — RLS helpers + explicit policies (no loops, no recursion).

-- Helper functions (SECURITY DEFINER) to avoid policy recursion
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_memberships um
    where um.organization_id = org
      and um.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_memberships um
    where um.organization_id = org
      and um.user_id = auth.uid()
      and um.role in ('owner','admin')
  );
$$;

grant execute on function public.is_org_member(uuid) to anon, authenticated;
grant execute on function public.is_org_admin(uuid) to anon, authenticated;

-- Enable RLS on all managed tables
alter table public.organizations enable row level security;
alter table public.user_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.devices enable row level security;
alter table public.brand_sources enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.playback_sessions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.provider_compliance enable row level security;
alter table public.models enable row level security;

-- Organizations
drop policy if exists lyra_org_select on public.organizations;
drop policy if exists lyra_org_update_admin on public.organizations;
drop policy if exists lyra_org_insert_any_auth on public.organizations;

create policy lyra_org_select on public.organizations
  for select using (public.is_org_member(organizations.id));
create policy lyra_org_update_admin on public.organizations
  for update using (public.is_org_admin(organizations.id));
create policy lyra_org_insert_any_auth on public.organizations
  for insert with check (auth.uid() is not null);

-- User memberships (no recursive EXISTS)
drop policy if exists lyra_m_select_self_or_org on public.user_memberships;
drop policy if exists lyra_m_manage_admin on public.user_memberships;

create policy lyra_m_select_self_or_org on public.user_memberships
  for select using (
    user_memberships.user_id = auth.uid()
    or public.is_org_member(user_memberships.organization_id)
  );

create policy lyra_m_manage_admin on public.user_memberships
  for all using (public.is_org_admin(user_memberships.organization_id))
  with check (public.is_org_admin(user_memberships.organization_id));

-- Tables WITH organization_id

-- locations
drop policy if exists lyra_locations_select on public.locations;
drop policy if exists lyra_locations_insert on public.locations;
drop policy if exists lyra_locations_update on public.locations;
drop policy if exists lyra_locations_delete on public.locations;

create policy lyra_locations_select on public.locations
  for select using (public.is_org_member(locations.organization_id));
create policy lyra_locations_insert on public.locations
  for insert with check (public.is_org_member(locations.organization_id));
create policy lyra_locations_update on public.locations
  for update using (public.is_org_admin(locations.organization_id))
  with check (public.is_org_admin(locations.organization_id));
create policy lyra_locations_delete on public.locations
  for delete using (public.is_org_admin(locations.organization_id));

-- brand_sources
drop policy if exists lyra_brand_sources_select on public.brand_sources;
drop policy if exists lyra_brand_sources_insert on public.brand_sources;
drop policy if exists lyra_brand_sources_update on public.brand_sources;
drop policy if exists lyra_brand_sources_delete on public.brand_sources;

create policy lyra_brand_sources_select on public.brand_sources
  for select using (public.is_org_member(brand_sources.organization_id));
create policy lyra_brand_sources_insert on public.brand_sources
  for insert with check (public.is_org_member(brand_sources.organization_id));
create policy lyra_brand_sources_update on public.brand_sources
  for update using (public.is_org_admin(brand_sources.organization_id))
  with check (public.is_org_admin(brand_sources.organization_id));
create policy lyra_brand_sources_delete on public.brand_sources
  for delete using (public.is_org_admin(brand_sources.organization_id));

-- brand_profiles
drop policy if exists lyra_brand_profiles_select on public.brand_profiles;
drop policy if exists lyra_brand_profiles_insert on public.brand_profiles;
drop policy if exists lyra_brand_profiles_update on public.brand_profiles;
drop policy if exists lyra_brand_profiles_delete on public.brand_profiles;

create policy lyra_brand_profiles_select on public.brand_profiles
  for select using (public.is_org_member(brand_profiles.organization_id));
create policy lyra_brand_profiles_insert on public.brand_profiles
  for insert with check (public.is_org_member(brand_profiles.organization_id));
create policy lyra_brand_profiles_update on public.brand_profiles
  for update using (public.is_org_admin(brand_profiles.organization_id))
  with check (public.is_org_admin(brand_profiles.organization_id));
create policy lyra_brand_profiles_delete on public.brand_profiles
  for delete using (public.is_org_admin(brand_profiles.organization_id));

-- generation_jobs
drop policy if exists lyra_generation_jobs_select on public.generation_jobs;
drop policy if exists lyra_generation_jobs_insert on public.generation_jobs;
drop policy if exists lyra_generation_jobs_update on public.generation_jobs;
drop policy if exists lyra_generation_jobs_delete on public.generation_jobs;

create policy lyra_generation_jobs_select on public.generation_jobs
  for select using (public.is_org_member(generation_jobs.organization_id));
create policy lyra_generation_jobs_insert on public.generation_jobs
  for insert with check (public.is_org_member(generation_jobs.organization_id));
create policy lyra_generation_jobs_update on public.generation_jobs
  for update using (public.is_org_admin(generation_jobs.organization_id))
  with check (public.is_org_admin(generation_jobs.organization_id));
create policy lyra_generation_jobs_delete on public.generation_jobs
  for delete using (public.is_org_admin(generation_jobs.organization_id));

-- tracks
drop policy if exists lyra_tracks_select on public.tracks;
drop policy if exists lyra_tracks_insert on public.tracks;
drop policy if exists lyra_tracks_update on public.tracks;
drop policy if exists lyra_tracks_delete on public.tracks;

create policy lyra_tracks_select on public.tracks
  for select using (public.is_org_member(tracks.organization_id));
create policy lyra_tracks_insert on public.tracks
  for insert with check (public.is_org_member(tracks.organization_id));
create policy lyra_tracks_update on public.tracks
  for update using (public.is_org_admin(tracks.organization_id))
  with check (public.is_org_admin(tracks.organization_id));
create policy lyra_tracks_delete on public.tracks
  for delete using (public.is_org_admin(tracks.organization_id));

-- playlists
drop policy if exists lyra_playlists_select on public.playlists;
drop policy if exists lyra_playlists_insert on public.playlists;
drop policy if exists lyra_playlists_update on public.playlists;
drop policy if exists lyra_playlists_delete on public.playlists;

create policy lyra_playlists_select on public.playlists
  for select using (public.is_org_member(playlists.organization_id));
create policy lyra_playlists_insert on public.playlists
  for insert with check (public.is_org_member(playlists.organization_id));
create policy lyra_playlists_update on public.playlists
  for update using (public.is_org_admin(playlists.organization_id))
  with check (public.is_org_admin(playlists.organization_id));
create policy lyra_playlists_delete on public.playlists
  for delete using (public.is_org_admin(playlists.organization_id));

-- subscriptions
drop policy if exists lyra_subscriptions_select on public.subscriptions;
drop policy if exists lyra_subscriptions_insert on public.subscriptions;
drop policy if exists lyra_subscriptions_update on public.subscriptions;
drop policy if exists lyra_subscriptions_delete on public.subscriptions;

create policy lyra_subscriptions_select on public.subscriptions
  for select using (public.is_org_member(subscriptions.organization_id));
create policy lyra_subscriptions_insert on public.subscriptions
  for insert with check (public.is_org_member(subscriptions.organization_id));
create policy lyra_subscriptions_update on public.subscriptions
  for update using (public.is_org_admin(subscriptions.organization_id))
  with check (public.is_org_admin(subscriptions.organization_id));
create policy lyra_subscriptions_delete on public.subscriptions
  for delete using (public.is_org_admin(subscriptions.organization_id));

-- Tables WITHOUT organization_id (join via parent → org)

-- devices → locations → org_id
drop policy if exists lyra_devices_select on public.devices;
drop policy if exists lyra_devices_insert on public.devices;
drop policy if exists lyra_devices_update on public.devices;
drop policy if exists lyra_devices_delete on public.devices;

create policy lyra_devices_select on public.devices
  for select using (
    public.is_org_member(
      (select l.organization_id from public.locations l where l.id = devices.location_id)
    )
  );
create policy lyra_devices_insert on public.devices
  for insert with check (
    public.is_org_member(
      (select l.organization_id from public.locations l where l.id = devices.location_id)
    )
  );
create policy lyra_devices_update on public.devices
  for update using (
    public.is_org_admin(
      (select l.organization_id from public.locations l where l.id = devices.location_id)
    )
  )
  with check (
    public.is_org_admin(
      (select l.organization_id from public.locations l where l.id = devices.location_id)
    )
  );
create policy lyra_devices_delete on public.devices
  for delete using (
    public.is_org_admin(
      (select l.organization_id from public.locations l where l.id = devices.location_id)
    )
  );

-- playlist_items → playlists → org_id
drop policy if exists lyra_playlist_items_select on public.playlist_items;
drop policy if exists lyra_playlist_items_insert on public.playlist_items;
drop policy if exists lyra_playlist_items_update on public.playlist_items;
drop policy if exists lyra_playlist_items_delete on public.playlist_items;

create policy lyra_playlist_items_select on public.playlist_items
  for select using (
    public.is_org_member(
      (select p.organization_id from public.playlists p where p.id = playlist_items.playlist_id)
    )
  );
create policy lyra_playlist_items_insert on public.playlist_items
  for insert with check (
    public.is_org_member(
      (select p.organization_id from public.playlists p where p.id = playlist_items.playlist_id)
    )
  );
create policy lyra_playlist_items_update on public.playlist_items
  for update using (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playlist_items.playlist_id)
    )
  )
  with check (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playlist_items.playlist_id)
    )
  );
create policy lyra_playlist_items_delete on public.playlist_items
  for delete using (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playlist_items.playlist_id)
    )
  );

-- playback_sessions → playlists → org_id
drop policy if exists lyra_playback_sessions_select on public.playback_sessions;
drop policy if exists lyra_playback_sessions_insert on public.playback_sessions;
drop policy if exists lyra_playback_sessions_update on public.playback_sessions;
drop policy if exists lyra_playback_sessions_delete on public.playback_sessions;

create policy lyra_playback_sessions_select on public.playback_sessions
  for select using (
    public.is_org_member(
      (select p.organization_id from public.playlists p where p.id = playback_sessions.playlist_id)
    )
  );
create policy lyra_playback_sessions_insert on public.playback_sessions
  for insert with check (
    public.is_org_member(
      (select p.organization_id from public.playlists p where p.id = playback_sessions.playlist_id)
    )
  );
create policy lyra_playback_sessions_update on public.playback_sessions
  for update using (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playback_sessions.playlist_id)
    )
  )
  with check (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playback_sessions.playlist_id)
    )
  );
create policy lyra_playback_sessions_delete on public.playback_sessions
  for delete using (
    public.is_org_admin(
      (select p.organization_id from public.playlists p where p.id = playback_sessions.playlist_id)
    )
  );

-- Provider registry: readable by any authenticated user
drop policy if exists lyra_pc_read_auth on public.provider_compliance;
drop policy if exists lyra_models_read_auth on public.models;

create policy lyra_pc_read_auth on public.provider_compliance
  for select using (auth.uid() is not null);

create policy lyra_models_read_auth on public.models
  for select using (auth.uid() is not null);

-- Reload API cache
notify pgrst, 'reload schema';