# 🎙️ Offline TTS Model Readiness Gate

This module provides the offline local text-to-speech (TTS) model readiness gate configuration and verification rules for the Grounded Narrator. It enforces manual voice model package auditing and manual environmental override validations before voice compiler synthesis is allowed.

## 🔒 Safety and Isolation Rules

1. **Gate-Only Verification:** This phase only verifies local model placement, environment flags, and checklist reports.
2. **No Audio Compilation:** Real audio generation processes remain completely locked and disabled.
3. **No Piper Compiler Execution:** No subprocess calls to Piper or any speech rendering engine are performed.
4. **No Remote Downloads:** Voice model ONNX binaries and configurations must not be fetched over the network.
5. **No External Connections:** External speech synthesis endpoints or remote voice APIs cannot be queried.
6. **No Command Bypass:** Executing checks must route through the Safe Command Router exact-name rules.

## 📂 Local Model Settings

*   **Model Folder:** `models/tts/piper/`
*   **Required Files:**
    *   ONNX voice model file (e.g., `*.onnx`)
    *   Matching JSON config profile file (e.g., `*.onnx.json` or `*.json`)
*   **Manual Override Env Variable Name:** `TTS_AUDIO_GENERATION_ENABLED` (Must be manually declared in the local environment and set to `true` to pass dry-run readiness checks).

## 🛠️ CLI Operations

Execute verification checks and checklists using:

```bash
# Print instructions
npm run tts-model-gate-help

# Run model directory scan and readiness check
npm run tts-model-gate -- "check"

# Generate model files checklist
npm run tts-model-gate -- "checklist"

# Generate manual enable instructions
npm run tts-model-gate -- "manual-enable"

# Print comprehensive capabilities status
npm run tts-model-gate -- "status"
```
