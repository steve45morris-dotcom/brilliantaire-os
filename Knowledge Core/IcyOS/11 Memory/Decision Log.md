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

| DEC-SP5-20260702-01 | 2026-07-02 | Built 12 Next.js App Router route handlers exposing application services endpoints. | [[apps/web/src/app/api]] | Accepted |
| DEC-SP5-20260702-02 | 2026-07-02 | Created api error handling and validation wrappers inside apps/web/src/lib/api. | [[apps/web/src/lib/api/response.ts]] | Accepted |

---

| DEC-SP55-20260702-01 | 2026-07-02 | Integrated Tailwind CSS, PostCSS, Autoprefixer, and Lucide Icons inside web app. | [[apps/web/package.json]] | Accepted |
| DEC-SP55-20260702-02 | 2026-07-02 | Designed dark-first theme token rules and wrote 6 base UI component primitives. | [[apps/web/src/components/ui/button.tsx]] | Accepted |

---

| DEC-SP6-20260702-01 | 2026-07-02 | Scaffolded Next.js AppShell layout containing Sidebar and responsive navigations. | [[apps/web/src/components/layout/app-shell.tsx]] | Accepted |
| DEC-SP6-20260702-02 | 2026-07-02 | Created placeholder route pages mapping the 7 workspace section views. | [[apps/web/src/app/(dashboard)/dashboard/page.tsx]] | Accepted |

---

| DEC-SP7-20260702-01 | 2026-07-02 | Developed custom hooks and unified fetch utilities to communicate with Next.js App Router endpoints. | [[apps/web/src/hooks/use-inbox-capture.ts]] | Accepted |
| DEC-SP7-20260702-02 | 2026-07-02 | Deployed interactive inbox text capturing fields displaying validation and success result boundaries. | [[apps/web/src/components/inbox/inbox-capture-box.tsx]] | Accepted |

---

| DEC-SP8-20260702-01 | 2026-07-02 | Wrote custom plan generation hook Sorting block objects chronologically. | [[apps/web/src/hooks/use-generate-daily-plan.ts]] | Accepted |
| DEC-SP8-20260702-02 | 2026-07-02 | Designed interactive timeline generators displaying proposed block durations. | [[apps/web/src/components/timeline/timeline-block.tsx]] | Accepted |

---

| DEC-SP9-20260702-01 | 2026-07-02 | Deployed ApprovalPanel controls mapping states transitions: draft, generated, approved, locked. | [[apps/web/src/components/timeline/approval-panel.tsx]] | Accepted |
| DEC-SP9-20260702-02 | 2026-07-02 | Created hook useTimelineApproval wrapping api calls and preventing duplicates. | [[apps/web/src/hooks/use-timeline-approval.ts]] | Accepted |

---

| DEC-SP10-20260702-01 | 2026-07-02 | Developed custom hooks and countdown interfaces managing focus session running and overruns. | [[apps/web/src/hooks/use-focus-session.ts]] | Accepted |
| DEC-SP10-20260702-02 | 2026-07-02 | Created Protected Buffer countdown cards auto-consuming remaining durations during overruns. | [[apps/web/src/components/focus/protected-buffer-card.tsx]] | Accepted |

---

| DEC-SP11-20260702-01 | 2026-07-02 | Scaffolded Reflection page layouts supporting rating selection scales and microphone request checks. | [[apps/web/src/components/review/voice-reflection.tsx]] | Accepted |
| DEC-SP11-20260702-02 | 2026-07-02 | Wrote extracted learning signal widgets rendering structured wins, blocker lists and lessons. | [[apps/web/src/components/review/learning-signal-card.tsx]] | Accepted |

---

| DEC-SP12-20260702-01 | 2026-07-02 | Configured the local package @icyos/learning calculate metrics values, overrun ratios and user profiles. | [[packages/learning/src/profile/index.ts]] | Accepted |
| DEC-SP12-20260702-02 | 2026-07-02 | Created recommendations engines recommending target sprint reductions based on completions scores. | [[packages/learning/src/recommendations/index.ts]] | Accepted |

---

| DEC-SP13-20260703-01 | 2026-07-03 | Upgraded PlanningService to consume historical profiles data from @icyos/learning. | [[packages/services/src/planning/index.ts]] | Accepted |
| DEC-SP13-20260703-02 | 2026-07-03 | Created AdaptiveInsightCard rendering suggestions reasons and confidence ratings metrics. | [[apps/web/src/components/timeline/adaptive-insight-card.tsx]] | Accepted |

---

## 2026-07-03 Architecture Review Milestone

| DEC-AR-20260703-01 | 2026-07-03 | Refactored services constructors to allow parameterless default initialization of repositories. | [[packages/services/src/]] | Accepted |
| DEC-AR-20260703-02 | 2026-07-03 | Decoupled web apps API route handlers from importing @icyos/database repositories directly. | [[apps/web/src/app/api/]] | Accepted |

---

## 2026-07-03 Sprint 15 Execution

| ID | Date | Decision | Reference | Status |
|---|---|---|---|---|
| DEC-SP15-20260703-01 | 2026-07-03 | Implemented provider-agnostic @icyos/ai workspace package enclosing unified runtime interface. | [[packages/ai/src/runtime/]] | Accepted |
| DEC-SP15-20260703-02 | 2026-07-03 | Scaffolded OpenAI, Anthropic, Gemini, Ollama, and simulated Mock providers adapters. | [[packages/ai/src/providers/]] | Accepted |
| DEC-SP15-20260703-03 | 2026-07-03 | Implemented failover fallback policies and timeout racing limit controls. | [[packages/ai/src/runtime/index.ts]] | Accepted |
























