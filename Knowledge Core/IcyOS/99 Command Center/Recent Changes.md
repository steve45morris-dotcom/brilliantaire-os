# Recent Changes
`Version: 1.29.0` | `Status: Locked`

Track of recent updates to documentation, layout re-organizations, and specification versions.

---

## 📅 Recent Log

- **2026-07-03**: Executed Sprint 15: AI Runtime & Provider Integration. Scaffolded local `@icyos/ai` monorepo package exposing provider-agnostic AI Runtime interfaces, registry capabilities selectors, retry policies, and simulated mocks provider.
- **2026-07-03**: Executed Architecture Review Milestone. Decoupled `@icyos/database` packages repository dependencies from all Next.js API routes handlers, modified services constructors to support parameterless default instantiations, and audited monorepo package boundaries.
- **2026-07-03**: Executed Sprint 14: Decision Engine & AI Orchestrator. Created local `@icyos/decision` package evaluating deterministic rules, routing queries locally, or escalating to LLMs with provider-agnostic request definitions and Vitest checks.
- **2026-07-03**: Executed Sprint 13: Adaptive Planner v1. Upgraded PlanningService to consume historical profile recommendations, integrated explainable metadata displays cards on Daily Timeline routing pages, and verified Vitest checks.
- **2026-07-02**: Executed Sprint 12: Learning Engine v1. Created local `@icyos/learning` workspace package containing profile analyzers, metrics calculations, recommendations templates and Vitest checks.
- **2026-07-02**: Executed Sprint 11: Reflection Engine. Scaffolded rating selectors, voice micro-perm fallback alerts, text forms, AI summaries and learning signals dashboards under `apps/web/src/app/(dashboard)/review/`.
- **2026-07-02**: Executed Sprint 10: Focus Execution Engine. Scaffolded `focus-session-card.tsx`, `session-timer.tsx`, custom `use-focus-session.ts` hook, event logging arrays, and countdown timers under `apps/web/src/app/(dashboard)/focus/`.
- **2026-07-02**: Executed Sprint 9: Timeline Approval. Developed `approval-panel.tsx`, sub-buttons components, custom `use-timeline-approval.ts` hooks, and linked integration page triggers under `apps/web/src/app/(dashboard)/timeline/`.
- **2026-07-02**: Executed Sprint 8: Daily Plan Generation. Created `generate-plan-button.tsx`, `timeline-block.tsx`, `timeline-view.tsx` list controls, `use-generate-daily-plan.ts` hook, and timezone format helpers under `apps/web/src/app/(dashboard)/timeline/`.
- **2026-07-02**: Executed Sprint 7: Inbox Capture. Built `inbox-capture-box.tsx`, `inbox-result-card.tsx`, `use-inbox-capture.ts` hooks, and linked route triggers under `apps/web/src/app/(dashboard)/inbox/`.
- **2026-07-02**: Executed Sprint 6: Shell Architecture. Created AppShell navigation coordinates, Top/Bottom layouts, desktop Sidebar, and 7 view placeholders inside `apps/web`.
- **2026-07-02**: Executed Sprint 5.5: Frontend Foundation. Integrated Tailwind CSS, dark-first global theme system, and core UI primitives inside `apps/web`.
- **2026-07-02**: Executed Sprint 5: API Route Boundaries. Created 12 typed Next.js route handlers exposing application services coordinates under `apps/web/src/app/api/`.
- **2026-07-02**: Executed Sprint 4: Service Layer. Created `@icyos/services` package coordinating repository handlers and use cases.
- **2026-07-02**: Executed Sprint 3: Repository Layer. Created `@icyos/database` package containing repositories mappers and typescript interfaces.
- **2026-07-02**: Executed Sprint 2: Supabase local setup. Validated the 13 staged database SQL migrations under `supabase/migrations/` on local PostgreSQL.
- **2026-07-02**: Executed Story 1.2: Zod Validation. Implemented Zod validation schemas and unit tests.
- **2026-07-02**: Executed Sprint 1: Shared Types & Validation. Implemented static TS type definitions under `@icyos/shared`.
- **2026-07-02**: Executed Sprint 0: Repo and Project Scaffold. Mapped monorepo configurations (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`) and Next.js workspace setup.
- **2026-07-02**: Executed Foundation Layer 9: Implementation Gate. Setup monorepo and CI/CD quality gate rules under `29 Implementation Gate/`.
- **2026-07-02**: Executed Foundation Layer 8: MVP Implementation Plan. Created sprint breakdown schedules under `28 MVP Implementation Plan/`.
- **2026-07-02**: Executed Foundation Layer 7: Application Architecture & Component System. Deployed screen layouts and props contracts under `26 Application Architecture/` and `27 Component System/`.
- **2026-07-02**: Executed Foundation Layer 6: Type System and Shared Contracts. Scaffolded `@icyos/shared` package folders under `packages/shared/` and specs.
- **2026-07-02**: Executed Foundation Layer 5: API Contracts. Mapped REST and RPC endpoints under `24 API Contracts/`.
- **2026-07-02**: Executed Foundation Layer 4C: Physical Database Design. Staged SQL migration files under `supabase/migrations/` and docs.
- **2026-07-02**: Executed Foundation Layer 4B: Database Architecture specs. Deployed columns standards, security RLS, stored procedures, setup guidelines under `23 Database Architecture/`.
- **2026-07-02**: Executed Foundation Layer 4A: Information Architecture specs. Deployed schemas, matrices, and sync strategies under `22 Information Architecture/`.
- **2026-07-02**: Executed Foundation Layer 3: Domain Model specs. Deployed canonical DDD map specs under `21 Domain Model/`.
- **2026-07-02**: Executed the Foundation Freeze v1.0, locking the 10 Protected Assets under the ICOS framework. Designed and deployed the Foundation Charter and freeze ADR.
- **2026-07-02**: Upgraded to Foundation v1.1. Designed and deployed the AI Governance, Context Builder, Task Dispatcher, Repository Guardian, and Executive Console files.
- **2026-07-02**: Completed structural migration of Knowledge Core to upgraded ICOS format (Phases 1-3). Deployed upgraded Command Center dashboards.

---

## 📋 Document Metadata
- **Purpose**: Record recent changes across documentation.
- **Version**: 1.29.0

*I build before burning.*
