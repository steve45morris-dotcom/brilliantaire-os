# 📊 Sentinel OS: Voice Loop Execution Overview
*Snapshot Timestamp: {{TIMESTAMP}}*

## Voice Pipeline State Map

```mermaid
graph LR
    subgraph ASR Engine
        ST[Staged: {{STAGED_COUNT}}] -->|Approved| AP[Approved: {{APPROVED_ASR_COUNT}}]
    end
    subgraph Voice Bridge
        AP -->|Prepare| RD[Ready: {{READY_COUNT}}]
        RD -->|Execute| EX[Executed: {{EXECUTED_COUNT}}]
        RD -->|Reject| RJ[Rejected: {{REJECTED_COUNT}}]
    end
```

## Staging & Lifecycle Metrics
- ASR Transcripts: `{{ASR_TRANSCRIPTS_COUNT}}`
- ASR Staged Packets: `{{STAGED_COUNT}}`
- Approved ASR Intake: `{{APPROVED_ASR_COUNT}}`
- Voice Bridge Ready Packets: `{{READY_COUNT}}`
- Voice Bridge Executed Packets: `{{EXECUTED_COUNT}}`
- Voice Bridge Rejected Packets: `{{REJECTED_COUNT}}`
- Log Entries Captured: `{{LOGS_COUNT}}`

---
*Manual review gate active. Use dashboard commands to inspect or manage packets.*
