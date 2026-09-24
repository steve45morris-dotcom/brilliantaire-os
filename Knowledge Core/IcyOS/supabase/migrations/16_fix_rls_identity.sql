-- Migration: 16_fix_rls_identity.sql
-- Purpose: Make the 12_rls_policies.sql read policies match signed-in users.
-- Dependencies: 15_fix_role_resolution.sql (current_app_user_id())
-- Safety Notes: Idempotent. Does not change any data; only policies.
--
-- 12_rls_policies.sql compared auth.uid() to users.id (directly, or through
-- workspaces.user_id). Since 14_auth_roles.sql, users created through Supabase
-- Auth get a fresh users.id and carry their auth id in users.auth_id, so those
-- policies never matched and signed-in users saw none of their own rows.
-- sprints and missions had RLS enabled with no policy at all, so they were
-- unreadable.
--
-- Ownership chain: users.auth_id = auth.uid() -> workspaces.user_id = users.id
-- -> projects.workspace_id -> sprints.project_id -> missions.sprint_id.
-- The (SELECT ...) wrappers let Postgres evaluate the identity once per query
-- instead of once per row.
--
-- Read access only, as in 12. Writes stay denied for signed-in users until
-- the app needs them; server code using the service role is unaffected.

DROP POLICY IF EXISTS user_self_select ON users;
DROP POLICY IF EXISTS workspace_select ON workspaces;
DROP POLICY IF EXISTS project_select ON projects;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS workspaces_owner_select ON workspaces;
DROP POLICY IF EXISTS projects_owner_select ON projects;
DROP POLICY IF EXISTS sprints_owner_select ON sprints;
DROP POLICY IF EXISTS missions_owner_select ON missions;

CREATE POLICY users_self_select ON users FOR SELECT
    USING (auth_id = (SELECT auth.uid()));

CREATE POLICY workspaces_owner_select ON workspaces FOR SELECT
    USING (user_id = (SELECT current_app_user_id()));

CREATE POLICY projects_owner_select ON projects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = projects.workspace_id
          AND w.user_id = (SELECT current_app_user_id())
    ));

CREATE POLICY sprints_owner_select ON sprints FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM projects p
        JOIN workspaces w ON w.id = p.workspace_id
        WHERE p.id = sprints.project_id
          AND w.user_id = (SELECT current_app_user_id())
    ));

CREATE POLICY missions_owner_select ON missions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sprints s
        JOIN projects p ON p.id = s.project_id
        JOIN workspaces w ON w.id = p.workspace_id
        WHERE s.id = missions.sprint_id
          AND w.user_id = (SELECT current_app_user_id())
    ));
