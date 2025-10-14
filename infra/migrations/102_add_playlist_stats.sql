-- infra/migrations/102_add_playlist_stats.sql
-- Add track_count and total_duration_seconds columns to playlists table

ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS track_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER DEFAULT 0;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_playlists_track_count ON public.playlists (track_count);
CREATE INDEX IF NOT EXISTS idx_playlists_duration ON public.playlists (total_duration_seconds);

-- Update existing playlists with calculated values
UPDATE public.playlists 
SET 
  track_count = (
    SELECT COUNT(*) 
    FROM public.playlist_items 
    WHERE playlist_items.playlist_id = playlists.id
  ),
  total_duration_seconds = (
    SELECT COALESCE(SUM(t.duration_seconds), 0)
    FROM public.playlist_items pi
    JOIN public.tracks t ON pi.track_id = t.id
    WHERE pi.playlist_id = playlists.id
  )
WHERE id IN (
  SELECT DISTINCT playlist_id 
  FROM public.playlist_items
);

-- Create function to update playlist stats
CREATE OR REPLACE FUNCTION update_playlist_stats(playlist_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.playlists 
  SET 
    track_count = (
      SELECT COUNT(*) 
      FROM public.playlist_items 
      WHERE playlist_items.playlist_id = playlist_uuid
    ),
    total_duration_seconds = (
      SELECT COALESCE(SUM(t.duration_seconds), 0)
      FROM public.playlist_items pi
      JOIN public.tracks t ON pi.track_id = t.id
      WHERE pi.playlist_id = playlist_uuid
    )
  WHERE id = playlist_uuid;
END;
$$ LANGUAGE plpgsql;

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
