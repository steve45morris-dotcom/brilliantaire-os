# 🛠️ ASR Model Acquisition & Placement Guide: {{DATE}}

This document details guidelines for safely getting and placing Whisper ASR models offline.

## 🧭 Purpose
To establish safe, manual-only acquisition parameters for Whisper GGML/ONNX speech recognition models, strictly blocking automatic downloads and keeping the pipeline offline.

## 📂 Target Configuration
*   **Target Folder:** `{{TARGET_FOLDER}}`
*   **Allowed Formats:** `{{ALLOWED_FORMATS}}`

## 🚫 Safety Guidelines
1.  **Manual Acquisition Rule:** Whisper model files must be manually placed inside the target directory. No automated networking scripts or downloaders are allowed.
2.  **Repo Safety Warning:** Only load verified models from trusted sources (e.g., official GGML models). Do not execute unverified binary layers or configs.
3.  **Checksum Reminder:** Verify file hashes locally before execution.

## 💻 Recheck Commands
To audit local folder state, run:
```bash
{{RECHECK_COMMANDS}}
```

---
**Next Action Recommended:** {{NEXT_ACTION}}
