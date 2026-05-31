# 🔎 NotebookLM MCP Adapter Detection

## Purpose
This module provides a safe detection layer to check whether a NotebookLM Model Context Protocol (MCP) connector is installed, configured, and reachable on the local system. It only inspects local configuration profiles and outputs markdown audit reports.

## Safety Boundaries (The Golden Rules)
1. **Detection-Only Rule:** This module must only inspect local configuration paths. Under no circumstances should it attempt to initiate connection requests, authorize accounts, or execute search queries.
2. **No-Query Rule:** It must not execute NotebookLM research queries.
3. **No External API Calls:** No web calls, scraping, or DNS lookups are allowed.
4. **No Direct Obsidian Writes:** Stage reports locally; do not write directly to active Obsidian vault directories.
5. **No File Modification:** Scanned configurations must be treated as read-only. Do not create, modify, or delete any external MCP files.
6. **No Arbitrary Execution:** Do not run unverified shell commands.

## Scanned Configuration Files
The scanner searches the following paths for NotebookLM MCP configuration entries:
- `.mcp.json`
- `mcp.json`
- `~/config/mcp/`
- `~/.cursor/mcp.json`
- `~/.claude/mcp.json`
- `~/.codex/mcp.json`
- `~/.agents/mcp.json`
- `package.json` scripts
- `Taskfile.yml`

## Candidate Connector Names
The adapter scans files for references to any of the following names:
- `notebooklm`
- `notebooklm-mcp`
- `notebooklm-server`
- `notebook-lm`
- `google-notebooklm`

## Command Usage
Execution is routed through the Safe Command Router:

```bash
# Get help listing available commands
npm run command -- "notebooklm-mcp-detect-help"

# Run the local scanner and generate a report
npm run command -- "notebooklm-mcp-detect scan"

# Check the current status of detection reports
npm run command -- "notebooklm-mcp-detect status"

# Generate a detailed capabilities summary report
npm run command -- "notebooklm-mcp-detect capability-report"
```

## What Positive Detection Means
A positive detection indicates that a NotebookLM MCP connector mapping is defined in at least one of the scanned configuration profiles, showing that the environment is structurally prepared for NotebookLM MCP automation. It does *not* imply active connectivity to Google's backends.

## Why MCP Activation Comes Later
MCP activation is deferred to Phase 11D to ensure that the detection metrics, configuration states, and user confirmations are thoroughly logged and validated beforehand. This prevents premature connections, token leakage, or command injection hazards.
