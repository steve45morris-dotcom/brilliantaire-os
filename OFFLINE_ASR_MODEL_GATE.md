# 🎙️ Local Offline ASR Model Gate and Placement Assistant

This document outlines the local safety layer, inventory scanners, cryptographic checks, and manual placement rules designed to audit local Whisper speech-to-text models before unlocking offline transcription capability.

## 🧭 Purpose & Architectural Boundaries
The **ASR Model Gate** evaluates manual Whisper model folder state, calculates checksum hashes, logs inventories, compiles readiness gates, and checks manual environment flags under strict system rules:
1.  **Manual-Only Model Acquisition:** Models must be placed manually. Automated scripting, network down loaders, or curl queries are completely blocked.
2.  **No Automatic Downloads:** Direct remote access to external model hubs is prevented by the safety policy configuration.
3.  **No Direct Transcription:** No audio processing, transcribing, or text-to-speech rendering is initiated.
4.  **Local Model Verification Folder:** Audits the designated model storage directory: `models/asr/whisper/`.

---

## 📂 Verification Policies
*   **Allowed Model Formats:** `.bin`, `.pt`, `.onnx`, `.ggml`, `.tflite`
*   **Cryptographic Verification:** Node crypto library calculates local file SHA256 hashes for manually placed files.
*   **Manual Enable Boundary:** Operators must configure the `ASR_EXECUTION_ENABLED=true` environment flag alongside model placement and checksum check before the system registers readiness.

---

## 🛠️ CLI Operations Reference

Always run commands using the Safe Command Router wrapper.

### 1. Help Guide
```bash
npm run command -- "asr-model-gate-help"
```

### 2. Compile Manual Model Placement Instructions
```bash
npm run command -- "asr-model-gate guide"
```

### 3. Scan Model Directory Inventory
```bash
npm run command -- "asr-model-gate inventory"
```

### 4. Audit Cryptographic Hashes (Node Crypto Hashing)
```bash
npm run command -- "asr-model-gate checksum"
```

### 5. Evaluate Model Readiness Gate
```bash
npm run command -- "asr-model-gate readiness"
```

### 6. View Model Gate Status Summary
```bash
npm run command -- "asr-model-gate status"
```
