# ⛓️ Relationship Matrix & Association Types
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Mapping of entity associations, dependencies, inheritance, and compositions.

---

## 🗂️ Association Rules
- **Workspace ➔ Project**: Composition (1-to-Many). A Project cannot exist outside a Workspace container.
- **Project ➔ Sprint**: Aggregation (1-to-Many).
- **Sprint ➔ Mission**: Composition (1-to-Many).
- **Mission ➔ Action**: Composition (1-to-Many).
- **Mission ➔ Timeline**: Dependency (1-to-1). Schedule events link directly to mission parameters.
- **User ➔ Trust Profile**: Composition (1-to-1). Single user identity profiles.

---

## 📋 Document Metadata
- **Purpose**: Map entity relationships types.
- **Version**: 1.0.0

*I build before burning.*
