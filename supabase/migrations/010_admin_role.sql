-- Add admin role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Make dkurak@gmail.com an admin
UPDATE profiles
SET is_admin = true
WHERE email = 'dkurak@gmail.com';

-- Also update based on auth.users email if profile email is null
UPDATE profiles p
SET is_admin = true
FROM auth.users u
WHERE p.id = u.id
  AND u.email = 'dkurak@gmail.com';

-- Verify
SELECT id, email, display_name, is_admin, is_test_user
FROM profiles
WHERE is_admin = true OR email = 'dkurak@gmail.com';
