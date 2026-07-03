# ⚙️ Context Assembly Engine: Release 0.4
`Status: Active` | `Scope: Context Engine`

This document details the context assembly pipeline mapping related notes, files, decisions, and signals together.

---

## 🏗️ Context Assembly Pipeline
When a mission is loaded, the Context Engine dynamically fetches:
1. **Obsidian Notes**: Vault notes linked to active mission objectives.
2. **Calendar Events**: External schedules matching focus times.
3. **Decisions Log**: Recent architectural decisions linked to active categories.
4. **Learning Signals**: Prior focus blockers and wins aggregated by `@icyos/learning`.

---

## ⚡ Output Payload Spec
The engine returns a singular consolidated payload for LLM/UI queries:
- `notes`: Related notes arrays.
- `calendar_events`: Conflict warnings.
- `files`: File paths arrays.
- `recent_decisions`: Decisions matrices.
- `learning_signals`: Performance summaries.

*I build before burning.*
