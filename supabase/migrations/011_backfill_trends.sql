-- Backfill trends by comparing danger levels between consecutive days
-- This corrects historical trends to use danger level comparison
--
-- Run this after 010_admin_role.sql if trends need recalculating

-- Reset and recalculate all trends
WITH forecast_with_prev AS (
  SELECT
    f.id,
    f.zone_id,
    f.valid_date,
    f.bottom_line,
    f.discussion,
    GREATEST(f.danger_alpine, f.danger_treeline, f.danger_below_treeline) as current_danger,
    (
      SELECT GREATEST(p.danger_alpine, p.danger_treeline, p.danger_below_treeline)
      FROM forecasts p
      WHERE p.zone_id = f.zone_id
        AND p.valid_date = f.valid_date - INTERVAL '1 day'
    ) as prev_danger
  FROM forecasts f
)
UPDATE forecasts f
SET trend = CASE
  -- Storm keywords take priority
  WHEN lower(fp.bottom_line || ' ' || COALESCE(fp.discussion, '')) LIKE '%storm expected%'
    OR lower(fp.bottom_line || ' ' || COALESCE(fp.discussion, '')) LIKE '%danger is expected to rise%'
  THEN 'storm_incoming'
  -- Danger decreased = improving
  WHEN fp.prev_danger IS NOT NULL AND fp.current_danger < fp.prev_danger THEN 'improving'
  -- Danger increased = worsening
  WHEN fp.prev_danger IS NOT NULL AND fp.current_danger > fp.prev_danger THEN 'worsening'
  -- Text analysis fallback
  WHEN lower(fp.bottom_line) LIKE '%adjusting%' OR lower(fp.bottom_line) LIKE '%stabiliz%' THEN 'improving'
  -- Default
  ELSE 'steady'
END
FROM forecast_with_prev fp
WHERE f.id = fp.id;

-- Update key_message where missing
UPDATE forecasts
SET key_message = substring(bottom_line FROM '^([^.]+\.)')
WHERE key_message IS NULL AND bottom_line IS NOT NULL;

-- Update travel_advice where missing
UPDATE forecasts
SET travel_advice = substring(bottom_line FROM '(The safest[^.]+\.)')
WHERE travel_advice IS NULL AND lower(bottom_line) LIKE '%safest%';

UPDATE forecasts
SET travel_advice = substring(bottom_line FROM '(You can reduce[^.]+\.)')
WHERE travel_advice IS NULL AND lower(bottom_line) LIKE '%you can reduce%';

-- Verify results
SELECT valid_date, zone_id,
  GREATEST(danger_alpine, danger_treeline, danger_below_treeline) as danger,
  trend
FROM forecasts
ORDER BY valid_date DESC
LIMIT 10;
