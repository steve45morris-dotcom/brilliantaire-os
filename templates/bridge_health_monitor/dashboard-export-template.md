{
  "reportId": "{{REPORT_ID}}",
  "date": "{{DATE}}",
  "timestamp": "{{TIMESTAMP}}",
  "verdict": "{{VERDICT}}",
  "totalBridges": {{TOTAL_BRIDGES}},
  "passing": {{PASS_COUNT}},
  "warnings": {{WARN_COUNT}},
  "failing": {{FAIL_COUNT}},
  "totalIssues": {{TOTAL_ISSUES}},
  "categories": {
    "bridgeMissing": {{BRIDGE_MISSING_COUNT}},
    "configMissing": {{CONFIG_MISSING_COUNT}},
    "safetyViolations": {{SAFETY_VIOLATION_COUNT}},
    "modeMismatches": {{MODE_MISMATCH_COUNT}},
    "exportMissing": {{EXPORT_MISSING_COUNT}}
  },
  "bridges": [
{{BRIDGE_JSON_ROWS}}
  ]
}
