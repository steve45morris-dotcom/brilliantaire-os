# 📊 Sentinel OS: Voice ASR Pipeline Telemetry Summary
*Export Timestamp: {{TIMESTAMP}}*

## 1. Pipeline Metrics Summary
- Dispatched to ASR: `{{DISPATCHED_ASR_COUNT}}`
- Transcribed Sessions: `{{TRANSCRIBED_COUNT}}`
- Staged Command Packets: `{{STAGED_COUNT}}`
- Approved Command Packets: `{{APPROVED_COUNT}}`

## 2. Safety Control Checklists
- [x] Auto Transcribe triggers: Disabled (`{{AUTO_TRANSCRIBE}}`)
- [x] Auto Stage triggers: Disabled (`{{AUTO_STAGE}}`)
- [x] Auto Approve triggers: Disabled (`{{AUTO_APPROVE}}`)
- [x] Duplicate Dispatch Protection: Enabled (`{{DUPLICATE_PROTECTION}}`)

## 3. Registered Staging Channels
- Recordings folder: `{{RECORDINGS_DIR}}`
- ASR Intake: `{{ASR_INPUT_DIR}}`
- Transcripts: `{{ASR_TRANSCRIPTS_DIR}}`
- Staged Commands: `{{ASR_STAGED_DIR}}`
