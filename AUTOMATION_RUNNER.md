# 🌌 Local Automation Runner

## Purpose
The Local Automation Runner provides a safe, structured execution environment for running maintenance, validation, and diagnostic checks inside the Brilliantaire OS ecosystem. It executes approved routine check-lists in a sequential pipeline and records telemetry for audits.

## Allowed Routines
1. **`daily-check`**: Runs daily health and maintenance verification checks.
   - Commands: `audit`, `brief`, `next`, `mesh-telemetry snapshot`, `mesh-telemetry report`, `dashboard-export`
   - Owning Agent: `Workflow Auditor`
   - Risk: Low
2. **`campaign-check`**: Monitors active campaign status and performance metrics.
   - Commands: `campaign-simulate status sporty`, `mesh-telemetry campaign sporty`, `dashboard-export`
   - Owning Agent: `Creative Revenue Strategist`
   - Risk: Low
3. **`voice-check`**: Validates the vocal bridge queue and pending speech announcements.
   - Commands: `voice-pending`, `mesh-telemetry report`, `dashboard-export`
   - Owning Agent: `Workflow Auditor`
   - Risk: Low

## Safety Rules & Boundaries
- **No External Connections**: Do not query external APIs or databases. Keep all telemetry local.
- **No Auto-Posting**: Do not publish posts or updates automatically to public feeds.
- **No Non-Local Scheduling**: Do not schedule jobs on external triggers or third-party crons.
- **No Destructive Actions**: Never execute commands that delete files, wipe databases, or drop columns.
- **Strict Allowlist Execution**: Only allowlisted commands registered in `config/commands.ts` are permitted.
- **No Shell Bypass**: Under no circumstance should arbitrary shell execution (`exec` with unvalidated input) be bypassable.

## The Safe Command Router Boundary
All commands in a routine are forced to execute through the **Safe Command Router** using:
```bash
npm run command -- "<allowed command>"
```
Direct calls to script files are blocked. The Safe Command Router acts as a gateway that checks permissions, validates agent ownership, evaluates risk profiles, and restricts aliases if the command requires exact naming (e.g. `automation-runner`).

## Execution Examples
To run routines locally:
```bash
npm run automation-runner -- "daily-check"
npm run automation-runner -- "campaign-check"
npm run automation-runner -- "voice-check"
```
Or check the routines and their configs:
```bash
npm run automation-help
```

## Future Scheduling Boundary
Any daemon or cron-based automatic triggering (such as via system LaunchAgents or global cron tools) must only be set up after the local runner passes all manual integration tests and is verified stable.
