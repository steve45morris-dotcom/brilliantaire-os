-- Migration: 07_ai_intelligence.sql
-- Purpose: Initialize trust_profiles, ai_decisions, ai_context_packages, and protected_buffers tables.
-- Dependencies: 06_timelines_sessions.sql
-- Safety Notes: Cascade delete mapping check constraints.

CREATE TABLE IF NOT EXISTS trust_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trust_score NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (trust_score >= 0.00 AND trust_score <= 1.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_context_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_paths JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected_buffers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_hour INT NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
    end_hour INT NOT NULL CHECK (end_hour >= 0 AND end_hour <= 23),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
