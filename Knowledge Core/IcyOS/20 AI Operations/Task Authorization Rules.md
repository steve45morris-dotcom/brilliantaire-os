# 🔏 Task Authorization Rules
`Version: 1.1.0` | `Status: Active` | `Scope: AI Operations`

Guides authorization checks and defines which actions are allowed and which are blocked pending human validation.

---

## 🔒 Authorization Matrices
- **Sandboxed File Write**: 🟩 Authorized. AI agents can modify specification markdown nodes.
- **CLI Commands (Run Test, Audits)**: 🟩 Authorized inside local directories.
- **Production Code Deployments**: 🚫 Blocked. Enforces a human confirmation gate.
- **External Web API Writes**: 🚫 Blocked without explicit authorization parameters.

---

## 📋 Document Metadata
- **Purpose**: Record task authorization boundaries.
- **Version**: 1.1.0

*I build before burning.*
