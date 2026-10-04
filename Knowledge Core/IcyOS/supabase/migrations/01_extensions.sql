-- Migration: 01_extensions.sql
-- Purpose: Enable core PostgreSQL extensions for UUID and search index calculations.
-- Dependencies: None.
-- Safety Notes: Safe to execute, doesn't modify data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mock Auth schema for local PostgreSQL validation only. The mock is created
-- only when no auth.uid() exists: on Supabase, auth.uid() reads the caller's
-- JWT, and replacing it would make every request run as one fixed user.
CREATE SCHEMA IF NOT EXISTS auth;
DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    CREATE FUNCTION auth.uid() RETURNS uuid AS $mock$
      SELECT 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
    $mock$ LANGUAGE sql STABLE;
  END IF;
END
$$;
