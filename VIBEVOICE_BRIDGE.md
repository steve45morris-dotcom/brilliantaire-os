# 🎙️ VibeVoice Transcript Producer (Phase 5A)

This document specifies the design, safety boundaries, and local ingestion flow for the **VibeVoice Bridge** in **Brilliantaire OS**.

---

## 1. Purpose

**VibeVoice Transcript Producer** serves as the ingestion bridge that stages voice transcripts into the safe pipeline without triggering live actions directly from audio inputs.

---

## 2. Why This is Transcript Producer Only

Executing commands directly from speech-to-text models introduces major security risks. A transcript producer strictly writes raw text phrases to the queue's `voice_queue/inbox/` folder. It does not invoke any scripts, run commands, or bypass the router. Decoupling transcription from execution ensures that all commands undergo strict gating, normalization, and review.

---

## 3. Why Direct Voice Execution is Blocked

* **No shell access:** Speech models cannot construct or invoke command lines.
* **Review/Staging requirements:** Low-risk commands route only via the whitelist command router. Medium-risk and high-risk commands are held in `voice_queue/pending_confirmation/`.
* **Zero microphone execution:** The microphone bridge does not connect to child processes. It is restricted to appending transcript files locally.

---

## 4. File Flow Pipeline

```
[ voice_input/manual/ ]  <-- Static plain text files containing spoken commands
          │
          ▼
(npm run vibevoice-transcript) <-- Ingests, normalizes, and validates phrase limits
          │
          ├──> [ voice_input/transcripts/ ]  (Audited Archive File)
          └──> [ voice_queue/inbox/ ]        (Ingestion Pipeline Queue)
                    │
                    ▼
          (npm run voice-queue) <-- Normalizes, matches registry, applies risk levels
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    [LOW RISK]             [MEDIUM/HIGH]
        │                       │
 (Command Router)       [pending_confirmation/]
        │                       │
        ▼                       ▼
    Executed              (voice-confirm)
                                │
                                ▼
                            Executed
```

---

## 5. Manual Test Process

1. Stage test cases:
   ```bash
   npm run vibevoice-test
   ```
2. Ingest transcripts to queue inbox:
   ```bash
   npm run vibevoice-transcript
   ```
3. Run voice command queue processor:
   ```bash
   npm run voice-queue
   ```
4. Review pending releases:
   ```bash
   npm run voice-pending
   ```

---

## 6. Safety & Validation Rules

* **Prefix Enforcement:** Staged files are prefixed with `vibevoice_` to prevent namespaces collision.
* **Length Restraints:** Transcripts exceeding `MAX_TRANSCRIPT_LENGTH` (500 characters) are rejected immediately to prevent buffer overload or prompt injections.
* **Empty Checking:** Null, blank, or whitespace-only files are rejected and logged.
* **Logging:** Telemetry and staging details are written to `outputs/vibevoice_logs/vibevoice_log_YYYY-MM-DD.md`.
