# 🛡️ Staged Registry Appending Gate (Phase 12D)

This gate controls the final process of taking candidate project entries staged during project drift review scans and safely appending them as new rows in [PROJECTS.md](file:///Users/alexanderanthony/PROJECTS.md).

## 🔒 Guardrails & Rules
To prevent repository corruption, duplication, or namespace clashes, the system enforces the following safety controls:

1. **Review-Only / No Overwrite Rule:** The gate strictly appends new matrix entries at the end of [PROJECTS.md](file:///Users/alexanderanthony/PROJECTS.md). It never rewrites, modifies, or deletes existing rows.
2. **Explicit Operator Approval Required:** Automatic registry updates are blocked. Appending requires the `--confirm` command flag.
3. **No Automatic Append-All:** Only candidates marked as `register` are eligible for append. Candidates marked as `active_experiment` or `inspect_manually` are skipped.
4. **Strict Duplicate Checking:** Before appending any candidate, its project name and absolute path are checked against all existing rows in PROJECTS.md. Staged duplicates are skipped and logged.
5. **Mandatory Backup Before Append:** Prior to any write, a timestamped backup of the current state of PROJECTS.md is generated under `outputs/project_registry/append_gate/backups/`.
6. **No File System Manipulation:** Absolutely no folders are created, moved, renamed, or deleted on the disk.
7. **No Code Execution:** No commands or scripts are run inside target project directories.

## ⚙️ Available Commands

Execute commands via npm scripts or the Safe Command Router:

```bash
# 1. Print help menu and descriptions
npm run project-registry-append-gate-help

# 2. Preview candidates, duplicates, and check safety lists
npm run project-registry-append-gate -- "preview"

# 3. Perform safety backup and append approved candidates
npm run project-registry-append-gate -- "append-approved" --confirm

# 4. View dashboard status of previews, backups, logs, and counts
npm run project-registry-append-gate -- "status"
```

## 📦 Output Artifacts
- Append Preview Report: `outputs/project_registry/append_gate/reports/project_registry_append_preview_YYYY-MM-DD.md`
- Backup files: `outputs/project_registry/append_gate/backups/PROJECTS_backup_YYYY-MM-DD_HHMM.md`
- Execution Run Logs: `outputs/project_registry/append_gate/logs/project_registry_append_log_YYYY-MM-DD.md`

## 🔄 Rollback Procedure
If an append error occurs or an entry is registered in error, rollback to the previous state using the generated backup:
```bash
cp outputs/project_registry/append_gate/backups/PROJECTS_backup_YYYY-MM-DD_HHMM.md PROJECTS.md
```
This ensures zero-risk restoration capability.
