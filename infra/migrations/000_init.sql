
-- Lyra baseline schema (trimmed for starter)
create extension if not exists vector;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists user_memberships (
  user_id uuid not null,
  organization_id uuid not null references organizations(id),
  role text not null check (role in ('owner','admin','manager','staff')),
  primary key (user_id, organization_id)
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

create table if not exists brand_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  type text not null check (type in ('website','instagram','youtube','tiktok','manual')),
  url text,
  raw_text text,
  embedding vector(1536),
  extracted_at timestamptz default now()
);
