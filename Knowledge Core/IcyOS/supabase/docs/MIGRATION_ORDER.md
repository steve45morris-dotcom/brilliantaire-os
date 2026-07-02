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

*I build before burning.*
