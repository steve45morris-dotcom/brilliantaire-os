# 🔊 Briefing Audio Playback Review Gate Status
*Timestamp: {{TIMESTAMP}}*

## Monitored Directories
- Rendered Audio Source: `{{NARRATOR_TTS_RENDERED_AUDIO_DIR}}`
- Briefing TTS Rendered: `{{BRIEFING_TTS_RENDERED_DIR}}`
- Review Queue Directory: `{{REVIEW_QUEUE_DIR}}`
- Reviewed Approved target: `{{REVIEW_APPROVED_DIR}}`

## Playback Review Safety Configuration
- Auto Playback: `{{AUTO_PLAYBACK}}` (Disabled)
- Auto Publish: `{{AUTO_PUBLISH}}` (Disabled)
- Auto Send: `{{AUTO_SEND}}` (Disabled)
- Cloud Upload: `{{CLOUD_UPLOAD_ENABLED}}` (Disabled)
- Manual Review Required: `{{MANUAL_REVIEW_REQUIRED}}` (Active Gate)
- Duplicate Review Protection: `{{DUPLICATE_REVIEW_PROTECTION}}`
- Max File Size: `{{MAX_FILE_SIZE}}` bytes

## State Counters
- Rendered Briefing Audio Count: `{{RENDERED_COUNT}}`
- Pending Review Count: `{{PENDING_COUNT}}`
- Approved Audio Count: `{{APPROVED_COUNT}}`
- Rejected Audio Count: `{{REJECTED_COUNT}}`

## Pipeline Context
- Latest Audio ID: `{{LATEST_AUDIO_ID}}`
- Latest Approved Audio Path: `{{LATEST_APPROVED_PATH}}`
