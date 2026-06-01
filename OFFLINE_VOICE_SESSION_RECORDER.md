# 🎙️ Local Offline Voice Session Recorder Scaffold

This document outlines the local safety layer and manual recording workflow configured to stage and verify narrator voice briefs without automating microphone captures or external speech recognition.

## 🧭 Purpose & Architectural Boundaries
The **Offline Voice Session Recorder** provides a safe sandbox to stage manual narrator drop files, configure metadata attributes, catalog inventory, and check recording sizes before future speech recognition stages. It strictly enforces:
1.  **Scaffold-Only Verification:** All operations are read/write on staged metadata and checklists files only.
2.  **Strict Safe Boundary Constraints:**
    *   **No Microphone Recording:** Automatic live microphone capture is blocked. No child processes are spawned.
    *   **No ASR Execution:** Spawning Whisper, GGML, or local speech-to-text engines is disabled.
    *   **No TTS Generation:** Synthesizers or voice compilers are completely inactive.
    *   **No External API Requests:** Zero telemetry or cloud transcription queries are initiated.

---

## 📂 Manual Audio Drop Workflow
Because automatic microphone capture is disabled, operators must manually stage voice recordings:
1.  **Manual Recording Folder:** Copy external wave/mp3 voice files into `voice_sessions/manual_recordings/`.
2.  **Allowed Audio Formats:** Staged recordings must use `.wav`, `.mp3`, or `.m4a` extensions.
3.  **Maximum File Size:** Staging files must be under **100MB** to ensure compatibility.
4.  **Naming Convention:** Rename files to match their corresponding session ID prefix (e.g., `voice_session_narrator_briefing_YYYY-MM-DD.wav`).

---

## ⚙️ Session Metadata & Transcription Staging Flow
1.  **Initialize Metadata:** Run `create-session` to generate a new MD record under `voice_sessions/session_metadata/`.
2.  **Scan Manual Drops:** Run `scan-recordings` to catalog dropped audio file names, sizes, and formats.
3.  **Perform Session Review:** Run `review` to match the staged audio file against metadata, checking size, format, and flagging blockers.
4.  **Stage Transcription:** If review passes, run `stage-transcription` to create a record in `voice_sessions/transcription_staging/`. Transcription is staged as `staged_not_transcribed` for future Whisper processing.

---

## 🛠️ CLI Operations Reference

Ensure you use the Safe Command Router wrapper for all executions.

### 1. Help Guide
```bash
npm run command -- "voice-session-recorder-help"
```

### 2. Compile Manual Recording Instructions
```bash
npm run command -- "voice-session-recorder guide"
```

### 3. Initialize Staging Metadata Session
```bash
npm run command -- "voice-session-recorder create-session narrator briefing"
```

### 4. Scan Staged Recordings Directory
```bash
npm run command -- "voice-session-recorder scan-recordings"
```

### 5. Run Recording Compatibility Review Check
```bash
npm run command -- "voice-session-recorder review"
```

### 6. Create Transcription Staging Record
```bash
npm run command -- "voice-session-recorder stage-transcription"
```

### 7. View Session Recorder Status Dashboard
```bash
npm run command -- "voice-session-recorder status"
```
