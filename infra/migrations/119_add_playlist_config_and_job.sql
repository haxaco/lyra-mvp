-- infra/migrations/119_add_playlist_config_and_job.sql
-- Add config and job_id fields to playlists table for full traceability

-- Add config JSONB field to store the full ComposeConfig
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS config JSONB;

-- Add job_id field to track which generation job created this playlist
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.generation_jobs(id) ON DELETE SET NULL;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_playlists_config ON public.playlists USING GIN (config);
CREATE INDEX IF NOT EXISTS idx_playlists_job_id ON public.playlists (job_id);

-- Add comments for documentation
COMMENT ON COLUMN public.playlists.config IS 'Full ComposeConfig JSON data used to generate this playlist';
COMMENT ON COLUMN public.playlists.job_id IS 'Reference to the generation job that created this playlist';

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
