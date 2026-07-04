# 📝 Logging Standard
\`Status: Active\` | \`Scope: Logging\`

This document outlines the structured logging payload standards.

---

## 📋 Standard Logging Fields
Every log message must match the following JSON pattern:

```json
{
  "timestamp": "2026-07-04T12:00:00Z",
  "level": "INFO | WARN | ERROR",
  "correlation_id": "uuid-v4",
  "service": "SessionService",
  "message": "Focus session started",
  "context": {}
}
```

*I build before burning.*
