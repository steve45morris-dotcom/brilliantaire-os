# 🛰️ Sentinel OS: Voice Command Lifecycle Audit Status
*Report Timestamp: {{TIMESTAMP}}*

## Monitored Directories
- Session Metadata: `{{SESSIONS_METADATA_DIR}}`
- Recordings Folder: `{{SESSIONS_RECORDINGS_DIR}}`
- ASR Intake audio: `{{ASR_INPUT_DIR}}`
- ASR Transcripts: `{{ASR_TRANSCRIPTS_DIR}}`
- Staged Commands: `{{ASR_STAGED_DIR}}`
- ASR Approved: `{{ASR_APPROVED_DIR}}`
- ASR Rejected: `{{ASR_REJECTED_DIR}}`
- Voice Bridge Ready: `{{BRIDGE_READY_DIR}}`
- Voice Bridge Executed: `{{BRIDGE_EXECUTED_DIR}}`
- Voice Bridge Rejected: `{{BRIDGE_REJECTED_DIR}}`

## Safety Configuration Matrix
- Auto Execute commands: `{{AUTO_EXECUTE}}`
- Readonly Mode (Auditor): `{{READONLY_MODE}}`
- Redact Sensitive Paths: `{{REDACT_PATHS}}`
- Include Transcript Previews: `{{INCLUDE_TRANSCRIPTS}}`

## Metrics Index
- Total Scanned Events: `{{TOTAL_EVENTS}}`
- Tracked Sessions Count: `{{TRACKED_SESSIONS}}`
- Safety Anomalies Detected: `{{SAFETY_ANOMALIES}}`
- Bridge Executions Logged: `{{BRIDGE_EXECUTIONS}}`
- Blocked Commands Logged: `{{BLOCKED_COMMANDS}}`
- Latest Lifecycle Tracking ID: `{{LATEST_LIFECYCLE_ID}}`
