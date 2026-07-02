# 🗃️ Archive Strategy
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Database archiving processes and tables partitions.

- **Columns**: Mapped via `archived_at: timestamptz DEFAULT NULL`.
- **Query Filter**: Client queries default to filtering active records (`WHERE archived_at IS NULL`) to hide archived rows.

---

## 📋 Document Metadata
- **Purpose**: Record archive strategies.
- **Version**: 1.0.0

*I build before burning.*
