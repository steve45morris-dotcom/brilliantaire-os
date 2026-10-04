# Obsidian Sync Layer — Sync Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Pipeline Health

{{CHECK_TABLE}}

**Overall:** {{OVERALL_STATUS}} ({{PASS_COUNT}}/{{TOTAL_CHECKS}})

## Module Coverage

{{MODULE_COVERAGE}}

## Summary

- **Total Staged Files:** {{TOTAL_STAGED}}
- **Modules with Files:** {{MODULES_WITH_FILES}} of {{TOTAL_MODULES}}
- **Vault Path:** {{VAULT_PATH}}

---

## Review Checklist

- [ ] All pipeline checks reviewed
- [ ] Safety flag consistency confirmed
- [ ] Upstream source availability verified
- [ ] Module coverage gaps identified
- [ ] Sync readiness assessed

## Safety Notes

- This report is read-only. No pipeline components are modified.
- No vault writes or sync operations are performed.
- Human approval required for all remediation actions.
