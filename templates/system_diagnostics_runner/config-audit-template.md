# System Diagnostics — Config Audit Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Command Registry Summary

| Metric | Value |
|---|---|
| Total Commands | {{TOTAL_COMMANDS}} |
| Enabled | {{ENABLED_COUNT}} |
| Disabled | {{DISABLED_COUNT}} |
| Duplicates | {{DUPLICATE_COUNT}} |

## Risk Level Breakdown

| Risk Level | Count |
|---|---|
{{RISK_TABLE}}

## Duplicate Commands

{{DUPLICATES}}

---

## Review Checklist

- [ ] Command count verified
- [ ] Duplicates resolved
- [ ] Risk levels appropriate
- [ ] Report approved

## Safety Notes

- This report is read-only. No registry entries are modified.
- Duplicate detection is name-based exact matching.
