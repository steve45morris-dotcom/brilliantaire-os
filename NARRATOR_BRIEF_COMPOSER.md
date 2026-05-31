# 🧭 Brilliantaire OS — Narrator Brief Composer Specification

The **Narrator Brief Composer** is a local, decoupled templating and generation layer that reads system status inputs and generated narrator cards to produce target-specific operational briefs.

## 1. Purpose
The composer translates structured system telemetry summaries into specialized markdown formats tailored for operators, dashboards, voice synthesis systems, and Obsidian notes without executing commands, changing system state, or writing directly to active vault directories.

## 2. Ground Rules & Safety Boundaries (Read-Only Gateway)
To enforce strict sandboxing:
- **No Command Execution:** The composer is strictly read-only and must never call shell commands or execute subprocesses.
- **No Direct Obsidian Vault Writes:** The composer writes to a staging directory (`outputs/narrator/briefs/`) where briefs wait for staging verification. It must never write directly into active Obsidian folders.
- **Output-Only Boundary:** The composer operates under `output_only` rules, editing only designated outputs under `outputs/narrator/`.
- **No Event Stream / WebSockets:** Real-time push updates are intentionally deferred to Phase N3. This phase is entirely batch-driven to keep execution predictable and audit-ready.

## 3. Whitelisted Inputs
The composer is whitelisted to read from:
- `outputs/narrator_card.json` (Primary structured summary)
- `outputs/narrator/source_snapshots/latest_snapshot.md` (Telemetry grounded details)
- `SYSTEM_STATUS.md` (Active capabilities listing)
- `NEXT_ACTIONS.md` (Active checklists)
- `PROJECTS.md` (Sovereign project priorities matrix)
- `outputs/mesh_telemetry/reports/` (Latest telemetry report if present)

## 4. Generated Brief Types

### A. Operator Brief
- **Target Path:** `outputs/narrator/operator_briefs/operator_brief_YYYY-MM-DD_HHMM.md`
- **Focus:** High-level tactical details, active risks, and next 5 actions for human operator review.

### B. Dashboard Feed
- **Target Path:** `outputs/narrator/dashboard_feed/dashboard_narration_feed_YYYY-MM-DD_HHMM.md`
- **Focus:** Compact, status-colored summaries and key metrics formatted for the browser dashboard.

### C. Voice Script
- **Target Path:** `outputs/narrator/voice_scripts/voice_narration_script_YYYY-MM-DD_HHMM.md`
- **Focus:** Clean, non-exaggerated verbal reports for text-to-speech engine ingestion.

### D. Obsidian Brief
- **Target Path:** `outputs/narrator/briefs/obsidian_narrator_brief_YYYY-MM-DD_HHMM.md`
- **Focus:** Clean Obsidian Markdown brief complete with frontmatter metadata tags, marked as `status: staged_for_obsidian_review`.

---
*Authorized by User via Gemini CLI Interface*
