# 🔐 Row Level Security (RLS) Policy Map
`Version: 1.0.0` | `Status: Approved` | `Scope: Database Security`

Identity: Supabase Auth users map to app users through `users.auth_id = auth.uid()`; `users.id` is a separate key. Policies resolve the signed-in user with the `SECURITY DEFINER` helpers from `15_fix_role_resolution.sql`: `current_app_user_id()`, `current_user_role()`, `is_admin()`.

Security mappings details (all read-only for signed-in users; writes are denied unless noted):
- **`users` table**: `users_self_select`: a user reads their own row (`auth_id = auth.uid()`).
- **`workspaces` table**: `workspaces_owner_select`: rows where `user_id = current_app_user_id()`.
- **`projects` table**: `projects_owner_select`: projects in the user's workspaces.
- **`sprints` table**: `sprints_owner_select`: sprints of the user's projects.
- **`missions` table**: `missions_owner_select`: missions of the user's sprints.
- **`user_roles` table**: `user_roles_select`: own role, or all roles for admins. `user_roles_admin_insert` / `_update` / `_delete`: admins only.

Superseded: `user_self_select`, `workspace_select`, `project_select` (12) compared `auth.uid()` to `users.id` and matched no auth-created user; `admin_read_roles`, `self_read_role`, `admin_manage_roles` (14) recursed on `user_roles`. Replaced by 16 and 15 respectively.

Not yet covered: the remaining tables (`actions`, `timelines`, `timeline_blocks`, `sessions`, and the AI, review, learning and knowledge tables) do not have RLS enabled.

*I build before burning.*
