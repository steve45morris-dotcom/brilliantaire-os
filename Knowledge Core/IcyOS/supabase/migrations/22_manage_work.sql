-- Migration: 22_manage_work.sql
-- Purpose: Let users create, rename, reprioritise and delete their own projects,
--          missions and mission steps.
-- Dependencies: 21_mission_progress.sql
-- Safety Notes: Idempotent. Adds or replaces functions only; no tables, columns,
--               policies or data change.
--
-- Same model as 20 and 21: signed-in users still have no INSERT, UPDATE or
-- DELETE policies on these tables. Each change goes through a SECURITY DEFINER
-- function that
--   - acts only on rows in the caller's own workspace;
--   - reports "not found" (P0002) for rows that are missing or someone else's,
--     so ids cannot be probed;
--   - validates its input and reports bad input as 22023 with a message that is
--     safe to show;
--   - caps how much one user can create, so one account cannot fill the database.
--
-- Sprints stay out of sight: a new project gets "Sprint 1", and a new mission
-- goes into its project's newest sprint.
--
-- Mission status follows its steps through refresh_mission_status(), now shared
-- by set_action_completed() (21) and the step functions here:
--   - no steps: unchanged;
--   - every step done: Completed;
--   - some steps done and status Staged or Approved: Running;
--   - not every step done and status Completed: Running;
--   - Skipped and Failed: unchanged.

-- ---------------------------------------------------------------------------
-- Internal helpers. Not callable by users (see the REVOKE block at the end).
-- ---------------------------------------------------------------------------

-- A trimmed name, or a 22023 error naming the field.
CREATE OR REPLACE FUNCTION public.clean_name(value TEXT, label TEXT, max_length INTEGER DEFAULT 255)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    cleaned TEXT := btrim(value);
BEGIN
    IF cleaned IS NULL OR cleaned = '' OR length(cleaned) > max_length THEN
        RAISE EXCEPTION '% must be 1 to % characters', label, max_length USING ERRCODE = '22023';
    END IF;
    RETURN cleaned;
END;
$$;

-- The caller's workspace, or an error when signed out or not yet onboarded.
CREATE OR REPLACE FUNCTION public.caller_workspace_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    ws_id UUID;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    SELECT id INTO ws_id FROM workspaces WHERE user_id = app_user_id ORDER BY created_at LIMIT 1;
    IF ws_id IS NULL THEN
        RAISE EXCEPTION 'workspace not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN ws_id;
END;
$$;

-- Locks and returns the caller's project, or raises "not found".
CREATE OR REPLACE FUNCTION public.lock_owned_project(target_project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_id UUID;
BEGIN
    SELECT p.id INTO found_id
    FROM projects p
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE p.id = target_project_id AND w.user_id = current_app_user_id()
    FOR UPDATE OF p;
    IF found_id IS NULL THEN
        RAISE EXCEPTION 'project not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN found_id;
END;
$$;

-- Locks and returns the caller's mission, or raises "not found".
CREATE OR REPLACE FUNCTION public.lock_owned_mission(target_mission_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_id UUID;
BEGIN
    SELECT m.id INTO found_id
    FROM missions m
    JOIN sprints s ON s.id = m.sprint_id
    JOIN projects p ON p.id = s.project_id
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE m.id = target_mission_id AND w.user_id = current_app_user_id()
    FOR UPDATE OF m;
    IF found_id IS NULL THEN
        RAISE EXCEPTION 'mission not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN found_id;
END;
$$;

-- Locks the mission that owns the caller's step and returns it, or raises "not found".
CREATE OR REPLACE FUNCTION public.lock_owned_step_mission(target_action_id UUID)
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_id UUID;
BEGIN
    SELECT m.id INTO found_id
    FROM actions a
    JOIN missions m ON m.id = a.mission_id
    JOIN sprints s ON s.id = m.sprint_id
    JOIN projects p ON p.id = s.project_id
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE a.id = target_action_id AND w.user_id = current_app_user_id()
    FOR UPDATE OF m;
    IF found_id IS NULL THEN
        RAISE EXCEPTION 'step not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN found_id;
END;
$$;

-- Recomputes a mission's status from its steps (rules in the header). The
-- caller must already hold the mission's row lock.
CREATE OR REPLACE FUNCTION public.refresh_mission_status(target_mission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_status mission_status;
    new_status mission_status;
    total_steps INTEGER;
    done_steps INTEGER;
BEGIN
    SELECT status INTO old_status FROM missions WHERE id = target_mission_id;
    SELECT count(*), count(completed_at) INTO total_steps, done_steps
    FROM actions WHERE mission_id = target_mission_id;

    new_status := CASE
        WHEN old_status IN ('Skipped', 'Failed') OR total_steps = 0 THEN old_status
        WHEN done_steps = total_steps THEN 'Completed'
        WHEN old_status = 'Completed' THEN 'Running'
        WHEN done_steps > 0 AND old_status IN ('Staged', 'Approved') THEN 'Running'
        ELSE old_status
    END;

    IF new_status <> old_status THEN
        UPDATE missions SET status = new_status WHERE id = target_mission_id;
    END IF;

    RETURN jsonb_build_object(
        'mission_id', target_mission_id,
        'mission_status', new_status,
        'steps_done', done_steps,
        'steps_total', total_steps
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- Steps: ticking (replaces 21's version, same behaviour and result shape).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_action_completed(action_id UUID, completed BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owning_mission_id UUID;
    step_completed_at TIMESTAMPTZ;
BEGIN
    IF current_app_user_id() IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF completed IS NULL THEN
        RAISE EXCEPTION 'completed must be true or false' USING ERRCODE = '22023';
    END IF;

    owning_mission_id := lock_owned_step_mission(set_action_completed.action_id);

    -- Ticking an already-done step keeps its original time.
    UPDATE actions
    SET completed_at = CASE WHEN completed THEN COALESCE(completed_at, NOW()) ELSE NULL END
    WHERE id = set_action_completed.action_id
    RETURNING completed_at INTO step_completed_at;

    RETURN jsonb_build_object('action_id', set_action_completed.action_id, 'completed_at', step_completed_at)
        || refresh_mission_status(owning_mission_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_project(project_name TEXT, project_priority task_priority DEFAULT 'P2')
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ws_id UUID := caller_workspace_id();
    cleaned TEXT := clean_name(project_name, 'Project name');
    new_project_id UUID;
BEGIN
    -- Serialize creation per workspace so the cap below holds under concurrency.
    PERFORM 1 FROM workspaces WHERE id = ws_id FOR UPDATE;
    IF (SELECT count(*) FROM projects WHERE workspace_id = ws_id) >= 100 THEN
        RAISE EXCEPTION 'a workspace can have at most 100 projects' USING ERRCODE = '22023';
    END IF;

    INSERT INTO projects (workspace_id, name, priority)
    VALUES (ws_id, cleaned, COALESCE(project_priority, 'P2'))
    RETURNING id INTO new_project_id;

    INSERT INTO sprints (project_id, sprint_name) VALUES (new_project_id, 'Sprint 1');

    RETURN jsonb_build_object('project_id', new_project_id);
END;
$$;

-- NULL arguments leave that field unchanged.
CREATE OR REPLACE FUNCTION public.update_project(
    target_project_id UUID,
    project_name TEXT DEFAULT NULL,
    project_priority task_priority DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM lock_owned_project(target_project_id);
    UPDATE projects
    SET name = CASE WHEN project_name IS NULL THEN name ELSE clean_name(project_name, 'Project name') END,
        priority = COALESCE(project_priority, priority)
    WHERE id = target_project_id;
    RETURN jsonb_build_object('project_id', target_project_id);
END;
$$;

-- Deletes the project with its sprints, missions and steps (ON DELETE CASCADE).
CREATE OR REPLACE FUNCTION public.delete_project(target_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM lock_owned_project(target_project_id);
    DELETE FROM projects WHERE id = target_project_id;
    RETURN jsonb_build_object('project_id', target_project_id, 'deleted', TRUE);
END;
$$;

-- ---------------------------------------------------------------------------
-- Missions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_mission(
    target_project_id UUID,
    mission_name TEXT,
    step_texts TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned TEXT := clean_name(mission_name, 'Mission name');
    target_sprint_id UUID;
    new_mission_id UUID;
    step TEXT;
    step_count INTEGER := 0;
BEGIN
    PERFORM lock_owned_project(target_project_id);

    IF COALESCE(array_length(step_texts, 1), 0) > 50 THEN
        RAISE EXCEPTION 'a mission can have at most 50 steps' USING ERRCODE = '22023';
    END IF;
    IF (SELECT count(*) FROM missions m JOIN sprints s ON s.id = m.sprint_id WHERE s.project_id = target_project_id) >= 500 THEN
        RAISE EXCEPTION 'a project can have at most 500 missions' USING ERRCODE = '22023';
    END IF;

    SELECT id INTO target_sprint_id FROM sprints
    WHERE project_id = target_project_id
    ORDER BY created_at DESC, id DESC LIMIT 1;
    IF target_sprint_id IS NULL THEN
        INSERT INTO sprints (project_id, sprint_name) VALUES (target_project_id, 'Sprint 1')
        RETURNING id INTO target_sprint_id;
    END IF;

    INSERT INTO missions (sprint_id, name) VALUES (target_sprint_id, cleaned)
    RETURNING id INTO new_mission_id;

    FOREACH step IN ARRAY COALESCE(step_texts, '{}') LOOP
        step_count := step_count + 1;
        INSERT INTO actions (mission_id, command, position)
        VALUES (new_mission_id, clean_name(step, 'Step', 512), step_count);
    END LOOP;

    RETURN jsonb_build_object('mission_id', new_mission_id, 'steps_total', step_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_mission(target_mission_id UUID, mission_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM lock_owned_mission(target_mission_id);
    UPDATE missions SET name = clean_name(mission_name, 'Mission name') WHERE id = target_mission_id;
    RETURN jsonb_build_object('mission_id', target_mission_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_mission(target_mission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM lock_owned_mission(target_mission_id);
    DELETE FROM missions WHERE id = target_mission_id;
    RETURN jsonb_build_object('mission_id', target_mission_id, 'deleted', TRUE);
END;
$$;

-- ---------------------------------------------------------------------------
-- Steps: adding, renaming, deleting.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.add_step(target_mission_id UUID, step_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned TEXT := clean_name(step_text, 'Step', 512);
    new_action_id UUID;
BEGIN
    PERFORM lock_owned_mission(target_mission_id);
    IF (SELECT count(*) FROM actions WHERE mission_id = target_mission_id) >= 50 THEN
        RAISE EXCEPTION 'a mission can have at most 50 steps' USING ERRCODE = '22023';
    END IF;

    INSERT INTO actions (mission_id, command, position)
    VALUES (
        target_mission_id,
        cleaned,
        (SELECT COALESCE(max(position), 0) + 1 FROM actions WHERE mission_id = target_mission_id)
    )
    RETURNING id INTO new_action_id;

    -- A new open step reopens a Completed mission.
    RETURN jsonb_build_object('action_id', new_action_id) || refresh_mission_status(target_mission_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_step(target_action_id UUID, step_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM lock_owned_step_mission(target_action_id);
    UPDATE actions SET command = clean_name(step_text, 'Step', 512) WHERE id = target_action_id;
    RETURN jsonb_build_object('action_id', target_action_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_step(target_action_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owning_mission_id UUID := lock_owned_step_mission(target_action_id);
BEGIN
    DELETE FROM actions WHERE id = target_action_id;
    -- Removing the last open step can complete the mission.
    RETURN jsonb_build_object('action_id', target_action_id, 'deleted', TRUE)
        || refresh_mission_status(owning_mission_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Privileges. Helpers are internal; the rest is for signed-in users only.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    internal_fn TEXT;
    user_fn TEXT;
    internal_fns TEXT[] := ARRAY[
        'public.clean_name(TEXT, TEXT, INTEGER)',
        'public.caller_workspace_id()',
        'public.lock_owned_project(UUID)',
        'public.lock_owned_mission(UUID)',
        'public.lock_owned_step_mission(UUID)',
        'public.refresh_mission_status(UUID)'
    ];
    user_fns TEXT[] := ARRAY[
        'public.set_action_completed(UUID, BOOLEAN)',
        'public.create_project(TEXT, task_priority)',
        'public.update_project(UUID, TEXT, task_priority)',
        'public.delete_project(UUID)',
        'public.create_mission(UUID, TEXT, TEXT[])',
        'public.rename_mission(UUID, TEXT)',
        'public.delete_mission(UUID)',
        'public.add_step(UUID, TEXT)',
        'public.rename_step(UUID, TEXT)',
        'public.delete_step(UUID)'
    ];
    has_anon BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
    has_authenticated BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
    -- Supabase grants EXECUTE on new public functions to anon and authenticated
    -- explicitly, so revoke by name. The roles only exist on Supabase, not in
    -- plain local PostgreSQL.
    FOREACH internal_fn IN ARRAY internal_fns LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', internal_fn);
        IF has_anon THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', internal_fn); END IF;
        IF has_authenticated THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', internal_fn); END IF;
    END LOOP;
    FOREACH user_fn IN ARRAY user_fns LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', user_fn);
        IF has_anon THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', user_fn); END IF;
        IF has_authenticated THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', user_fn); END IF;
    END LOOP;
END
$$;
