# 📖 Offline ASR Whisper Model Acquisition Guide
*Generated on: 2026-06-01*

## 1. Purpose
This document provides instructions for safely procuring and placing Whisper speech recognition models locally. Automatic model downloading is disabled to enforce isolated offline environments.

## 2. Target Folder
* **Path:** `/Users/alexanderanthony/models/asr/whisper`

## 3. Allowed Formats
Only the following binary formats are permitted inside the Whisper model directory:
* `.bin, .pt, .onnx, .ggml, .tflite`

## 4. Manual Acquisition Rule
No automatic web scraping or API pulling is supported. You must manually download the model binaries from official sources (such as OpenAI Hugging Face repositories) and copy them into the target folder.

## 5. Repo Safety Warning
⚠️ **DO NOT COPY executable files, `.sh` scripts, or untrusted binary hooks into the model directory.** Any files containing disallowed extensions will block the entire ASR pipeline.

## 6. Checksum Reminder
Always compute the SHA256 checksum of your manually placed files and compare them with trusted sources to verify integrity before allowing execution.

## 7. Recheck Commands
Run the gate checks to refresh status:
* `npm run asr-model-gate -- status`
* `npm run asr-model-gate -- readiness`

## 8. Next Action
* **Recommended Next Step:** `Place Whisper model binaries inside the target folder manually and run inventory verification.`
