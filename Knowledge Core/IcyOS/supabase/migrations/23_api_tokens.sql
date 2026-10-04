-- Migration: 23_api_tokens.sql
-- Purpose: Personal access tokens, so a user's own tools (such as P.J.K.) can
--          read and change their projects, missions and steps without a
--          browser session.
-- Dependencies: 22_manage_work.sql (clean_name)
-- Safety Notes: Idempotent. Adds one table, its policy and grants, and three
--               functions. No existing data changes.
--
-- The database never sees a token, only its SHA-256 hash. The app generates the
-- token, shows it to the user once, and stores the hash here.
--
-- When a request arrives with a token, the app looks the hash up through
-- resolve_api_token(), which only the service role may call. It then acts as the
-- token's owner, so every RLS policy and function from 15 to 22 applies to the
-- request exactly as it would to that user's browser session.
--
-- Users can list their own tokens without the hash column, and create or revoke
-- them through the functions below. Limits: 20 active tokens per user, each
-- expiring within 366 days or never.

CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    prefix VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens (user_id);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_tokens_owner_select ON api_tokens;
CREATE POLICY api_tokens_owner_select ON api_tokens FOR SELECT TO authenticated
    USING (user_id = (SELECT current_app_user_id()));

-- Supabase grants every table to anon and authenticated by default. Take that
-- back, then give signed-in users read access to everything except the hash.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON api_tokens FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON api_tokens FROM authenticated;
        GRANT SELECT (id, user_id, name, prefix, created_at, last_used_at, expires_at, revoked_at)
            ON api_tokens TO authenticated;
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.create_api_token(
    token_name TEXT,
    token_hash TEXT,
    token_prefix TEXT,
    expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    cleaned TEXT;
    new_id UUID;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    cleaned := clean_name(token_name, 'Token name', 100);
    IF token_hash IS NULL OR token_hash !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'token hash must be 64 lowercase hex characters' USING ERRCODE = '22023';
    END IF;
    IF token_prefix IS NULL OR token_prefix !~ '^icy_[A-Za-z0-9_-]{4,12}$' THEN
        RAISE EXCEPTION 'token prefix is malformed' USING ERRCODE = '22023';
    END IF;
    IF create_api_token.expires_at IS NOT NULL
       AND (create_api_token.expires_at <= NOW() OR create_api_token.expires_at > NOW() + INTERVAL '366 days') THEN
        RAISE EXCEPTION 'tokens must expire within 366 days, or never' USING ERRCODE = '22023';
    END IF;

    -- Serialize per user so the cap holds under concurrent requests.
    PERFORM 1 FROM users WHERE id = app_user_id FOR UPDATE;
    IF (SELECT count(*) FROM api_tokens t
        WHERE t.user_id = app_user_id AND t.revoked_at IS NULL
          AND (t.expires_at IS NULL OR t.expires_at > NOW())) >= 20 THEN
        RAISE EXCEPTION 'you can have at most 20 active tokens; revoke one first' USING ERRCODE = '22023';
    END IF;

    INSERT INTO api_tokens (user_id, name, token_hash, prefix, expires_at)
    VALUES (app_user_id, cleaned, create_api_token.token_hash, token_prefix, create_api_token.expires_at)
    RETURNING id INTO new_id;

    RETURN jsonb_build_object('id', new_id);
END;
$$;

-- Revoking twice is harmless; someone else's token reads as not found.
CREATE OR REPLACE FUNCTION public.revoke_api_token(token_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    app_user_id UUID := current_app_user_id();
    found_id UUID;
BEGIN
    IF app_user_id IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;
    UPDATE api_tokens
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE id = token_id AND user_id = app_user_id
    RETURNING id INTO found_id;
    IF found_id IS NULL THEN
        RAISE EXCEPTION 'token not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN jsonb_build_object('id', found_id, 'revoked', TRUE);
END;
$$;

-- For the app server only (service role). Returns the owner's auth id for a
-- live token, or no row. Records use at most once a minute to limit writes.
CREATE OR REPLACE FUNCTION public.resolve_api_token(token_hash TEXT)
RETURNS TABLE (token_id UUID, auth_id UUID)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE api_tokens t
    SET last_used_at = CASE
            WHEN t.last_used_at IS NULL OR t.last_used_at < NOW() - INTERVAL '1 minute' THEN NOW()
            ELSE t.last_used_at
        END
    FROM users u
    WHERE t.token_hash = resolve_api_token.token_hash
      AND u.id = t.user_id
      AND u.auth_id IS NOT NULL
      AND t.revoked_at IS NULL
      AND (t.expires_at IS NULL OR t.expires_at > NOW())
    RETURNING t.id, u.auth_id;
END;
$$;

DO $$
DECLARE
    has_anon BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
    has_authenticated BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
    has_service_role BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role');
BEGIN
    REVOKE ALL ON FUNCTION public.create_api_token(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.revoke_api_token(UUID) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.resolve_api_token(TEXT) FROM PUBLIC;
    IF has_anon THEN
        REVOKE ALL ON FUNCTION public.create_api_token(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM anon;
        REVOKE ALL ON FUNCTION public.revoke_api_token(UUID) FROM anon;
        REVOKE ALL ON FUNCTION public.resolve_api_token(TEXT) FROM anon;
    END IF;
    IF has_authenticated THEN
        GRANT EXECUTE ON FUNCTION public.create_api_token(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.revoke_api_token(UUID) TO authenticated;
        REVOKE ALL ON FUNCTION public.resolve_api_token(TEXT) FROM authenticated;
    END IF;
    IF has_service_role THEN
        GRANT EXECUTE ON FUNCTION public.resolve_api_token(TEXT) TO service_role;
    END IF;
END
$$;
