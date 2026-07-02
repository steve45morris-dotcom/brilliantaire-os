-- Migration: 01_extensions.sql
-- Purpose: Enable core PostgreSQL extensions for UUID and search index calculations.
-- Dependencies: None.
-- Safety Notes: Safe to execute, doesn't modify data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Mock Auth schema for local PostgreSQL validation
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
$$ LANGUAGE sql STABLE;
