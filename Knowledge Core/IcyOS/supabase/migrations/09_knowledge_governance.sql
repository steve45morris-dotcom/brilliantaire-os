-- Migration: 09_knowledge_governance.sql
-- Purpose: Initialize blueprints, blueprint_steps, recommendations, trade_off_decisions, knowledge_assets, architecture_decisions, and memory_entries tables.
-- Dependencies: 08_review_learning.sql
-- Safety Notes: Cascade delete mapping check constraints.

CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagram_syntax TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprint_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    step_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actionable_task_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_off_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    selected_option VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path VARCHAR(512) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS architecture_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adr_id VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
