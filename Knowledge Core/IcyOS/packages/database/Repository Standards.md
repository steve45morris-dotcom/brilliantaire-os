# 🛠️ Repository Standards
`Version: 1.0.0` | `Status: Active`

This document defines the interface standards for data access repositories in **IcyOS**.

---

## 📋 Standards Checklist
- **No leak of raw DB models**: Mappers must convert database models to domain entities before returning them to client logic.
- **Unified connection boundaries**: The database layer is the only layer allowed to reference database drivers.

*I build before burning.*
