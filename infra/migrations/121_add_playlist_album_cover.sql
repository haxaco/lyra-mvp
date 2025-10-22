-- infra/migrations/121_add_playlist_album_cover.sql
-- Add album cover support to playlists table

-- Add album_cover_r2_key field to store the R2 key for the generated album cover
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS album_cover_r2_key TEXT;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_playlists_album_cover ON public.playlists (album_cover_r2_key);

-- Add comment for documentation
COMMENT ON COLUMN public.playlists.album_cover_r2_key IS 'R2 key for the generated album cover image';

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
