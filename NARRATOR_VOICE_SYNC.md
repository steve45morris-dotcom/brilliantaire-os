# 🧭 Brilliantaire OS — Narrator Voice Narration Sync Specification

The **Narrator Voice Narration Sync** layer connects generated voice scripts and live telemetry status feeds into structured, voice-ready packages staged for manual text-to-speech (TTS) ingestion.

## 1. Purpose
To serve as a secure staging layer that parses verbal updates and packages them for the Voice Narrative Protocol (VNP) pipeline without initiating active voice playback, calling external cloud speech interfaces, or executing shell processes.

## 2. Safety & Integration Rules
- **No Active Voice Playback:** The composer operates strictly statically, preparing markdown files for manual or future bridge ingestion.
- **No External TTS Calls:** Direct translation of text-to-speech using external cloud services is disabled by default (`ALLOW_TTS_API_CALLS = false`) to enforce local sovereignty.
- **Zero Command Invocation:** The controller script runs as a read-only parser. It never launches CLI processes.
- **Strict Staging Gates:** Staged queue briefs are written exclusively to `outputs/narrator/voice_sync/` to isolate them from live edge devices.

## 3. Operations & File Flow

### A. Voice Packet Flow
- **Input Sources:** Reads latest compiled script from `outputs/narrator/voice_scripts/` and the live telemetry brief `outputs/narrator/live_feed/narrator_live_feed.json`.
- **Output Target:** `outputs/narrator/voice_sync/packets/narrator_voice_packet_YYYY-MM-DD_HHMM.md`
- **Goal:** Compiles a developer-readable manifest of current vocal parameters (mood, headline, voice script content, playback status).

### B. VNP Queue Flow
- **Output Target:** `outputs/narrator/voice_sync/vnp_queue/vnp_narrator_queue_YYYY-MM-DD_HHMM.md`
- **Goal:** Formats intent lines, completion summaries, tone markers, and anti-auto-playback directives into a VNP-standard staging package.

## 4. Future Development Boundaries
- **Phase N5 (Live Voice Ingestion):** Incorporates local WebSocket triggers to push staged queue packets to active microphone/speaker daemons.
