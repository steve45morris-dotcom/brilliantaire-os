# 🐛 Known Problems: Active Bugs & Blockers
`Version: 1.0.0` | `Status: Active` | `Scope: Global`

This document details the active bugs, resource constraints, integration issues, and blocker tickets for **IcyOS**.

---

## 🚫 Active Problems Tracker

- **Issue ID**: PRB-001
- **Component**: Context Window
- **Description**: Large repository search queries (ripgrep) time out due to workspace directory size.
- **Workaround**: Limit search directories specifically using targeted directories rather than query-wide folders.

- **Issue ID**: PRB-002
- **Component**: Calendar Sync
- **Description**: Access token expirations cause silent integration failure on calendar sync.
- **Workaround**: Force manual re-auth via command script.

---

## 📋 Document Metadata
- **Purpose**: Log and track system bugs and context constraints.
- **Responsibilities**: Enforces visibility of system blocks.
- **Dependencies**: None.
- **Relationships**: Informs sprint priorities and future ideas.
- **Version**: 1.0.0
- **Revision History**:
  - `2026-07-02`: Created initial Known Problems tracker.
- **Future Expansion**: Add automatic bug collection triggers from compiler outputs.
- **Cross References**:
  - [START_HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/START_HERE.md)
  - [Current State](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/11%20Memory/Current%20State.md)

*I build before burning.*

---

## ICOS Foundation Known Problems

| Problem | Status | Reference |
|---|---|---|
| IcyOS is currently untracked inside the parent home-directory Git repo. | Open | [[Repository Health]] |
| Legacy docs still contain local absolute links. | Open | [[Open Decisions]] |
| No automated markdown link checker exists yet. | Open | [[AI Status]] |

## Cross References

- [[Risk Register]]
- [[Git Workflow]]
