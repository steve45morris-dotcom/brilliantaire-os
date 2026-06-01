# 🛡️ Duplicate Quarantine Report

**Staging Date:** {{STAGING_DATE}}
**Status:** {{APPROVAL_STATUS}}

---

## 📦 Quarantine Queue

| Source Path | Quarantine Destination | Reason | Confidence | Restore Path | Manual Approval |
|---|---|---|---|---|---|
{{QUARANTINE_QUEUE_TABLE}}

---

## 🚫 Guardrail Enforcements
- Direct `rm` deletion is **blocked** by default under Phase 12A.
- Quarantined files must be safely copied to `outputs/cleanup/quarantine/` prior to any source removal.
