# 🛰️ Sentinel OS: Voice ASR Orchestrator Status
*Report Timestamp: {{TIMESTAMP}}*

## Directory Bindings & Queues
- Sessions Metadata: `{{SESSIONS_METADATA_DIR}}`
- ASR Inputs: `{{ASR_INPUT_DIR}}`
- ASR Transcripts: `{{ASR_TRANSCRIPTS_DIR}}`
- Staged Commands: `{{ASR_STAGED_DIR}}`
- Approved Targets: `{{ASR_APPROVED_DIR}}`

## Safety Configuration Badges
- Auto Transcribe after stop: `{{AUTO_TRANSCRIBE}}`
- Auto Stage after transcribe: `{{AUTO_STAGE}}`
- Auto Approve transcript: `{{AUTO_APPROVE}}`
- Auto Execute commands: `{{AUTO_EXECUTE}}`
- Duplicate Dispatch Lock: `{{DUPLICATE_PROTECTION}}`

## Staging Pipelines Summary
- Total Capture Sessions Scanned: `{{TOTAL_SESSIONS}}`
- Staged-for-ASR Count: `{{DISPATCHED_ASR}}`
- Transcribed Count: `{{TRANSCRIBED}}`
- Staged-Command Count: `{{STAGED}}`
- Approved Staging Count: `{{APPROVED}}`
- Blocked Staging Count: `{{BLOCKED}}`

## Orchestration System State
- ASR Listener Backend: `{{ASR_LISTENER_STATUS}}`
- Validation Enforcement: `Strict Manual Gates`
