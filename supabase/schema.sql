-- CBAC Forecast Tracker Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Forecasts table (1 per day per zone)
CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id VARCHAR(20) NOT NULL,  -- 'northwest' or 'southeast'
  zone_name VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  valid_date DATE NOT NULL,
  expires_date DATE,

  -- Danger ratings
  danger_level INTEGER NOT NULL CHECK (danger_level BETWEEN 1 AND 5),
  danger_text VARCHAR(20) NOT NULL,
  danger_alpine INTEGER NOT NULL CHECK (danger_alpine BETWEEN 1 AND 5),
  danger_treeline INTEGER NOT NULL CHECK (danger_treeline BETWEEN 1 AND 5),
  danger_below_treeline INTEGER NOT NULL CHECK (danger_below_treeline BETWEEN 1 AND 5),

  -- Text content
  travel_advice TEXT,
  bottom_line TEXT,
  discussion TEXT,

  -- Metadata
  forecast_url TEXT,
  raw_data JSONB,  -- Store full API response for future parsing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one forecast per zone per day
  UNIQUE (zone_id, valid_date)
);

-- Avalanche problems (many per forecast)
CREATE TABLE IF NOT EXISTS avalanche_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_id UUID NOT NULL REFERENCES forecasts(id) ON DELETE CASCADE,
  problem_number INTEGER NOT NULL,
  problem_type VARCHAR(50) NOT NULL,
  likelihood VARCHAR(50),
  size VARCHAR(20),
  aspect_elevation_rose JSONB,  -- JSON object with aspect/elevation data
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather forecasts
CREATE TABLE IF NOT EXISTS weather_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id VARCHAR(20) NOT NULL,
  forecast_date DATE NOT NULL,
  metrics JSONB,  -- Temps, wind, precip, etc.
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (zone_id, forecast_date)
);

-- Avalanche observations
CREATE TABLE IF NOT EXISTS avalanche_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_date DATE NOT NULL,
  zone_id VARCHAR(20),
  avalanche_count INTEGER DEFAULT 0,
  summary TEXT,
  cbac_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_forecasts_zone_date ON forecasts(zone_id, valid_date DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_valid_date ON forecasts(valid_date DESC);
CREATE INDEX IF NOT EXISTS idx_problems_forecast ON avalanche_problems(forecast_id);
CREATE INDEX IF NOT EXISTS idx_weather_zone_date ON weather_forecasts(zone_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_observations_date ON avalanche_observations(observation_date DESC);

-- Row Level Security (RLS) - Allow public read access
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE avalanche_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE avalanche_observations ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Allow public read access on forecasts"
  ON forecasts FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on avalanche_problems"
  ON avalanche_problems FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on weather_forecasts"
  ON weather_forecasts FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on avalanche_observations"
  ON avalanche_observations FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for forecasts updated_at
CREATE TRIGGER update_forecasts_updated_at
  BEFORE UPDATE ON forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
