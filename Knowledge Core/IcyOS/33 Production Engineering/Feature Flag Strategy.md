# 🚩 Feature Flag Strategy
\`Status: Active\` | \`Scope: Release Control\`

This document details feature flags settings and release configurations.

---

## 📋 Flag Matrix
- \`enable-ai-orchestrator\`: Toggles local deterministic rules vs LLM calls.
- \`enable-calendar-connector\`: Controls Apple & Google Calendar imports.
- \`enable-focus-reminders\`: Controls active local notification alerts.

---

## ⚡ Execution Rule
All feature flags default to \`false\` in development and can be toggled via config dashboard panels or local environment parameters.

*I build before burning.*
