-- Migration: 18_add_owner_columns.sql
-- Purpose: Give the tables that 17 left admin-only an owner, so users can read their own rows.
-- Dependencies: 17_enable_rls_remaining_tables.sql
-- Safety Notes: Idempotent. Adds nullable columns, indexes and per-user unique
--               constraints; existing rows keep user_id NULL and are not modified.
--
-- 12 tables get user_id -> users(id). blueprint_steps is owned through its
-- blueprint. The column is nullable because existing rows have no known owner;
-- those rows stay readable by admins only. Once they are backfilled, the column
-- can be made NOT NULL.
--
-- knowledge_assets.path and architecture_decisions.adr_id were unique across
-- the whole database. With per-user data that would stop a second user from
-- creating their own "ADR-001" and reveal that another user has one, so both
-- become unique per user. NULLS NOT DISTINCT (PostgreSQL 15+, as on Supabase)
-- keeps ownerless rows unique among themselves, as before.

-- 1. Owner columns and indexes.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'ai_decisions', 'ai_context_packages', 'reviews', 'insights',
        'learning_records', 'notifications', 'blueprints', 'recommendations',
        'trade_off_decisions', 'knowledge_assets', 'architecture_decisions',
        'memory_entries'
    ] LOOP
        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE',
            t
        );
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id)', 'idx_' || t || '_user_id', t);
    END LOOP;
END
$$;

-- 2. Per-user uniqueness.
ALTER TABLE knowledge_assets DROP CONSTRAINT IF EXISTS knowledge_assets_path_key;
ALTER TABLE knowledge_assets DROP CONSTRAINT IF EXISTS knowledge_assets_user_id_path_key;
ALTER TABLE knowledge_assets
    ADD CONSTRAINT knowledge_assets_user_id_path_key UNIQUE NULLS NOT DISTINCT (user_id, path);

ALTER TABLE architecture_decisions DROP CONSTRAINT IF EXISTS architecture_decisions_adr_id_key;
ALTER TABLE architecture_decisions DROP CONSTRAINT IF EXISTS architecture_decisions_user_id_adr_id_key;
ALTER TABLE architecture_decisions
    ADD CONSTRAINT architecture_decisions_user_id_adr_id_key UNIQUE NULLS NOT DISTINCT (user_id, adr_id);

-- 3. Replace 17's admin-only reads: owners read their rows, admins read ownerless ones.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'ai_decisions', 'ai_context_packages', 'reviews', 'insights',
        'learning_records', 'notifications', 'blueprints', 'recommendations',
        'trade_off_decisions', 'knowledge_assets', 'architecture_decisions',
        'memory_entries'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_admin_select', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_owner_select', t);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING ('
            || 'user_id = (SELECT current_app_user_id()) OR (user_id IS NULL AND (SELECT is_admin())))',
            t || '_owner_select', t
        );
    END LOOP;
END
$$;

DROP POLICY IF EXISTS blueprint_steps_admin_select ON blueprint_steps;
DROP POLICY IF EXISTS blueprint_steps_owner_select ON blueprint_steps;
CREATE POLICY blueprint_steps_owner_select ON blueprint_steps FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM blueprints b
        WHERE b.id = blueprint_steps.blueprint_id
          AND (b.user_id = (SELECT current_app_user_id()) OR (b.user_id IS NULL AND (SELECT is_admin())))
    ));
