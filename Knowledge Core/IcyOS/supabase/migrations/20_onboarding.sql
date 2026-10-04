-- Migration: 20_onboarding.sql
-- Purpose: Let a new user set up their first workspace, project, sprint and sample mission.
-- Dependencies: 19_billing.sql
-- Safety Notes: Idempotent. Adds a nullable column, swaps one unique constraint
--               for a narrower one, and adds a function. No data is modified.
--
-- New users land in an empty app: signup (19) creates their users, user_roles
-- and subscriptions rows, but no workspace. complete_onboarding() creates the
-- whole chain in one transaction for the signed-in user only:
--   workspace -> project -> "Sprint 1" -> optional sample mission and its actions.
--
-- It is SECURITY DEFINER rather than built on INSERT policies so the four
-- inserts are atomic (supabase-js cannot wrap separate table writes in one
-- transaction) and so signed-in users still get no general write access to
-- these tables. Calling it again once the user has a workspace changes nothing
-- and returns the existing workspace, so a double-submit is harmless.
--
-- sprints.sprint_name was unique across the whole database, so only the first
-- user could ever have a "Sprint 1", and the error would reveal that another
-- user has one. It becomes unique per project, like the per-user constraints in 18.

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE sprints DROP CONSTRAINT IF EXISTS sprints_sprint_name_key;
ALTER TABLE sprints DROP CONSTRAINT IF EXISTS sprints_project_id_sprint_name_key;
ALTER TABLE sprints ADD CONSTRAINT sprints_project_id_sprint_name_key UNIQUE (project_id, sprint_name);

CREATE OR REPLACE FUNCTION public.complete_onboarding(
    workspace_name TEXT,
    project_name TEXT,
    project_priority task_priority DEFAULT 'P2',
    include_sample_mission BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    ws_name TEXT := btrim(workspace_name);
    proj_name TEXT := btrim(project_name);
    ws_id UUID;
    proj_id UUID;
    sprint_id UUID;
    mission_id UUID;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF ws_name IS NULL OR ws_name = '' OR length(ws_name) > 255 THEN
        RAISE EXCEPTION 'workspace name must be 1 to 255 characters' USING ERRCODE = '22023';
    END IF;
    IF proj_name IS NULL OR proj_name = '' OR length(proj_name) > 255 THEN
        RAISE EXCEPTION 'project name must be 1 to 255 characters' USING ERRCODE = '22023';
    END IF;

    -- Serialize concurrent calls for the same user so only one workspace is created.
    PERFORM 1 FROM users WHERE id = app_user_id FOR UPDATE;

    SELECT id INTO ws_id FROM workspaces WHERE user_id = app_user_id ORDER BY created_at LIMIT 1;
    IF ws_id IS NOT NULL THEN
        RETURN jsonb_build_object('created', FALSE, 'workspace_id', ws_id);
    END IF;

    -- root_path is globally unique and meant for local folders; hosted
    -- workspaces get a path derived from their own id.
    ws_id := uuid_generate_v4();
    INSERT INTO workspaces (id, user_id, name, root_path)
    VALUES (ws_id, app_user_id, ws_name, 'icyos://workspaces/' || ws_id);

    INSERT INTO projects (workspace_id, name, priority)
    VALUES (ws_id, proj_name, COALESCE(project_priority, 'P2'))
    RETURNING id INTO proj_id;

    INSERT INTO sprints (project_id, sprint_name)
    VALUES (proj_id, 'Sprint 1')
    RETURNING id INTO sprint_id;

    IF include_sample_mission THEN
        INSERT INTO missions (sprint_id, name)
        VALUES (sprint_id, 'Sample mission: plan your first week')
        RETURNING id INTO mission_id;

        INSERT INTO actions (mission_id, command) VALUES
            (mission_id, 'Capture three things on your mind in the Inbox'),
            (mission_id, 'Generate a plan on the Timeline and approve it'),
            (mission_id, 'Run one Focus session, then reflect in Review');
    END IF;

    RETURN jsonb_build_object(
        'created', TRUE,
        'workspace_id', ws_id,
        'project_id', proj_id,
        'sprint_id', sprint_id,
        'mission_id', mission_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) FROM PUBLIC;

-- Supabase grants EXECUTE on new public functions to anon explicitly, so revoke it
-- by name. The roles only exist on Supabase, not in plain local PostgreSQL.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) TO authenticated;
    END IF;
END
$$;
