# ADR-0011: Absolute URI Path Mapping
- **Status**: Accepted
- **Date**: 2026-07-02
- **Author**: DevOps Engineer

---

## Context & Problem
Different developer environments (Cursor, Claude Code, terminal CLI) use different relative path contexts when parsing links. Standard relative links frequently break or map incorrectly on click-through actions, resulting in dead file mappings.

## Proposed Solution
Standardize on the `file:///` absolute URI scheme for developer-facing documentation links when absolute local click-through is required. Example: [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md).

## Alternatives Considered
- **Relative Markdown Links**: Work inside Obsidian but fail in local terminal logs and external scripts unless executed from the exact directory.
- **Custom URL Protocol**: Introduces setup friction.

## Consequences
- **Positive**: Direct, single-click absolute linkages work across terminal screens, markdown preview views, and CLI outputs.
- **Negative**: Relies on `/Users/alexanderanthony` as the standard home path. If the codebase moves to a different directory, paths must be updated.

---

## 📋 Document Metadata
- **Purpose**: Document key decision regarding link path standard.
- **Responsibilities**: Enforces link readability.
- **Dependencies**: None.
- **Relationships**: Informs START_HERE.md and Engineering Standards.
- **Version**: 1.0.0
- **Revision History**:
  - `2026-07-02`: Initialized ADR.
- **Future Review Date**: 2027-07-02
- **Cross References**:
  - [START_HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/START_HERE.md)
  - [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)

*I build before burning.*
