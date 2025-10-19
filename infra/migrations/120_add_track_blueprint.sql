-- infra/migrations/120_add_track_blueprint.sql
-- Add blueprint JSONB field to tracks table for complete traceability

-- Add blueprint JSONB field to store the complete TrackBlueprint object
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS blueprint JSONB;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_tracks_blueprint ON public.tracks USING GIN (blueprint);

-- Add comment for documentation
COMMENT ON COLUMN public.tracks.blueprint IS 'Complete TrackBlueprint JSON data used to generate this track';

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
