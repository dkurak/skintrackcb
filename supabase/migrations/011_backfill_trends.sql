-- Backfill trends by comparing danger levels between consecutive days
-- This corrects historical trends to use danger level comparison
--
-- Uses SUM of all three bands (not just MAX) to catch individual band changes
-- e.g., BTL going from 2→1 while others stay same = improving

-- Reset and recalculate all trends
WITH forecast_with_prev AS (
  SELECT
    f.id,
    f.zone_id,
    f.valid_date,
    f.bottom_line,
    f.discussion,
    -- Use SUM of all bands for more granular comparison
    (f.danger_alpine + f.danger_treeline + f.danger_below_treeline) as current_danger_sum,
    (
      SELECT (p.danger_alpine + p.danger_treeline + p.danger_below_treeline)
      FROM forecasts p
      WHERE p.zone_id = f.zone_id
        AND p.valid_date = f.valid_date - INTERVAL '1 day'
    ) as prev_danger_sum
  FROM forecasts f
)
UPDATE forecasts f
SET trend = CASE
  -- Storm keywords take priority
  WHEN lower(fp.bottom_line || ' ' || COALESCE(fp.discussion, '')) LIKE '%storm expected%'
    OR lower(fp.bottom_line || ' ' || COALESCE(fp.discussion, '')) LIKE '%danger is expected to rise%'
  THEN 'storm_incoming'
  -- Danger sum decreased = improving (any band got better)
  WHEN fp.prev_danger_sum IS NOT NULL AND fp.current_danger_sum < fp.prev_danger_sum THEN 'improving'
  -- Danger sum increased = worsening (any band got worse)
  WHEN fp.prev_danger_sum IS NOT NULL AND fp.current_danger_sum > fp.prev_danger_sum THEN 'worsening'
  -- Text analysis fallback for when sum is unchanged
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
