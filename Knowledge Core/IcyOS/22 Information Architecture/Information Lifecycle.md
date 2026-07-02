# 🔄 Information Lifecycle & Retention Transitions
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Defines standard entity state transitions, recovery pathways, and failure handling loops.

---

## 🧭 Transition Sequence
- **Allowed States Sequence**: `Created` ➔ `Validated` ➔ `Scheduled` ➔ `Approved` ➔ `Active` ➔ `Completed` ➔ `Archived` ➔ `Deleted`.
- **Forbidden Transitions**:
  - `Created` ➔ `Active` (Bypasses human Approval Gate constraint).
  - `Completed` ➔ `Scheduled` (Requires active task cloning).
- **Recovery Rules**: Soft-deleted projects can be restored to `Archived` state within 30 days.

---

## 📋 Document Metadata
- **Purpose**: Map state transitions constraints.
- **Version**: 1.0.0

*I build before burning.*
