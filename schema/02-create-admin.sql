-- ============================================
-- ATTENDANCE SYSTEM - CREATE ADMIN USER
-- Run this AFTER creating a user in Supabase Authentication
-- ============================================

-- This query finds the user in Supabase Auth by email and
-- inserts a corresponding record into the users table with
-- the 'admin' role so they can access admin features.
--
-- PREREQUISITE: The user must already exist in
-- Authentication > Users in your Supabase dashboard.
--
-- Change the email below to match the user you want to promote.
-- ============================================

INSERT INTO users (auth_id, email, fullname, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 'admin'
FROM auth.users
WHERE email = 'miketanny893@gmail.com'
ON CONFLICT DO NOTHING;
