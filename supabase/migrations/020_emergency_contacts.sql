-- Add emergency contacts to profiles
-- Stored as JSONB array: [{ "name": "...", "phone": "...", "relationship": "..." }]
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.emergency_contacts IS 'Array of emergency contacts: [{name, phone, relationship}]';
