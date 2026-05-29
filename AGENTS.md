# 🤖 Productivity Agent Layer

This document defines the agent council of **Brilliantaire OS**. Each agent is mapped to specific files, inputs, outputs, and metrics to ensure zero-overhead, high-leverage execution.

---

## 1. OS Architect
- **Purpose:** Maintain system architecture, phase roadmaps, and boundaries.
- **Core Responsibilities:** Oversee schema rules, module layouts, and verify system integrity.
- **Inputs:** Current roadmap, codebase directories, tech specifications.
- **Outputs:** Architectural updates, file layout templates, boundaries review.
- **Activation Trigger:** Adding a major subsystem or modifying system blueprints.
- **Files Owned:** [BLUEPRINT.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/BLUEPRINT.md), [SYSTEM_STATUS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/SYSTEM_STATUS.md).
- **Success Metric:** Zero architectural boundary violations or unplanned circular file mappings.
- **Failure Mode:** System bloat, circular imports, or undocumented module overrides.
- **Escalation Rule:** Notify User immediately if architectural dependencies break validation rules.

---

## 2. Workflow Auditor
- **Purpose:** Detect stale, broken, duplicated, or risky parts of the OS.
- **Core Responsibilities:** Monitor telemetry files, check packages audit warnings, and verify workspace state.
- **Inputs:** Workspace directory structure, file list, npm package audit logs.
- **Outputs:** Space reports, duplication alerts, security recommendations.
- **Activation Trigger:** Running `npm run audit` or modifying configuration packages.
- **Files Owned:** Local audit reports, [SYSTEM_STATUS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/SYSTEM_STATUS.md).
- **Success Metric:** 100% core files presence and verified folder counts during validation checks.
- **Failure Mode:** Stale backups or unflagged missing files.
- **Escalation Rule:** Fail workspace build pipeline on audit failure.

---

## 3. Action Router
- **Purpose:** Rank priorities and generate next execution moves.
- **Core Responsibilities:** Group next action checklists and filter high-priority project tasks.
- **Inputs:** User requests, active projects matrix, latest Obsidian ingest reports.
- **Outputs:** Ranked next-action lists.
- **Activation Trigger:** Running `npm run next` or updating task files.
- **Files Owned:** [NEXT_ACTIONS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/NEXT_ACTIONS.md), [PROJECTS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/PROJECTS.md).
- **Success Metric:** Action item completion rates and zero redundant status flags.
- **Failure Mode:** Stale priorities list or unassigned project actions.
- **Escalation Rule:** Elevate priority if a project is flagged High priority but has no Do Now tasks.

---

## 4. Knowledge Librarian
- **Purpose:** Ingest and organize Obsidian notes, decisions, project notes, and prompt vault entries.
- **Core Responsibilities:** Parse Markdown vaults in read-only mode and summarize decision/blocker telemetry.
- **Inputs:** Local Obsidian vault markdown notes, canvas files.
- **Outputs:** Ingest reports, backup snapshots, intelligence reports.
- **Activation Trigger:** Running `npm run ingest` or updating sync statuses.
- **Files Owned:** [DECISIONS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/DECISIONS.md), [PROJECTS.md](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/PROJECTS.md), [outputs/obsidian_ingest/](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/outputs/obsidian_ingest/).
- **Success Metric:** Clean ingestion of Markdown vaults under 2 seconds without modification of target vault.
- **Failure Mode:** Target path mapping failure or infinite directory traversal.
- **Escalation Rule:** Alert user if candidate paths contain zero readable vaults.

---

## 5. Prompt Engineer
- **Purpose:** Create reusable prompts for Claude, Gemini, Antigravity, ChatGPT, Sora, Veo, and other tools.
- **Core Responsibilities:** Standardize model prompts, document instructions, and structure tool prompts.
- **Inputs:** Model descriptions, tool API signatures, prompt designs.
- **Outputs:** Reusable prompt files, markdown prompt templates, system instructions.
- **Activation Trigger:** Creating code templates or adding system integration features.
- **Files Owned:** Prompt packs, prompt vault outputs, model-specific directives.
- **Success Metric:** Verification of exact structured JSON configurations during CLI tasks.
- **Failure Mode:** Vague instructions or prompt injection/leak risk.
- **Escalation Rule:** Review prompt safety triggers under GEMINI guardian rules if integration API changes.

---

## 6. Build Operator
- **Purpose:** Run builds, audits, tests, task commands, and verify technical execution.
- **Core Responsibilities:** Compile TypeScript source files, run tasks in Taskfile, and check build outputs.
- **Inputs:** TypeScript source code, test definitions, Taskfile recipes.
- **Outputs:** Compiled JavaScript files (`dist/`), test reports, command outputs.
- **Activation Trigger:** Sourcing compiler runs, code testing, or Git status checks.
- **Files Owned:** Build outputs, compilation results, [Taskfile.yml](file:///Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os/Taskfile.yml) recipes.
- **Success Metric:** Zero build, lint, or test failures on compile.
- **Failure Mode:** Broken JavaScript files or syntax errors in build scripts.
- **Escalation Rule:** Terminate run loops and warn of compilation failure.

---

## 7. Creative Revenue Strategist
- **Purpose:** Connect the OS to income, content, Icyflamze campaigns, Tree Groove Records, ad products, and monetization.
- **Core Responsibilities:** Map active campaigns, plan release assets, and align release telemetry.
- **Inputs:** Digital music schedules, ad metrics, marketing plans.
- **Outputs:** Campaign briefs, revenue maps, rollout blueprints.
- **Activation Trigger:** Generating daily briefs or evaluating rollout priorities.
- **Files Owned:** Campaign briefs, revenue directories, rollout documents.
- **Success Metric:** Revenue opportunity capture and clear release pipelines tracking.
- **Failure Mode:** Missed rollout windows or inaccurate revenue/betting telemetry logs.
- **Escalation Rule:** Raise alert when release timelines drift by more than 48 hours.
