# 🎙️ Live Microphone ASR Bridge (Phase 5B)

This document specifies the design, safety boundaries, and folder structure for the **Live Microphone ASR Bridge** in **Brilliantaire OS**.

---

## 1. Purpose

The **Live Microphone ASR Bridge** acts as the ingestion adapter for transcript output produced by live ASR (Automatic Speech Recognition) models. It bridges live/streaming audio transcriptions into the safe OS command queue without executing them directly.

---

## 2. Why Live ASR Only Imports Transcripts

Executing commands directly from an active microphone stream poses significant security and operational risks (e.g. ambient conversations triggering unwanted OS commands). 

To enforce absolute safety, this bridge does not run any code directly from audio. It only reads text files dropped into the `voice_input/live/` folder, validates them, and pushes them into the staging pipeline.

---

## 3. Why Direct Microphone Execution is Blocked

* **Strict Sandboxing:** Audio stream transcribers cannot access the safe command router.
* **No Bypass:** The adapter normalizes text and forces files to be staged in the `manual/` area, ensuring they go through the VibeVoice stage-producer (`vibevoice-transcript`), voice queue scanner (`voice-queue`), and final confirmation review (`voice-confirm`).
* **Zero Autonomous Execution:** The system is explicitly configured with `ENABLE_DIRECT_COMMAND_EXECUTION = false` to prevent any automatic execution of transcribed text.

---

## 4. Safe Folder Flow Architecture

The data pipeline flows across decoupled directories to isolate raw inputs, archives, rejections, and queue buffers:

```
[ voice_input/live/ ]         <-- Live ASR transcript plain text drop folder
          │
          ▼ (npm run live-asr-import)
          │
          ├──> [ voice_input/live_sessions/ ] (Audit archive of imported runs)
          ├──> [ voice_input/live_logs/rejected/ ] (Validation failed/empty items)
          │
          └──> [ voice_input/manual/ ] <-- Staged for VibeVoice ingestion
                    │
                    ▼ (npm run vibevoice-transcript)
                    │
                    └──> [ voice_queue/inbox/ ] <-- Command Queue Inbox
```

---

## 5. Ingestion & Validation Protocols

### Accepted Transcript Flow
1. File is scanned from `voice_input/live/`.
2. Whitespace is normalized and extra spaces collapsed.
3. Length checked (must be <= `MAX_TRANSCRIPT_LENGTH` of 500 characters).
4. If valid, the file is copied to `voice_input/manual/` for Phase 5A processing.
5. Telemetry details are logged to `outputs/live_asr_logs/live_asr_log_YYYY-MM-DD.md`.
6. Original staging files in `voice_input/live/` are removed.

### Rejected Transcript Flow
1. If the file is empty, whitespace-only, or too long:
   - The file is moved to `voice_input/live_logs/rejected/`.
   - The event is logged in `outputs/live_asr_logs/live_asr_log_YYYY-MM-DD.md`.
   - Ingest stops for that file, avoiding execution risk.

---

## 6. Future Recorder Integration

While the bridge currently operates via text-based transcripts staged from external sources, future enhancements could support a safe local daemon:
- A stream recorder that captures 5-10 second audio snippets from the microphone when a hotkey is pressed.
- Saves audio files to `voice_input/live/` using formats like `.wav` or `.mp3`.
- Feeds them to a lightweight local Whisper engine to output `.txt` transcripts.
- Triggers `live-asr-import` automatically, retaining full manual confirmation gates.
