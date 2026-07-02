# ⛓️ Foreign Key Strategy: Cascade & Constraints
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Referential constraints strategies and cascade parameters.

- **Naming Conventions**: `[parent_table_singular]_id` (e.g. `workspace_id`).
- **Composition Deletes**: Parent-child compositions (e.g. `sprints` ➔ `missions`) must enforce `ON DELETE CASCADE`.
- **References**: Non-cascade associations must set `ON DELETE SET NULL` to preserve historical telemetry logs.

---

## 📋 Document Metadata
- **Purpose**: Record referential foreign keys strategies.
- **Version**: 1.0.0

*I build before burning.*
