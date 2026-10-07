# System Diagnostics — Test Suite Report

- **Report ID:** {{REPORT_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Test Results

| Metric | Value |
|---|---|
| Total Tests | {{TOTAL_TESTS}} |
| Passed | {{PASSED}} |
| Failed | {{FAILED}} |
| Skipped | {{SKIPPED}} |
| Duration | {{DURATION}} |
| Exit Code | {{EXIT_CODE}} |
| **Verdict** | **{{VERDICT}}** |

## Test Output (last 2000 chars)

```
{{TEST_OUTPUT}}
```

---

## Review Checklist

- [ ] Verdict reviewed
- [ ] Failed tests investigated (if any)
- [ ] Skipped tests are expected
- [ ] Report approved

## Safety Notes

- This report is read-only. No test state is modified.
- No external APIs or services are contacted.
- Human approval required for any remediation actions.
