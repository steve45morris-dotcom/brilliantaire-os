# 🛠️ TTS Model Manual Placement & Staging Guide: 2026-06-01

This document details instructions for staging Piper voice files manually inside the offline speech sandbox.

## 📁 Target Configuration
*   **Target Folder:** `models/tts/piper/`
*   **Required ONNX File:** `*.onnx voice model file`
*   **Required JSON File:** `*.json config settings file`

## 🏷️ Staging Requirements & Recommendations
1. **Naming Recommendation:** Match the file names exactly. For instance, `en_US-lessac-low.onnx` must sit next to a matching config named `en_US-lessac-low.json` or `en_US-lessac-low.onnx.json`.
2. **File Size Integrity:** Ensure the model files are not empty, corrupt, or truncated.

> [!WARNING]
> **Repository Safety Guard:** Large voice models (`.onnx`) must never be tracked or committed to git. Ensure that the repository `.gitignore` configuration or workspace policies exclude large binary assets from commits.

## ⚙️ How to re-verify:
1. Re-run model gate scan and pairing verification steps:
   ```bash
   npm run tts-model-activation -- status
   ```
2. Verify that the readiness score improves and all blockers clear.

---
**Next Action Recommended:** Place model files manually and trigger scan checklist.
