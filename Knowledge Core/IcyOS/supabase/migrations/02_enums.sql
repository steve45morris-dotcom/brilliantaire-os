-- Migration: 02_enums.sql
-- Purpose: Initialize status and priority database enum values.
-- Dependencies: 01_extensions.sql
-- Safety Notes: Idempotent enum creation guards.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('P1', 'P2', 'P3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_status') THEN
        CREATE TYPE mission_status AS ENUM ('Staged', 'Approved', 'Running', 'Completed', 'Skipped', 'Failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('Active', 'Wrapped', 'Failing');
    END IF;
END$$;
