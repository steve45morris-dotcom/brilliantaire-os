-- Migration: 26_knowledge_notes.sql
-- Purpose: Real data for the Knowledge page: each user's notes, with an
--          optional project, pinning and search.
-- Dependencies: 18_add_owner_columns.sql (memory_entries.user_id and its owner
--               read policy), 22_manage_work.sql (clean_name, lock_owned_project).
-- Safety Notes: Idempotent and additive. memory_entries was unused until now;
--               any existing rows keep their content and get a title derived
--               from it. Writes go only through the functions below, which
--               check ownership; authenticated users get no INSERT, UPDATE or
--               DELETE policies.

-- 1. Columns. memory_entries already has id, content, created_at and user_id.
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE memory_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE memory_entries
SET title = COALESCE(NULLIF(left(btrim(split_part(content, E'\n', 1)), 255), ''), 'Untitled')
WHERE title IS NULL;
ALTER TABLE memory_entries ALTER COLUMN title SET NOT NULL;

ALTER TABLE memory_entries DROP CONSTRAINT IF EXISTS memory_entries_content_length;
ALTER TABLE memory_entries
    ADD CONSTRAINT memory_entries_content_length CHECK (length(content) <= 20000) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_memory_entries_user_recent ON memory_entries (user_id, pinned DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_project_id ON memory_entries (project_id);

-- 2. Internal helpers.
CREATE OR REPLACE FUNCTION public.lock_owned_note(target_note_id UUID)
RETURNS memory_entries
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found memory_entries;
BEGIN
    SELECT * INTO found
    FROM memory_entries
    WHERE id = target_note_id AND user_id = current_app_user_id()
    FOR UPDATE;
    IF found.id IS NULL THEN
        RAISE EXCEPTION 'note not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN found;
END;
$$;

CREATE OR REPLACE FUNCTION public.clean_note_body(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    IF value IS NOT NULL AND length(value) > 20000 THEN
        RAISE EXCEPTION 'a note can be at most 20000 characters' USING ERRCODE = '22023';
    END IF;
    RETURN COALESCE(value, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.note_json(n memory_entries)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'body', n.content,
        'project_id', n.project_id,
        'project_name', (SELECT p.name FROM projects p WHERE p.id = n.project_id),
        'pinned', n.pinned,
        'created_at', n.created_at,
        'updated_at', n.updated_at
    );
$$;

-- 3. User functions.
CREATE OR REPLACE FUNCTION public.create_note(note_title TEXT, note_body TEXT DEFAULT '', target_project_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    cleaned_title TEXT := clean_name(note_title, 'Title');
    cleaned_body TEXT := clean_note_body(note_body);
    new_note memory_entries;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    IF target_project_id IS NOT NULL THEN
        PERFORM lock_owned_project(target_project_id);
    END IF;
    -- Serialize creation per user so the cap holds under concurrency.
    PERFORM 1 FROM users WHERE id = app_user_id FOR UPDATE;
    IF (SELECT count(*) FROM memory_entries WHERE user_id = app_user_id) >= 2000 THEN
        RAISE EXCEPTION 'you can have at most 2000 notes' USING ERRCODE = '22023';
    END IF;

    INSERT INTO memory_entries (user_id, title, content, project_id)
    VALUES (app_user_id, cleaned_title, cleaned_body, target_project_id)
    RETURNING * INTO new_note;
    RETURN note_json(new_note);
END;
$$;

-- Changes only what is passed: NULL leaves a field as it is. clear_project
-- removes the project link.
CREATE OR REPLACE FUNCTION public.update_note(
    target_note_id UUID,
    note_title TEXT DEFAULT NULL,
    note_body TEXT DEFAULT NULL,
    target_project_id UUID DEFAULT NULL,
    clear_project BOOLEAN DEFAULT FALSE,
    note_pinned BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    note memory_entries := lock_owned_note(target_note_id);
BEGIN
    IF target_project_id IS NOT NULL THEN
        PERFORM lock_owned_project(target_project_id);
    END IF;
    UPDATE memory_entries SET
        title = CASE WHEN note_title IS NULL THEN title ELSE clean_name(note_title, 'Title') END,
        content = CASE WHEN note_body IS NULL THEN content ELSE clean_note_body(note_body) END,
        project_id = CASE WHEN clear_project THEN NULL ELSE COALESCE(target_project_id, project_id) END,
        pinned = COALESCE(note_pinned, pinned),
        updated_at = NOW()
    WHERE id = note.id
    RETURNING * INTO note;
    RETURN note_json(note);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_note(target_note_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    note memory_entries := lock_owned_note(target_note_id);
BEGIN
    DELETE FROM memory_entries WHERE id = note.id;
    RETURN jsonb_build_object('id', note.id, 'deleted', TRUE);
END;
$$;

-- Lists the caller's notes, pinned first then newest, with a short excerpt.
-- With a query, keeps notes whose title or body contains it (case-insensitive,
-- no wildcards). Runs as the caller, so RLS limits it to their own notes.
CREATE OR REPLACE FUNCTION public.search_notes(query TEXT DEFAULT NULL, max_results INTEGER DEFAULT 200)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COALESCE(jsonb_agg(row ORDER BY ord), '[]'::jsonb)
    FROM (
        SELECT
            jsonb_build_object(
                'id', n.id,
                'title', n.title,
                'excerpt', left(regexp_replace(n.content, '\s+', ' ', 'g'), 200),
                'project_id', n.project_id,
                'project_name', p.name,
                'pinned', n.pinned,
                'updated_at', n.updated_at
            ) AS row,
            row_number() OVER (ORDER BY n.pinned DESC, n.updated_at DESC, n.id) AS ord
        FROM memory_entries n
        LEFT JOIN projects p ON p.id = n.project_id
        WHERE n.user_id = current_app_user_id()
          AND (
              NULLIF(btrim(query), '') IS NULL
              OR strpos(lower(n.title), lower(btrim(query))) > 0
              OR strpos(lower(n.content), lower(btrim(query))) > 0
          )
        ORDER BY n.pinned DESC, n.updated_at DESC, n.id
        LIMIT LEAST(GREATEST(COALESCE(max_results, 200), 1), 200)
    ) found;
$$;

-- 4. Grants. Supabase grants EXECUTE on new public functions to anon and
-- authenticated explicitly, so revoke by name. The roles only exist on
-- Supabase, not in plain local PostgreSQL.
DO $$
DECLARE
    fn TEXT;
    internal_fns TEXT[] := ARRAY[
        'public.lock_owned_note(UUID)',
        'public.clean_note_body(TEXT)',
        'public.note_json(memory_entries)'
    ];
    user_fns TEXT[] := ARRAY[
        'public.create_note(TEXT, TEXT, UUID)',
        'public.update_note(UUID, TEXT, TEXT, UUID, BOOLEAN, BOOLEAN)',
        'public.delete_note(UUID)',
        'public.search_notes(TEXT, INTEGER)'
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
