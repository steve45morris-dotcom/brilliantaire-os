# Bridge Health Monitor — Anomaly Scan

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Anomaly Summary

**{{VERDICT}}** — {{VERDICT_SUMMARY}}

## Anomalies Detected

{{ANOMALY_LIST}}

## Anomaly Breakdown

| Category | Count |
|---|---|
| Missing Safety Flags | {{MISSING_FLAGS_COUNT}} |
| Missing BRIDGE_MODE | {{MISSING_MODE_COUNT}} |
| Missing Output Dirs | {{MISSING_DIRS_COUNT}} |
| Safety Flag Violations | {{VIOLATION_COUNT}} |

## Total

- Bridges Scanned: {{TOTAL_BRIDGES}}
- Anomalies Found: {{TOTAL_ANOMALIES}}

---

## Review Checklist

- [ ] All anomalies reviewed
- [ ] Missing safety flags added
- [ ] BRIDGE_MODE declarations added
- [ ] Output directories created
- [ ] Report approved

## Safety Notes

- This report is read-only. No files are modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
