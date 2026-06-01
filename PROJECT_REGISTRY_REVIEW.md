# 🧭 Project Registry Drift Review (Phase 12C)

This system reviews local directories to identify "drift" between files present on the filesystem and the active project entries listed in [PROJECTS.md](file:///Users/alexanderanthony/PROJECTS.md).

## 🛡️ Review-Only Safety Gate (CIP Core)
To enforce the **Collision Isolation Protocol (CIP)** and preserve design sovereignty, this system operates under a strict read-only boundary:
- **No auto-edits to PROJECTS.md:** All directory additions or edits must be staging candidate proposals for manual operator review.
- **No folder moves or deletions:** The script only reads metadata (timestamps, signature files) and writes reports.
- **No external commands:** Absolutely no process executions or code runs are initiated within scanned target folders.
- **No arbitrary shell execution:** Bypassing the Safe Command Router is strictly forbidden.

## 📁 Scan Roots & Signatures
Scanned Root Directories:
- `/Users/alexanderanthony/Projects/`
- `/Users/alexanderanthony/TreeGrooveProjects/`

Project Signature Files detected:
- `package.json`
- `pyproject.toml`
- `Cargo.toml`
- `go.mod`
- `pubspec.yaml`
- `Taskfile.yml`
- `README.md`
- `.git`
- `docker-compose.yml`

## 🏷️ Classification System

### Classification Labels:
- `register`: Active or strategically relevant codebase worthy of entry in the main projects matrix.
- `active_experiment`: Recently modified folder with unclear long-term strategy but active workspace history.
- `archive_candidate`: Stale, inactive directory with low value, suitable for cleanup.
- `ignore`: Build cache, package dependencies, templates, vendors, or test runners.
- `dependency_or_template`: Starter template, clone, or dependency package.
- `inspect_manually`: Insufficient metadata signal requiring direct developer auditing.

### Activity Labels:
- `recent`: Folder modified within the last 30 days.
- `active`: Folder modified within the last 90 days.
- `stale`: Folder modified over 90 days ago.
- `unknown`: Missing files or unreadable system timestamps.

### Scoring Method:
Confidence score is computed out of 100 based on matching parameters:
- Presence of `.git` (+30% confidence)
- Multiple project signature files (e.g. `package.json` + `Taskfile.yml`) (+20% each, capped)
- Non-empty directory contents (+20%)
- Recent last modified timestamp match (+20%)
- Clear alignment with designated activity markers (+10%)

## ⚙️ Available Commands

Execute tasks through npm scripts or the Safe Command Router:

```bash
# 1. Print help menu and description of commands
npm run project-registry-review-help

# 2. Classify unregistered directories and generate classification file
npm run project-registry-review -- "classify"

# 3. Generate candidate PROJECTS.md table rows for manual review
npm run project-registry-review -- "staged-entries"

# 4. Generate high-level counts and top-10 candidate summaries
npm run project-registry-review -- "summary"

# 5. Generate action group tasks, reasons, and manual checklist
npm run project-registry-review -- "action-plan"

# 6. Print console summary status of all generated outputs
npm run project-registry-review -- "status"
```

## 📦 Output Artifacts
All reports are generated with a timestamped suffix to avoid overwriting existing logs:
- Classification Profile: `outputs/project_registry/classification/project_classification_YYYY-MM-DD.md`
- Staged matrix proposals: `outputs/project_registry/staged_entries/project_registry_candidate_entries_YYYY-MM-DD.md`
- System Drift Summary: `outputs/project_registry/reports/project_registry_drift_summary_YYYY-MM-DD.md`
- Review Action Plan: `outputs/project_registry/reports/project_registry_action_plan_YYYY-MM-DD.md`

## 🔮 Future Approved Registry Updater Boundary
In a future phase, a manual approval confirmation UI or script may allow safe, incremental writing of approved `register` entries to [PROJECTS.md](file:///Users/alexanderanthony/PROJECTS.md) using structured JSON commits. This phase remains strictly read-only.
