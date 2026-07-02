# 🤝 Git Workflow: Branching & Commits
`Version: 1.1.0` | `Status: Active` | `Scope: Engineering`

This document details the branch conventions, commit formatting, pull request steps, and merge guidelines for developing **IcyOS**.

---

## 🌿 Branch Naming
- **Features**: `feat/[sprint-number]-[short-description]`
- **Bug Fixes**: `fix/[issue-number]-[short-description]`
- **Refactors**: `refactor/[sprint-number]-[short-description]`
- **Documentation**: `docs/[sprint-number]-[short-description]`

---

## 💬 Commit Formatting
Commits must follow the **Conventional Commits** standard:

`type(scope): description` (e.g. `feat(api): add idempotency header check`)

### Permitted Types:
- `feat`: New features.
- `fix`: Bug repairs.
- `docs`: Markdown updates.
- `refactor`: Structural modifications with zero external impact.
- `test`: Adding or upgrading test files.

---

## 📋 Document Metadata
- **Purpose**: Map contribution steps and merge workflows.
- **Responsibilities**: Enforces branching, commits, and PR safety.
- **Dependencies**: [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)
- **Relationships**: Child of Engineering Standards.
- **Version**: 1.1.0
- **Revision History**:
  - `2026-07-02`: Created initial Contribution Guide.
  - `2026-07-02`: Renamed to Git Workflow for ICOS.
- **Future Expansion**: Add automated commit linter rules.
- **Cross References**:
  - [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)
  - [Repository Guide](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Repository%20Guide.md)

*I build before burning.*
