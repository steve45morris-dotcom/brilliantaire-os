-- Migration: 08_review_learning.sql
-- Purpose: Initialize reviews, insights, learning_records, and notifications tables.
-- Dependencies: 07_ai_intelligence.sql
-- Safety Notes: Cascade delete mapping check constraints.

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linter_errors_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    findings TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_syntax TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
