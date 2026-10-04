-- Migration: 13_seed_data.sql
-- Purpose: Seed default configurations and initial strategist user.
-- Dependencies: 12_rls_policies.sql
-- Safety Notes: Enforces idempotent inserts.

INSERT INTO users (id, name, timezone)
VALUES ('748805f1-3561-42e7-a9a3-d0adbb267389', 'Workspace Owner', 'UTC')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, user_id, root_path)
VALUES ('31f137eb-d1eb-4b2a-874f-40c265696d59', '748805f1-3561-42e7-a9a3-d0adbb267389', '/workspace/icyos')
ON CONFLICT (id) DO NOTHING;
