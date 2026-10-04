# System Diagnostics — Comprehensive Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Overall Health:** {{OVERALL_HEALTH}}

---

## Health Check Results

| Target | Status | Detail |
|---|---|---|
{{HEALTH_TABLE}}

## Output Inventory

| Directory | Status | Files |
|---|---|---|
{{OUTPUT_TABLE}}

## Codebase Metrics

| Metric | Count |
|---|---|
| Scripts | {{SCRIPT_COUNT}} |
| Config Files | {{CONFIG_COUNT}} |
| Source Files | {{SRC_FILE_COUNT}} |
| Total Output Files | {{TOTAL_OUTPUT_FILES}} |

---

## Review Checklist

- [ ] Overall health verdict reviewed
- [ ] Missing targets investigated
- [ ] Output inventory complete
- [ ] Codebase metrics consistent
- [ ] Report approved for archival

## Safety Notes

- This report is read-only. No system state is modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
