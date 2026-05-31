# 🧭 Brilliantaire OS — AI Narrator System Specification

The AI Narrator is a grounded briefing engine that summarizes system status, latest tasks, and future actions for a non-technical audience (modeled as a curious 15-year-old).

## 1. Purpose
The Narrator acts as an observer layer. It reads the latest snapshots of operating system status and execution logs to compile them into clear, conversational narratives and metadata for display in the local dashboard and Obsidian briefings.

## 2. Ground Rules (What the Narrator is NOT Allowed to Do)
To enforce absolute sandbox safety:
- **No Command Execution:** The Narrator is strictly read-only and must never call shell commands or subprocesses.
- **No Writing to Core Files:** The Narrator may only write to designated outputs (`outputs/narrator_card.json`, `outputs/narrator/`, `outputs/explain_history.md`, and `brilliantaire-briefs/latest_task_explain.md`).
- **No Approval Delegation:** The Narrator cannot bypass authorization gates, approve staged writes, or trigger automation routines.
- **No File Deletion:** The Narrator must never delete any file on the system.

## 3. Approved Sources
The Narrator is strictly restricted to reading the following approved source files and directories:
- `SYSTEM_STATUS.md`
- `PROJECTS.md`
- `NEXT_ACTIONS.md`
- `COMMANDS.md`
- `outputs/mesh_telemetry/reports/`
- `outputs/mesh_telemetry/snapshots/`
- `outputs/automation/logs/`
- `outputs/automation/runs/`
- `outputs/command_logs/`
- `outputs/campaigns/validation_reports/`
- `outputs/platform_verification/reports/`
- `outputs/manual_release/checklists/`
- `outputs/manual_release/runbooks/`
- `outputs/knowledge_harvest/workflow_ideas/`
- `outputs/notebooklm_bridge/workflow_ideas/`

## 4. Flow Architecture

### Source Scan Flow
1. `npm run narrator-sources` runs `scripts/narrator-sources.ts`.
2. It reads only approved files, finds the latest files in log folders, and compiles them into a markdown snapshot at `outputs/narrator/source_snapshots/narrator_source_snapshot_YYYY-MM-DD_HHMM.md`.

### Briefing & Output Flow
1. `python tools/ai_narrator.py` checks for the latest source snapshot.
2. It sends the snapshot content to Gemini for narration (using `gemini-2.5-flash`).
3. If `GEMINI_API_KEY` is missing or the call fails, it uses a deterministic local fallback narration.
4. It outputs:
   - `outputs/narrator_card.json` (Dashboard bridge)
   - `outputs/narrator/cards/narrator_card_YYYY-MM-DD_HHMM.json` (History tracking)
   - `brilliantaire-briefs/latest_task_explain.md` (Obsidian note)
   - Appends to `outputs/explain_history.md`.
5. Logs are appended to `outputs/narrator/logs/narrator_log_YYYY-MM-DD.log`.

## 5. Validation Requirements
All generated dashboard cards must be validated by running `npm run narrator-validate`.
Required JSON keys:
- `headline`, `what_we_did`, `what_it_is`, `whats_left`, `status_color`, `mood`, `key_metrics`, `sources_used`, `generated_at`, `safety_mode`.

Safety limits enforced:
- `sources_used` must be an array of strings.
- `safety_mode` must exactly equal `output_only`.
- `status_color` must be one of: `green`, `amber`, `red`, `blue`, `purple`.
- `key_metrics` must be an object.
