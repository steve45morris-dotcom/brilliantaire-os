# NotebookLM MCP Rollback Plan

* **Date:** {{DATE}}

## Step-by-Step Deactivation Checklist

| Step | Action | Risk Reduced | Verification Command |
|---|---|---|---|
| **1** | Remove local environment variables values | Plain-text credentials exposure | `npm run notebooklm-mcp-auth -- "scan"` (confirm score drops to 0%) |
| **2** | Disable `NOTEBOOKLM_MCP_ENABLED` | Unauthorized process execution | Confirm `NOTEBOOKLM_MCP_ENABLED=false` in environment settings |
| **3** | Remove local MCP config file references | External process invocation | `npm run notebooklm-mcp-detect -- "scan"` (confirm detection status is inactive) |
| **4** | Rerun auth validation | Configuration validation drift | `npm run notebooklm-mcp-auth -- "status"` |
| **5** | Confirm live execution is disabled | Safety boundary violation | `npm run notebooklm-mcp-harden -- "status"` (confirm live execution is `No`) |
| **6** | Keep staged reports for audit | Telemetry audits history | Inspect `outputs/notebooklm_bridge/mcp_hardening/reports/` for historical logs |
