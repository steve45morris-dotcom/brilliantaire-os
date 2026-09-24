# Live Microphone Audio Streamer — Daemon Configuration

- **Config ID:** {{CONFIG_ID}}
- **Date:** {{DATE}}
- **Generated:** {{TIMESTAMP}}
- **Bridge Mode:** manual-first
- **Status:** staged (read-only)

---

## Audio Capture Parameters

{{CAPTURE_PARAMS}}

## Audio Backend Status

{{BACKEND_STATUS}}

## Model Selection

{{MODEL_SELECTION}}

## Pipeline Wiring

{{PIPELINE_WIRING}}

---

## Review Checklist

- [ ] Audio capture parameters reviewed and approved
- [ ] Audio backend selected and verified locally
- [ ] Whisper model placed and checksum validated
- [ ] Voice Activity Detection threshold tuned
- [ ] Pipeline wiring connections verified
- [ ] Ready for manual daemon test

## Safety Notes

- This configuration is staging-only. No daemon processes are spawned.
- No microphone access is enabled.
- No audio streaming occurs.
- Human operator must review all parameters before enabling.
