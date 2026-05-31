# NotebookLM MCP Detection Report

- **Detection Date:** 2026-05-31
- **Confidence Score:** 75/100

## Files Checked
- [Not Found] .mcp.json
- [Not Found] mcp.json
- [Not Found] Directory: /Users/alexanderanthony/.config/mcp
- [Not Found] /Users/alexanderanthony/.cursor/mcp.json
- [Not Found] /Users/alexanderanthony/.claude/mcp.json
- [Not Found] /Users/alexanderanthony/.codex/mcp.json
- [Not Found] /Users/alexanderanthony/.agents/mcp.json
- [Checked] package.json
- [Checked] Taskfile.yml

## Connector References Found
- `notebooklm`
- `notebooklm-mcp`

## Launch Commands Found
- `npm run notebooklm-bridge`
- `npm run notebooklm-bridge-help`
- `npm run notebooklm-mcp-detect`
- `npm run notebooklm-mcp-detect-help`
- `notebooklm-bridge-help:`
- `desc: "Print NotebookLM MCP Sidecar Bridge safety manuals"`
- `- npm run notebooklm-bridge-help`
- `notebooklm-bridge:`
- `desc: "Run NotebookLM MCP Sidecar Bridge tasks safely"`
- `- npm run notebooklm-bridge -- {{.CLI_ARGS}}`
- `notebooklm-mcp-detect-help:`
- `desc: "Print NotebookLM MCP Adapter Detection safety manuals"`
- `- npm run notebooklm-mcp-detect-help`
- `notebooklm-mcp-detect:`
- `desc: "Run NotebookLM MCP Adapter Detection checks safely"`
- `- npm run notebooklm-mcp-detect -- {{.CLI_ARGS}}`

## Environment Variables Referenced
None

## Safety Warnings
- **DANGER:** Direct NotebookLM MCP execution is currently disabled (`ALLOW_MCP_QUERY_EXECUTION: false`). Do not force execution.
- **SECURITY:** External network calls and query API endpoints are disabled. Scans are entirely offline.
- **INTEGRITY:** Tested configurations must not be written to or modified by this script.

## Next Recommended Action
Generate a detailed capabilities report using `npm run notebooklm-mcp-detect -- "capability-report"` to outline adapter specifications.
