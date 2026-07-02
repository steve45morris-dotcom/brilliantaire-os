# 🔐 Access Model & User Roles
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Role-based access controls (RBAC) and permissions parameters for human and AI actors.

---

## 🗂️ Access Levels Grid

| Actor | Read | Write | Update | Delete | Approve | Recommend |
|---|---|---|---|---|---|---|
| **User (Strategist)** | 🟩 Yes | 🟩 Yes | 🟩 Yes | 🟩 Yes | 🟩 Yes | 🟩 Yes |
| **AI Planner** | 🟩 Yes | 🟨 Staged | 🟨 Staged | 🚫 No | 🚫 No | 🟩 Yes |
| **AI Scheduler** | 🟩 Yes | 🟨 Staged | 🟨 Staged | 🚫 No | 🚫 No | 🟩 Yes |
| **AI Reviewer** | 🟩 Yes | 🟩 Logs | 🟩 Logs | 🚫 No | 🚫 No | 🟩 Yes |
| **AI Learner** | 🟩 Yes | 🟨 Staged | 🟨 Staged | 🚫 No | 🚫 No | 🟩 Yes |

---

## 📋 Document Metadata
- **Purpose**: Map system access policies.
- **Version**: 1.0.0

*I build before burning.*
