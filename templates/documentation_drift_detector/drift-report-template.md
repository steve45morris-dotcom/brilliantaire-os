# Documentation Drift Detector — Comprehensive Drift Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Overall Verdict

**{{VERDICT}}** — {{VERDICT_SUMMARY}}

## Audit Results

| Audit | Result | Issues Found |
|---|---|---|
| System Index Scan | {{INDEX_SCAN_RESULT}} | {{INDEX_SCAN_ISSUES}} |
| Command Audit | {{COMMAND_AUDIT_RESULT}} | {{COMMAND_AUDIT_ISSUES}} |
| Pointer Audit | {{POINTER_AUDIT_RESULT}} | {{POINTER_AUDIT_ISSUES}} |
| Narration Audit | {{NARRATION_AUDIT_RESULT}} | {{NARRATION_AUDIT_ISSUES}} |

## Drift Items

{{DRIFT_ITEMS}}

## Summary Statistics

| Metric | Value |
|---|---|
| Total Audits Run | {{TOTAL_AUDITS}} |
| Total Issues | {{TOTAL_ISSUES}} |
| Critical Issues | {{CRITICAL_ISSUES}} |
| System Indexes Checked | {{INDEXES_CHECKED}} |

---

## Review Checklist

- [ ] All audit sections reviewed
- [ ] Critical drift items addressed
- [ ] Stale pointers updated
- [ ] Missing documentation added
- [ ] Report approved

## Safety Notes

- This report is read-only. No files are modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
