-- infra/migrations/003_seeds_core.sql
-- Idempotent core seeds (providers + example models).

insert into public.provider_compliance
  (id, display_name, allowed_for_b2b, allowed_public_performance, requires_attribution, watermarking_available, notes)
values
  ('mureka','Mureka', true, true, false, true, 'Use commercial tier'),
  ('musicgen','MusicGen (self-hosted)', true, true, false, false, 'Requires infra & guardrails'),
  ('suno','Suno', false, false, false, false, 'Gate behind feature flag; clarify license posture')
on conflict (id) do update
set
  display_name = excluded.display_name,
  allowed_for_b2b = excluded.allowed_for_b2b,
  allowed_public_performance = excluded.allowed_public_performance,
  requires_attribution = excluded.requires_attribution,
  watermarking_available = excluded.watermarking_available,
  notes = excluded.notes;

insert into public.models (provider_id, name, version, enabled, default_params)
values
  ('mureka','mureka-default','v1', true, '{"durationSec":120,"sampleRate":44100,"bitrate":256}'),
  ('musicgen','musicgen-medium','v0.1', false, '{"durationSec":120}')
on conflict do nothing;

notify pgrst, 'reload schema';