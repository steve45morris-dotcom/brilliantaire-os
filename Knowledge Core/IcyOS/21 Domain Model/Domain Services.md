# ⚙️ Domain Services Specification
`Version: 1.0.0` | `Status: Active` | `Scope: Domain Model`

Logical specifications for domain-level services handling actions across multiple aggregates.

---

## 🗂️ Core Domain Services
- **`ScheduleOptimizer`**: Automatically moves tasks along calendar grids, resolving overlaps while respecting protected buffers and focus settings.
- **`PlanDecomposer`**: Translates high-level intention texts into checklists of structured checkpoints.
- **`ContextBundler`**: Filters files matching target task type definitions and builds unified context package JSONs.

---

## 📋 Document Metadata
- **Purpose**: Record domain services definitions.
- **Version**: 1.0.0

*I build before burning.*
