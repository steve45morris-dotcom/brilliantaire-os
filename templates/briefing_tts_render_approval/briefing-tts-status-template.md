# 🔊 Briefing TTS Render Approval Flow Status
*Timestamp: {{TIMESTAMP}}*

## Monitored Directories
- Scheduled Briefing TTS Requests: `{{BRIEFING_TTS_REQUEST_DIR}}`
- Narrator TTS Pending Queue: `{{NARRATOR_TTS_PENDING_DIR}}`
- Narrator TTS Approved Queue: `{{NARRATOR_TTS_APPROVED_DIR}}`
- Rendered Audio Output: `{{NARRATOR_TTS_RENDERED_AUDIO_DIR}}`

## Flow Safety Configuration
- Auto Approve TTS Requests: `{{AUTO_APPROVE_TTS}}`
- Auto Render Approved Requests: `{{AUTO_RENDER_TTS}}`
- Local Audio Playback: `{{AUTO_PLAYBACK}}`
- Cloud TTS Enabled: `{{CLOUD_TTS_ENABLED}}`
- Duplicate Render Protection: `{{DUPLICATE_RENDER_PROTECTION}}`
- Manual Confirmation Required: `{{MANUAL_CONFIRMATION_REQUIRED}}`
- Max Text Length Cap: `{{MAX_TEXT_LENGTH}}` characters

## State Counters
- Generated Briefing TTS Requests: `{{GENERATED_COUNT}}`
- Submitted Requests (Pending): `{{SUBMITTED_COUNT}}`
- Approved Requests: `{{APPROVED_COUNT}}`
- Rendered Audio Files: `{{RENDERED_COUNT}}`
- Blocked / Rejected Requests: `{{BLOCKED_COUNT}}`

## Active Pipeline Context
- Latest Briefing ID: `{{LATEST_BRIEFING_ID}}`
- Latest Rendered Audio Path: `{{LATEST_RENDERED_PATH}}`
