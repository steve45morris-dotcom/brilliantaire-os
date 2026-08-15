# 📊 Safe Mesh Telemetry Logger (Phase 7A)

This document specifies the design, offline rules, and reporting structures for the **Safe Mesh Telemetry Logger** in **Brilliantaire OS**.

---

## 1. Purpose

The **Mesh Telemetry Logger** is an offline auditing engine. It aggregates historical CLI execution logs, voice command queues, confirmation results, Whisper transcripts, and campaign validation scores into unified system summaries and reports.

---

## 2. Offline-Only Safety Policy

To ensure strict sandboxing and workspace integrity:
* **No Telemetry Networks:** The engine compiles telemetry reports strictly from local filesystem files and does not submit data to external APIs, databases, or cloud endpoints.
* **No Auto-Triggering:** Telemetry reports are drafted statically when run by the developer or called through the Safe Command Router.
* **Zero Destruction:** The logger never deletes or modifies historical logs. It operates strictly in a read-only manner on existing inputs.

---

## 3. Supported CLI Commands

* **Help Manual:**
  ```bash
  npm run mesh-telemetry -- "help"
  ```
* **System Snapshot:**
  ```bash
  npm run mesh-telemetry -- "snapshot"
  ```
* **Unified Report:**
  ```bash
  npm run mesh-telemetry -- "report"
  ```
* **Sporty Campaign Metrics:**
  ```bash
  npm run mesh-telemetry -- "campaign sporty"
  ```
* **Status Dashboard Check:**
  ```bash
  npm run mesh-telemetry -- "status"
  ```

---

## 4. Log Families Inspected

The engine dynamically compiles statistics by scanning files within:
1. `outputs/command_logs/` — Tracking overall command volume and blocked execution attempts.
2. `outputs/voice_command_logs/` — Auditing dispatcher logs, accepted phrases, and rejections.
3. `outputs/voice_confirmation_logs/` — Verifying manual approvals and denials.
4. `outputs/vibevoice_logs/` & `outputs/live_asr_logs/` — Reviewing microphone bridge ingest details.
5. `outputs/write_logs/` — Auditing approved Obsidian write gates.
6. `outputs/campaigns/simulations/` & `outputs/campaigns/validation_reports/` — Extracting campaign readiness scores.
7. `outputs/higgsfield_ai/logs/` & `outputs/higgsfield_ai/render_requests/` — Tracking AI video render request staging and approval status.
8. `outputs/local_inference/logs/` & `outputs/local_inference/chat_requests/` — Tracking local inference server chat request staging and prompt management.

---

## 5. Scope Boundaries

### What Telemetry Can Do
* Audit total script runs, error exit codes, and blocked actions.
* Extract structural capabilities, active council agent counts, and project status matrices.
* Calculate platform coverage percentages and asset completeness levels.

### What Telemetry Cannot Do
* Track user location, keypress events, or clipboard data.
* Broadcast logs to analytics platforms or telemetry databases.
* Automatically resolve missing checklist errors without developer modifications.

---

## 6. Future Dashboard Boundary

Any future lightweight web interface or dashboard must:
1. Be constructed strictly on top of the static reports generated under `outputs/mesh_telemetry/`.
2. Restrict access to read-only capabilities and avoid writing commands back to the system.
