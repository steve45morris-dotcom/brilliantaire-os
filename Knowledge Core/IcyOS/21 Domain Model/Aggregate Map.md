# 🧱 Aggregate Map: Domain Boundaries
`Version: 1.0.0` | `Status: Active` | `Scope: Domain Model`

Defines aggregate boundaries, roots, and entities.

---

## 🧭 Domain Aggregates

### 1. Planning Aggregate
- **Root**: `Project`
- **Entities**: `Sprint`, `Mission`, `Action`.
- **Value Objects**: `Priority`, `Time Estimate`.

### 2. Schedule Aggregate
- **Root**: `Timeline`
- **Entities**: `Protected Buffer`.
- **Value Objects**: `Focus Score`.

### 3. Execution Aggregate
- **Root**: `Session`
- **Entities**: `AI Context Package`, `Notification`.
- **Value Objects**: `Session Status`.

---

## 📋 Document Metadata
- **Purpose**: Record aggregate boundaries.
- **Version**: 1.0.0

*I build before burning.*
