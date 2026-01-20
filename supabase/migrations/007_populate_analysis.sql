-- Populate trend, key_message, and travel_advice from existing bottom_line and discussion
-- Run this in Supabase SQL Editor after running 006_forecast_analysis.sql

-- Update forecasts with extracted key messages and generated travel advice
-- This analyzes the bottom_line text to set trend and extract key messages

-- First, let's set travel_advice where we can find terrain recommendations
UPDATE forecasts SET travel_advice = substring(bottom_line FROM '(The safest[^.]+\.)')
WHERE travel_advice IS NULL AND bottom_line LIKE '%safest%';

UPDATE forecasts SET travel_advice = substring(bottom_line FROM '(You can reduce[^.]+\.)')
WHERE travel_advice IS NULL AND bottom_line LIKE '%reduce%exposure%';

UPDATE forecasts SET travel_advice = substring(bottom_line FROM '(Avoid[^.]+\.)')
WHERE travel_advice IS NULL AND bottom_line LIKE '%Avoid%';

UPDATE forecasts SET travel_advice = substring(bottom_line FROM '(Lower elevation[^.]+\.)')
WHERE travel_advice IS NULL AND bottom_line LIKE '%lower elevation%';

UPDATE forecasts SET travel_advice = substring(bottom_line FROM '(wind.protected[^.]+\.)')
WHERE travel_advice IS NULL AND lower(bottom_line) LIKE '%wind%protected%';

-- Set key_message - extract the most actionable sentence
UPDATE forecasts SET key_message = substring(bottom_line FROM '(Expect[^.]+\.)')
WHERE key_message IS NULL AND bottom_line LIKE '%Expect%';

UPDATE forecasts SET key_message = substring(bottom_line FROM '(You can trigger[^.]+\.)')
WHERE key_message IS NULL AND bottom_line LIKE '%You can trigger%';

UPDATE forecasts SET key_message = substring(bottom_line FROM '(Dangerous[^.]+\.)')
WHERE key_message IS NULL AND bottom_line LIKE '%Dangerous%';

UPDATE forecasts SET key_message = substring(bottom_line FROM '([^.]+margin[^.]+\.)')
WHERE key_message IS NULL AND lower(bottom_line) LIKE '%margin%';

-- For remaining, use first sentence of bottom_line as key_message
UPDATE forecasts SET key_message = substring(bottom_line FROM '^([^.]+\.)')
WHERE key_message IS NULL AND bottom_line IS NOT NULL AND bottom_line != '';

-- Set trend based on keywords in bottom_line and discussion
-- storm_incoming: new snow, storm, accumulation
UPDATE forecasts SET trend = 'storm_incoming'
WHERE (
  lower(bottom_line) LIKE '%storm%'
  OR lower(bottom_line) LIKE '%new snow%'
  OR lower(bottom_line) LIKE '%incoming%'
  OR lower(discussion) LIKE '%storm%coming%'
  OR lower(discussion) LIKE '%snow expected%'
) AND trend IS NULL;

-- worsening: increasing, dangerous, heightened
UPDATE forecasts SET trend = 'worsening'
WHERE (
  lower(bottom_line) LIKE '%increasing%'
  OR lower(bottom_line) LIKE '%dangerous%'
  OR lower(bottom_line) LIKE '%heightened%'
  OR lower(bottom_line) LIKE '%elevated%'
) AND trend IS NULL;

-- improving: decreasing, stabilizing, isolated, stubborn
UPDATE forecasts SET trend = 'improving'
WHERE (
  lower(bottom_line) LIKE '%decreasing%'
  OR lower(bottom_line) LIKE '%stabilizing%'
  OR lower(bottom_line) LIKE '%adjusting%'
  OR lower(bottom_line) LIKE '%isolated%'
  OR lower(bottom_line) LIKE '%stubborn%'
) AND trend IS NULL;

-- Default to steady for everything else
UPDATE forecasts SET trend = 'steady'
WHERE trend IS NULL AND bottom_line IS NOT NULL;

-- Verify the updates
SELECT valid_date, zone_id, trend,
  LEFT(key_message, 60) as key_message_preview,
  LEFT(travel_advice, 60) as travel_advice_preview
FROM forecasts
ORDER BY valid_date DESC
LIMIT 10;
