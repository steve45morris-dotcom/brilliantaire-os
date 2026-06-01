# 🎙️ Local Offline ASR Orchestrator Scaffold

This document outlines the local safety layer, dry-run simulation, and staging workflow configured for offline speech-to-text transcription checks.

## 🧭 Purpose & Architectural Boundaries
The **Offline ASR Orchestrator** validates speech recognition readiness, creates execution packets, logs dry-run previews, and stages empty placeholder records for narrator voice notes under strict safety policies:
1.  **Orchestration-Only Scaffold:** Audio translation engines (Whisper / GGML) are decoupled and completely blocked from execution.
2.  **No Direct Transcription:** No audio waveform decoding, voice extraction, or command dispatching occurs.
3.  **No Shell/External Access:** Zero command lines are spawned to Whisper binaries, and no external web APIs or cloud services are queried.

---

## 📂 System Configurations
*   **ASR Engine:** `Whisper (offline-local)`
*   **Staged Audio Directory:** `voice_sessions/manual_recordings/`
*   **Whisper Model Folder:** `models/asr/whisper/`
*   **Transcript Staging Folder:** `outputs/asr_orchestrator/transcript_staging/`
*   **Allowed Audio Formats:** `.wav`, `.mp3`, `.m4a`
*   **Maximum File Size:** `100MB`

---

## ⚙️ ASR Orchestration & Job Flow
1.  **Readiness Audit:** Run `readiness` to verify if Whisper models are present, staged voice files exist, and manual enable configurations are present.
2.  **Create Job Packet:** Run `create-job` to initialize a structured JSON/markdown packet detailing source assets, parameters, engines, and target transcript locations.
3.  **Run Dry-Run Simulation:** Run `dry-run` to execute a mock command compilation, checking format constraints, mapping expected model inputs, and simulation blockers.
4.  **Stage Transcript Record:** Run `stage-transcript` to output a placeholder staged transcript file (`asr_transcript_staging_YYYY-MM-DD.md`) logging `awaiting_manual_or_future_asr` status.

---

## 🛠️ CLI Operations Reference

Always wrapper-execute via the Safe Command Router.

### 1. Help Guide
```bash
npm run command -- "asr-orchestrator-help"
```

### 2. Run ASR System Readiness Check
```bash
npm run command -- "asr-orchestrator readiness"
```

### 3. Initialize Staging Job Packet
```bash
npm run command -- "asr-orchestrator create-job"
```

### 4. Run Dry-Run Simulation Check
```bash
npm run command -- "asr-orchestrator dry-run"
```

### 5. Create Transcript Staging Record Placeholder
```bash
npm run command -- "asr-orchestrator stage-transcript"
```

### 6. View ASR Orchestration Status Dashboard
```bash
npm run command -- "asr-orchestrator status"
```
