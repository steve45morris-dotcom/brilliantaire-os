# 💡 Lessons Learned: Wisdom & Failures Database
`Version: 1.1.0` | `Status: Active` | `Scope: Global`

This document serves as the permanent memory for past developer mistakes, AI coding failures, tool usage bottlenecks, and structural guidelines.

---

## 🚫 Critical Lessons & Pitfalls

### Pitfall 1: Absolute Path Dependency
- **Context**: Specifying relative file links that break when the vault or workspace path shifts.
- **Resolution**: Use absolute `file:///Users/alexanderanthony/Knowledge%20Core/...` paths for developer-facing documents, and portable relative paths for vault-internal wikilinks.

### Pitfall 2: Context Window Saturation
- **Context**: Feeding full conversation records or very large search logs back into agent prompts.
- **Resolution**: Keep active tasks atomic. Compact context logs regularly.

### Pitfall 3: Phantom File Writes
- **Context**: Attempting to edit files without verifying target ranges first.
- **Resolution**: Always use strict search checks and match exact target line numbers before making edits.

---

## 📋 Document Metadata
- **Purpose**: Record developer lessons and prevent recurring architectural errors.
- **Responsibilities**: Enforces code design and debugging principles.
- **Dependencies**: None.
- **Relationships**: Informs active agent guidelines and lint specs.
- **Version**: 1.1.0
- **Revision History**:
  - `2026-07-02`: Created initial Lessons Learned log.
  - `2026-07-02`: Upgraded to v1.1.0.
- **Future Expansion**: Add automated linting checks that scan files against known code smell logs.
- **Cross References**:
  - [START HERE](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/START%20HERE.md)
  - [Engineering Standards](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/02%20Engineering/Engineering%20Standards.md)

*I build before burning.*

---

## ICOS Foundation Lessons
- A durable AI operating system needs both a human Command Center and an AI onboarding protocol.
- Absolute local links are useful on one machine but reduce Obsidian portability; new ICOS docs prefer wikilinks.
- Existing Knowledge Core work should be preserved as intellectual property and connected through indexes instead of replaced.
- Multi-agent coordination requires a strict hierarchy of source of truth to avoid conflicting edits.
- Freeze safeguards are necessary to protect immutable philosophy from being overwritten by operational sprint data.

## Cross References
- [Foundation Audit Report](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/99%20Command%20Center/Foundation%20Audit%20Report.md)
- [Documentation Update Protocol](file:///Users/alexanderanthony/Knowledge%20Core/IcyOS/20%20AI%20Operations/Documentation%20Update%20Protocol.md)

---

## 2026-07-02 ADR Repository Lessons
- ADR numbering must be reserved before prompt-level ADR recommendations are accepted; `ADR-0008` was already occupied by Foundation Freeze.
- Legacy non-padded ADR names create long-term lookup ambiguity and should be normalized into the canonical ADR sequence or archived.
- Duplicate decision files should be archived only after unique architectural content is merged into the surviving ADR.

---

## 2026-07-02 Database Physical Design Lessons
- Splitting database setup migrations into sequential dependencies prevents table reference errors during pg_trgm indices creation.
- Check constraints (such as `trust_score` boundaries) must be declared inline on identity tables to avoid schema synchronization lag.

---

## 2026-07-02 API Design Lessons
- Standardizing API response envelopes early prevents client parsing bugs when integrating AI agent tools outputs.
- Restricting AI agent permissions via JWT scopes is required to prevent automated write actions on user configuration models.

---

## 2026-07-02 Type System Design Lessons
- Static type safety must be mirrored with Zod schema validation runtime checks to prevent unsafe JSON payload parsing.
- Keeping database generated models decoupled from the domain models is required to isolate database column structure changes from application entities.

---

## 2026-07-02 Application Architecture Lessons
- Enforcing modular React component prop contracts from the outset prevents styling bloat and ensures reusable UI widgets.
- Isolating state variables per page view inside Zustand hooks prevents context window pollution during client state mutations.

---

## 2026-07-02 MVP Scoping & Planning Lessons
- Locking the MVP scope strictly to the intent-capture focus execution loop prevents feature creep and ensures stable delivery coordinates.
- Staging QA test criteria before scaffold scripts creation guarantees that all code modules are auditable under type/lint checks.

---

## 2026-07-02 Implementation Gate Lessons
- Setting up workspaces dependencies paths using local pnpm file protocols isolates type errors early.
- Integrating validation gates (such as Prettier and ESLint check) directly into git hooks via Husky avoids code drift during fast merges.

---

## 2026-07-02 Sprint 0 Lessons
- Configuring the base compiler rules (`tsconfig.base.json`) in the monorepo root simplifies TypeScript resolution across packages.
- Setting up workspaces mappings using clean JSON objects in Turborepo (`turbo.json`) ensures fast caching builds.

---

## 2026-07-02 Sprint 1 Lessons
- Organizing type definitions into modular domains (entities, value objects, API payloads, events) simplifies TS compile runs.
- Defining strict read-only properties on domain model interfaces prevents unintended field mutations.

---

## 2026-07-02 Story 1.2 Lessons
- Enforcing UUID format checks on payload strings at the schema validation boundary catches identifier errors early.
- Placing unit test files in locations matching test configurations patterns (e.g. `src/validation/validation.test.ts`) prevents folder resolution issues.

---

## 2026-07-02 Sprint 2 Lessons
- Introducing a mock `auth` schema locally prevents SQL errors during RLS policy creation when validating migrations on default Postgres environments.
- Splitting migrations logically into identity, workspaces, projects, and triggers limits validation errors during schema rollout.

---

## 2026-07-02 Sprint 3 Lessons
- Keeping data mapping configurations isolated inside dedicated static mappers prevents database schema changes from leaking into the domain layer.
- Enforcing that database connections can only occur through repository abstractions limits runtime side-effects in client code.

---

## 2026-07-02 Sprint 4 Lessons
- Placing unit test files directly inside the services packages bounds configurations limits resolution errors.
- Enforcing services coordination maps isolates transactional validation logic from database persistence layers.

---

## 2026-07-02 Sprint 5 Lessons
- Enforcing that all API controllers return standard `ApiResponseEnvelope` prevents contract deviations.
- Counting relative path nestings from nested route handlers is prone to drift; using consistent paths patterns resolves compiling type issues.

---

## 2026-07-02 Sprint 5.5 Lessons
- Declaring dark-first color variables in CSS variables ensures consistent style behavior across both Tailwind and standard vanilla classes.
- Consolidating base UI primitives (Button, Card, Input) into isolated folders separates design tokens configurations from application business components.

---

## 2026-07-02 Sprint 6 Lessons
- Using route groups (e.g. `(dashboard)`) inside Next.js App Router keeps layout structures cleanly mapped without nesting path segments.
- Implementing desktop sidebars and mobile bottom navigations as separate components optimizes layout responsiveness.

---

## 2026-07-02 Sprint 7 Lessons
- Mocking the fetch wrapper client and envelope format directly inside Vitest unit tests avoids needing active local Node servers during unit checks.
- Placing error validations and loadings status variables inside single unified custom hooks keeps visual page view components clean and logic-free.

---

## 2026-07-02 Sprint 8 Lessons
- Passing timeZone options (like `'UTC'`) inside client formatting utilities avoids timezone mismatch errors across different test runner machines.
- Sorting lists of blocks by start time chronological order on the client hook layer guarantees a consistent render experience regardless of database order.

---

## 2026-07-02 Sprint 9 Lessons
- Splitting approval action buttons (Approve, Reject, Regenerate) into distinct subcomponents makes the parent panel layout modular.
- Locking client controls optimistic states after timeline approval prevents duplicate network actions and keeps states transitions clean.

---

## 2026-07-02 Sprint 10 Lessons
- Binding useEffect hooks directly to states transitions ensures countdown intervals clear cleanly during pauses.
- Appending transition events asynchronously to historical event arrays guarantees operators can audit exact target execution sequences.

---

## 2026-07-02 Sprint 11 Lessons
- Wrapping navigator mediaDevice requests in try-catch bounds prevents runtime exceptions on machines lacking microphone hardware.
- Presenting extracted learning signals using tag badges makes focus blockers and wins scannable under one minute.

---

## 2026-07-02 Sprint 12 Lessons
- Dividing historical analysis items into older vs newer blocks halves helps calculate buffer trends directions (increasing vs decreasing) cleanly.
- Computing confidence values on deterministic calculations prevents statistical feedback loops when generating adaptive recommendation thresholds.

---

## 2026-07-03 Sprint 13 Lessons
- Keeping plan metadata fully explainable in the UI increases operator confidence in automated timeline adjustments.
- Enforcing "AI suggests, Human Approves" ensures the planning system remains a tool of leverage rather than automation friction.

---

## 2026-07-03 Sprint 14 Lessons
- Standardizing categories payloads inside provider-agnostic request definitions decouples core application routing rules from external LLM vendors models.

---

## 2026-07-03 Architecture Review Lessons
- Using parameterless default service dependencies initialization solves route package leaking while preserving modular testing capabilities.

---

## 2026-07-03 Sprint 15 Lessons
- Implementing race-timeout policies directly inside provider-agnostic runtime layers prevents hanging API connections if external vendor services become unresponsive.
- Designing simulated latency mock adapters enables robust local validation of fallback and timeout policies without hitting paid AI APIs.

---

## 2026-07-03 Phase 2 Lessons
- Integrating the Decision Engine with the AI Runtime within services ensures standard and escalated pathways are processed seamlessly under one interface contract.
- Freezing Release 0.1 plan specifications inside a structured management directory (`30 Release Management/`) establishes a baseline that tracks performance budgets alongside functional matrices.

---

## 2026-07-03 Release 0.3 Lessons
- Standardizing connector connection interfaces connects external tools cleanly without exposing internal service logic.
- Building focus-aware reminders prevents notification alert noise while users are running active focus blocks.

---

## 2026-07-03 Release 0.4 Lessons
- Pre-configuring reusable templates inside a registry makes adding new workflow types (Recording, Coding) extremely structured.
- caching dynamic context assembly queries in memory under short TTL limits prevents repetitive disk lookups during focused sessions.





