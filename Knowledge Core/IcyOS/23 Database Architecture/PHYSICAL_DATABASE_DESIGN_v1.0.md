# 🏗️ PHYSICAL DATABASE DESIGN v1.0
`Version: 1.0.0` | `Status: Approved` | `Scope: Database Architecture`

This document serves as the canonical map for the raw physical SQL migration files under `supabase/migrations/` in **IcyOS**.

---

## 🗂️ Staged Migration Files
- **01_extensions.sql**: Sets PostgreSQL extensions.
- **02_enums.sql**: Initializes domain enum types.
- **03_identity.sql**: Sets users profile tables.
- **04_workspaces.sql**: Sets workspaces directories.
- **05_projects_missions.sql**: Sets projects, sprints, missions, and actions tables.
- **06_timelines_sessions.sql**: Sets timelines coordinates.
- **07_ai_intelligence.sql**: Sets trust profiles and protected buffers.
- **08_review_learning.sql**: Sets checks validation and learning models.
- **09_knowledge_governance.sql**: Sets blueprints and ADR logs tracking.
- **10_indexes.sql**: Configures foreign key B-Tree and trigram text search.
- **11_triggers_functions.sql**: Deploys stored procedures and auto-update timestamp hooks.
- **12_rls_policies.sql**: Deploys Row Level Security (RLS) policies.
- **13_seed_data.sql**: Seeds defaults.

---

## 📋 Document Metadata
- **Purpose**: Map physical database migration structures.
- **Version**: 1.0.0
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)

*I build before burning.*
