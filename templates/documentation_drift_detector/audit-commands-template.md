# Documentation Drift Detector — Command Audit Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Command Registry Summary

| Metric | Value |
|---|---|
| Registry Commands | {{REGISTRY_COUNT}} |
| COMMANDS.md Entries | {{DOC_COUNT}} |
| package.json Scripts | {{NPM_SCRIPT_COUNT}} |

## Commands in Registry but NOT in COMMANDS.md

{{MISSING_FROM_DOCS}}

## Commands in COMMANDS.md but NOT in Registry

{{MISSING_FROM_REGISTRY}}

## Commands in Registry but Missing npm Scripts

{{MISSING_NPM_SCRIPTS}}

## Verdict

**{{VERDICT}}** — {{DRIFT_SUMMARY}}

---

## Review Checklist

- [ ] Missing documentation entries reviewed
- [ ] Missing registry entries reviewed
- [ ] Missing npm scripts reviewed
- [ ] Report approved

## Safety Notes

- This report is read-only. No commands, docs, or scripts are modified.
- Command matching is name-based exact matching.
