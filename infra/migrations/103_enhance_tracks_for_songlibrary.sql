-- infra/migrations/103_enhance_tracks_for_songlibrary.sql

-- Add missing fields to tracks table for SongLibrary compatibility
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS artist text,
ADD COLUMN IF NOT EXISTS mood text,
ADD COLUMN IF NOT EXISTS play_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_liked boolean DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON public.tracks (artist);
CREATE INDEX IF NOT EXISTS idx_tracks_mood ON public.tracks (mood);
CREATE INDEX IF NOT EXISTS idx_tracks_play_count ON public.tracks (play_count);
CREATE INDEX IF NOT EXISTS idx_tracks_user_liked ON public.tracks (user_liked);

-- Update existing tracks with default values
-- Note: artist will be set to user info when tracks are created, not updated here
UPDATE public.tracks 
SET 
  mood = COALESCE(mood, 
    CASE 
      WHEN genre = 'Ambient' THEN 'Calm'
      WHEN genre = 'Electronic' THEN 'Energetic'
      WHEN genre = 'Jazz' THEN 'Chill'
      WHEN genre = 'Pop' THEN 'Upbeat'
      WHEN genre = 'Classical' THEN 'Elegant'
      WHEN genre = 'Lounge' THEN 'Sophisticated'
      ELSE 'Upbeat'
    END
  ),
  play_count = COALESCE(play_count, 0),
  user_liked = COALESCE(user_liked, false)
WHERE mood IS NULL OR play_count IS NULL OR user_liked IS NULL;

-- Create a function to update play count
CREATE OR REPLACE FUNCTION increment_track_play_count(track_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.tracks 
  SET play_count = play_count + 1
  WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create a function to toggle track like status
CREATE OR REPLACE FUNCTION toggle_track_like(track_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_liked BOOLEAN;
BEGIN
  SELECT user_liked INTO current_liked FROM public.tracks WHERE id = track_uuid;
  
  UPDATE public.tracks 
  SET user_liked = NOT current_liked
  WHERE id = track_uuid;
  
  RETURN NOT current_liked;
END;
$$ LANGUAGE plpgsql;

-- Make the API see the new schema right away
NOTIFY pgrst, 'reload schema';
