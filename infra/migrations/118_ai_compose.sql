-- 118_ai_compose.sql — AI Composer tables + columns (idempotent)

-- Helper: is_org_member(uuid) only if missing
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_org_member'
      and pg_get_function_identity_arguments(p.oid) = 'uuid'
  ) then
    create function public.is_org_member(org_id uuid)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $f$
      select case when (select auth.uid()) is null then false
      else exists (
        select 1
        from public.user_memberships m
        where m.organization_id = org_id
          and m.user_id = (select auth.uid())
      ) end;
    $f$;
  end if;
end$$;

-- Tables (create if not exists)
create table if not exists public.ai_compose_sessions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id),
  user_id           uuid not null references auth.users(id),
  brief             text not null,
  brand_context     jsonb,
  seed              text,
  config_json       jsonb,
  suggestions_json  jsonb,
  track_blueprints  jsonb,
  model             text default 'gpt-4o-mini',
  temperature       numeric default 0.4,
  prompt_overrides  jsonb,
  created_at        timestamptz not null default now()
);

create table if not exists public.ai_compose_messages (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.ai_compose_sessions(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id),
  role             text not null check (role in ('system','assistant','user','tool')),
  content          text not null,
  payload          jsonb,
  created_at       timestamptz not null default now()
);

-- Add columns if earlier migrations created these tables without them
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_compose_sessions' and column_name='model') then
    alter table public.ai_compose_sessions add column model text default 'gpt-4o-mini';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_compose_sessions' and column_name='temperature') then
    alter table public.ai_compose_sessions add column temperature numeric default 0.4;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_compose_sessions' and column_name='prompt_overrides') then
    alter table public.ai_compose_sessions add column prompt_overrides jsonb;
  end if;
end $$;

-- Indexes
create index if not exists idx_ai_compose_sessions_org_created
  on public.ai_compose_sessions (organization_id, created_at desc);
create index if not exists idx_ai_compose_messages_session_created
  on public.ai_compose_messages (session_id, created_at asc);

-- RLS
alter table public.ai_compose_sessions enable row level security;
alter table public.ai_compose_messages enable row level security;

-- Policies (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_sessions' and policyname='acs_select_org_members') then
    create policy acs_select_org_members on public.ai_compose_sessions
      for select to authenticated using (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_sessions' and policyname='acs_insert_member_self') then
    create policy acs_insert_member_self on public.ai_compose_sessions
      for insert to authenticated with check (public.is_org_member(organization_id) and user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_sessions' and policyname='acs_update_creator') then
    create policy acs_update_creator on public.ai_compose_sessions
      for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_sessions' and policyname='acs_delete_creator') then
    create policy acs_delete_creator on public.ai_compose_sessions
      for delete to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_messages' and policyname='acm_select_org_members') then
    create policy acm_select_org_members on public.ai_compose_messages
      for select to authenticated using (public.is_org_member(organization_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ai_compose_messages' and policyname='acm_insert_member') then
    create policy acm_insert_member on public.ai_compose_messages
      for insert to authenticated with check (
        public.is_org_member(organization_id) and exists (
          select 1 from public.ai_compose_sessions s
          where s.id = session_id and s.organization_id = organization_id
        )
      );
  end if;
end $$;
