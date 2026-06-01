# 🔧 TTS Synthesis Manual Enable Instructions: 2026-06-01

This guide outlines the required steps to enable local offline text-to-speech audio synthesis.

## 📝 Required Environmental Flags
*   **Environment Variable Name:** `TTS_AUDIO_GENERATION_ENABLED`
*   **Required Value:** `true`

> [!WARNING]
> **Security Rule:** Never commit real secrets, environment files, or `.env` configurations containing active overrides or settings to the git repository. Ensure your git policies untrack local overrides.

## ⚙️ How to Apply:
1. Declare the environment flag in your local session or `.env.local` config:
   ```bash
   export TTS_AUDIO_GENERATION_ENABLED=true
   ```
2. Re-run the readiness checks to verify validation passage:
   ```bash
   npm run tts-model-gate -- status
   ```
3. Proceed to the audio rendering compile step only after verifying all blockers are cleared.

---
**Next Action Recommended:** Review the readiness status again and proceed only after manual operator approval.
