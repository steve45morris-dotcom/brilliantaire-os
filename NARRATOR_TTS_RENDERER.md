# 🎙️ Phase N5B: Local TTS Audio Renderer

The **Local TTS Audio Renderer** converts approved text-to-speech rendering requests into offline audio files using a local speech synthesis engine backend. It operates strictly locally, preventing automatic playback and isolating subprocess calls.

---

## 🎯 Purpose
Establish a secure, offline audio generation channel. The script processes text files staged in the `approved/` folder using local synthesis models (e.g. Piper), outputting final audio files without making external API requests.

---

## 🛡️ Safety & Execution Rules
1. **Approved-Request-Only Rendering:** Synthesis is strictly restricted to request files located under `outputs/narrator/tts_queue/approved/`. Staged files inside the `render_requests/` (pending) or `rejected/` folders are rejected.
2. **Local-Only Behavior:** All processing is executed locally on-device. No network connections are initiated (`ALLOW_EXTERNAL_TTS_API = false`).
3. **No Auto-Playback:** Compiled audio waves are stored silently inside `rendered_audio/` and must never be auto-played.
4. **Exact-Name Routing Gate:** Main operations (`status`, `dry-run`, `render`, `render-all-approved`) require exact command name matching via the Command Router.
5. **Payload Command Sanitization:** Payloads are treated strictly as text blocks to prevent command injections.

---

## 🌊 Staging Queue & Rendering Flow

```mermaid
graph TD
    APP[outputs/narrator/tts_queue/approved/*] -->|Read Approved request| TR[scripts/narrator-tts-renderer.ts]
    TEMP_OUT[templates/narrator_tts_renderer/tts-render-output-template.md] -->|Load Success Template| TR
    TEMP_ERR[templates/narrator_tts_renderer/tts-render-error-template.md] -->|Load Error Template| TR
    
    TR -->|Verify Request is Approved| TR
    TR -->|Check local Piper binary PATH| TR
    
    TR -->|Success| OUT[outputs/narrator/tts_queue/rendered_audio/narrator_audio_REQ_ID.mp3]
    TR -->|Log Success| LOG_OUT[outputs/narrator/tts_queue/logs/tts_render_output_REQ_ID_TS.md]
    
    TR -->|Fail / Missing Piper| ERR_LOG[outputs/narrator/tts_queue/logs/tts_render_error_REQ_ID_TS.md]
```

---

## 🔮 Future Integration Boundaries

### 📡 Future Local TTS Adapter Integration
Subsequent phases will introduce automatic configuration pipelines for local voices and speed optimizations. The synthesis loop will:
- Read approved requests sequentially.
- Cache rendered models for reduced latency.
- Log complete metrics.

### 🔌 Future WebSocket Audio Feed Boundary
Real-time dashboard playback notifications will stream audio state events over a local WebSocket pipe. The socket server will:
- Stream only output notifications and metadata cards.
- Remain completely isolated from command routing.
- Execute in a separate process thread.
