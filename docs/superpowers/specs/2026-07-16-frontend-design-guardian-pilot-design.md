# Frontend Design Guardian Consolidated Audit and Pilot Design

Date: 2026-07-16  
Status: Awaiting written-spec review  
Branch: `feature/frontend-design-guardian`

## Objective

Create one governed frontend-quality system by auditing the eight registered workspace frontends, reviewing six external design sources, establishing shared design standards, and redesigning only the weakest eligible landing page. Completion requires measured desktop and mobile improvement, independent review, route preservation, clean runtime evidence, and final implementation reports.

## Scope

The eight audited workspace products are:

1. The One System
2. Icyflamze
3. ProfBetGeng
4. TreeGroove Records
5. Joy Beauty Studio
6. Avatar
7. Podcast
8. AI School

The audit covers route truth, framework and rendering state, design-system maturity, typography, color, imagery, responsive behavior, interaction quality, accessibility, conversion clarity, duplication, dead or generic sections, and screenshot readiness.

Only one eligible landing page may be redesigned. The other seven remain audit-only. Unrelated dirty files, existing project behavior, and established route contracts must be preserved.

## Consolidated Execution Model

The work runs as one implementation stream:

1. Audit all eight frontends and produce the maturity report.
2. Review six external design and component sources in read-only mode.
3. Establish the workspace design-governance layer.
4. Select the weakest eligible pilot using documented scores and launch constraints.
5. Capture baseline desktop and mobile evidence at fixed viewports.
6. Record the baseline visual score and route contract.
7. Redesign only the selected pilot.
8. Capture revised desktop, mobile, and meaningful interaction-state evidence.
9. Run an independent design review and revise until acceptance or a documented blocker.
10. Run automated and browser verification and produce final reports.

This is not divided into specification-only subprojects, and the pilot is not deferred.

## Audit Architecture

The workspace registry and actual renderer are inspected separately. A configured route is not considered a mature frontend unless it renders the correct product identity and supports its intended task.

Each frontend receives:

- route and launch-state verification;
- framework, source, and build-surface inventory;
- token, typography, color, component, and imagery assessment;
- desktop and mobile behavior assessment;
- strengths, weaknesses, duplication, dead-section, and blocker notes;
- a 0-100 maturity score using the shared visual rubric.

Eligibility for the pilot requires a working local-preview route that can be redesigned without inventing a missing external integration. Lower-scoring routes that are explicitly blocked, unconfigured, or not launchable are documented but are not selected.

## External Source Review

Review these six sources without installing or executing their code:

1. VoltAgent/design-md
2. VoltAgent/awesome-design-md
3. shadcn-ui/ui
4. launch-ui/launch-ui
5. BuilderIO/builder-agent-skills
6. 21st-dev/magic-mcp

For each source, record activity, license visibility, framework compatibility, maintenance and supply-chain risk, duplication with local capabilities, cost or lock-in, and an adopt, pilot, watch, or reject decision. Any future component import must use a pinned reference and provenance record.

## Design Governance Deliverables

The shared governance layer contains:

- a root `DESIGN.md` router;
- a twenty-section `DESIGN.md` standard and reusable template;
- a 100-point visual acceptance rubric;
- an experimental Frontend Design Guardian skill;
- a lean independent Design Review Agent;
- a frontend visual-quality workflow;
- eight brand-autonomous project design profiles;
- a governed component source registry;
- a frontend design playbook;
- structured design commands and dashboard actions where they fit existing architecture.

Shared standards govern behavior, accessibility, evidence, and review. Each project retains autonomous typography, color, imagery, tone, content hierarchy, and conversion strategy.

## Pilot Selection and Route Contract

The documented audit score determines the weakest candidate, subject to eligibility. The expected pilot is Joy Beauty Studio because it is the weakest route that is locally previewable and not blocked by missing configuration or a prerequisite build.

The pilot contract is:

- preserve `/projects/joy-beauty-studio`;
- do not change `/projects/icyflamze` behavior;
- do not alter the other six workspace routes;
- do not add a real booking integration or external write;
- keep the booking confirmation local and explicitly non-final;
- preserve unrelated dashboard behavior and dirty files.

If live audit evidence contradicts the expected selection, the report must document the new scoring and select the actual weakest eligible route before any redesign.

## Pilot Design Direction

Joy Beauty Studio becomes a service-led booking landing page whose single job is to help a local client choose a service and request a visit.

The visual direction is a warm editorial service ledger, not a generic beige luxury template. It uses:

- restrained editorial display typography with clear service and utility roles;
- ink, petal, mineral, canvas, and white semantic colors;
- authentic salon photography with recorded source and license;
- an availability ribbon;
- selectable service rows with price and duration;
- a responsive booking summary and labeled visit form;
- an explicit local request confirmation state;
- quiet, purposeful motion with reduced-motion support.

The signature element is the service ledger: services behave like a clear editorial menu and booking control rather than a repeated marketing-card grid.

## Responsive and Accessibility Contract

Desktop and mobile must be designed as distinct compositions around the same primary task. Required behavior includes:

- no horizontal overflow, clipping, or unreadable wrapping;
- minimum 44px touch targets;
- visible keyboard focus;
- semantic landmarks, headings, labels, and live confirmation;
- sufficient text and interactive contrast;
- state communicated by text and structure, not color alone;
- reduced-motion support;
- a clear booking action in the first mobile viewport.

## Visual Acceptance

The rubric scores ten categories from 0 to 10:

1. Brand distinction
2. Typography
3. Layout hierarchy
4. Spacing consistency
5. Color discipline
6. Imagery and visual interest
7. Responsive behavior
8. Interaction quality
9. Accessibility
10. Conversion clarity

The Joy Beauty Studio threshold is 85/100. A score at or above 85 is insufficient by itself. Acceptance also requires desktop and mobile evidence, meaningful interaction-state evidence, an independent reviewer, intact routes, a clean console, and no unresolved blockers.

The implementing pass cannot approve itself. The independent review returns either `pass` or `revise` with prioritized evidence-backed defects. Revision continues until the threshold and evidence gates are met or a blocker is documented.

## Evidence Contract

Capture baseline and revised screenshots at matching fixed viewports:

- desktop: 1440 by 1000;
- mobile: 390 by 844.

Capture the selected service and booking confirmation states after redesign. Store screenshot evidence outside tracked source folders under `/private/tmp` unless repository policy changes.

For each capture, record route, viewport, state, evidence path, and whether horizontal overflow or console errors were observed.

## Implementation Boundaries

New design logic should remain isolated under focused design modules and reuse existing registries, Live Operations, command conventions, and dashboard architecture through narrow adapters.

Do not redesign the kernel, runtime, executive layer, operations intelligence, knowledge graph, universal integration framework, constitution, architecture freeze, or the seven non-pilot frontends.

Do not install Magic MCP, import an entire component library, add API keys, deploy, publish, delete files, normalize the dirty tree, or modify shared infrastructure as part of this task.

## Error and Blocker Handling

- A route that renders the wrong product is scored against the actual output, not registry intent.
- A route that cannot launch is documented as blocked and is not silently treated as complete.
- Missing screenshot, mobile, console, or independent-review evidence forces `revise`.
- A build pass does not substitute for visual acceptance.
- Pre-existing unrelated failures are separated from pilot regressions and recorded with evidence.
- Any action requiring an external write or destructive change stops at a SENTINEL confirmation gate.

## Verification

Required verification includes:

- targeted unit tests for design-spec validation, scoring, thresholds, profiles, source registry, command output, workflow and agent registration, and pilot route preservation;
- full relevant test suite;
- TypeScript typecheck;
- root build;
- dashboard build;
- browser verification at desktop and mobile viewports;
- service selection and confirmation interaction checks;
- route-regression checks for the pilot and Icyflamze;
- horizontal-overflow check;
- browser console error check;
- independent design review against the rubric.

## Final Reports

Produce:

- frontend design maturity audit;
- six-source review;
- pilot selection, baseline, redesign, score, and evidence report;
- independent design-review decision and revision history;
- implementation and architecture-boundary report;
- final verification evidence including commands, results, routes, console state, screenshots, unresolved blockers, and acceptance verdict.

## Acceptance Criteria

The task is complete only when:

- all eight frontends have documented maturity scores;
- all six external sources have governed decisions;
- all requested design-governance artifacts exist and are internally consistent;
- the weakest eligible pilot is selected from documented evidence;
- baseline and revised desktop/mobile evidence exists;
- only the pilot implementation is redesigned;
- pilot route behavior is preserved;
- the independent score meets 85/100 or a blocker is documented;
- tests, typecheck, builds, browser checks, console checks, and route checks are recorded;
- unrelated dirty files remain untouched;
- final reports state one clear acceptance verdict.
