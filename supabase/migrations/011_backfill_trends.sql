-- Backfill trends by comparing danger levels between consecutive days
-- This corrects historical trends to use danger level comparison

-- First, reset all trends
UPDATE forecasts SET trend = NULL;

-- Create a temporary function to calculate max danger
-- (PostgreSQL doesn't have a simple GREATEST for this)
CREATE OR REPLACE FUNCTION calc_max_danger(alp int, tl int, btl int) RETURNS int AS $$
BEGIN
  RETURN GREATEST(alp, tl, btl);
END;
$$ LANGUAGE plpgsql;

-- Update trends by comparing to previous day
-- Use a CTE to get previous day's data
WITH forecast_with_prev AS (
  SELECT
    f.id,
    f.zone_id,
    f.valid_date,
    f.bottom_line,
    calc_max_danger(f.danger_alpine, f.danger_treeline, f.danger_below_treeline) as current_danger,
    (
      SELECT calc_max_danger(p.danger_alpine, p.danger_treeline, p.danger_below_treeline)
      FROM forecasts p
      WHERE p.zone_id = f.zone_id
        AND p.valid_date = f.valid_date - INTERVAL '1 day'
    ) as prev_danger,
    (
      SELECT COUNT(*)::int FROM avalanche_problems ap WHERE ap.forecast_id = f.id
    ) as current_problems,
    (
      SELECT COUNT(*)::int
      FROM avalanche_problems ap2
      JOIN forecasts p2 ON ap2.forecast_id = p2.id
      WHERE p2.zone_id = f.zone_id
        AND p2.valid_date = f.valid_date - INTERVAL '1 day'
    ) as prev_problems
  FROM forecasts f
)
UPDATE forecasts f
SET trend = CASE
  -- Check for storm keywords first (takes priority)
  WHEN lower(f.bottom_line || ' ' || COALESCE(f.discussion, '')) LIKE '%storm expected%'
    OR lower(f.bottom_line || ' ' || COALESCE(f.discussion, '')) LIKE '%storm approaching%'
    OR lower(f.bottom_line || ' ' || COALESCE(f.discussion, '')) LIKE '%snow expected%'
    OR lower(f.bottom_line || ' ' || COALESCE(f.discussion, '')) LIKE '%danger is expected to rise%'
    OR lower(f.bottom_line || ' ' || COALESCE(f.discussion, '')) LIKE '%inches expected%'
  THEN 'storm_incoming'

  -- Danger decreased = improving
  WHEN fp.prev_danger IS NOT NULL AND fp.current_danger < fp.prev_danger
  THEN 'improving'

  -- Danger increased = worsening
  WHEN fp.prev_danger IS NOT NULL AND fp.current_danger > fp.prev_danger
  THEN 'worsening'

  -- Danger same, fewer problems = improving
  WHEN fp.prev_danger IS NOT NULL
    AND fp.current_danger = fp.prev_danger
    AND fp.prev_problems IS NOT NULL
    AND fp.current_problems < fp.prev_problems
  THEN 'improving'

  -- Danger same, more problems = worsening
  WHEN fp.prev_danger IS NOT NULL
    AND fp.current_danger = fp.prev_danger
    AND fp.prev_problems IS NOT NULL
    AND fp.current_problems > fp.prev_problems
  THEN 'worsening'

  -- Danger same, problems same - use text analysis
  WHEN lower(f.bottom_line) LIKE '%adjusting%'
    OR lower(f.bottom_line) LIKE '%stabiliz%'
    OR lower(f.bottom_line) LIKE '%stubborn%'
    OR lower(f.bottom_line) LIKE '%unlikely%'
  THEN 'improving'

  WHEN lower(f.bottom_line) LIKE '%dangerous avalanche%'
    OR lower(f.bottom_line) LIKE '%heightened%'
  THEN 'worsening'

  -- Default to steady
  ELSE 'steady'
END
FROM forecast_with_prev fp
WHERE f.id = fp.id;

-- Also update key_message and travel_advice where missing
UPDATE forecasts
SET key_message = substring(bottom_line FROM '^([^.]+\.)')
WHERE key_message IS NULL AND bottom_line IS NOT NULL;

UPDATE forecasts
SET travel_advice = substring(bottom_line FROM '(The safest[^.]+\.)')
WHERE travel_advice IS NULL AND lower(bottom_line) LIKE '%safest%';

UPDATE forecasts
SET travel_advice = substring(bottom_line FROM '(You can reduce[^.]+\.)')
WHERE travel_advice IS NULL AND lower(bottom_line) LIKE '%you can reduce%';

-- Show results
SELECT
  valid_date,
  zone_id,
  GREATEST(danger_alpine, danger_treeline, danger_below_treeline) as danger,
  trend,
  LEFT(key_message, 50) as key_message_preview
FROM forecasts
ORDER BY valid_date DESC, zone_id
LIMIT 20;

-- Clean up the helper function
DROP FUNCTION IF EXISTS calc_max_danger(int, int, int);
