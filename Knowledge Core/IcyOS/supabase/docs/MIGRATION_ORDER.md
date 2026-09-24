# 📐 Migration Order Specification
`Version: 1.0.0` | `Status: Approved` | `Scope: Database Architecture`

Conceptual migration execution order:
1. **01_extensions.sql**: Enable core UUID and trigram extensions.
2. **02_enums.sql**: Initialize database enums.
3. **03_identity.sql**: Seed user accounts.
4. **04_workspaces.sql**: Setup workspaces root directories.
5. **05_projects_missions.sql**: Setup projects, sprints, missions, and actions tables.
6. **06_timelines_sessions.sql**: Setup timelines coordinates.
7. **07_ai_intelligence.sql**: Setup trust profiles and protected buffers.
8. **08_review_learning.sql**: Setup validation checks and learning models.
9. **09_knowledge_governance.sql**: Setup blueprint and ADR tracking tables.
10. **10_indexes.sql**: Initialize foreign keys B-Tree and text search indices.
11. **11_triggers_functions.sql**: Deploy trigger hooks and PL/pgSQL stored procedures.
12. **12_rls_policies.sql**: Deploy Row Level Security (RLS) policies.
13. **13_seed_data.sql**: Seed default user configurations.
14. **14_auth_roles.sql**: Link users to Supabase Auth; add `user_roles` and the signup trigger.
15. **15_fix_role_resolution.sql**: Resolve identity and role in `SECURITY DEFINER` functions (`current_app_user_id()`, `current_user_role()`, `is_admin()`) and replace 14's recursive `user_roles` policies.
16. **16_fix_rls_identity.sql**: Rewrite the `12_rls_policies.sql` read policies to match users through `auth_id`, and add the missing `sprints` and `missions` policies.
17. **17_enable_rls_remaining_tables.sql**: Enable RLS on the 19 remaining tables: owner-only reads where a table links to a user, admin-only reads where it has no owner column.
18. **18_add_owner_columns.sql**: Add a nullable `user_id` to the 12 tables without an owner (`blueprint_steps` follows its blueprint). Make `knowledge_assets.path` and `architecture_decisions.adr_id` unique per user, and switch their reads to owner-only; ownerless legacy rows stay admin-only.

*I build before burning.*
