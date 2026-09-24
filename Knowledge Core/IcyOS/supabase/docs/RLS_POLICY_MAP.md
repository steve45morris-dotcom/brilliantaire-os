# 🔐 Row Level Security (RLS) Policy Map
`Version: 1.0.0` | `Status: Approved` | `Scope: Database Security`

Identity: Supabase Auth users map to app users through `users.auth_id = auth.uid()`; `users.id` is a separate key. Policies resolve the signed-in user with the `SECURITY DEFINER` helpers from `15_fix_role_resolution.sql`: `current_app_user_id()`, `current_user_role()`, `is_admin()`.

Security mappings details (all read-only for signed-in users; writes are denied unless noted). Core tables (15, 16):
- **`users` table**: `users_self_select`: a user reads their own row (`auth_id = auth.uid()`).
- **`workspaces` table**: `workspaces_owner_select`: rows where `user_id = current_app_user_id()`.
- **`projects` table**: `projects_owner_select`: projects in the user's workspaces.
- **`sprints` table**: `sprints_owner_select`: sprints of the user's projects.
- **`missions` table**: `missions_owner_select`: missions of the user's sprints.
- **`user_roles` table**: `user_roles_select`: own role, or all roles for admins. `user_roles_admin_insert` / `_update` / `_delete`: admins only.

Superseded: `user_self_select`, `workspace_select`, `project_select` (12) compared `auth.uid()` to `users.id` and matched no auth-created user; `admin_read_roles`, `self_read_role`, `admin_manage_roles` (14) recursed on `user_roles`. Replaced by 16 and 15 respectively.

Owned tables (17):
- **`timelines`, `trust_profiles`, `protected_buffers`**: `*_owner_select`: rows where `user_id = current_app_user_id()`.
- **`timeline_blocks`**: blocks of the user's timelines.
- **`sessions`**: sessions in the user's workspaces.
- **`actions`**: actions of the user's missions.

Per-user records (17, owner columns added in 18): `ai_decisions`, `ai_context_packages`, `reviews`, `insights`, `learning_records`, `notifications`, `blueprints`, `recommendations`, `trade_off_decisions`, `knowledge_assets`, `architecture_decisions`, `memory_entries` carry a nullable `user_id`, and `blueprint_steps` is owned through its blueprint. `*_owner_select` lets a user read rows where `user_id = current_app_user_id()`; rows with `user_id IS NULL` (created before 18) are readable by admins only. `knowledge_assets.path` and `architecture_decisions.adr_id` are unique per user.

Every table in `public` has RLS enabled. Every policy is scoped `TO authenticated`, so the `anon` role matches none and reads nothing. Server code using the service role bypasses RLS.

*I build before burning.*
