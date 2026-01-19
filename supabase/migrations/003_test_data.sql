-- Test Data Migration
-- Creates sample users, tours, and responses for testing
-- All test data can be easily deleted with the cleanup script at the bottom

-- Add test user flag to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT false;

-- =====================================================
-- IMPORTANT: Test users must be created through Supabase Auth
-- Run this AFTER creating test users via the admin page or API
-- The UUIDs below should match the auth.users IDs
-- =====================================================

-- This script assumes test users have been created with emails:
-- test1@skintrackcb.local through test20@skintrackcb.local
-- Password for all: TestUser123!

-- After creating auth users, run UPDATE statements like:
-- UPDATE profiles SET is_test_user = true WHERE email LIKE '%@skintrackcb.local';

-- =====================================================
-- CLEANUP SCRIPT (run this to delete all test data)
-- =====================================================
--
-- -- Delete tour responses from test users
-- DELETE FROM tour_responses WHERE user_id IN (SELECT id FROM profiles WHERE is_test_user = true);
--
-- -- Delete tour responses TO tours by test users
-- DELETE FROM tour_responses WHERE tour_id IN (SELECT id FROM tour_posts WHERE user_id IN (SELECT id FROM profiles WHERE is_test_user = true));
--
-- -- Delete tours by test users
-- DELETE FROM tour_posts WHERE user_id IN (SELECT id FROM profiles WHERE is_test_user = true);
--
-- -- Delete test profiles (this will cascade from auth.users deletion)
-- -- You'll need to delete auth.users via Supabase Dashboard or API
--
-- -- To fully remove: Go to Supabase Dashboard > Authentication > Users
-- -- Delete all users with @skintrackcb.local emails
