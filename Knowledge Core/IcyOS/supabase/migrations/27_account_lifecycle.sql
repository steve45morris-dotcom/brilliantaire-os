-- Migration: 27_account_lifecycle.sql
-- Purpose: Account deletion and data export, backing the promises in
--          the Terms of Service (§10) and Privacy Policy (§6, §8).
-- Dependencies: 18_add_owner_columns.sql, 22_manage_work.sql

-- export_account(): returns all user-owned rows as a single JSON object.
-- The caller must be authenticated; RLS + current_app_user_id() scopes it.
CREATE OR REPLACE FUNCTION export_account()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := current_app_user_id();
  result JSONB := '{}'::JSONB;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'user', (SELECT to_jsonb(u) FROM users u WHERE u.id = uid),
    'projects', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM projects p WHERE p.user_id = uid), '[]'::JSONB),
    'missions', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM missions m WHERE m.user_id = uid), '[]'::JSONB),
    'actions', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM actions a WHERE a.user_id = uid), '[]'::JSONB),
    'notes', COALESCE((SELECT jsonb_agg(to_jsonb(n)) FROM notes n WHERE n.owner_id = uid), '[]'::JSONB),
    'timelines', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM timelines t WHERE t.user_id = uid), '[]'::JSONB),
    'sessions', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM sessions s WHERE s.user_id = uid), '[]'::JSONB),
    'day_plans', COALESCE((SELECT jsonb_agg(to_jsonb(dp)) FROM day_plans dp WHERE dp.user_id = uid), '[]'::JSONB),
    'focus_sessions', COALESCE((SELECT jsonb_agg(to_jsonb(fs)) FROM focus_sessions fs WHERE fs.user_id = uid), '[]'::JSONB),
    'reviews', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM reviews r WHERE r.user_id = uid), '[]'::JSONB),
    'blueprints', COALESCE((SELECT jsonb_agg(to_jsonb(b)) FROM blueprints b WHERE b.user_id = uid), '[]'::JSONB),
    'knowledge_assets', COALESCE((SELECT jsonb_agg(to_jsonb(k)) FROM knowledge_assets k WHERE k.user_id = uid), '[]'::JSONB),
    'ai_decisions', COALESCE((SELECT jsonb_agg(to_jsonb(ad)) FROM ai_decisions ad WHERE ad.user_id = uid), '[]'::JSONB),
    'learning_records', COALESCE((SELECT jsonb_agg(to_jsonb(lr)) FROM learning_records lr WHERE lr.user_id = uid), '[]'::JSONB),
    'architecture_decisions', COALESCE((SELECT jsonb_agg(to_jsonb(arc)) FROM architecture_decisions arc WHERE arc.user_id = uid), '[]'::JSONB),
    'api_tokens', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'prefix', t.prefix, 'created_at', t.created_at, 'expires_at', t.expires_at)) FROM api_tokens t WHERE t.auth_id = uid AND t.revoked_at IS NULL), '[]'::JSONB),
    'exported_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- delete_account(): removes all user-owned data across every table, then
-- deletes the users row. Cascades handle child rows with FK constraints.
-- The auth.users row is NOT deleted here (Supabase Admin API is needed for
-- that); the API route calls supabase.auth.admin.deleteUser() after this.
CREATE OR REPLACE FUNCTION delete_account()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := current_app_user_id();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Revoke all API tokens
  UPDATE api_tokens SET revoked_at = NOW() WHERE auth_id = uid AND revoked_at IS NULL;

  -- Delete from tables that have user_id but no FK cascade from users
  DELETE FROM notes WHERE owner_id = uid;
  DELETE FROM day_plans WHERE user_id = uid;
  DELETE FROM focus_sessions WHERE user_id = uid;
  DELETE FROM ai_decisions WHERE user_id = uid;
  DELETE FROM ai_context_packages WHERE user_id = uid;
  DELETE FROM reviews WHERE user_id = uid;
  DELETE FROM insights WHERE user_id = uid;
  DELETE FROM learning_records WHERE user_id = uid;
  DELETE FROM notifications WHERE user_id = uid;
  DELETE FROM blueprints WHERE user_id = uid;
  DELETE FROM recommendations WHERE user_id = uid;
  DELETE FROM trade_off_decisions WHERE user_id = uid;
  DELETE FROM knowledge_assets WHERE user_id = uid;
  DELETE FROM architecture_decisions WHERE user_id = uid;
  DELETE FROM memory_entries WHERE user_id = uid;

  -- Actions, missions, projects cascade via FK but explicit is clearer
  DELETE FROM actions WHERE user_id = uid;
  DELETE FROM missions WHERE user_id = uid;
  DELETE FROM projects WHERE user_id = uid;
  DELETE FROM timelines WHERE user_id = uid;
  DELETE FROM sessions WHERE user_id = uid;

  -- Billing: keep for accounting records (as stated in Privacy Policy §6)
  -- but clear the subscription so the account is no longer active
  UPDATE subscriptions SET status = 'canceled' WHERE user_id = uid AND status != 'canceled';

  -- User roles and the user row itself
  DELETE FROM user_roles WHERE user_id = uid;
  DELETE FROM users WHERE id = uid;
END;
$$;
