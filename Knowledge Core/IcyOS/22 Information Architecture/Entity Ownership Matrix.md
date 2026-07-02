# 👥 Entity Ownership Matrix
`Version: 1.0.0` | `Status: Active` | `Scope: Information Architecture`

Ownership rules and authorization criteria for IcyOS data entities.

---

## 🗂️ Ownership Grid

| Entity | Primary Owner | Creator | Modifier | Archiver | AI Modifiable? |
|---|---|---|---|---|---|
| **User** | User | System | User | User | 🚫 No (Read only) |
| **Workspace** | User | User | User | User | 🚫 No |
| **Project** | User | User | User | User | 🟨 Recommend Only |
| **Mission** | User | User / AI | User / AI | User / AI | 🟩 Yes (Sandboxed) |
| **Action** | User | AI | AI | AI | 🟩 Yes |
| **Session** | User | System | AI / User | AI / User | 🟩 Yes |
| **Timeline** | User | AI Scheduler | User | User | 🟨 Recommend Only |
| **Blueprint** | User | AI Designer | User | User | 🟩 Yes |
| **Review** | User | Review Engine | System | System | 🚫 No (Compile only) |
| **Insight** | User | Learning Engine| System | System | 🚫 No |
| **Recommendation**| User | AI Recommender| System | System | 🚫 No |
| **Learning Record**| User | Learning Engine| User | User | 🟨 Recommend Only |
| **Trust Profile** | User | Trust Engine | System | System | 🚫 No |
| **Protected Buffer**| User | User | User | User | 🚫 No |
| **AI Decision** | User | AI Engine | System | System | 🚫 No |
| **AI Context Pack**| User | Context Builder| AI | AI | 🟩 Yes |
| **ADR** | User | OS Architect | User | User | 🚫 No |
| **Knowledge Asset**| User | User / AI | User | User | 🟨 Recommend Only |
| **Memory Entry** | User | AI / User | User | User | 🟨 Recommend Only |

---

## 📋 Document Metadata
- **Purpose**: Record CRUD rights.
- **Version**: 1.0.0

*I build before burning.*
