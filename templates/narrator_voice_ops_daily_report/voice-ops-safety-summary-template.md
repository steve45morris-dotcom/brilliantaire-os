# 🛡️ Daily Voice Ops Safety Summary: {{REPORT_DATE}}
*Generated At: {{TIMESTAMP}}*

## 1. Safety Alerts Metric Summary
- Fuzzy routing blocked attempts: `{{FUZZY_BLOCKED_COUNT}}`
- Injection blocks: `{{INJECTION_BLOCKED_COUNT}}`
- Duplicate dispatch blocks: `{{DUPLICATE_BLOCKED_COUNT}}`
- Rejected packets: `{{REJECTED_PACKET_COUNT}}`
- Security Alert Status: `{{SAFETY_STATUS}}`

## 2. Policy Enforcements status
- Raw shell executions block: `ENFORCED (Active)`
- Cloud synthesis/ASR APIs: `BLOCKED (Local ONNX models used)`
- Auto-execution: `BLOCKED (Human confirmation signature required)`

## 3. Log Details of Interventions
{{SAFETY_INTERVENTIONS_DETAILS}}
