# Documentation Drift Detector — Pointer Audit Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## SYSTEM_STATUS.md "Next Upgrade" Pointer

| Field | Value |
|---|---|
| Current Pointer | {{CURRENT_POINTER}} |
| Pointer Found | {{POINTER_FOUND}} |
| NEXT_ACTIONS.md Exists | {{NEXT_ACTIONS_EXISTS}} |
| Pointer Status | {{POINTER_STATUS}} |

## Detail

{{POINTER_DETAIL}}

## Verdict

**{{VERDICT}}** — {{VERDICT_DETAIL}}

---

## Review Checklist

- [ ] Pointer text verified
- [ ] NEXT_ACTIONS.md completion status checked
- [ ] Stale pointer updated if needed
- [ ] Report approved

## Safety Notes

- This report is read-only. No pointers or status files are modified.
- Human approval required to update any system status entries.
