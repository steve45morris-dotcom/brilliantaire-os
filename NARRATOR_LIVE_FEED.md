# 🧭 Brilliantaire OS — Narrator Live Feed Specification

The **Narrator Live Feed** layer provides a read-only telemetry interface that polls narrator outputs and aggregates them into a unified, lightweight feed JSON. It detects when new narrative updates occur and triggers event notifications for local dashboards.

## 1. Purpose
To serve as a decoupled status ingestion endpoint for local web clients, allowing the system dashboard to pull the latest system updates dynamically without exposing the dashboard to state mutation endpoints or remote script execution.

## 2. Safety & Decoupled Rules (Strictest Sandbox Boundary)
- **Read-Only Dashboard Interface:** The dashboard reads strictly from static JSON files (`narrator_live_feed.json` and `narrator_card.json`). No POST, PUT, or DELETE request routing exists.
- **Zero Frontend Execution:** The frontend contains no controls, inputs, or triggers capable of calling command router actions or invoking shell processes.
- **WebSocket Disabled:** Real-time push protocols are disabled (`ENABLE_WEBSOCKET = false`) to keep the system fully batch-driven and local-first. Live updates are processed via safe client-side polling.
- **No Direct Obsidian Writes:** Telemetry outputs are written strictly to local staging files in `outputs/narrator/live_feed/`.

## 3. Feed JSON Flow
1. **Source Parsing:** The live feed compiler scans:
   - `outputs/narrator_card.json` (Structured summary details)
   - `outputs/narrator/dashboard_feed/` (Mood and status parameters)
   - `outputs/narrator/operator_briefs/` (Tactical milestones)
   - `outputs/narrator/voice_scripts/` (TTS narration script)
   - `outputs/narrator/source_snapshots/` (Approved whitelisted telemetry snapshots)
2. **Consolidation:** Aggregates inputs into a single target: `outputs/narrator/live_feed/narrator_live_feed.json`
3. **Collision Preservation:** For every generate action, a timestamped backup copy is written to `outputs/narrator/live_feed/narrator_live_feed_YYYY-MM-DD_HHMM.json`.

## 4. Event Flow
When the file system watcher detects a hash-change in the source files, it compiles an event packet and writes it to `outputs/narrator/live_feed/events/narrator_event_YYYY-MM-DD_HHMMSS.json`.

## 5. Local Watcher Mode
The watch loop daemon runs in read-only polling mode, scanning file metadata periodically (`WATCH_INTERVAL_MS = 8000`), executing no subprocesses, and writing activity logs to `outputs/narrator/live_feed/logs/`.
