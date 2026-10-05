# Bridge Health Monitor — Comprehensive Health Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Overall Verdict

**{{VERDICT}}** — {{VERDICT_SUMMARY}}

## Bridge Health Summary

| Bridge | Status | Issues |
|---|---|---|
{{BRIDGE_HEALTH_TABLE}}

## Issue Breakdown

| Category | Count |
|---|---|
| Bridge Missing | {{BRIDGE_MISSING_COUNT}} |
| Config Missing | {{CONFIG_MISSING_COUNT}} |
| Safety Flag Violations | {{SAFETY_VIOLATION_COUNT}} |
| Mode Mismatches | {{MODE_MISMATCH_COUNT}} |
| Export Missing | {{EXPORT_MISSING_COUNT}} |

## Detailed Findings

{{FINDINGS}}

## Summary Statistics

| Metric | Value |
|---|---|
| Total Bridges | {{TOTAL_BRIDGES}} |
| Passing | {{PASS_COUNT}} |
| Warnings | {{WARN_COUNT}} |
| Failing | {{FAIL_COUNT}} |
| Total Issues | {{TOTAL_ISSUES}} |

---

## Review Checklist

- [ ] All bridge health results reviewed
- [ ] Failing bridges investigated
- [ ] Safety flag violations addressed
- [ ] Report approved

## Safety Notes

- This report is read-only. No files are modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
