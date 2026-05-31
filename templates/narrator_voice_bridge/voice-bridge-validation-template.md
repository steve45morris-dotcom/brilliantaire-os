# 🛡️ Voice Bridge: Command Validation Gate
*Packet ID: {{PACKET_ID}}*
*Validated At: {{TIMESTAMP}}*

## Verification Checklist
- [ ] Mapped command is present: `{{HAS_MAPPED_COMMAND}}`
- [ ] Command matches whitelisted router exact entry: `{{IS_WHITELISTED}}`
- [ ] Safe length check (<= {{MAX_LEN}} chars): `{{IS_SAFE_LENGTH}}`
- [ ] Command contains no forbidden characters or chaining operators: `{{NO_SHELL_INJECTION}}`
- [ ] Packet timestamp is within allowed age: `{{IS_FRESH_PACKET}}`
- [ ] Transcript confidence >= threshold: `{{IS_CONFIDENT}}`

## Safety Result Decision
- Validation Gate Status: `{{VALIDATION_STATUS}}`
- Target Script Execution Mode: `{{EXECUTION_MODE}}`
- Blocker/Error Report: `{{ERROR_MESSAGE}}`
