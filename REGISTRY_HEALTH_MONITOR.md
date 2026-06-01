# 🩺 Registry Health Monitor (Phase 12E)

This system provides post-append verification and health audits for the projects matrix, duplicate files quarantine folder, and staging lists.

## 🛡️ Read-Only Guardrails (CIP Core)
In strict compliance with the **Collision Isolation Protocol (CIP)**, this monitor enforces a complete read-only boundary:
- **No file deletions:** The script never deletes any project files, backups, logs, or quarantined items.
- **No registry modifications:** All writes are strictly restricted to compiling health audit files in the `outputs/` folder. [PROJECTS.md](file:///Users/alexanderanthony/PROJECTS.md) is never edited.
- **No internal folder moves or execution:** Scanned project target directories are inspected for metadata only; no child scripts are run within them.

## 📊 Audit & Monitor Framework

### 1. PROJECTS.md Integrity Check
Verifies:
- Physical file presence.
- Syntax validity of table rows (columns count and cell bounds).
- Duplicate project name detection (case-insensitive).
- Duplicate project path detection.
- Presence of malformed or misaligned rows.

### 2. Skipped Candidates Audit
Inspects:
- Unregistered folders that were skipped by the Appending Gate.
- Matches their skipped reasons (e.g. duplicates, `active_experiment` label, or `inspect_manually` label) to suggest manual developer review actions.

### 3. Quarantine Duplicates Monitor
Inspects:
- The quarantine folder `outputs/cleanup/quarantine/` for staged file counts.
- Verifies checksum report presence and backup restore mapping script existence.
- Calculates elapsed time (days since quarantine).
- **Enforces Deletion Eligibility:** Returns `no` (deletion remains disabled during monitoring).

## ⚙️ CLI Subcommands

Execute audits using npm scripts or the Safe Command Router:

```bash
# 1. Print help menu and parameter checks
npm run project-registry-health-monitor-help

# 2. Audit PROJECTS.md matrix format, names, and paths for duplicates
npm run project-registry-health-monitor -- "verify-projects"

# 3. List candidates skipped by the append gate and suggest actions
npm run project-registry-health-monitor -- "skipped-candidates"

# 4. Monitor quarantine folder file counts, checksums, and safety duration
npm run project-registry-health-monitor -- "quarantine-status"

# 5. Compile all summaries into a unified markdown health report
npm run project-registry-health-monitor -- "health-report"

# 6. Display a console dashboard summarizing latest statuses
npm run project-registry-health-monitor -- "status"
```

## 📦 Generated Outputs
All files are timestamped to prevent overrides:
- Integrity check: `outputs/project_registry/health_monitor/reports/projects_integrity_check_YYYY-MM-DD.md`
- Skipped candidates review: `outputs/project_registry/health_monitor/reports/skipped_candidates_review_YYYY-MM-DD.md`
- Quarantine monitor log: `outputs/project_registry/health_monitor/reports/quarantine_monitor_YYYY-MM-DD.md`
- Unified health summary: `outputs/project_registry/health_monitor/reports/registry_health_report_YYYY-MM-DD.md`

## 🔮 Future Cleanup Phase Boundary
Permanent file deletions of quarantined duplicates remain strictly blocked. In a future approved phase, after a defined monitoring period, a command with explicit `--confirm` signatures may prune quarantined assets. This phase remains 100% read-only.
