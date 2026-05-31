# 🌌 Sentinel OS: Voice Loop Dashboard Status
*Report Timestamp: {{TIMESTAMP}}*

## System Directory Bindings
- ASR Transcripts: `{{ASR_TRANSCRIPTS_DIR}}`
- ASR Staged Commands: `{{ASR_STAGED_DIR}}`
- ASR Approved Intake: `{{ASR_APPROVED_DIR}}`
- Voice Bridge Ready Queue: `{{BRIDGE_READY_DIR}}`
- Voice Bridge Executed Queue: `{{BRIDGE_EXECUTED_DIR}}`
- Voice Bridge Logs Queue: `{{BRIDGE_LOG_DIR}}`

## Safety Configuration Badges
- Dashboard Mode: `{{DASHBOARD_MODE}}` (Auto Execute: `{{AUTO_EXECUTE}}`)
- Live Mic Control: `{{LIVE_MIC_ENABLED}}`
- Human Confirmation Barrier: `{{CONFIRMATION_REQUIRED}}`
- Allowable Action Sets Count: `{{ALLOWED_ACTIONS_COUNT}}`

## Diagnostics Summary Counts
- Staged / Pending Packets: `{{STAGED_COUNT}}`
- ASR Approved Intake Packets: `{{APPROVED_ASR_COUNT}}`
- Ready-to-Execute Packets: `{{READY_COUNT}}`
- Executed Packets: `{{EXECUTED_COUNT}}`
- Rejected Packets: `{{REJECTED_COUNT}}`
