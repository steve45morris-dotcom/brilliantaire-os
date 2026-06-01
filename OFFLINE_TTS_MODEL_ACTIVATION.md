# 🎙️ Local Offline TTS Voice Model Placement & Activation Check

This document outlines the local safety layer and manual file audits configured to check manually placed voice model files before offline TTS synthesis can be unlocked.

## 🧭 Purpose & Architectural Boundaries
The **Offline TTS Model Activation Check** provides a strict audit checkpoint to ensure voice assets are safely staged and configured locally. It acts as a safety gate enforcing:
1.  **Placement Verification Only:** Performs read-only scans and pairing verification on the local `models/tts/piper/` directory.
2.  **Strict Safe Boundary Constraints:**
    *   **No Audio Generation:** Will not compile wave audio or call speech modules.
    *   **No Piper Execution:** Does not execute Piper binaries.
    *   **No Model Download:** Never initiates external networking, curl, wget, or model fetches.
    *   **No External API Calls:** Zero telemetry or cloud requests.

---

## 📂 Required Local Voice Assets
For offline speech synthesis to run in future phases, the operator must manually stage the following voice profile assets inside the sandbox folder:
*   **Target Directory:** `models/tts/piper/`
*   **Speech Model:** A valid `.onnx` Piper voice file (e.g., `en_US-lessac-low.onnx`).
*   **Profile Settings:** An accompanying matching configuration `.json` file (e.g., `en_US-lessac-low.json`).

---

## ⚡ Activation Readiness Scoring Logic
The activation checker evaluates five verification dimensions, each worth 20 points, for a maximum readiness score of **100%**:
1.  **Queue Validation Readiness (20%):** Validates that scripts, metadata, and character inputs are formatted correctly with 0 queue validation blockers.
2.  **Model Gate Integrity (20%):** Ensures model gate reports exist and match safety constraints.
3.  **Model Placement Integrity (20%):** Verifies that the model directory exists, contains valid `.onnx` and `.json` configs, and is free of corrupt/unexpected executables.
4.  **Model Pairing Validation (20%):** Verifies that every voice `.onnx` file has a matching configuration `.json` profile prefix.
5.  **Manual Enable Verification (20%):** Validates that the local environment override flag `TTS_AUDIO_GENERATION_ENABLED` is active (`true`).

---

## 🛠️ CLI Operations Guide

Ensure you use the Safe Command Router wrapper for all executions.

### 1. View Commands Manual
```bash
npm run command -- "tts-model-activation-help"
```

### 2. Generate Manual Placement Instructions
```bash
npm run command -- "tts-model-activation placement-guide"
```

### 3. Run Staged Directory Verification Scan
```bash
npm run command -- "tts-model-activation scan"
```

### 4. Verify Voice/Config Pairing Audit
```bash
npm run command -- "tts-model-activation pairing-check"
```

### 5. Check Multi-Layer Activation Readiness
```bash
npm run command -- "tts-model-activation activation-readiness"
```

### 6. View Core Readiness Dashboard
```bash
npm run command -- "tts-model-activation status"
```
