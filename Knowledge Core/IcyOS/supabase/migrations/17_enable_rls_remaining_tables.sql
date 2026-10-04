-- Migration: 17_enable_rls_remaining_tables.sql
-- Purpose: Enable Row Level Security on every table that 12, 14 and 16 left open.
-- Dependencies: 16_fix_rls_identity.sql, 15_fix_role_resolution.sql
-- Safety Notes: Idempotent. Does not change any data; only RLS settings and policies.
--
-- On Supabase, a public table without RLS is readable and writable through the
-- REST API by anyone holding the anon key, which ships to every browser. 19
-- tables were in that state.
--
-- Tables with a path to a user get owner-only reads, following the same
-- identity as 16 (users.auth_id = auth.uid(), resolved by current_app_user_id()).
-- Tables with no owner column get admin-only reads: several hold private data
-- (memory_entries, notifications, ai_decisions), so opening them to every
-- signed-in user would leak between customers. They need an owner column
-- before users can read their own rows.
--
-- Policies are scoped TO authenticated: anon matches none and sees no rows,
-- rather than failing on the identity helpers, which anon may not execute (15).
--
-- Read access only, as in 12 and 16. Writes are denied for signed-in users;
-- server code using the service role bypasses RLS and is unaffected.

-- 1. Enable RLS everywhere.
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected_buffers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_off_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE architecture_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

-- 2. Owned tables: the owner reads their own rows.
DROP POLICY IF EXISTS timelines_owner_select ON timelines;
CREATE POLICY timelines_owner_select ON timelines FOR SELECT TO authenticated
    USING (user_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS trust_profiles_owner_select ON trust_profiles;
CREATE POLICY trust_profiles_owner_select ON trust_profiles FOR SELECT TO authenticated
    USING (user_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS protected_buffers_owner_select ON protected_buffers;
CREATE POLICY protected_buffers_owner_select ON protected_buffers FOR SELECT TO authenticated
    USING (user_id = (SELECT current_app_user_id()));

DROP POLICY IF EXISTS timeline_blocks_owner_select ON timeline_blocks;
CREATE POLICY timeline_blocks_owner_select ON timeline_blocks FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM timelines t
        WHERE t.id = timeline_blocks.timeline_id
          AND t.user_id = (SELECT current_app_user_id())
    ));

DROP POLICY IF EXISTS sessions_owner_select ON sessions;
CREATE POLICY sessions_owner_select ON sessions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM workspaces w
        WHERE w.id = sessions.workspace_id
          AND w.user_id = (SELECT current_app_user_id())
    ));

DROP POLICY IF EXISTS actions_owner_select ON actions;
CREATE POLICY actions_owner_select ON actions FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM missions m
        JOIN sprints s ON s.id = m.sprint_id
        JOIN projects p ON p.id = s.project_id
        JOIN workspaces w ON w.id = p.workspace_id
        WHERE m.id = actions.mission_id
          AND w.user_id = (SELECT current_app_user_id())
    ));

-- 3. Tables with no owner column: admins only.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'ai_decisions', 'ai_context_packages', 'reviews', 'insights',
        'learning_records', 'notifications', 'blueprints', 'blueprint_steps',
        'recommendations', 'trade_off_decisions', 'knowledge_assets',
        'architecture_decisions', 'memory_entries'
    ] LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_admin_select', t);
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING ((SELECT is_admin()))',
            t || '_admin_select', t
        );
    END LOOP;
END
$$;
