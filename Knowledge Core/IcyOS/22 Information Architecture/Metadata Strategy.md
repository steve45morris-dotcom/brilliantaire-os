# 🗃️ Metadata Strategy: System Attributes
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Unified audit attributes and metadata keys implemented across all database entities.

---

## 📐 Metadata Columns Map
Every database table and document schema must include:
- `created_at`: Timestamp (auto-initialized).
- `updated_at`: Timestamp.
- `created_by`: User or AI Agent ID.
- `updated_by`: User or AI Agent ID.
- `version`: Integer (starts at 1).
- `status`: String state.
- `confidence_score`: Decimal (0.00 to 1.00; populated by AI).
- `trust_level`: Decimal (0.00 to 1.00).
- `ai_generated`: Boolean.
- `human_approved`: Boolean.
- `last_reviewed_at`: Timestamp.
- `source`: String source type.
- `context_package_id`: UUID (relates to the Context Package used).

---

## 📋 Document Metadata
- **Purpose**: Record metadata attributes.
- **Version**: 1.0.0

*I build before burning.*
