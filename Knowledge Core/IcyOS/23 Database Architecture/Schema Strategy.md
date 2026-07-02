# 🗄️ Schema Strategy
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Details the schema partitioning models inside PostgreSQL.

- **Public Schema**: Contains all user productivity tables (sprints, projects, timelines).
- **Private Schema**: Internal job execution queues and config variables.
- **Extensions Schema**: Localizes PostgreSQL add-ons (`uuid-ossp`, `pg_trgm`).

---

## 📋 Document Metadata
- **Purpose**: Record schema layout strategies.
- **Version**: 1.0.0

*I build before burning.*
