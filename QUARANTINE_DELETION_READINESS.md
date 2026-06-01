# 🩺 Quarantine Deletion Readiness Staging Gate (Phase 12G)

This staging gate implements a safe, read-only system that checks quarantined duplicate files, restore maps, checksum reports, and monitoring age before any future permanent deletion phase is considered.

## 🛡️ Staging Safety Guardrails

In strict compliance with the One System safety policies, this phase enforces the following rules:
1. **Read-Only Gate:** Absolutely no files are deleted, unlinked, or mutated. No `rm` or `unlink` commands are executed.
2. **Restore Map Verification:** Validates that a complete restore shell script mapping is present and fully covers all quarantined files.
3. **Checksum Verification:** Inspects existing checksum validation records to guarantee zero data loss.
4. **Age Audit Check:** Enforces that quarantined items remain in the monitoring period for at least the configured minimum days (default: 7 days) before being eligible for future deletion.
5. **No Auto-Deletion:** The actual deletion status is locked at disabled. Only a future independent phase, with explicit developer confirmation and separate command routing, can perform pruning.

## 💻 CLI Commands

Run these subcommands using npm scripts or the Safe Command Router:

```bash
# 1. Print help menu and security settings
npm run quarantine-deletion-readiness-help

# 2. Scan quarantine folder and manifest listings
npm run quarantine-deletion-readiness -- "scan"

# 3. Audit restore script coverage without executing it
npm run quarantine-deletion-readiness -- "restore-check"

# 4. Compute days elapsed since quarantine and check threshold eligibility
npm run quarantine-deletion-readiness -- "age-check"

# 5. Generate unified deletion readiness markdown report
npm run quarantine-deletion-readiness -- "readiness-report"

# 6. Generate future checklist for eventual manual deletion phases
npm run quarantine-deletion-readiness -- "future-checklist"

# 7. Print summary status dashboard on the console
npm run quarantine-deletion-readiness -- "status"
```

## 📦 Generated Outputs
Reports are saved with a timestamp suffix to preserve past audit history:
- Scan report: `outputs/cleanup/deletion_readiness/reports/quarantine_deletion_scan_YYYY-MM-DD.md`
- Restore validation: `outputs/cleanup/deletion_readiness/reports/quarantine_restore_validation_YYYY-MM-DD.md`
- Age verification: `outputs/cleanup/deletion_readiness/reports/quarantine_age_check_YYYY-MM-DD.md`
- Readiness report: `outputs/cleanup/deletion_readiness/reports/quarantine_deletion_readiness_report_YYYY-MM-DD.md`
- Future checklist: `outputs/cleanup/deletion_readiness/checklists/future_deletion_checklist_YYYY-MM-DD.md`
