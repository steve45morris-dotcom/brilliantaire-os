# 🛡️ User Data Ownership Policy: Release 0.3
`Status: Active` | `Scope: Privacy & Governance`

This policy defines user data sovereignty, storage rules, and third-party API isolation.

---

## 📋 Data Sovereignty Principles

1. **Local Priority**: All imported calendar events and Obsidian note metadata must be cached locally in local storage/SQLite databases.
2. **Read-Only Vault Access**: Obsidian markdown note connections must operate in read-only mode to prevent write sync corruptions.
3. **Opt-Out Control**: Users can disconnect any external integration instantly, deleting cached third-party records without affecting core focus metrics.

---

## 🚦 Security Auditing
We verify that no local notes content or private calendar details leak into telemetry tracker logs.

*I build before burning.*
