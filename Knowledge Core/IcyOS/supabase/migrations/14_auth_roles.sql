-- Migration: 14_auth_roles.sql
-- Purpose: Add role-based access control for Supabase Auth integration.
-- Dependencies: 03_identity.sql, 12_rls_policies.sql

-- Link users table to Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Role-based access control
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can read all roles
CREATE POLICY admin_read_roles ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE u.auth_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Users can read their own role
CREATE POLICY self_read_role ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = user_roles.user_id AND u.auth_id = auth.uid()
        )
    );

-- Only admins can assign roles
CREATE POLICY admin_manage_roles ON user_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE u.auth_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Auto-create user record on auth signup via trigger
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (auth_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

    INSERT INTO user_roles (user_id, role)
    SELECT id, 'viewer' FROM users WHERE auth_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();
