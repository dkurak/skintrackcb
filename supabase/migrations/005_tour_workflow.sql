-- Tour Workflow: Discussion, Status Updates, Contact Sharing
-- Run this in your Supabase SQL Editor

-- 1. Update tour_posts status to include 'confirmed'
-- First drop the existing constraint
ALTER TABLE tour_posts DROP CONSTRAINT IF EXISTS tour_posts_status_check;

-- Add the new constraint with 'confirmed' status
ALTER TABLE tour_posts ADD CONSTRAINT tour_posts_status_check
  CHECK (status IN ('open', 'confirmed', 'full', 'cancelled', 'completed'));

-- 2. Add planning_notes field to tour_posts
ALTER TABLE tour_posts ADD COLUMN IF NOT EXISTS planning_notes TEXT;

-- 3. Create tour_messages table for discussions
CREATE TABLE IF NOT EXISTS tour_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES tour_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching messages by tour
CREATE INDEX IF NOT EXISTS idx_tour_messages_tour ON tour_messages(tour_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tour_messages_user ON tour_messages(user_id);

-- Enable RLS on tour_messages
ALTER TABLE tour_messages ENABLE ROW LEVEL SECURITY;

-- Tour messages policies:
-- Participants (organizer + accepted responses) can view messages
CREATE POLICY "Tour participants can view messages"
  ON tour_messages FOR SELECT
  USING (
    -- User is the tour organizer
    auth.uid() IN (SELECT user_id FROM tour_posts WHERE id = tour_id)
    OR
    -- User has an accepted response to this tour
    auth.uid() IN (SELECT user_id FROM tour_responses WHERE tour_id = tour_messages.tour_id AND status = 'accepted')
  );

-- Participants can create messages
CREATE POLICY "Tour participants can create messages"
  ON tour_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- User is the tour organizer
      auth.uid() IN (SELECT user_id FROM tour_posts WHERE id = tour_id)
      OR
      -- User has an accepted response to this tour
      auth.uid() IN (SELECT user_id FROM tour_responses WHERE tour_id = tour_messages.tour_id AND status = 'accepted')
    )
  );

-- Users can update their own messages (for editing)
CREATE POLICY "Users can update their own messages"
  ON tour_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON tour_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for tour_messages updated_at
CREATE TRIGGER update_tour_messages_updated_at
  BEFORE UPDATE ON tour_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
