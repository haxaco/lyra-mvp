-- 122_add_musicgpt_provider.sql
-- Add optional fields to support MusicGPT webhook provider

alter table generation_jobs
  add column if not exists provider_task_id text,
  add column if not exists expected_variants int2 default 2;

alter table tracks
  add column if not exists source_conversion_id text;

