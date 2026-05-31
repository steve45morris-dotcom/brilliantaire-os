# 📊 Sentinel OS: Voice Session Recorder Summary
*Export Timestamp: {{TIMESTAMP}}*

## 1. Operational Overview
- Total Sessions Captured: `{{TOTAL_SESSIONS}}`
- Staged to ASR Inputs: `{{STAGED_COUNT}}`
- Rejected Session Files: `{{REJECTED_COUNT}}`
- Archived Session Files: `{{ARCHIVED_COUNT}}`

## 2. Safety Enforcement Checklist
- [x] Live Microphone Active by Default: Banned (`{{LIVE_MIC_ENABLED}}`)
- [x] Background Daemon Capture: Banned (`{{BACKGROUND_RECORDING_ENABLED}}`)
- [x] Auto-Transcribe Triggers: Banned (`{{AUTO_TRANSCRIBE}}`)
- [x] Human Confirmation Gate: Enforced (`{{CONFIRMATION_REQUIRED}}`)

## 3. Recording Devices / Binaries
- Detected System Tooling: `{{DETECTED_BACKEND}}`

## 4. Audio Quality Requirements
- Audio Formats Allowed: `{{ALLOWED_FORMATS}}`
- Default Staged format: `{{DEFAULT_FORMAT}}`
- Maximum Length Bound: `{{MAX_DURATION_SECONDS}} seconds`
