-- Migration: 15_fix_role_resolution.sql
-- Purpose: Make role lookup work and remove the recursive user_roles policies from 14.
-- Dependencies: 14_auth_roles.sql
-- Safety Notes: Idempotent. Does not change any data; only functions and policies.
--
-- Two defects in 14_auth_roles.sql:
-- 1. user_roles.user_id references users.id, but auth-created users get a fresh
--    users.id with the Supabase auth id in users.auth_id. Callers matching
--    user_roles.user_id against auth.uid() never find a row.
-- 2. admin_read_roles and admin_manage_roles query user_roles inside their own
--    USING clause, so Postgres raises "infinite recursion detected in policy
--    for relation user_roles" on any read.
--
-- Fix: resolve identity and role in SECURITY DEFINER functions, which run as the
-- table owner and so are not subject to RLS, and build the policies on them.

-- The app users.id for the signed-in auth user, or NULL.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM users WHERE auth_id = auth.uid();
$$;

-- The signed-in user's role; 'viewer' when they have no role row, NULL when signed out.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN auth.uid() IS NULL THEN NULL
        ELSE COALESCE(
            (SELECT ur.role FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.auth_id = auth.uid()),
            'viewer'::user_role
        )
    END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(current_user_role() = 'admin', FALSE);
$$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;

-- Supabase grants EXECUTE on new public functions to anon explicitly, so revoke it
-- by name. The roles only exist on Supabase, not in plain local PostgreSQL.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.current_app_user_id() FROM anon;
        REVOKE ALL ON FUNCTION public.current_user_role() FROM anon;
        REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
    END IF;
END
$$;

DROP POLICY IF EXISTS admin_read_roles ON user_roles;
DROP POLICY IF EXISTS self_read_role ON user_roles;
DROP POLICY IF EXISTS admin_manage_roles ON user_roles;
DROP POLICY IF EXISTS user_roles_select ON user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert ON user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete ON user_roles;

-- Users read their own role; admins read every role.
CREATE POLICY user_roles_select ON user_roles FOR SELECT
    USING (user_id = current_app_user_id() OR is_admin());

-- Only admins assign or revoke roles.
CREATE POLICY user_roles_admin_insert ON user_roles FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY user_roles_admin_update ON user_roles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY user_roles_admin_delete ON user_roles FOR DELETE
    USING (is_admin());
