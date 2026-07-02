# 🔒 Domain Invariants: Immutable Constraints
`Version: 1.0.0` | `Status: Active` | `Scope: Domain Model`

Logical specifications defining system parameters that must remain true under all transaction bounds.

---

## 🗃️ Invariants Catalog
- **Rest Integrity**: A Protected Buffer event slot can *never* be overwritten by task allocations.
- **Trust Bounds**: A Trust Profile score must *always* fall between `0.0` and `1.0` inclusive.
- **Approval Gate**: No code file writes inside the execution path (`Repository/`) shall run if `is_approved` status is false.
- **State Singularity**: A workspace can *only* contain a single `Active` sprint board.

---

## 📋 Document Metadata
- **Purpose**: Record domain invariants.
- **Version**: 1.0.0

*I build before burning.*
