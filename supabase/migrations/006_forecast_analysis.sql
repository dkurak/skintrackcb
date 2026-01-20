-- Forecast Analysis Fields
-- Adds trend tracking and key message extraction

-- Add trend field to track conditions (computed from comparing consecutive days)
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS trend VARCHAR(20)
  CHECK (trend IN ('improving', 'steady', 'worsening', 'new_problem', 'storm_incoming'));

-- Add key_message for extracted critical callouts
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS key_message TEXT;

-- Add confidence level if CBAC provides it
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS confidence VARCHAR(20)
  CHECK (confidence IN ('low', 'moderate', 'high'));

-- Add recent avalanche activity summary to forecasts (denormalized for quick access)
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS recent_activity_summary TEXT;
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS recent_avalanche_count INTEGER DEFAULT 0;

-- Enhance observations table with location data
ALTER TABLE avalanche_observations ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE avalanche_observations ADD COLUMN IF NOT EXISTS elevation TEXT;
ALTER TABLE avalanche_observations ADD COLUMN IF NOT EXISTS aspect TEXT;
ALTER TABLE avalanche_observations ADD COLUMN IF NOT EXISTS trigger_type TEXT; -- natural, human, explosive
ALTER TABLE avalanche_observations ADD COLUMN IF NOT EXISTS size TEXT;
