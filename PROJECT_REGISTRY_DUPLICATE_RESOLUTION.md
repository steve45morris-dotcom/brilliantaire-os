# 🛡️ Duplicate Registry Entry Resolution Gate (Phase 12F)

This gate provides a safe duplicate registry entry resolution system that reads the projects integrity findings, stages resolution recommendations, backs up `PROJECTS.md`, and applies approved line removals to prune duplicates without deleting folders or files.

## ⚖️ Operational Rationale

This system operates sequentially after the **Registry Health Monitor (Phase 12E)**:
1. **Health Monitor (Phase 12E):** Audits and detects formatting issues or duplicate name/path references.
2. **Duplicate Resolution Gate (Phase 12F):** Resolves identified row conflicts inside PROJECTS.md safely under confirmation switches.

## 🛡️ Guardrails and Safety Boundaries

1. **No Folder Deletion:** The resolution gate never deletes any project files or directories.
2. **No Quarantine Deletion:** Quarantined duplicate items are preserved in place without deletion capabilities.
3. **Mandatory Backups:** PROJECTS.md is backed up with a timestamp suffix under `outputs/project_registry/duplicate_resolution/backups/` before any write.
4. **Approval Enforcement:** Applying changes requires the explicit `--confirm` flag.
5. **No File Overwrite:** All modifications occur on a line-by-line basis, preserving section headers, structure, and comments.

## 💻 CLI Commands

Run the subcommands using npm scripts or the Safe Command Router:

```bash
# 1. Print help menu and parameter menu
npm run project-registry-duplicate-resolution-help

# 2. Scan PROJECTS.md duplicate entries
npm run project-registry-duplicate-resolution -- "scan"

# 3. Stage duplicate resolution plan
npm run project-registry-duplicate-resolution -- "stage-resolution"

# 4. Apply approved duplicate resolutions (requires confirmation)
npm run project-registry-duplicate-resolution -- "apply-approved" --confirm

# 5. Query status of scans, plans, backups, and logs
npm run project-registry-duplicate-resolution -- "status"
```

## 📂 Rollback Procedure
If any incorrect resolution occurs, the registry can be fully restored to its pre-write state:
1. Identify the backup file path in the resolution log or the backups folder.
2. Overwrite `PROJECTS.md` with the backup file contents:
   ```bash
   cp outputs/project_registry/duplicate_resolution/backups/PROJECTS_duplicate_resolution_backup_YYYY-MM-DD_HHMM.md PROJECTS.md
   ```
