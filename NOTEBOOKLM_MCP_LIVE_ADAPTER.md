# 🛰️ NotebookLM MCP Live Adapter Integration

This document outlines the purpose, safety boundaries, manual gates, allowed query types, and rollback mechanisms for the restricted read-only live query adapter (Phase 11M).

---

## 🎯 Purpose
The **Live MCP Query Adapter** enables pre-configured read-only queries to run against the NotebookLM MCP server. It bridges the gap between local static staging and remote workspace data harvesting, under strict local safety gates.

---

## 🛡️ Core Safety Gating Rules

### 1. Manual-Enable Rule
Live adapter execution is completely inactive by default and requires `NOTEBOOKLM_MCP_ENABLED=true` inside `.env.local` plus manual execution routing.

### 2. Read-Only Query Boundary
The adapter only dispatches queries and never mutates NotebookLM workspaces. 

### 3. Allowed Query Types
Only the following query types are pre-approved in the allowlist:
- `source-summary`
- `workflow-extraction`
- `weak-claims-review`
- `os-module-suggestions`
- `prompt-pack-ideas`

### 4. Blocked Operations
The following functions are strictly prohibited and hard-blocked:
- Notebook creation or deletion (`create-notebook`, `delete-notebook`)
- Source upload, update, or deletion (`update-source`, `delete-source`)
- Direct writes to Obsidian vault files (`write-obsidian`)
- Launching arbitrary subprocesses (`execute-command`)
- Browser automation/scraping routines (`browser-automation`)

### 5. Secrets Redaction Rule
Private credentials must never be printed to logs, console, reports, or checked into version control.

### 6. Obsidian Staging Rule
All responses fetched from NotebookLM are stored locally under the outputs directory. Generating an Obsidian export only stages the note under `outputs/notebooklm_bridge/live_mcp/obsidian_staged_exports/` and never writes directly into the Obsidian vault.

### 7. Response Logging
Every execution (whether blocked, run, or manually imported) appends a log entry to `outputs/notebooklm_bridge/live_mcp/logs/live_query_log_YYYY-MM-DD.md`.

---

## ⚡ Fallback Behavior
If the live WebSocket connection or client-command cannot execute safely:
1. Do not simulate success or mock output.
2. Mark query status as `blocked_manual_execution_required`.
3. Generate detailed manual execution instructions in the reports folder for the operator to copy-paste.

---

## ↩️ Rollback Plan
To deactivate the live adapter at any point, set `NOTEBOOKLM_MCP_ENABLED=false` in `.env.local` or run `npm run notebooklm-mcp-uninstall` to disable hooks.
