# 🛠️ Maintenance Daily Check Routine

## Purpose
The Maintenance Daily Check routine acts as a central telemetry and health verification aggregator for **Brilliantaire OS**. It compiles daily status checks on the project registry health, quarantine monitoring, and cleanup deletion readiness, providing a unified report without mutating the state of the workspace.

## Why This Follows Quarantine Monitoring
As part of the system lifecycle, files that are flagged as duplicates or risks are moved to the quarantine area for a minimum 7-day monitoring period. To ensure visibility into the status of these quarantined files without risking premature deletion, the maintenance daily check gathers telemetry directly after the quarantine monitor runs, updating status flags and age checks.

## Read-Only Maintenance Rule
This routine operates under a strict **Read-Only** policy:
- **No deletions:** The scripts will never delete or unlink files automatically.
- **No mutations:** The scripts will never rename, move, or mutate quarantined contents.
- **No automated PROJECTS.md modifications:** Project mappings must not be modified dynamically during the health sweeps.
- **No arbitrary shell execution:** Commands must be executed via the Safe Command Router.

## Commands Included
The following subcommands are supported by `npm run maintenance-check`:
1. `status`: Displays current registry health status, quarantine logs, deletion readiness status, and recommended next actions.
2. `cleanup-status`: Evaluates the state of the quarantined files, restore maps, checksums, and remaining monitoring days, saving reports to `outputs/maintenance/reports/cleanup_status_YYYY-MM-DD.md`.
3. `registry-status`: Verifies the integrity of `PROJECTS.md`, detects duplicate project names/paths, and saves reports to `outputs/maintenance/reports/registry_status_YYYY-MM-DD.md`.
4. `full-report`: Aggregates audit status, registry integrity, cleanup status, and telemetry freshness, compiling a unified check report at `outputs/maintenance/reports/maintenance_daily_check_YYYY-MM-DD.md`.

## Daily-Check Integration
The main automation check `npm run automation-runner -- daily-check` is extended to execute the following commands through the Safe Command Router:
- `project-registry-health-monitor status`
- `quarantine-monitoring status`
- `quarantine-deletion-readiness status`
- `maintenance-check status`

These execute sequentially alongside existing routine commands (`audit`, `brief`, `next`, `mesh-telemetry snapshot`, etc.).

## Deletion Boundary
Permanent deletion remains blocked during the daily checks. The configuration parameters prevent any write or unlink calls on quarantined files during maintenance loops.

## Future Expiration Verification Boundary
Expiration verification and actual file pruning are bounded until the 7-day monitoring period has passed. The maintenance scripts only check deletion eligibility (`yes`/`no`) but perform no pruning or cleanup execution.
