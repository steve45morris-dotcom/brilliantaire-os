# 📋 Voice Ops Daily Report: {{REPORT_DATE}}
*Generated Timestamp: {{TIMESTAMP}}*
*Project Root Workspace: {{PROJECT_ROOT}}*
*Report Target ID: {{REPORT_ID}}*

---

## 1. Local Voice Systems Health Summary
- **Speech Synthesis (TTS) status**: `{{TTS_STATUS}}`
- **Speech Ingestion (ASR) status**: `{{ASR_STATUS}}`
- **Voice Session Recorder status**: `{{REC_STATUS}}`
- **Command Approval Bridge status**: `{{BRIDGE_STATUS}}`
- **Chronological Lifecycle Auditor status**: `{{AUDIT_STATUS}}`
- **Local Read-only Dashboard status**: `{{DASHBOARD_STATUS}}`

---

## 2. Voice Sessions Pipeline Transitions
- **Total Recorded Sessions**: `{{TOTAL_SESSIONS}}`
- **Staged for transcription**: `{{STAGED_ASR_SESSIONS}}`
- **Unsafe Rejected sessions**: `{{REJECTED_SESSIONS}}`
- **Archived sessions**: `{{ARCHIVED_SESSIONS}}`
- **Latest recorded Session ID**: `{{LATEST_SESSION_ID}}`

---

## 3. ASR Text & Command Processing
- **Total generated Transcripts**: `{{TOTAL_TRANSCRIPTS}}`
- **Staged command VNP packets**: `{{STAGED_PACKETS}}`
- **ASR Approved packets**: `{{APPROVED_PACKETS}}`
- **ASR Rejected packets**: `{{REJECTED_PACKETS}}`
- **Latest transcribed ID**: `{{LATEST_TRANSCRIPT_ID}}`

---

## 4. Approval Bridge & Command Router
- **Ready in Bridge queue**: `{{BRIDGE_READY_PACKETS}}`
- **Executed via Human Release**: `{{BRIDGE_EXECUTED_PACKETS}}`
- **Rejected packets in Bridge**: `{{BRIDGE_REJECTED_PACKETS}}`
- **Latest executed command route**: `{{LATEST_EXECUTED_ROUTE}}`
- **Latest bridge run log file**: `{{LATEST_BRIDGE_LOG}}`

---

## 5. Timeline Correlation Metrics
- **Latest lifecycle target ID**: `{{LATEST_LIFECYCLE_ID}}`
- **Active tracking stage state**: `{{LATEST_LIFECYCLE_STATE}}`
- **Scanned blocked events**: `{{BLOCKED_EVENT_COUNT}}`
- **Scanned safety anomalies**: `{{SAFETY_EVENT_COUNT}}`
- **Lifecycle Markdown report file**: `{{TIMELINE_REPORT_PATH}}`

---

## 6. Security & Policy Violations Timeline
### fuzzy commands blocked
{{FUZZY_BLOCKS}}

### injection attempts blocked
{{INJECTION_BLOCKS}}

### duplicate dispatch blocks
{{DUPLICATE_BLOCKS}}

### rejected unsafe packets
{{REJECTED_PACKETS_LIST}}

---

## 7. Strategic Recommendations
- **Next recommended phase**: `{{NEXT_RECOMMENDED_PHASE}}`
- **Smallest repair needed**: `{{SMALLEST_REPAIR}}`
- **Risk Assessment Level**: `{{RISK_LEVEL}}`
- **Daily operational recommendation**:
  `{{OPERATIONAL_RECOMMENDATION}}`

---
## 8. Footer
“I build before burning.”
