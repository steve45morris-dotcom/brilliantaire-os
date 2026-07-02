# 🔒 Relationship Constraints
`Version: 1.0.0` | `Status: Active` | `Scope: Database Architecture`

Checks, validations, and constraints enforcing business rules inside the database.

- **Check Constraints**:
  - `trust_score` must remain between `0.0` and `1.0` inclusive (`CHECK (trust_score >= 0.0 AND trust_score <= 1.0)`).
  - `start_hour` and `end_hour` must remain between `0` and `23` (`CHECK (start_hour >= 0 AND start_hour <= 23)`).

---

## 📋 Document Metadata
- **Purpose**: Record check constraints strategies.
- **Version**: 1.0.0

*I build before burning.*
