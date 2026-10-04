-- Migration: 24_inbox.sql
-- Purpose: Let the Inbox turn a brain-dump into missions in one step, with time estimates.
-- Dependencies: 22_manage_work.sql (clean_name, lock_owned_project)
-- Safety Notes: Idempotent. Adds one nullable column and one function; no data changes.
--
-- The Inbox sorts a brain-dump into proposed missions; the user reviews them,
-- then adds them all at once. add_inbox_missions() creates every mission (with
-- its steps and estimate) in one transaction, so a failure part-way through
-- leaves nothing half-added. It uses the same ownership and limit rules as
-- create_mission() in 22: projects must be the caller's, names are validated,
-- and a project holds at most 500 missions, a mission at most 50 steps.
--
-- missions.estimated_minutes is the planned length of a mission (1 to 1440),
-- or NULL when unknown. The Timeline will use it to plan the day.

ALTER TABLE missions ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_estimated_minutes_check;
ALTER TABLE missions ADD CONSTRAINT missions_estimated_minutes_check
    CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440);

-- items: [{ "project_id": uuid, "name": text, "steps": [text], "estimated_minutes": int|null }, …]
CREATE OR REPLACE FUNCTION public.add_inbox_missions(items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item JSONB;
    step_value JSONB;
    target_project_id UUID;
    target_sprint_id UUID;
    new_mission_id UUID;
    minutes INTEGER;
    step_count INTEGER;
    created JSONB := '[]'::jsonb;
BEGIN
    IF current_app_user_id() IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF items IS NULL OR jsonb_typeof(items) <> 'array' OR jsonb_array_length(items) = 0 THEN
        RAISE EXCEPTION 'nothing to add' USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(items) > 50 THEN
        RAISE EXCEPTION 'add at most 50 missions at a time' USING ERRCODE = '22023';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
        IF jsonb_typeof(item) <> 'object' THEN
            RAISE EXCEPTION 'each mission must be an object' USING ERRCODE = '22023';
        END IF;
        BEGIN
            target_project_id := (item ->> 'project_id')::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'project not found' USING ERRCODE = 'P0002';
        END;
        PERFORM lock_owned_project(target_project_id);

        IF (SELECT count(*) FROM missions m JOIN sprints s ON s.id = m.sprint_id WHERE s.project_id = target_project_id) >= 500 THEN
            RAISE EXCEPTION 'a project can have at most 500 missions' USING ERRCODE = '22023';
        END IF;

        minutes := NULL;
        IF item ? 'estimated_minutes' AND jsonb_typeof(item -> 'estimated_minutes') = 'number' THEN
            minutes := round((item ->> 'estimated_minutes')::numeric)::integer;
            IF minutes < 1 OR minutes > 1440 THEN
                RAISE EXCEPTION 'estimates must be 1 to 1440 minutes' USING ERRCODE = '22023';
            END IF;
        END IF;

        IF item ? 'steps' AND jsonb_typeof(item -> 'steps') <> 'array' THEN
            RAISE EXCEPTION 'steps must be a list' USING ERRCODE = '22023';
        END IF;
        IF COALESCE(jsonb_array_length(item -> 'steps'), 0) > 50 THEN
            RAISE EXCEPTION 'a mission can have at most 50 steps' USING ERRCODE = '22023';
        END IF;

        SELECT id INTO target_sprint_id FROM sprints
        WHERE project_id = target_project_id
        ORDER BY created_at DESC, id DESC LIMIT 1;
        IF target_sprint_id IS NULL THEN
            INSERT INTO sprints (project_id, sprint_name) VALUES (target_project_id, 'Sprint 1')
            RETURNING id INTO target_sprint_id;
        END IF;

        INSERT INTO missions (sprint_id, name, estimated_minutes)
        VALUES (target_sprint_id, clean_name(item ->> 'name', 'Mission name'), minutes)
        RETURNING id INTO new_mission_id;

        step_count := 0;
        FOR step_value IN SELECT * FROM jsonb_array_elements(COALESCE(item -> 'steps', '[]'::jsonb)) LOOP
            IF jsonb_typeof(step_value) <> 'string' THEN
                RAISE EXCEPTION 'each step must be text' USING ERRCODE = '22023';
            END IF;
            step_count := step_count + 1;
            INSERT INTO actions (mission_id, command, position)
            VALUES (new_mission_id, clean_name(step_value #>> '{}', 'Step', 512), step_count);
        END LOOP;

        created := created || jsonb_build_object('mission_id', new_mission_id, 'project_id', target_project_id, 'steps_total', step_count);
    END LOOP;

    RETURN jsonb_build_object('created', created);
END;
$$;

DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.add_inbox_missions(JSONB) FROM PUBLIC;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.add_inbox_missions(JSONB) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION public.add_inbox_missions(JSONB) TO authenticated;
    END IF;
END
$$;
