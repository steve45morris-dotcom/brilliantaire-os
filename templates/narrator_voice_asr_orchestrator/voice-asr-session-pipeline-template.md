# 🔎 Voice-ASR Session Pipeline: {{SESSION_ID}}
*Queried At: {{TIMESTAMP}}*

## 1. Input Source & Metadata
- Session Name Tag: `{{SESSION_NAME}}`
- Audio File Path: `{{AUDIO_PATH}}`
- Duration Recorded: `{{DURATION_SECONDS}} seconds`
- Recording Status: `{{RECORDING_STATUS}}`

## 2. Pipeline Tracking States
- [{{ASR_DISPATCHED_STATE}}] ASR Input Copy Staged
  - Target Path: `{{ASR_INPUT_PATH}}`
- [{{ASR_TRANSCRIBED_STATE}}] ASR Transcript Generated
  - Target Path: `{{ASR_TRANSCRIPT_PATH}}`
- [{{ASR_STAGED_STATE}}] Staged Command Packet Generated
  - Target Path: `{{ASR_STAGED_PATH}}`
- [{{ASR_APPROVED_STATE}}] Operator Approved Staging
  - Target Path: `{{ASR_APPROVED_PATH}}`

## 3. Downstream Execution Audit (Manual Confirmation Gated)
- Bridge Ready: `{{BRIDGE_READY}}`
- Bridge Executed: `{{BRIDGE_EXECUTED}}`
- Execution Status: `{{EXECUTION_STATUS}}`
