# NotebookLM MCP Client Configuration Copy Checklist

* **Date:** 2026-06-01

## Configuration Handshake Parameters

* **Source Template:** `outputs/notebooklm_bridge/mcp_hardening/staged_config/notebooklm_mcp_config_template_YYYY-MM-DD.md`
* **Manual Destination:** `~/.claude/mcp.json` or `~/.config/mcp/` or `~/.codex/mcp.json`
* **Env References:** Mapped directly to process shell environment parameters instead of raw values.

## Safety Rules
1. **No Hardcoded Secrets:** Never replace the environment variable references (`{{ENV_VAR}}`) in the target JSON with active secrets.
2. **Manual Action Only:** The application never writes or alters local user configuration files automatically.
3. **Never Commit Client Configs:** Ensure that global configuration files are never committed to public repositories.

## Verification Step
* Rerun detection checks to verify if the client connector is discovered in one of the active paths:
  ```bash
  npm run notebooklm-mcp-detect -- "scan"
  npm run notebooklm-mcp-detect -- "status"
  ```
