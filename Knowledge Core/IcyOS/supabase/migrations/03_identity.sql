-- Migration: 03_identity.sql
-- Purpose: Initialize the core users table.
-- Dependencies: 02_enums.sql
-- Safety Notes: Enforces primary key checks.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
