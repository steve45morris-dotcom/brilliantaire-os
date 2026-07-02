# 📅 Soft Delete Strategy
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Soft delete models schema design.

- **Columns**: Mapped via `deleted_at: timestamptz DEFAULT NULL`.
- **Query Filter**: Client queries default to filtering active records (`WHERE deleted_at IS NULL`) to hide soft-deleted rows.

---

## 📋 Document Metadata
- **Purpose**: Record soft delete schemas.
- **Version**: 1.0.0

*I build before burning.*
