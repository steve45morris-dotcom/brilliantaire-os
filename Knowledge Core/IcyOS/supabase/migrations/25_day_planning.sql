-- Migration: 25_day_planning.sql
-- Purpose: Real data for the Timeline (day plans), Focus (timed sessions on a
--          mission) and Review (a daily reflection) pages.
-- Dependencies: 24_inbox.sql, 22_manage_work.sql (clean_name, caller helpers)
-- Safety Notes: Idempotent. Adds nullable columns, checks, unique indexes and
--               functions. Existing rows are untouched (their new columns are NULL).
--
-- The tables came from 06 and 08 as placeholders. This gives them the columns
-- the pages need, and, as in 20-24, every write goes through a SECURITY DEFINER
-- function that acts only on the caller's own rows; signed-in users still have
-- no INSERT, UPDATE or DELETE policies. Reads use the owner SELECT policies
-- from 17 and 18.
--
-- Dates are the user's local calendar dates, sent by the app; times are
-- timestamps, so the database never guesses a time zone.

-- ---------------------------------------------------------------------------
-- Timeline: one saved plan per user per day.
-- ---------------------------------------------------------------------------

ALTER TABLE timelines ADD COLUMN IF NOT EXISTS plan_date DATE;
ALTER TABLE timelines ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS timelines_user_plan_date_key ON timelines (user_id, plan_date);

ALTER TABLE timeline_blocks ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'mission';
ALTER TABLE timeline_blocks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE timeline_blocks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timeline_blocks DROP CONSTRAINT IF EXISTS timeline_blocks_kind_check;
ALTER TABLE timeline_blocks ADD CONSTRAINT timeline_blocks_kind_check CHECK (kind IN ('mission', 'buffer', 'break'));
ALTER TABLE timeline_blocks DROP CONSTRAINT IF EXISTS timeline_blocks_time_order_check;
ALTER TABLE timeline_blocks ADD CONSTRAINT timeline_blocks_time_order_check CHECK (end_time > start_time);

-- ---------------------------------------------------------------------------
-- Focus: a session is time spent on one mission, timed by the server.
-- ---------------------------------------------------------------------------

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS paused_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS planned_minutes INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS focus_seconds INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_planned_minutes_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_planned_minutes_check CHECK (planned_minutes IS NULL OR planned_minutes BETWEEN 1 AND 600);
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_outcome_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_outcome_check CHECK (outcome IS NULL OR outcome IN ('done', 'stopped'));
CREATE INDEX IF NOT EXISTS idx_sessions_mission_id ON sessions (mission_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions (started_at);
CREATE INDEX IF NOT EXISTS idx_actions_completed_at ON actions (completed_at);

-- ---------------------------------------------------------------------------
-- Review: one reflection per user per day.
-- ---------------------------------------------------------------------------

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_date DATE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS score SMALLINT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS went_well TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS got_in_way TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS next_time TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_score_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_score_check CHECK (score IS NULL OR score BETWEEN 1 AND 10);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_review_date_key ON reviews (user_id, review_date);

-- ---------------------------------------------------------------------------
-- Internal helper: the caller's mission, or "not found".
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.owned_mission_workspace(target_mission_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ws_id UUID;
BEGIN
    SELECT w.id INTO ws_id
    FROM missions m
    JOIN sprints s ON s.id = m.sprint_id
    JOIN projects p ON p.id = s.project_id
    JOIN workspaces w ON w.id = p.workspace_id
    WHERE m.id = target_mission_id AND w.user_id = current_app_user_id();
    IF ws_id IS NULL THEN
        RAISE EXCEPTION 'mission not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN ws_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Timeline
-- ---------------------------------------------------------------------------

-- blocks: [{ "kind": "mission"|"buffer"|"break", "mission_id": uuid|null, "title": text,
--            "start": timestamptz, "end": timestamptz }, …] in time order, not overlapping.
-- Replaces any plan already saved for that date.
CREATE OR REPLACE FUNCTION public.save_day_plan(plan_date DATE, blocks JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    app_user_id UUID := current_app_user_id();
    plan_id UUID;
    block JSONB;
    block_kind TEXT;
    block_mission UUID;
    block_start TIMESTAMPTZ;
    block_end TIMESTAMPTZ;
    previous_end TIMESTAMPTZ;
    n INTEGER := 0;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF plan_date IS NULL OR plan_date < CURRENT_DATE - 2 OR plan_date > CURRENT_DATE + 30 THEN
        RAISE EXCEPTION 'plans can be saved for today or up to 30 days ahead' USING ERRCODE = '22023';
    END IF;
    IF blocks IS NULL OR jsonb_typeof(blocks) <> 'array' OR jsonb_array_length(blocks) = 0 OR jsonb_array_length(blocks) > 60 THEN
        RAISE EXCEPTION 'a plan needs 1 to 60 blocks' USING ERRCODE = '22023';
    END IF;

    -- One plan per day: serialize saves for this user.
    PERFORM 1 FROM users WHERE id = app_user_id FOR UPDATE;

    INSERT INTO timelines (user_id, plan_date, approved_at)
    VALUES (app_user_id, save_day_plan.plan_date, NOW())
    ON CONFLICT (user_id, plan_date) DO UPDATE SET approved_at = NOW(), updated_at = NOW()
    RETURNING id INTO plan_id;
    DELETE FROM timeline_blocks WHERE timeline_id = plan_id;

    FOR block IN SELECT * FROM jsonb_array_elements(blocks) LOOP
        n := n + 1;
        block_kind := block ->> 'kind';
        IF block_kind IS NULL OR block_kind NOT IN ('mission', 'buffer', 'break') THEN
            RAISE EXCEPTION 'block % has an unknown kind', n USING ERRCODE = '22023';
        END IF;
        BEGIN
            block_start := (block ->> 'start')::timestamptz;
            block_end := (block ->> 'end')::timestamptz;
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION 'block % has an invalid time', n USING ERRCODE = '22023';
        END;
        IF block_start IS NULL OR block_end IS NULL OR block_end <= block_start OR block_end - block_start > INTERVAL '12 hours' THEN
            RAISE EXCEPTION 'block % must end after it starts, within 12 hours', n USING ERRCODE = '22023';
        END IF;
        -- Allow for time zones: the day's blocks fall within a day either side of the date.
        IF block_start < plan_date::timestamp - INTERVAL '1 day' OR block_end > plan_date::timestamp + INTERVAL '2 days' THEN
            RAISE EXCEPTION 'block % is not on that day', n USING ERRCODE = '22023';
        END IF;
        IF previous_end IS NOT NULL AND block_start < previous_end THEN
            RAISE EXCEPTION 'blocks must be in order and not overlap' USING ERRCODE = '22023';
        END IF;
        previous_end := block_end;

        block_mission := NULL;
        IF block_kind = 'mission' THEN
            BEGIN
                block_mission := (block ->> 'mission_id')::uuid;
            EXCEPTION WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'mission not found' USING ERRCODE = 'P0002';
            END;
            IF block_mission IS NULL THEN
                RAISE EXCEPTION 'block % needs a mission', n USING ERRCODE = '22023';
            END IF;
            PERFORM owned_mission_workspace(block_mission);
        END IF;

        INSERT INTO timeline_blocks (timeline_id, mission_id, kind, title, start_time, end_time, position)
        VALUES (
            plan_id, block_mission, block_kind,
            CASE WHEN block ? 'title' AND jsonb_typeof(block -> 'title') = 'string'
                 THEN clean_name(block ->> 'title', 'Block title') ELSE NULL END,
            block_start, block_end, n
        );
    END LOOP;

    RETURN jsonb_build_object('timeline_id', plan_id, 'blocks', n);
END;
$$;

-- ---------------------------------------------------------------------------
-- Focus
-- ---------------------------------------------------------------------------

-- Locks and returns the caller's session, or raises "not found".
CREATE OR REPLACE FUNCTION public.lock_owned_session(target_session_id UUID)
RETURNS sessions
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found sessions;
BEGIN
    SELECT se.* INTO found
    FROM sessions se
    JOIN workspaces w ON w.id = se.workspace_id
    WHERE se.id = target_session_id AND w.user_id = current_app_user_id()
    FOR UPDATE OF se;
    IF found.id IS NULL THEN
        RAISE EXCEPTION 'session not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN found;
END;
$$;

CREATE OR REPLACE FUNCTION public.focus_session_json(s sessions)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', s.id, 'mission_id', s.mission_id, 'started_at', s.started_at, 'paused_at', s.paused_at,
        'paused_seconds', s.paused_seconds, 'ended_at', s.ended_at, 'planned_minutes', s.planned_minutes,
        'focus_seconds', s.focus_seconds, 'outcome', s.outcome
    );
$$;

CREATE OR REPLACE FUNCTION public.start_focus(target_mission_id UUID, planned_minutes INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ws_id UUID := owned_mission_workspace(target_mission_id);
    created sessions;
BEGIN
    IF planned_minutes IS NOT NULL AND (planned_minutes < 1 OR planned_minutes > 600) THEN
        RAISE EXCEPTION 'plan 1 to 600 minutes' USING ERRCODE = '22023';
    END IF;
    -- One session at a time per workspace.
    PERFORM 1 FROM workspaces WHERE id = ws_id FOR UPDATE;
    IF EXISTS (SELECT 1 FROM sessions WHERE workspace_id = ws_id AND started_at IS NOT NULL AND ended_at IS NULL) THEN
        RAISE EXCEPTION 'finish the focus session you have running first' USING ERRCODE = '22023';
    END IF;

    INSERT INTO sessions (workspace_id, mission_id, status, started_at, planned_minutes)
    VALUES (ws_id, target_mission_id, 'Active', NOW(), start_focus.planned_minutes)
    RETURNING * INTO created;

    UPDATE missions SET status = 'Running' WHERE id = target_mission_id AND status IN ('Staged', 'Approved');
    RETURN focus_session_json(created);
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_focus(target_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    s sessions := lock_owned_session(target_session_id);
BEGIN
    IF s.ended_at IS NOT NULL THEN
        RAISE EXCEPTION 'that session has finished' USING ERRCODE = '22023';
    END IF;
    UPDATE sessions SET paused_at = COALESCE(paused_at, NOW()) WHERE id = s.id RETURNING * INTO s;
    RETURN focus_session_json(s);
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_focus(target_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    s sessions := lock_owned_session(target_session_id);
BEGIN
    IF s.ended_at IS NOT NULL THEN
        RAISE EXCEPTION 'that session has finished' USING ERRCODE = '22023';
    END IF;
    UPDATE sessions
    SET paused_seconds = paused_seconds + CASE WHEN paused_at IS NULL THEN 0
                                               ELSE GREATEST(0, EXTRACT(EPOCH FROM NOW() - paused_at))::integer END,
        paused_at = NULL
    WHERE id = s.id RETURNING * INTO s;
    RETURN focus_session_json(s);
END;
$$;

-- outcome: 'done' (the work is finished) or 'stopped' (stopped early).
CREATE OR REPLACE FUNCTION public.finish_focus(target_session_id UUID, outcome TEXT)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    s sessions := lock_owned_session(target_session_id);
    total_paused INTEGER;
BEGIN
    IF finish_focus.outcome IS NULL OR finish_focus.outcome NOT IN ('done', 'stopped') THEN
        RAISE EXCEPTION 'outcome must be done or stopped' USING ERRCODE = '22023';
    END IF;
    IF s.ended_at IS NOT NULL THEN
        RAISE EXCEPTION 'that session has finished' USING ERRCODE = '22023';
    END IF;
    total_paused := s.paused_seconds + CASE WHEN s.paused_at IS NULL THEN 0
                                            ELSE GREATEST(0, EXTRACT(EPOCH FROM NOW() - s.paused_at))::integer END;
    UPDATE sessions
    SET ended_at = NOW(),
        paused_at = NULL,
        paused_seconds = total_paused,
        focus_seconds = LEAST(86400, GREATEST(0, EXTRACT(EPOCH FROM NOW() - started_at)::integer - total_paused)),
        outcome = finish_focus.outcome,
        status = 'Wrapped'
    WHERE id = s.id RETURNING * INTO s;
    RETURN focus_session_json(s);
END;
$$;

-- ---------------------------------------------------------------------------
-- Review
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.save_review(
    review_date DATE,
    score INTEGER,
    went_well TEXT DEFAULT NULL,
    got_in_way TEXT DEFAULT NULL,
    next_time TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    review_id UUID;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF review_date IS NULL OR review_date > CURRENT_DATE + 1 OR review_date < CURRENT_DATE - 366 THEN
        RAISE EXCEPTION 'reviews are for today or the past year' USING ERRCODE = '22023';
    END IF;
    IF score IS NULL OR score < 1 OR score > 10 THEN
        RAISE EXCEPTION 'score the day from 1 to 10' USING ERRCODE = '22023';
    END IF;
    IF length(COALESCE(went_well, '')) > 2000 OR length(COALESCE(got_in_way, '')) > 2000 OR length(COALESCE(next_time, '')) > 2000 THEN
        RAISE EXCEPTION 'keep each answer under 2000 characters' USING ERRCODE = '22023';
    END IF;

    PERFORM 1 FROM users WHERE id = app_user_id FOR UPDATE;
    SELECT id INTO review_id FROM reviews WHERE user_id = app_user_id AND reviews.review_date = save_review.review_date;
    IF review_id IS NULL THEN
        INSERT INTO reviews (user_id, review_date, score, went_well, got_in_way, next_time)
        VALUES (app_user_id, save_review.review_date, save_review.score,
                NULLIF(btrim(went_well), ''), NULLIF(btrim(got_in_way), ''), NULLIF(btrim(next_time), ''))
        RETURNING id INTO review_id;
    ELSE
        UPDATE reviews
        SET score = save_review.score,
            went_well = NULLIF(btrim(save_review.went_well), ''),
            got_in_way = NULLIF(btrim(save_review.got_in_way), ''),
            next_time = NULLIF(btrim(save_review.next_time), ''),
            updated_at = NOW()
        WHERE id = review_id;
    END IF;
    RETURN jsonb_build_object('review_id', review_id, 'review_date', save_review.review_date);
END;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    fn TEXT;
    internal_fns TEXT[] := ARRAY[
        'public.owned_mission_workspace(UUID)',
        'public.lock_owned_session(UUID)',
        'public.focus_session_json(sessions)'
    ];
    user_fns TEXT[] := ARRAY[
        'public.save_day_plan(DATE, JSONB)',
        'public.start_focus(UUID, INTEGER)',
        'public.pause_focus(UUID)',
        'public.resume_focus(UUID)',
        'public.finish_focus(UUID, TEXT)',
        'public.save_review(DATE, INTEGER, TEXT, TEXT, TEXT)'
    ];
    has_anon BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
    has_authenticated BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
    FOREACH fn IN ARRAY internal_fns LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
        IF has_anon THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn); END IF;
        IF has_authenticated THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn); END IF;
    END LOOP;
    FOREACH fn IN ARRAY user_fns LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
        IF has_anon THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn); END IF;
        IF has_authenticated THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn); END IF;
    END LOOP;
END
$$;
