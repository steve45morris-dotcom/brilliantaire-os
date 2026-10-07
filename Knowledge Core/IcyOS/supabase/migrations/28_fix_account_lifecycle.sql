-- Migration: 28_fix_account_lifecycle.sql
-- Purpose: Make account export and deletion work. The versions in
--          27_account_lifecycle.sql applied cleanly but failed on every call:
--          they read columns that don't exist (projects.user_id,
--          missions.user_id, actions.user_id, api_tokens.auth_id) and tables
--          that don't exist (notes, day_plans, focus_sessions).
-- Dependencies: 27_account_lifecycle.sql (same signatures), 26_knowledge_notes.sql.
-- Safety Notes: Replaces two functions only. No tables, columns or data change.
--
-- Ownership, as the rest of the schema has it: a user owns workspaces;
-- projects, sprints, missions and steps (actions) hang off a workspace;
-- sessions belong to a workspace; timelines, reviews, notes (memory_entries),
-- tokens and the other per-user tables carry user_id. Every one of these
-- reaches users through ON DELETE CASCADE.

-- export_account(): everything the caller owns, as one JSON object.
-- Token hashes are left out. Runs as the caller's app user only.
CREATE OR REPLACE FUNCTION public.export_account()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID := current_app_user_id();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;

    RETURN jsonb_build_object(
        'exported_at', NOW(),
        'user', (SELECT jsonb_build_object('id', u.id, 'name', u.name, 'email', u.email, 'timezone', u.timezone, 'created_at', u.created_at)
                 FROM users u WHERE u.id = uid),
        'roles', COALESCE((SELECT jsonb_agg(jsonb_build_object('role', r.role, 'granted_at', r.granted_at))
                 FROM user_roles r WHERE r.user_id = uid), '[]'::jsonb),
        'subscription', (SELECT jsonb_build_object('plan', s.plan, 'status', s.status, 'seats', s.seats,
                            'trial_ends_at', s.trial_ends_at, 'current_period_end', s.current_period_end,
                            'cancel_at_period_end', s.cancel_at_period_end, 'created_at', s.created_at)
                 FROM subscriptions s WHERE s.user_id = uid ORDER BY s.created_at DESC LIMIT 1),
        'workspaces', COALESCE((SELECT jsonb_agg(to_jsonb(w)) FROM workspaces w WHERE w.user_id = uid), '[]'::jsonb),
        'projects', COALESCE((SELECT jsonb_agg(to_jsonb(p))
                 FROM projects p JOIN workspaces w ON w.id = p.workspace_id WHERE w.user_id = uid), '[]'::jsonb),
        'sprints', COALESCE((SELECT jsonb_agg(to_jsonb(sp))
                 FROM sprints sp JOIN projects p ON p.id = sp.project_id JOIN workspaces w ON w.id = p.workspace_id
                 WHERE w.user_id = uid), '[]'::jsonb),
        'missions', COALESCE((SELECT jsonb_agg(to_jsonb(m))
                 FROM missions m JOIN sprints sp ON sp.id = m.sprint_id JOIN projects p ON p.id = sp.project_id
                 JOIN workspaces w ON w.id = p.workspace_id WHERE w.user_id = uid), '[]'::jsonb),
        'steps', COALESCE((SELECT jsonb_agg(to_jsonb(a))
                 FROM actions a JOIN missions m ON m.id = a.mission_id JOIN sprints sp ON sp.id = m.sprint_id
                 JOIN projects p ON p.id = sp.project_id JOIN workspaces w ON w.id = p.workspace_id
                 WHERE w.user_id = uid), '[]'::jsonb),
        'focus_sessions', COALESCE((SELECT jsonb_agg(to_jsonb(se))
                 FROM sessions se JOIN workspaces w ON w.id = se.workspace_id WHERE w.user_id = uid), '[]'::jsonb),
        'day_plans', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('blocks',
                     COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.position) FROM timeline_blocks b WHERE b.timeline_id = t.id), '[]'::jsonb)))
                 FROM timelines t WHERE t.user_id = uid), '[]'::jsonb),
        'reviews', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM reviews r WHERE r.user_id = uid), '[]'::jsonb),
        'notes', COALESCE((SELECT jsonb_agg(to_jsonb(n)) FROM memory_entries n WHERE n.user_id = uid), '[]'::jsonb),
        'api_tokens', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', t.name, 'prefix', t.prefix, 'created_at', t.created_at,
                            'last_used_at', t.last_used_at, 'expires_at', t.expires_at, 'revoked_at', t.revoked_at))
                 FROM api_tokens t WHERE t.user_id = uid), '[]'::jsonb),
        'insights', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM insights x WHERE x.user_id = uid), '[]'::jsonb),
        'learning_records', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM learning_records x WHERE x.user_id = uid), '[]'::jsonb),
        'notifications', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM notifications x WHERE x.user_id = uid), '[]'::jsonb),
        'ai_decisions', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM ai_decisions x WHERE x.user_id = uid), '[]'::jsonb),
        'ai_context_packages', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM ai_context_packages x WHERE x.user_id = uid), '[]'::jsonb),
        'blueprints', COALESCE((SELECT jsonb_agg(to_jsonb(x) || jsonb_build_object('steps',
                     COALESCE((SELECT jsonb_agg(to_jsonb(bs)) FROM blueprint_steps bs WHERE bs.blueprint_id = x.id), '[]'::jsonb)))
                 FROM blueprints x WHERE x.user_id = uid), '[]'::jsonb),
        'recommendations', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM recommendations x WHERE x.user_id = uid), '[]'::jsonb),
        'trade_off_decisions', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM trade_off_decisions x WHERE x.user_id = uid), '[]'::jsonb),
        'knowledge_assets', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM knowledge_assets x WHERE x.user_id = uid), '[]'::jsonb),
        'architecture_decisions', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM architecture_decisions x WHERE x.user_id = uid), '[]'::jsonb),
        'protected_buffers', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM protected_buffers x WHERE x.user_id = uid), '[]'::jsonb),
        'trust_profiles', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM trust_profiles x WHERE x.user_id = uid), '[]'::jsonb)
    );
END;
$$;

-- delete_account(): removes the caller's users row; ON DELETE CASCADE removes
-- everything they own (workspaces and all work under them, plans, sessions,
-- reviews, notes, tokens, roles, the local subscription row and the per-user
-- tables). Roles they granted to others keep the role and lose the
-- granted_by link, the one reference that would otherwise block the delete.
-- Billing records live in Stripe, which keeps them as tax and accounting law
-- requires. The auth.users row is removed afterwards by the API route
-- (supabase.auth.admin.deleteUser), which needs the service role.
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid UUID := current_app_user_id();
BEGIN
    IF uid IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;

    UPDATE user_roles SET granted_by = NULL WHERE granted_by = uid;
    DELETE FROM users WHERE id = uid;
END;
$$;

-- Grants: signed-in users only. Supabase grants EXECUTE on new public
-- functions to anon and authenticated explicitly, so revoke by name. The
-- roles only exist on Supabase, not in plain local PostgreSQL.
DO $$
DECLARE
    fn TEXT;
    has_anon BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon');
    has_authenticated BOOLEAN := EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated');
BEGIN
    FOREACH fn IN ARRAY ARRAY['public.export_account()', 'public.delete_account()'] LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
        IF has_anon THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn); END IF;
        IF has_authenticated THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn); END IF;
    END LOOP;
END
$$;
