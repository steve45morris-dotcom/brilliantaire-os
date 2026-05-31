# ⚠️ TTS Risk Report: 2026-05-31

This report logs safety findings, template gaps, and potential command execution risks in the staged script assets.

## 🚨 Security & Formatting Risk Findings

| Risk Type | File | Finding | Severity | Recommended Fix |
|---|---|---|---|---|
| Command Injections | Grounded scripts | Short Script: Contains potential command injection character.; Medium Script: Contains potential command injection character.; Long Script: Contains potential command injection character. | High | Strip characters ; & | and $() |
| External Reference | None | No external URLs detected | Low | None required |
| Empty Sections | None | No uncompiled placeholders found | Low | None required |
| Source Brief Match | None | Source reference verified | Low | None required |
| Status Conflicts | Queue Packet | Completed audio files detected or status conflicts | High | Reset audio generation status to not_started |

---

## 🔒 Safety Verification
No audio compiler engine can be run while high-severity risk items remain open.
