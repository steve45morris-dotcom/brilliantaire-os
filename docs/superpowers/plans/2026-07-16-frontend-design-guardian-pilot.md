# Frontend Design Guardian Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Directly verify and complete the approved eight-frontend audit, shared design-governance system, and one-page Joy Beauty Studio redesign with an independently evidenced score of at least 85/100.

**Architecture:** Treat the home repository as the governance and dashboard implementation surface. Keep reusable design logic under `src/design`, design documentation under `docs`, and the single pilot UI under focused dashboard files. Audit actual route output separately from registry intent, preserve all unrelated dirty files, and accept the pilot only from fresh fixed-viewport browser evidence.

**Tech Stack:** TypeScript, React, Vite, Vitest, CSS, CDP/browser-harness, Markdown governance artifacts.

## Global Constraints

- Use `docs/superpowers/specs/2026-07-16-frontend-design-guardian-pilot-design.md` as the controlling specification.
- Audit exactly eight registered workspace frontends.
- Review exactly six approved external sources in read-only mode.
- Redesign exactly one evidence-selected eligible pilot.
- Preserve `/projects/joy-beauty-studio`, `/projects/icyflamze`, all other route behavior, and unrelated dirty files.
- Joy Beauty Studio requires at least 85/100 plus all evidence gates.
- Do not certify pre-existing artifacts without fresh direct verification.
- Do not install Magic MCP, deploy, publish, add API keys, delete files, normalize the worktree, or modify shared infrastructure.
- Screenshot evidence stays outside tracked source folders under `/private/tmp`.

---

### Task 1: Establish Fresh Audit Inputs

**Files:**
- Read: `src/workspaces/WorkspaceLaunchConfig.ts`
- Read: `src/workspaces/WorkspaceData.ts`
- Read: `dashboard/src/App.tsx`
- Read: `docs/reports/current-state/WORKSPACE_CURRENT_STATE.md`
- Modify if evidence differs: `docs/reports/FRONTEND_DESIGN_MATURITY_AUDIT.md`

**Interfaces:**
- Consumes: eight registered workspace IDs and actual dashboard route rendering.
- Produces: an evidence-backed table of route, launch state, source surface, maturity score, eligibility, and blockers.

- [ ] **Step 1: Inventory all eight configured routes**

Run:

```bash
rg -n "workspaceId:|launchUrl:|launchMode:" src/workspaces/WorkspaceLaunchConfig.ts
rg -n "window.location.pathname|JoyBeautyStudio|Icyflamze|WorkspacePage" dashboard/src/App.tsx
```

Expected: eight unique workspace IDs and explicit evidence of which routes have dedicated render branches.

- [ ] **Step 2: Inventory adjacent frontend source surfaces**

Run bounded `find`, `rg`, package-manifest, and build-script checks for The One System, Icyflamze, ProfBetGeng, TreeGroove, Joy Beauty Studio, Avatar, Podcast, and AI School.

Expected: each audit row cites an actual source path or states that no dedicated frontend exists.

- [ ] **Step 3: Recalculate maturity scores**

Apply `docs/specifications/VISUAL_ACCEPTANCE_RUBRIC.md` to actual route and source evidence. Record blocked and non-launchable states separately from low visual quality.

- [ ] **Step 4: Update the maturity report only if evidence changed**

The report must include all eight projects, strengths, weaknesses, duplicated or dead surfaces, score, eligibility, and selection result.

- [ ] **Step 5: Verify report completeness**

Run:

```bash
rg -n "The One System|Icyflamze|ProfBetGeng|TreeGroove|Joy Beauty Studio|Avatar|Podcast|AI School" docs/reports/FRONTEND_DESIGN_MATURITY_AUDIT.md
```

Expected: every project appears with a documented score and state.

### Task 2: Refresh the Six-Source Review

**Files:**
- Read/Modify: `docs/reports/FRONTEND_DESIGN_SOURCE_REVIEW.md`
- Read/Modify: `src/design/ComponentSourceRegistry.ts`

**Interfaces:**
- Consumes: current primary-source repository metadata and license evidence.
- Produces: six governed adopt, pilot, watch, or reject decisions and consistent registry states.

- [ ] **Step 1: Verify all sources from primary repository pages**

Check activity, license, releases, framework assumptions, and maintenance state for:

```text
VoltAgent/design-md
VoltAgent/awesome-design-md
shadcn-ui/ui
launch-ui/launch-ui
BuilderIO/builder-agent-skills
21st-dev/magic-mcp
```

- [ ] **Step 2: Reconcile source decisions**

Ensure every decision includes license visibility, compatibility, risk, cost or lock-in, duplication, and approved usage.

- [ ] **Step 3: Reconcile machine-readable registry**

Confirm status, source, license, pinning rule, accessibility review, customization notes, and project usage match the written review.

- [ ] **Step 4: Verify exact six-source coverage**

Run:

```bash
rg -n "VoltAgent/design-md|VoltAgent/awesome-design-md|shadcn-ui/ui|launch-ui/launch-ui|BuilderIO/builder-agent-skills|21st-dev/magic-mcp" docs/reports/FRONTEND_DESIGN_SOURCE_REVIEW.md
```

Expected: six source records, with Magic MCP not installed.

### Task 3: Verify the Design-Governance Layer

**Files:**
- Read/Modify: `DESIGN.md`
- Read/Modify: `docs/specifications/DESIGN_MD_STANDARD.md`
- Read/Modify: `docs/specifications/VISUAL_ACCEPTANCE_RUBRIC.md`
- Read/Modify: `docs/agents/DESIGN_REVIEW_AGENT.md`
- Read/Modify: `docs/workflows/FRONTEND_VISUAL_QUALITY_WORKFLOW.md`
- Read/Modify: `docs/design/PROJECT_DESIGN_PROFILES.md`
- Read/Modify: `docs/playbook/FRONTEND_DESIGN_PLAYBOOK.md`
- Read/Modify: `templates/design/DESIGN_TEMPLATE.md`
- Read/Modify: `skills/frontend-design-guardian/*`
- Read/Modify: `src/design/*`
- Test: `src/design/design.test.ts`

**Interfaces:**
- Consumes: controlling spec, project profiles, visual rubric, existing registries.
- Produces: validated design contracts, score evaluation, evidence gates, source registry, commands, review agent, and workflow registration.

- [ ] **Step 1: Add or adjust failing tests for any uncovered contract**

Tests must verify all twenty DESIGN.md sections, forbidden defaults, 100-point clamping, 80/85/90 thresholds, evidence gates, eight profiles, allowed source statuses, independent reviewer requirement, command output, dashboard actions, agent registration, and workflow registration.

- [ ] **Step 2: Run targeted tests before implementation changes**

Run:

```bash
npx vitest run src/design/design.test.ts src/design/pilot-route.test.ts
```

Expected: failures identify real contract gaps; if all pass, continue with artifact-by-artifact review rather than assuming completeness.

- [ ] **Step 3: Correct only verified governance gaps**

Keep design logic isolated under `src/design`. Do not redesign unrelated architecture.

- [ ] **Step 4: Run targeted tests after corrections**

Run:

```bash
npx vitest run src/design/design.test.ts src/design/pilot-route.test.ts
```

Expected: all targeted tests pass.

- [ ] **Step 5: Run per-file code review**

Inspect the diff for hardcoded scores without evidence, dead actions, inconsistent paths, unsafe external execution, missing types, and duplicated rubric logic.

### Task 4: Confirm the Pilot from Evidence

**Files:**
- Read/Modify: `docs/reports/FRONTEND_DESIGN_MATURITY_AUDIT.md`
- Read/Modify: `docs/reports/FRONTEND_DESIGN_PILOT_REPORT.md`
- Read/Modify: `docs/design/joy-beauty-studio/DESIGN.md`

**Interfaces:**
- Consumes: refreshed maturity scores and route launch constraints.
- Produces: explicit selection decision, baseline score, route contract, and pilot DESIGN.md.

- [ ] **Step 1: Rank candidates by score**

Exclude only routes whose live audit proves they are unconfigured, not launchable, or require a prerequisite build.

- [ ] **Step 2: Confirm or reject Joy Beauty Studio**

If Joy remains the weakest eligible route, document the reason. If not, stop before changing UI and update the pilot selection from evidence.

- [ ] **Step 3: Validate the pilot design contract**

Run the DESIGN.md validator against `docs/design/joy-beauty-studio/DESIGN.md`.

Expected: all twenty sections present and threshold set to 85.

- [ ] **Step 4: Record the route contract**

Record `/projects/joy-beauty-studio` as the pilot and `/projects/icyflamze` as the explicit regression route.

### Task 5: Recreate Baseline Evidence

**Files:**
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-baseline-desktop.png`
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-baseline-mobile.png`
- Read/Modify: `docs/reports/FRONTEND_DESIGN_PILOT_REPORT.md`

**Interfaces:**
- Consumes: a baseline build from the parent commit before the pilot implementation.
- Produces: fixed-viewport baseline screenshots and an evidenced baseline score.

- [ ] **Step 1: Create an isolated temporary baseline checkout**

Use a temporary git worktree or archive of the parent revision so the active dirty tree remains untouched.

- [ ] **Step 2: Build and serve the baseline dashboard**

Use an unused local port and preserve the active project process state.

- [ ] **Step 3: Capture desktop baseline**

Viewport: 1440 by 1000. Route: `/projects/joy-beauty-studio`.

- [ ] **Step 4: Capture mobile baseline**

Viewport: 390 by 844. Route: `/projects/joy-beauty-studio`.

- [ ] **Step 5: Score the baseline**

Cite visible product identity, hierarchy, responsive behavior, conversion path, and route mismatch evidence for every category.

- [ ] **Step 6: Remove only the temporary baseline checkout**

Do not delete or modify any user-owned workspace files.

### Task 6: Review and Correct the Pilot Implementation

**Files:**
- Modify if required: `dashboard/src/components/JoyBeautyStudio.tsx`
- Modify if required: `dashboard/src/joy-beauty-studio.css`
- Modify if required: `dashboard/src/App.tsx`
- Modify if required: `dashboard/public/joy-beauty-studio-hero.jpg`
- Test: `src/design/pilot-route.test.ts`

**Interfaces:**
- Consumes: approved Joy DESIGN.md and baseline defects.
- Produces: one dedicated responsive route with service selection and local confirmation behavior.

- [ ] **Step 1: Review current component against the design contract**

Check semantic landmarks, navigation, service ledger, price and duration, selected state, form labels, local confirmation copy, image attribution, focus visibility, touch targets, reduced motion, and mobile collapse.

- [ ] **Step 2: Write a failing regression test for every discovered contract defect**

Keep tests focused on stable route and user-visible behavior.

- [ ] **Step 3: Run the failing tests**

Run:

```bash
npx vitest run src/design/pilot-route.test.ts
```

Expected: each new test fails for the intended reason.

- [ ] **Step 4: Implement the smallest compliant correction**

Do not modify any non-pilot frontend.

- [ ] **Step 5: Run the pilot tests**

Run:

```bash
npx vitest run src/design/pilot-route.test.ts
```

Expected: all pilot tests pass.

- [ ] **Step 6: Review changed files**

Check semantics, state behavior, CSS specificity, responsive constraints, accessibility, asset provenance, and route isolation.

### Task 7: Capture Revised Evidence and Independent Review

**Files:**
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-desktop.png`
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-mobile.png`
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-confirmation-desktop.png`
- Evidence: `/private/tmp/frontend-design-guardian-joy-beauty-studio-confirmation-mobile.png`
- Modify: `docs/reports/FRONTEND_DESIGN_PILOT_REPORT.md`

**Interfaces:**
- Consumes: built pilot and fixed viewports.
- Produces: screenshot, interaction, overflow, console, and independent-review evidence.

- [ ] **Step 1: Start the verified dashboard build**

Use the dashboard’s production preview or stable local server on an unused port.

- [ ] **Step 2: Capture default desktop and mobile states**

Use 1440 by 1000 and 390 by 844.

- [ ] **Step 3: Capture interaction states**

Select `Protective style consultation`, complete the local form, submit, and capture visible confirmation on desktop and mobile.

- [ ] **Step 4: Capture runtime checks**

Record console errors, horizontal overflow, selected-service state, confirmation visibility, route, and viewport.

- [ ] **Step 5: Run independent review**

The reviewer must score all ten categories from evidence, identify defects, and return `pass` or `revise`. It must not rely on the implementation report’s existing score.

- [ ] **Step 6: Revise if required**

For every `revise`, write a regression test where practical, make only the pilot correction, rebuild, recapture affected evidence, and rescore. Stop only at at least 85 with all gates satisfied or a documented blocker.

### Task 8: Full Verification

**Files:**
- Modify: `docs/reports/FRONTEND_DESIGN_GUARDIAN_IMPLEMENTATION_REPORT.md`
- Modify: `docs/reports/FRONTEND_DESIGN_PILOT_REPORT.md`
- Modify if needed: `docs/DOCUMENTATION_INDEX.md`
- Evidence log: `/private/tmp/frontend-design-guardian-verification.log`

**Interfaces:**
- Consumes: final source, reports, screenshots, and review decision.
- Produces: fresh command evidence and one final acceptance verdict.

- [ ] **Step 1: Run tests**

Run:

```bash
npm test
```

Expected: zero failing tests.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Run root build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Run dashboard build**

Run:

```bash
npm --prefix dashboard run build
```

Expected: exit 0.

- [ ] **Step 5: Verify route regressions**

Verify `/projects/joy-beauty-studio`, `/projects/icyflamze`, and representative non-pilot paths. Confirm only the pilot has a dedicated redesign change.

- [ ] **Step 6: Verify the final score and evidence gates**

Require score at least 85, desktop and mobile screenshots, interaction evidence, independent reviewer, clean console, no overflow, intact routes, and zero unresolved blockers.

- [ ] **Step 7: Update final reports**

Record exact commands, exit codes, test counts, screenshot paths, score, reviewer, route checks, console result, blockers, dirty-tree preservation, and one final verdict.

### Task 9: Checkpoint the Bounded Work

**Files:**
- Inspect: all files changed by this implementation
- Preserve: every unrelated dirty file

**Interfaces:**
- Consumes: verified scoped diff and final reports.
- Produces: a bounded local checkpoint commit or an explicit unsafe-checkpoint report.

- [ ] **Step 1: Inventory the scoped diff**

Compare current status against the pre-run snapshot and identify only files belonging to the approved specification.

- [ ] **Step 2: Run diff safety checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; unrelated files remain unstaged and untouched.

- [ ] **Step 3: Create the checkpoint**

Stage only approved spec, plan, design-governance, pilot, tests, and final-report files. Never use `git add .`.

- [ ] **Step 4: Verify checkpoint contents**

Run:

```bash
git show --stat --oneline --summary HEAD
git status --short
```

Expected: checkpoint contains only scoped work; pre-existing unrelated dirty files remain present and unstaged.
