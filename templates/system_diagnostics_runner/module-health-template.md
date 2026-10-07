# System Diagnostics — Module Health Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Module Summary

| Metric | Value |
|---|---|
| Total Modules | {{MODULE_COUNT}} |
| Present | {{PRESENT_COUNT}} |
| Missing | {{MISSING_COUNT}} |
| Safety Violations | {{VIOLATION_COUNT}} |

## Module Status

| Module | Status | Safety Flags |
|---|---|---|
{{MODULE_TABLE}}

## Safety Flag Violations

{{VIOLATIONS}}

---

## Review Checklist

- [ ] All modules accounted for
- [ ] Safety flag violations addressed
- [ ] Missing modules investigated
- [ ] Report approved

## Safety Notes

- This report is read-only. No module configs are modified.
- Safety flag convention: ALLOW_* defaults to false, REQUIRE_* defaults to true.
