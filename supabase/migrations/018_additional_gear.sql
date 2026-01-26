-- Add additional communication and safety gear fields to profiles
-- Migration: 018_additional_gear.sql

-- Add new gear columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_radio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_satellite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_first_aid BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.has_radio IS 'User has a radio (GMRS or FRS)';
COMMENT ON COLUMN profiles.has_satellite IS 'User has satellite communicator (e.g., InReach, Zoleo)';
COMMENT ON COLUMN profiles.has_first_aid IS 'User carries a first aid kit';
