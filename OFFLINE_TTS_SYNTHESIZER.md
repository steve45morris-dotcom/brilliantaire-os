# 🎙️ Offline TTS Synthesizer Scaffold

This module provides the offline local text-to-speech (TTS) synthesizer scaffolding and configuration layer for the Grounded Narrator. It defines safety gates, output folders, and dry-run validation steps before real audio compilation is allowed.

## 🔒 Security and Sandboxing Rules

1. **Scaffold-Only Mode:** This phase only validates configuration, dry-run previews, and file integrity.
2. **No Audio Generation:** Under no circumstances should real sound files (`.wav`, `.mp3`) be rendered in this phase.
3. **No Piper Execution:** The local synthesis engine (Piper) is not run, and subprocess spawning for audio compilation is blocked.
4. **No Model Download:** Model binaries and voices must not be fetched automatically over the network.
5. **No External API Connections:** No external TTS service endpoints (e.g., ElevenLabs, Google TTS) can be queried.
6. **No Command Bypass:** All executions must route through the Safe Command Router exact-name checks.

## 📂 System Directory Structure

*   `models/tts/piper/` — Storage directory for manual placement of local model files (e.g., `.onnx` and `.onnx.json` config).
*   `outputs/tts_audio/config_reports/` — Staged execution reports and engine parameter configs.
*   `outputs/tts_audio/dry_runs/` — Simulated synthesis dry-runs outlining executed commands.
*   `outputs/tts_audio/audio_outputs/` — Target output folder for compiled `.wav` speech files (empty in this phase).
*   `outputs/tts_audio/logs/` — Chronological audit logs tracking synthesizer actions.
*   `templates/tts_audio/` — Templates used by the engine to write reports and manifests.

## 📦 Model Placement Instructions

To enable speech synthesis in future phases:
1. Obtain the target voice model ONNX package (e.g., `en_US-lessac-medium.onnx` and `en_US-lessac-medium.onnx.json`).
2. Manually place them inside `models/tts/piper/`.
3. Re-run `npm run tts-synthesizer -- model-check` to verify readiness.

## 🛠️ CLI Operations

Execute validator and generator dry-runs using:

```bash
# Print general instructions
npm run tts-synthesizer-help

# Compile parameter configurations report
npm run tts-synthesizer -- "config-report"

# Verify local ONNX model presence
npm run tts-synthesizer -- "model-check"

# Simulate offline voice synthesis
npm run tts-synthesizer -- "dry-run"

# Generate structured audio manifest
npm run tts-synthesizer -- "manifest"

# Print comprehensive capabilities status
npm run tts-synthesizer -- "status"
```
