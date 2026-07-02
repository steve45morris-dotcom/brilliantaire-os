---
title: Decision Log
version: 1.0.0
status: active
tags:
  - memory
  - decisions
---

# Decision Log

## ICOS Foundation Decisions

| ID | Date | Decision | ADR | Status |
|---|---|---|---|---|
| DEC-0001 | 2026-07-02 | Adopt Obsidian-first Knowledge Core as primary operating memory. | [[ADR-0001 Obsidian First Knowledge Core]] | Accepted |
| DEC-0002 | 2026-07-02 | Build web app/PWA first and native iOS later. | [[ADR-0002 Web PWA First Native Later]] | Accepted |
| DEC-0003 | 2026-07-02 | Use documentation-first architecture before production implementation. | [[ADR-0003 Documentation First Architecture]] | Accepted |

## Cross References

- [[Architecture Decision Records]]
- [[Open Decisions]]
- [[Current State]]

---

## 2026-07-02 ADR Repository Consolidation

| ID | Date | Decision | ADR | Status |
|---|---|---|---|---|
| DEC-ADR-20260702-01 | 2026-07-02 | Consolidated duplicate ADR-0001, ADR-0002, and ADR-0003 variants into one canonical file per ADR number. | [[ADR Repository Verification Report]] | Accepted |
| DEC-ADR-20260702-02 | 2026-07-02 | Standardized ADR names for ADR-0001 through ADR-0007 and renumbered legacy ADR-001 through ADR-004 to ADR-0009 through ADR-0011. | [[ADR Repository Health Report]] | Accepted |
| DEC-ADR-20260702-03 | 2026-07-02 | Preserved `ADR-0008 Foundation Freeze` and recommended `AI Plans. Human Approves.` as the next available ADR unless Commander approves renumbering. | [[Open Decisions]] | Open |

---

## 2026-07-02 Database Architecture & Physical Design

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-DB-20260702-01 | 2026-07-02 | Structured database migration scripts sequentially (01_extensions.sql to 13_seed_data.sql) under supabase/migrations/ directory. | [[PHYSICAL_DATABASE_DESIGN_v1.0]] | Accepted |
| DEC-DB-20260702-02 | 2026-07-02 | Separated documentation mapping strategy into specific files (RLS_POLICY_MAP, INDEX_STRATEGY, TRIGGER_FUNCTION_MAP) to maintain modular design specs. | [[MIGRATION_ORDER]] | Accepted |

---

## 2026-07-02 API Contracts Design

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-API-20260702-01 | 2026-07-02 | Standardized on a JSON envelope wrapper for all HTTP responses containing success, data, error, and request metadata. | [[API_CONTRACTS_v1.0]] | Accepted |
| DEC-API-20260702-02 | 2026-07-02 | Defined custom RPC functions interfaces instead of standard REST endpoints for operations requiring trust profiling or timeline evaluations. | [[Supabase RPC Contracts]] | Accepted |

---

## 2026-07-02 Type System & Shared Contracts Design

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-TS-20260702-01 | 2026-07-02 | Adopted a shared npm package structure (@icyos/shared) to expose TypeScript interfaces to both client app and agent runtimes. | [[TYPE_SYSTEM_v1.0]] | Accepted |
| DEC-TS-20260702-02 | 2026-07-02 | Separated runtime validation schemas (Zod) from static interfaces definitions to avoid circular dependencies. | [[Shared Package Architecture]] | Accepted |

---

## 2026-07-02 Application Architecture & Component System Design

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-APP-20260702-01 | 2026-07-02 | Adopted Next.js App Router and Zustand as the standard frontend architecture base. | [[APPLICATION_ARCHITECTURE_v1.0]] | Accepted |
| DEC-APP-20260702-02 | 2026-07-02 | Structured components into four rigid taxonomy categories (primitives, layouts, data-displays, flow modules). | [[COMPONENT_SYSTEM_v1.0]] | Accepted |

---

## 2026-07-02 MVP Implementation Planning

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-PLAN-20260702-01 | 2026-07-02 | Defined a 13-sprint delivery roadmap (Sprint 0 through 12) prioritizing type contracts and schema migrations before client layouts. | [[MVP_IMPLEMENTATION_PLAN_v1.0]] | Accepted |
| DEC-PLAN-20260702-02 | 2026-07-02 | Locked MVP scope to the core focus loop, explicitly postponing third-party calendar accounts and payment models. | [[MVP Scope Lock]] | Accepted |

---

## 2026-07-02 Implementation Gate Setup

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-GATE-20260702-01 | 2026-07-02 | Structured repository workspaces configuration plans utilizing pnpm workspaces and Turborepo. | [[IMPLEMENTATION_GATE_v1.0]] | Accepted |
| DEC-GATE-20260702-02 | 2026-07-02 | Enforced pre-commit hooks (typecheck, lint, formatting check) as hard validation gates. | [[Code Quality Gates]] | Accepted |

---

## 2026-07-02 Sprint 0 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP0-20260702-01 | 2026-07-02 | Initialized root package.json, pnpm workspace file, and Turborepo json. | [[Sprint 0 Scaffold]] | Accepted |
| DEC-SP0-20260702-02 | 2026-07-02 | Scaffolded apps/web Next.js skeleton framework with page/layout TSX views. | [[apps/web/tsconfig.json]] | Accepted |

---

## 2026-07-02 Sprint 1 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP1-20260702-01 | 2026-07-02 | Implemented static TypeScript interfaces for all 24 entities in packages/shared/src/entities. | [[packages/shared/src/entities/index.ts]] | Accepted |
| DEC-SP1-20260702-02 | 2026-07-02 | Created shared rpc, api, realtime event types inside shared workspaces library. | [[packages/shared/src/index.ts]] | Accepted |

---

## 2026-07-02 Story 1.2 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-ST2-20260702-01 | 2026-07-02 | Integrated Zod package inside shared monorepo package. | [[packages/shared/package.json]] | Accepted |
| DEC-ST2-20260702-02 | 2026-07-02 | Declared validation schemas for primitives, payloads, envelopes, and RPC bounds under packages/shared/src/validation. | [[packages/shared/src/validation/index.ts]] | Accepted |

---

## 2026-07-02 Sprint 2 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP2-20260702-01 | 2026-07-02 | Set up and validated 13 SQL schema rollout migrations locally on PostgreSQL server. | [[Database Local Setup]] | Accepted |
| DEC-SP2-20260702-02 | 2026-07-02 | Introduced a local PostgreSQL mock auth schema to validate Supabase RLS security policies configurations locally. | [[01_extensions.sql]] | Accepted |

---

## 2026-07-02 Sprint 3 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP3-20260702-01 | 2026-07-02 | Scaffolded @icyos/database package mapping mappers and repositories logic. | [[packages/database/package.json]] | Accepted |
| DEC-SP3-20260702-02 | 2026-07-02 | Enforced static mapping algorithms isolating application logic from raw database query records. | [[packages/database/src/mappers/index.ts]] | Accepted |

---

## 2026-07-02 Sprint 4 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP4-20260702-01 | 2026-07-02 | Scaffolded @icyos/services package mapping service coordinators and use cases. | [[packages/services/package.json]] | Accepted |
| DEC-SP4-20260702-02 | 2026-07-02 | Implemented 7 core services coordinating data validation, mapping rules, and repository persistence. | [[packages/services/src/planning/index.ts]] | Accepted |

---

## 2026-07-02 Sprint 5 execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP5-20260702-01 | 2026-07-02 | Built 12 Next.js App Router route handlers exposing application services endpoints. | [[apps/web/src/app/api]] | Accepted |
| DEC-SP5-20260702-02 | 2026-07-02 | Created api error handling and validation wrappers inside apps/web/src/lib/api. | [[apps/web/src/lib/api/response.ts]] | Accepted |













