-- User Profiles and Partner Finder Schema
-- Run this in your Supabase SQL Editor after the base schema

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,

  -- Backcountry experience
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience INTEGER,
  certifications TEXT[], -- e.g., ['AIARE 1', 'AIARE 2', 'WFR']

  -- Gear
  has_beacon BOOLEAN DEFAULT false,
  has_probe BOOLEAN DEFAULT false,
  has_shovel BOOLEAN DEFAULT false,
  additional_gear TEXT[], -- e.g., ['Splitboard', 'Skins', 'Inclinometer']

  -- Preferences
  preferred_zones TEXT[] DEFAULT ARRAY['southeast', 'northwest'],
  typical_start_time TEXT, -- e.g., '6:00 AM', 'Dawn'
  fitness_level TEXT CHECK (fitness_level IN ('moderate', 'fit', 'very_fit', 'athlete')),

  -- Partner finder settings
  looking_for_partners BOOLEAN DEFAULT false,
  bio TEXT,

  -- Contact preferences
  contact_method TEXT CHECK (contact_method IN ('app', 'email', 'phone')),
  phone TEXT,
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour posts (partner finder posts)
CREATE TABLE IF NOT EXISTS tour_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tour details
  title TEXT NOT NULL,
  description TEXT,
  tour_date DATE NOT NULL,
  tour_time TEXT, -- e.g., '6:00 AM'
  zone TEXT NOT NULL, -- 'northwest' or 'southeast'
  meeting_location TEXT,

  -- Requirements
  experience_required TEXT CHECK (experience_required IN ('beginner', 'intermediate', 'advanced', 'expert')),
  spots_available INTEGER DEFAULT 1,
  gear_requirements TEXT[], -- e.g., ['Beacon', 'Probe', 'Shovel']

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour responses (people interested in joining)
CREATE TABLE IF NOT EXISTS tour_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tour_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One response per user per tour
  UNIQUE (tour_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_looking ON profiles(looking_for_partners) WHERE looking_for_partners = true;
CREATE INDEX IF NOT EXISTS idx_tour_posts_date ON tour_posts(tour_date DESC);
CREATE INDEX IF NOT EXISTS idx_tour_posts_zone ON tour_posts(zone, tour_date);
CREATE INDEX IF NOT EXISTS idx_tour_posts_user ON tour_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_posts_status ON tour_posts(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tour_responses_tour ON tour_responses(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_responses_user ON tour_responses(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_responses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tour posts policies
CREATE POLICY "Tour posts are viewable by everyone"
  ON tour_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tour posts"
  ON tour_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour posts"
  ON tour_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tour posts"
  ON tour_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Tour responses policies
CREATE POLICY "Users can view responses to their posts or their own responses"
  ON tour_responses FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT user_id FROM tour_posts WHERE id = tour_id)
  );

CREATE POLICY "Authenticated users can create responses"
  ON tour_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON tour_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Post owners can update response status"
  ON tour_responses FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM tour_posts WHERE id = tour_id));

CREATE POLICY "Users can delete their own responses"
  ON tour_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tour_posts updated_at
CREATE TRIGGER update_tour_posts_updated_at
  BEFORE UPDATE ON tour_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
