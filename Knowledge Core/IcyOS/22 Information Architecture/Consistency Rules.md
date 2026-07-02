# 🔒 Consistency Rules: Data Integrity
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Provides specifications for database normalization levels and referential constraints.

---

## 📐 Integrity Rules
- **No orphan actions**: An action record must link to an active parent mission.
- **Sprint Boundaries**: Active sprints dates cannot overlap on calendar grids.
- **Reference Checks**: Foreign keys on all metadata schemas must enforce cascade-delete settings where composition bounds apply.

---

## 📋 Document Metadata
- **Purpose**: Record consistency constraints.
- **Version**: 1.0.0

*I build before burning.*
