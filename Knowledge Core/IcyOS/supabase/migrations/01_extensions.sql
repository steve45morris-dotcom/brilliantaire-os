-- Migration: 01_extensions.sql
-- Purpose: Enable core PostgreSQL extensions for UUID and search index calculations.
-- Dependencies: None.
-- Safety Notes: Safe to execute, doesn't modify data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
