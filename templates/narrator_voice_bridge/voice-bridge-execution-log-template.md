# 🧾 Voice Bridge: Command Execution Audit Record
*Packet ID: {{PACKET_ID}}*
*Execution Timestamp: {{TIMESTAMP}}*

## Execution Context
- Mapped CLI Command: `{{CLI_COMMAND}}`
- Target Router Dispatch: `npm run command -- "{{EXACT_ROUTER_COMMAND}}"`
- System User / Operator: `Manual Bridge Dispatch`

## Process Results
- Execution Status Code: `{{EXIT_CODE}}`
- Run Outcome: `{{RUN_OUTCOME}}`

### Standard Output (Stdout) Summary
```text
{{STDOUT_SUMMARY}}
```

### Standard Error (Stderr) Summary
```text
{{STDERR_SUMMARY}}
```

---
*Manual review gate execution completed. Registered in audit logs.*
