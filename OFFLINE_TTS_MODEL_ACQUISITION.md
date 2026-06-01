# 🎙️ Local Offline TTS Voice Model Acquisition & Placement Assistant

This document outlines the offline safety guidelines and local tools designed to help operators manually download and place voice model assets without automating downloads or external network operations.

## 🧭 Purpose
To establish a clear manual process for acquiring and cataloging Piper-style offline voice models, ensuring system safety and tracking placement readiness before enabling offline text-to-speech compilation.

---

## 🚫 Staging Security Invariants
To maintain safety, the system enforces the following rules:
1.  **Manual-Only Model Acquisition:** Spawning automatic curl, wget, npm downloads, or third-party API fetches is strictly blocked.
2.  **Zero Audio Synthesis:** Spawning audio rendering compilers or creating wave output is disabled.
3.  **Local Sandbox Validation:** Validates manually staged `.onnx` and `.json` file formats and names within the sandbox folder.

---

## 📂 Target Configuration & Naming
*   **Target Directory:** `models/tts/piper/`
*   **Allowed Extensions:** `.onnx` (model weights) and `.json` (config settings).
*   **Naming Recommendations:** Config profiles must share the same prefix prefix base name as their ONNX model files:
    *   `en_US-lessac-low.onnx` next to `en_US-lessac-low.json`
    *   `en_US-lessac-low.onnx` next to `en_US-lessac-low.onnx.json`

> [!WARNING]
> **Repository Pollution Safeguard:** Large speech model files must never be committed to git. Ensure your ignore policy or `.gitignore` filters out binary `.onnx` weights.

---

## 🔗 Connection to Model Gate & Activation Checks
The acquisition checks sit ahead of the Model Gate (Phase 11T) and Activation Verification Loop (Phase 11U). Because synthesis requires a readiness score of **100%**, offline speech compilation remains blocked until:
1. Valid model/config files are manually placed.
2. Naming configurations match.
3. Env flag `TTS_AUDIO_GENERATION_ENABLED` is manually declared as `true` in your local environment session.

---

## 🛠️ CLI Reference Guide

Always execute commands inside the exact-name command router:

### 1. Help Menu
```bash
npm run command -- "tts-model-acquisition-help"
```

### 2. Manual Acquisition Instructions Guide
```bash
npm run command -- "tts-model-acquisition guide"
```

### 3. Catalog Model Directory Inventory
```bash
npm run command -- "tts-model-acquisition inventory"
```

### 4. Verify Local Placement Layout
```bash
npm run command -- "tts-model-acquisition verify-placement"
```

### 5. Check Next Steps Roadmap
```bash
npm run command -- "tts-model-acquisition next-step"
```

### 6. View Acquisition Status Dashboard
```bash
npm run command -- "tts-model-acquisition status"
```
