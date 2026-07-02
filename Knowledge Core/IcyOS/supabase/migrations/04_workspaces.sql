-- Migration: 04_workspaces.sql
-- Purpose: Initialize workspaces directory table.
-- Dependencies: 03_identity.sql
-- Safety Notes: Cascade delete mapping check constraints.

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    root_path VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
