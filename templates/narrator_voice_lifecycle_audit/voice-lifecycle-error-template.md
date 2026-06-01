# ❌ Sentinel OS: Voice Lifecycle Audit Error Report
*Error Timestamp: {{TIMESTAMP}}*

## Details
- Lifecycle Target ID: `{{TARGET_ID}}`
- Error Code/Type: `{{ERROR_CODE}}`
- Error Message context: `{{ERROR_MESSAGE}}`

## Diagnostic Actions Recommended
- Check if the target voice session directory contains valid `.json` metadata.
- Ensure Whisper transcription files are staged with exact prefix strings.
- Validate that exact-name commands are defined in `config/commands.ts`.
