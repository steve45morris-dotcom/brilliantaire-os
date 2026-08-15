# Supernova Executive Intelligence v1.0 Specification

## Status

- **Subsystem:** Supernova Executive Intelligence
- **Version:** v1.0
- **Baseline:** Phase 12M
- **Ratification Mode:** Evidence-first ratification of the existing implementation
- **Implementation Boundary:** No redesign, no new subsystem, no new agents

## Purpose

Supernova Executive Intelligence is the Phase 12M executive reasoning layer for Brilliantaire OS. It reads existing platform telemetry, ranks operational initiatives, writes an executive strategy briefing, appends an execution log, and injects a compact strategy snapshot into Mission Control dashboard telemetry.

The subsystem exists to formalize strategic prioritization inside the current Executive Intelligence architecture. It does not replace the dashboard, the Safe Command Router, the Operational Excellence runner, the Digital Twin simulator, or the existing Brilliantaire OS agent council.

## Architectural Role

Supernova extends the existing Brilliantaire OS v1.0 architecture as an OS Architect-owned executive intelligence layer.

It sits above these existing components:

- Operational Excellence diagnostics
- Production readiness telemetry
- Dependency intelligence
- Architecture certification outputs
- Digital Twin simulation outputs
- Mission Control dashboard JSON export
- Safe Command Router

It does not introduce an independent execution plane. It reads and writes local repository files only, using the same TypeScript, Taskfile, npm, and Command Router conventions already present in Brilliantaire OS.

## Current Boundaries

Included in v1.0:

- Supernova configuration in `config/supernova.ts`
- Strategy runner in `scripts/supernova-strategy-engine.ts`
- Help utility in `scripts/supernova-help.ts`
- npm command registration
- Taskfile command registration
- Safe Command Router registration
- Markdown briefing output
- Markdown log output
- `dashboard/public/dashboard-data.json` injection under `supernovaBriefing`

Excluded from v1.0:

- New agents or council members
- New background daemon
- External API calls
- Deployment automation
- Direct landing page modification
- Autonomous execution of recommended actions
- New dashboard panel implementation
- Replacement of Operational Excellence, Digital Twin, or certification engines

## Source Files

| File | Role |
|---|---|
| `config/supernova.ts` | Defines operating mode, output directories, configured scoring weights, and baseline confidence. |
| `scripts/supernova-strategy-engine.ts` | Runs the reasoning cycle, refreshes operational excellence, ranks initiatives, writes briefing/log outputs, and injects dashboard telemetry. |
| `scripts/supernova-help.ts` | Prints the Supernova CLI help menu and operating modes. |
| `package.json` | Registers `supernova-strategy-engine` and `supernova-help` npm scripts. |
| `Taskfile.yml` | Registers `task supernova-strategy-engine` and `task supernova-help`. |
| `config/commands.ts` | Registers both commands in the Safe Command Router with exact-name enforcement. |
| `dashboard/public/dashboard-data.json` | Receives the `supernovaBriefing` telemetry object. |

## Inputs

Primary input:

- `dashboard/public/dashboard-data.json`

Consumed fields:

- `operationalExcellence.platformHealthIndex`
- `operationalExcellence.backlog`
- `certification.status`
- `dependencyIntelligence.circularCount`
- `governance.namingScore`

The strategy engine first attempts to refresh operational excellence by running:

```bash
npm run operational-excellence-runner
```

If that refresh fails, the Supernova engine logs a warning and continues using the existing dashboard data file.

## Outputs

Report output:

- `outputs/supernova/reports/supernova_briefing_2026-06-01.md`

Log output:

- `outputs/supernova/logs/supernova_log_2026-06-01.md`

Dashboard telemetry output:

- `dashboard/public/dashboard-data.json`
- Injected object: `supernovaBriefing`

The implementation uses a fixed local anchor date of `2026-06-01` for report and log filenames.

## Configuration Values

From `config/supernova.ts`:

| Value | Current v1.0 Setting | Runtime Use |
|---|---:|---|
| `ACTIVE_OPERATING_MODE` | `certification` | Written to reports, dashboard telemetry, and completion narration. |
| `SUPERNOVA_OUTPUT_DIR` | `outputs/supernova/reports/` | Used to build the executive briefing output path. |
| `SUPERNOVA_LOG_DIR` | `outputs/supernova/logs/` | Used to build the Supernova log output path. |
| `STRATEGIC_WEIGHTS.value` | `0.4` | Configured and imported, but not applied by the v1.0 scoring calculation. |
| `STRATEGIC_WEIGHTS.risk` | `0.3` | Configured and imported, but not applied by the v1.0 scoring calculation. |
| `STRATEGIC_WEIGHTS.effort` | `0.3` | Configured and imported, but not applied by the v1.0 scoring calculation. |
| `CONFIDENCE_BASE` | `92` | Used as the confidence score for ranked initiatives. |

## Operating Modes

The configured TypeScript union supports:

- `development`
- `certification`
- `production`
- `recovery`
- `learning`

The active v1.0 mode is:

- `certification`

The help menu describes the modes as:

- Development: relaxed validation, fast execution
- Certification: full governance, Digital Twin, certifier gates
- Production: strict quality checks, maximum stability
- Recovery: minimal services, fault isolation assistance
- Learning: extract successful patterns to workflows

## Strategy Scoring Model

The current v1.0 engine ranks initiatives from `operationalExcellence.backlog`.

For each backlog item:

1. Start with `baseScore = 70`.
2. Add `15` points if `item.risk === "HIGH"`.
3. Add `10` points if `item.roi` includes `Critical` or `High`.
4. Use `CONFIDENCE_BASE` as the initiative confidence score.
5. Sort initiatives by descending score.

The configured `STRATEGIC_WEIGHTS` object is present and imported but is not used in the current scoring function. That is a known v1.0 limitation and should be treated as future improvement work, not as part of this ratification.

## Report Structure

The generated executive briefing contains:

- Title: `Supernova OS: Executive Strategic Outlook - 2026-06-01`
- Active operating mode
- Platform health index
- Certification pass/fail state
- Technical debt trend
- Strategic outlook narrative
- Top recommended next action
- Prioritized strategic initiatives
- Certification footer

## Mission Control Integration

The strategy engine injects `supernovaBriefing` into `dashboard/public/dashboard-data.json`.

Current shape:

```json
{
  "activeOperatingMode": "certification",
  "healthIndex": 78,
  "certStatus": "FAILED",
  "circularCount": 5,
  "namingDriftWarning": true,
  "recommendedAction": {
    "title": "Refactor TS module cyclic imports in scripts/",
    "evidence": "Backlog Reference OP-002",
    "confidence": 92,
    "score": 95
  },
  "initiatives": [
    {
      "title": "Refactor TS module cyclic imports in scripts/",
      "score": 95,
      "milestone": "v0.9-maturation"
    }
  ]
}
```

The dashboard source currently does not consume `supernovaBriefing` in a dedicated React view. Therefore missing Supernova data does not break the current dashboard build. Supernova content remains a data payload and report artifact, not a landing-page replacement.

## Command Contracts

### npm Scripts

| Command | Contract |
|---|---|
| `npm run supernova-help` | Prints Supernova help text and operating modes. |
| `npm run supernova-strategy-engine` | Runs strategy audit, writes report/log output, and injects dashboard telemetry. |

### Taskfile Commands

| Command | Contract |
|---|---|
| `task supernova-help` | Delegates to `npm run supernova-help`. |
| `task supernova-strategy-engine` | Delegates to `npm run supernova-strategy-engine`. |

### Safe Command Router Commands

| Command | Aliases | Risk | Exact Name | Owner |
|---|---|---|---|---|
| `supernova-help` | `supernova-help-menu` | low | required | OS Architect |
| `supernova-strategy-engine` | `supernova-run`, `strategy-run` | low | required | OS Architect |

Because exact-name enforcement is enabled, aliases are listed for discoverability but blocked by the router at execution time.

## Dependencies

Runtime dependencies:

- Node.js
- npm
- `tsx`
- TypeScript project module resolution
- Local filesystem access
- `dashboard/public/dashboard-data.json`
- Existing `operational-excellence-runner`
- VNP helper functions from `scripts/vnp.ts`

No external network dependency is part of the v1.0 Supernova command contract.

## Governance Requirements

Supernova v1.0 must remain inside the Brilliantaire OS governance model:

- Use existing npm, Taskfile, and Safe Command Router registration patterns.
- Preserve exact-name routing for router execution.
- Keep recommendations advisory; do not execute recommended actions automatically.
- Write outputs only under approved local repository output paths and dashboard JSON.
- Maintain OS Architect ownership in the command registry.
- Preserve the existing seven-agent productivity council; do not add a new agent for Supernova v1.0.

## Digital Twin Requirements

In certification mode, Supernova depends on upstream Operational Excellence and Digital Twin signals rather than implementing a new simulator. The strategy runner calls `operational-excellence-runner`, and that runner invokes `digital-twin-simulator` as part of its existing validation engine sequence.

Supernova v1.0 must treat Digital Twin data as upstream evidence and must not mutate Digital Twin engine behavior.

## Operator Approval Boundaries

Supernova v1.0 is advisory. It may:

- Rank initiatives
- Write local briefing artifacts
- Write local logs
- Inject dashboard telemetry
- Print help output

It must not:

- Deploy
- Delete files
- Modify the landing page
- Execute recommended remediation work
- Write to Obsidian
- Start or stop external services
- Add agents, daemons, or new subsystems

## Failure Behavior

Known v1.0 failure behavior:

- If operational excellence refresh fails, the engine logs a warning and continues.
- If dashboard JSON parsing fails, the engine logs the parse failure and continues with empty fallback data.
- If no backlog items exist, the report states that no pending priorities exist.
- If `dashboard/public/dashboard-data.json` exists and can be written, the engine injects `supernovaBriefing`.
- If the dashboard data file is absent, report and log generation can still complete.

## Known Limitations

- `STRATEGIC_WEIGHTS` is configured but not applied by the current score calculation.
- The report and log date are fixed to `2026-06-01`.
- The dashboard source currently stores but does not visibly render `supernovaBriefing`.
- There are no dedicated Supernova unit tests.
- The project-level `npm run test` currently exits with code 1 because no matching test files exist.
- Running the strategy engine appends log entries and rewrites generated outputs, so repeated verification runs are visible in the dirty working tree.

## v1.0 Baseline Declaration

The current Phase 12M implementation is declared:

**Supernova Executive Intelligence v1.0**

This baseline includes the implemented configuration, strategy runner, help utility, CLI registrations, report/log output, dashboard telemetry injection, and router contract described in this specification.
