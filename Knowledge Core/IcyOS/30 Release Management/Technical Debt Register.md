# 🛠️ Technical Debt Register: Release 0.1
`Status: Active` | `Scope: Code Quality`

This document tracks items of technical debt, code duplication, and proposed mitigation plans.

---

## 📅 Active Debt Log

### 1. Mock Database Integration
- **Area**: `@icyos/database` Repositories
- **Description**: Repositories currently mock data responses instead of querying live Supabase databases.
- **Impact**: Medium (Limits production multi-user capabilities, but enables robust test isolation).
- **Mitigation**: Connect real Supabase adapter bindings during Phase 3 (Release 0.2).

### 2. Timezone Mismatches in Client Rendering
- **Area**: `apps/web/src/components/`
- **Description**: Converting ISO strings to local browser formatting causes minor inconsistencies in Vitest runners depending on host settings.
- **Impact**: Low (Vitest tests now use explicit `'UTC'` timeZone parameter, but timezone offsets should be managed globally).
- **Mitigation**: Centralize formatters into `@icyos/shared` date utility wrapper functions.

### 3. AI Runtime Key Expiry Graceful Fallbacks
- **Area**: `@icyos/ai` Runtime
- **Description**: If environment variables expire or fail validation, the system drops back to `MockProvider` silently rather than prompting in the UI.
- **Impact**: Medium (Good for offline demo stability, bad for debug visibility).
- **Mitigation**: Expose provider status telemetry checks on Settings page.

---

## 🚦 Phase 2 Quality Target
- **Tech Debt Ratio**: < 5% of total monorepo codebase.
- **Code Duplication**: < 2% (all shared types and utilities are successfully consolidated into `@icyos/shared`).

*I build before burning.*
