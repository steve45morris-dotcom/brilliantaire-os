# 🎙️ Sentinel OS: Voice Session Recorder Status
*Report Timestamp: {{TIMESTAMP}}*

## System Bindings & Directory Configurations
- Recordings Output: `{{REC_RECORDINGS_DIR}}`
- Session Metadata: `{{REC_METADATA_DIR}}`
- ASR Staging Input: `{{REC_ASR_INPUT_DIR}}`
- Archive Output: `{{REC_ARCHIVE_DIR}}`
- Rejected Staging: `{{REC_REJECTED_DIR}}`

## Safety Configuration Matrix
- Live Microphone Enabled: `{{LIVE_MIC_ENABLED}}`
- Background Recording Active: `{{BACKGROUND_RECORDING_ENABLED}}`
- Auto Transcribe Trigger: `{{AUTO_TRANSCRIBE}}`
- Auto Approve Transcript: `{{AUTO_APPROVE}}`
- Auto Execute Commands: `{{AUTO_EXECUTE}}`
- Human Confirmation Needed: `{{CONFIRMATION_REQUIRED}}`

## Session Staging Telemetry
- Total Sessions Recorded: `{{TOTAL_SESSIONS}}`
- Active / Recording Session: `{{ACTIVE_SESSION}}`
- Staged for ASR Count: `{{STAGED_COUNT}}`
- Rejected Session Count: `{{REJECTED_COUNT}}`
- Archived Session Count: `{{ARCHIVED_COUNT}}`

## Recorder Backend Diagnostic
- Detected Backend Binaries: `{{DETECTED_BACKEND}}`
- Availability Status: `{{BACKEND_STATUS}}`
