-- Trailheads and Routes tables
-- Trailheads are starting points, Routes/Lines are specific objectives

-- Trailheads table
CREATE TABLE IF NOT EXISTS trailheads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'washington_gulch', 'cb_uphill'
  name VARCHAR(100) NOT NULL,         -- e.g., 'Washington Gulch', 'Crested Butte Uphill'
  description TEXT,                   -- e.g., "Coney's, etc.", "Skin up the resort after hours"
  zone VARCHAR(20),                   -- 'northwest' or 'southeast' (optional)
  latitude DECIMAL(10, 7),            -- for future mapping
  longitude DECIMAL(10, 7),
  elevation_ft INTEGER,               -- base elevation
  parking_info TEXT,                  -- parking details
  access_notes TEXT,                  -- winter closure info, etc.
  is_active BOOLEAN DEFAULT true,     -- soft delete / hide
  sort_order INTEGER DEFAULT 0,       -- for custom ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes/Lines table (for future use)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trailhead_id UUID REFERENCES trailheads(id) ON DELETE SET NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,   -- e.g., 'convex_corner', 'red_lady_bowl'
  name VARCHAR(100) NOT NULL,         -- e.g., 'Convex Corner', 'Red Lady Bowl'
  description TEXT,
  zone VARCHAR(20),                   -- 'northwest' or 'southeast'
  difficulty VARCHAR(20),             -- 'beginner', 'intermediate', 'advanced', 'expert'
  aspects TEXT[],                     -- ['N', 'NE', 'E'] - which aspects the route covers
  elevation_gain_ft INTEGER,
  max_elevation_ft INTEGER,
  avg_slope_angle INTEGER,            -- typical slope steepness
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trailheads ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Everyone can read trailheads and routes
CREATE POLICY "Trailheads are viewable by everyone"
  ON trailheads FOR SELECT USING (true);

CREATE POLICY "Routes are viewable by everyone"
  ON routes FOR SELECT USING (true);

-- Only admins can modify (we'll check is_test_user = false for real admin, or create admin flag)
-- For now, allow authenticated users to insert/update (you can tighten this later)
CREATE POLICY "Authenticated users can manage trailheads"
  ON trailheads FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage routes"
  ON routes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed initial trailheads from existing hardcoded data
INSERT INTO trailheads (slug, name, description, zone, sort_order) VALUES
  ('washington_gulch', 'Washington Gulch', 'Coney''s, etc.', 'southeast', 1),
  ('snodgrass', 'Snodgrass', 'Snodgrass Mountain', 'southeast', 2),
  ('kebler', 'Kebler Pass', 'Red Lady (winter closure)', 'northwest', 3),
  ('brush_creek', 'Brush Creek', 'Brush Creek area', 'southeast', 4),
  ('cement_creek', 'Cement Creek', 'Cement Creek area', 'southeast', 5),
  ('slate_river', 'Slate River', 'Smith Hill (variable snow)', 'northwest', 6),
  ('cb_uphill', 'Crested Butte Uphill', 'Skin up the resort after hours', 'southeast', 7)
ON CONFLICT (slug) DO NOTHING;

-- Verify
SELECT slug, name, description FROM trailheads ORDER BY sort_order;
