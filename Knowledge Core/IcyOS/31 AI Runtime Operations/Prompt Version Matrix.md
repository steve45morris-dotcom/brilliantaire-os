# 📊 Prompt Version Matrix: Release 0.2
`Status: Active` | `Scope: Operations`

This matrix tracks the active, deprecated, and proposed template versions deployed in IcyOS.

---

## 🗺️ Prompt Versions Ledger

| Template ID | Version | Status | Capability Required | Output Format | Last Updated |
|---|---|---|---|---|---|
| `TEMPLATE-INBOX_PARSING` | `1.0.0` | 🟩 Active | `fast` | JSON | 2026-07-03 |
| `TEMPLATE-TIMELINE_GENERATION` | `1.0.0` | 🟩 Active | `heavy` | JSON | 2026-07-03 |
| `TEMPLATE-REFLECTION_SUMMARIZATION`| `1.0.0` | 🟩 Active | `heavy` | JSON | 2026-07-03 |
| `TEMPLATE-EXECUTIVE_BRIEFING` | `1.0.0` | 🟩 Active | `reasoning` | Plain Text | 2026-07-03 |
| `TEMPLATE-KNOWLEDGE_QUERY` | `1.0.0` | 🟩 Active | `local` | Plain Text | 2026-07-03 |

---

## 🛡️ Validation & Deployment Gates
1. **Schema Check**: All prompt versions modifying JSON outputs must include equivalent Zod schemas.
2. **Local Test Pass**: Upgraded prompt versions must pass the `@icyos/ai` unit test verification before master merge.

*I build before burning.*
