-- Migration: 21_mission_progress.sql
-- Purpose: Let users tick off a mission's steps, and keep steps in a stable order.
-- Dependencies: 20_onboarding.sql
-- Safety Notes: Idempotent. Adds two columns, backfills step order for sample
--               missions created by 20, and adds or replaces two functions.
--
-- actions had no way to record that a step was done, and no order: the sample
-- mission's steps are inserted in one statement, so they share created_at.
--   - actions.completed_at: NULL until the step is done.
--   - actions.position: display order within the mission.
--
-- set_action_completed() is the only way a signed-in user can change a step,
-- in the same style as complete_onboarding(): it acts only on the caller's own
-- rows, and an action that does not exist or belongs to someone else gives the
-- same "not found" error. It also moves the mission's status along:
--   - every step done              -> Completed
--   - first step done (Staged or Approved) -> Running
--   - a step un-ticked on a Completed mission -> Running
-- Skipped and Failed missions keep their status; those are deliberate decisions.

ALTER TABLE actions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Order the steps of sample missions created before this migration.
UPDATE actions SET position = CASE command
        WHEN 'Capture three things on your mind in the Inbox' THEN 1
        WHEN 'Generate a plan on the Timeline and approve it' THEN 2
        WHEN 'Run one Focus session, then reflect in Review' THEN 3
    END
WHERE position = 0
  AND command IN (
        'Capture three things on your mind in the Inbox',
        'Generate a plan on the Timeline and approve it',
        'Run one Focus session, then reflect in Review'
  );

-- Same as 20, except the sample steps get their position.
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

        INSERT INTO actions (mission_id, command, position) VALUES
            (mission_id, 'Capture three things on your mind in the Inbox', 1),
            (mission_id, 'Generate a plan on the Timeline and approve it', 2),
            (mission_id, 'Run one Focus session, then reflect in Review', 3);
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

CREATE OR REPLACE FUNCTION public.set_action_completed(action_id UUID, completed BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    target_mission_id UUID;
    old_status mission_status;
    new_status mission_status;
    step_completed_at TIMESTAMPTZ;
    total_steps INTEGER;
    done_steps INTEGER;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF completed IS NULL THEN
        RAISE EXCEPTION 'completed must be true or false' USING ERRCODE = '22023';
    END IF;

    -- Find the step only if the caller owns it, and lock its mission so
    -- concurrent ticks on the same mission compute its status one at a time.
    SELECT m.id, m.status INTO target_mission_id, old_status
    FROM actions a
    JOIN missions m ON m.id = a.mission_id
    JOIN sprints s ON s.id = m.sprint_id
    JOIN projects p ON p.id = s.project_id
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE a.id = set_action_completed.action_id
      AND w.user_id = app_user_id
    FOR UPDATE OF m;

    IF target_mission_id IS NULL THEN
        RAISE EXCEPTION 'action not found' USING ERRCODE = 'P0002';
    END IF;

    -- Ticking an already-done step keeps its original time.
    UPDATE actions
    SET completed_at = CASE WHEN completed THEN COALESCE(completed_at, NOW()) ELSE NULL END
    WHERE id = set_action_completed.action_id
    RETURNING completed_at INTO step_completed_at;

    SELECT count(*), count(completed_at) INTO total_steps, done_steps
    FROM actions WHERE mission_id = target_mission_id;

    new_status := CASE
        WHEN old_status IN ('Skipped', 'Failed') THEN old_status
        WHEN done_steps = total_steps THEN 'Completed'
        WHEN old_status = 'Completed' THEN 'Running'
        WHEN done_steps > 0 AND old_status IN ('Staged', 'Approved') THEN 'Running'
        ELSE old_status
    END;

    IF new_status <> old_status THEN
        UPDATE missions SET status = new_status WHERE id = target_mission_id;
    END IF;

    RETURN jsonb_build_object(
        'action_id', set_action_completed.action_id,
        'completed_at', step_completed_at,
        'mission_id', target_mission_id,
        'mission_status', new_status,
        'steps_done', done_steps,
        'steps_total', total_steps
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_action_completed(UUID, BOOLEAN) FROM PUBLIC;

-- Supabase grants EXECUTE on new public functions to anon explicitly, so revoke it
-- by name. The roles only exist on Supabase, not in plain local PostgreSQL.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) FROM anon;
        REVOKE ALL ON FUNCTION public.set_action_completed(UUID, BOOLEAN) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, TEXT, task_priority, BOOLEAN) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.set_action_completed(UUID, BOOLEAN) TO authenticated;
    END IF;
END
$$;
