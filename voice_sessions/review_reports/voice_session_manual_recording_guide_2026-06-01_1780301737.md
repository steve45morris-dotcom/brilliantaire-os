# 🛠️ Voice Staging & Manual Recording Guide: 2026-06-01

This document details instructions for staging narrator and oracle voice files manually inside the voice session sandbox.

## 🧭 Purpose
To establish manual recording drop guidelines while keeping microphone recording modules disabled and holding all synthesis workflows offline.

## 📂 Target Configuration
*   **Manual Recording Folder:** `voice_sessions/manual_recordings/`
*   **Allowed Formats:** `.wav, .mp3, .m4a`
*   **Size Limit:** `100MB`

## 🏷️ Staging Requirements
1. **Naming Pattern:** Audio files should share the name prefix matching their session ID.
2. **Session Types:**
   - **narrator briefing**: Staged via manual drop protocol.
- **oracle voice note**: Staged via manual drop protocol.
- **campaign command voice**: Staged via manual drop protocol.
- **grounded insight read**: Staged via manual drop protocol.
- **system status readout**: Staged via manual drop protocol.

## 🚫 Safety Guidelines
1. **No Microphone Recording:** Automatic live microphone capture is disabled. Voice assets must be recorded using external devices and copied here.
2. **Size Constraint:** Files exceeding size limits will fail structural validation.

---
**Next Action Recommended:** Prepare manual audio recording drop and match metadata.
