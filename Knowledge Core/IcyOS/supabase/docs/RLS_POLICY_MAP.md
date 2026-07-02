# 🔐 Row Level Security (RLS) Policy Map
`Version: 1.0.0` | `Status: Approved` | `Scope: Database Security`

Security mappings details:
- **`users` table**: `user_self_select` policy allows reading if `auth.uid() = id`.
- **`workspaces` table**: `workspace_select` policy restricts access to the workspace user.
- **`projects` table**: `project_select` policy filters projects through workspace linkages.

*I build before burning.*
