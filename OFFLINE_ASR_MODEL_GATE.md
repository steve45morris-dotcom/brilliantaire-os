# 🛡️ Offline ASR Model Gate and Checksum Gate Boundary Specification

This document defines the safety boundaries, acquisition processes, and verification gates for offline Whisper ASR models in the Brilliantaire OS environment.

## 1. Purpose
The local offline ASR Model Gate serves as a strict safety barrier to prevent untrusted execution of speech-to-text libraries and model binaries. By verifying model presence, structure, and cryptographic integrity prior to any transcription pipeline invocation, it protects the system against command injection and resource exploitation.

## 2. Strict Security Mandates

### 🚫 The No-Download Rule
* Under no circumstances shall the system automatically download, fetch, or pull model files from the internet.
* All model acquisition must be performed manually by a human operator.
* External API calls are strictly blocked (`ALLOW_EXTERNAL_API_CALLS = false`).

### 🚫 The No-Transcription Rule
* This gate is for inventory, checksum validation, and readiness checklist compilation only.
* No actual audio transcription or audio model loading is performed by this layer (`ALLOW_ASR_EXECUTION = false`, `ALLOW_AUDIO_TRANSCRIPTION = false`).

### 🚫 The No-Shell-Execution Rule
* Subprocess shells and shell-wrapped binary executions are completely prohibited during gate verification (`ALLOW_SHELL_EXECUTION = false`).

## 3. Allowed Model Formats and Inventory
Only files matching the following extensions are permitted in the local Whisper model directory:
* `.bin`
* `.pt`
* `.onnx`
* `.ggml`
* `.tflite`

Any other extension (e.g. `.sh`, `.exe`, `.py`) inside the model directory will trigger a safety blocker and transition the gate status to `blocked`.

## 4. Local Model Directory
* **Target Local Path:** `models/asr/whisper/`

## 5. Checksum Verification
A manual review of calculated SHA256 hashes must be executed. The checksum gate calculates the cryptographic SHA256 hash of all model binaries in the target folder using Node's native `crypto` module. These hashes must be manually validated against the official model repository manifest before execution is permitted.

## 6. Manual Enable Boundary
ASR execution is only allowed if:
1. All model inventory checks pass.
2. The checksum report has been successfully generated.
3. The environment variable `ASR_EXECUTION_ENABLED` is manually exported as `true`.

## 7. CLI Commands
The following subcommands are supported by `npm run asr-model-gate --`:
* `guide`: Generate manual model acquisition guide markdown.
* `inventory`: Scan the local Whisper folder and list model files, sizes, and formats.
* `checksum`: Calculate SHA256 hashes of placed models and log validation status.
* `readiness`: Assess staged audio, model files, checksum logs, and the manual enable flag.
* `status`: Print a terminal dashboard summarizing gate metrics and next steps.

---
*I build before burning.*
