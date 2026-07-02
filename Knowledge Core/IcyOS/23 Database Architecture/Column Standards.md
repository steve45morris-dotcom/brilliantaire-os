# 🔤 Column Standards: Data Types & Schemas
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Standard configurations for columns names, types, and values constraints.

---

## 📐 Standards Rules
- **Naming Conventions**: `snake_case` singular (e.g. `root_path`).
- **Keys**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`.
- **Timestamps**: `timestamptz` (requires timezone offsets).
- **JSON Fields**: `jsonb` only for flexible staging parameters.
- **Auditing Columns**: `created_at`, `updated_at`, `created_by`, `updated_by` on every table.

---

## 📋 Document Metadata
- **Purpose**: Record column conventions.
- **Version**: 1.0.0

*I build before burning.*
