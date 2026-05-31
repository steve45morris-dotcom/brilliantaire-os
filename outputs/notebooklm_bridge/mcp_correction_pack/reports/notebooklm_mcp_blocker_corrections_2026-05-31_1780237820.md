# NotebookLM MCP Blocker Correction Guide

* **Date:** 2026-05-31

| Blocker | Severity | Why It Matters | Manual Correction | Verification Command | Pass Condition |
|---|---|---|---|---|---|
| Missing Local Setup Files | Medium | Local credential parameters are not defined outside version control. | Create local config file .env.local or .mcp.local.json | npm run notebooklm-mcp-readiness-gate -- "scan" | Local setup file exists logs as Yes |
| Missing MCP Config Reference | Medium | Claude/Cursor cannot resolve the sidecar execution command block. | Copy sidecar connector config to client settings | npm run notebooklm-mcp-readiness-gate -- "scan" | MCP Config References logs as Yes |
| Missing Environment Key: NOTEBOOKLM_MCP_ENABLED | High | Node runtime is missing target credential profiles and workspace parameters. | Define the NOTEBOOKLM_MCP_ENABLED key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |
| Missing Environment Key: NOTEBOOKLM_MCP_SERVER_COMMAND | High | Node runtime is missing target credential profiles and workspace parameters. | Define the NOTEBOOKLM_MCP_SERVER_COMMAND key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |
| Missing Environment Key: NOTEBOOKLM_AUTH_PROFILE | High | Node runtime is missing target credential profiles and workspace parameters. | Define the NOTEBOOKLM_AUTH_PROFILE key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |
| Missing Environment Key: GOOGLE_APPLICATION_CREDENTIALS | High | Node runtime is missing target credential profiles and workspace parameters. | Define the GOOGLE_APPLICATION_CREDENTIALS key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |
| Missing Environment Key: GOOGLE_CLOUD_PROJECT | High | Node runtime is missing target credential profiles and workspace parameters. | Define the GOOGLE_CLOUD_PROJECT key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |
| Missing Environment Key: NOTEBOOKLM_WORKSPACE_ID | High | Node runtime is missing target credential profiles and workspace parameters. | Define the NOTEBOOKLM_WORKSPACE_ID key-value pair in .env.local | npm run notebooklm-mcp-readiness-gate -- "scan" | Key is list-checked as present |

## Re-scan Execution
Once corrections are implemented, run:
```bash
npm run notebooklm-mcp-readiness-gate -- "scan"
```
