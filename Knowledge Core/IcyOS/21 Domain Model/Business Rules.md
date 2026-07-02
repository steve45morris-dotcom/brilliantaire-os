# 📋 Business Rules Matrix
`Version: 1.0.0` | `Status: Active` | `Scope: Domain Model`

Logical specifications defining the criteria for actions and scheduling checks.

---

## 🗂️ Rules Catalog
- **BR-101 (Protected Buffer Override)**: If a scheduled task overlaps a Protected Buffer block, the task must be automatically pushed to the next available focus window or delegated via the Trade-Off Engine.
- **BR-102 (Trust Decay)**: Every failed unit test or compiler crash during staging decreases the Trust Profile score by `0.05`. Successful validations increase it by `0.02`.

---

## 📋 Document Metadata
- **Purpose**: Record domain business rules.
- **Version**: 1.0.0

*I build before burning.*
