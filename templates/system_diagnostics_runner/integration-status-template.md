# System Diagnostics — Integration Status Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Integration Summary

| Metric | Value |
|---|---|
| Total Integrations | {{TOTAL_INTEGRATIONS}} |
| Present | {{PRESENT_COUNT}} |
| Missing | {{MISSING_COUNT}} |

## Integration File Status

| Integration | Status |
|---|---|
{{INTEGRATION_TABLE}}

---

## Review Checklist

- [ ] All integration modules accounted for
- [ ] Missing modules investigated
- [ ] Report approved

## Safety Notes

- This report is read-only. No integration state is modified.
- Checks file presence only; does not test runtime behavior.
