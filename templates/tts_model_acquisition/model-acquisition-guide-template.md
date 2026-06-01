# 📖 TTS Voice Model Offline Acquisition Guide: {{DATE}}

This document details guidance for acquiring and placing speech synthesis models manually inside the offline speech sandbox.

## 🧭 Purpose
To establish a manual acquisition procedure for the offline speech synthesizer engine (Piper) while keeping the repository secure and free of bulky model binaries.

## 📂 Target Configuration
*   **Target Folder:** `{{TARGET_FOLDER}}`
*   **Required Files:**
    1. One `.onnx` Piper voice model file (e.g., `{{REQUIRED_ONNX}}`)
    2. One matching `.json` configuration file (e.g., `{{REQUIRED_JSON}}`)

## 🏷️ Naming Examples & Structure
To verify configuration pairing cleanly, name voice files according to these patterns:
*   `voice-name.onnx` next to `voice-name.json`
*   `voice-name.onnx` next to `voice-name.onnx.json`

## 🚫 Manual Acquisition Only Rule
*   **No Auto-downloads:** The system is explicitly configured not to download models via scripts or external APIs.
*   **Manual Steps:** Open the official Piper voice repository or model site in your browser, select your preferred voice model (e.g., `en_US-lessac-low`), download the `.onnx` and `.json` configs, and copy them directly into the target folder.

> [!WARNING]
> **Repository Safety Guard:** Large voice models (`.onnx` binaries) must never be committed to git. Ensure that the repository `.gitignore` configuration or asset policies filter out these files before staging.

## ⚙️ How to re-verify:
Run these recheck commands sequentially to audit staged files:
```bash
{{RECHECK_COMMANDS}}
```

---
**Next Action Recommended:** {{NEXT_ACTION}}
