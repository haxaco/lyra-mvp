-- infra/migrations/115_fix_duration_seconds.sql
-- Verify that duration_seconds is stored as milliseconds (no changes needed)

BEGIN;

-- Verify current duration values (should be in milliseconds)
SELECT 
    id,
    title,
    duration_seconds,
    created_at,
    CASE 
        WHEN duration_seconds > 3600 THEN 'milliseconds (correct)'
        WHEN duration_seconds > 0 AND duration_seconds <= 3600 THEN 'seconds (needs conversion)'
        ELSE 'null or zero'
    END as duration_format
FROM public.tracks 
WHERE duration_seconds IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

NOTIFY pgrst, 'reload schema';

COMMIT;
