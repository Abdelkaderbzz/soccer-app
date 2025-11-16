-- Migration to support custom authentication without Supabase Auth
-- This modifies the users table to work with our custom auth system

-- Drop the foreign key constraint to auth.users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Add password_hash column for custom auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Update RLS policies for custom auth
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Add password verification function for login
CREATE OR REPLACE FUNCTION verify_user_password(email_param TEXT, password_param TEXT)
RETURNS TABLE(user_id UUID, user_email TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email
    FROM users u
    WHERE u.email = email_param 
    AND u.password_hash IS NOT NULL
    AND crypt(password_param, u.password_hash) = u.password_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;