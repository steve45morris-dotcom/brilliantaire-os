# Audio Drop Cleanup Report
*Scan Date: {{SCAN_DATE}}*

## 1. Safety Audit Summary
* **Valid Audio Ready For ASR:** `{{VALID_AUDIO_COUNT}}`
* **Files Needing Rename:** `{{RENAME_COUNT}}`
* **Duplicate Candidates:** `{{DUPLICATE_COUNT}}`
* **Unsupported Files:** `{{UNSUPPORTED_COUNT}}`
* **Unmatched Sessions:** `{{UNMATCHED_SESSIONS_COUNT}}`
* **Staged Transcription Records:** `{{STAGED_RECORDS_COUNT}}`

## 2. Validation Details
### Valid Audio Candidates
{{VALID_AUDIO_LIST}}

### Files Needing Attention
{{RENAME_LIST}}

## 3. Cleanup Recommendations
{{CLEANUP_RECOMMENDATIONS}}

## 4. ASR Readiness Impact
* **Staged Audio Input Found:** `{{STAGED_AUDIO_FOUND}}`
* **Current ASR Readiness Status:** `{{ASR_READINESS_STATUS}}`
* **Recommended Next Step:** {{NEXT_ACTION}}
