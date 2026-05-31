# NotebookLM MCP Connector Configuration Template

This staged template outlines the JSON configuration structure required to configure the NotebookLM MCP Connector safely in target Claude or Cursor configuration directories.

## Configuration Details

* **Connector Name:** `notebooklm-mcp`
* **Server Command:** `node` or `npx` (as defined in environment)
* **Env References:** Uses references to local environment variables to inject credentials securely at runtime rather than storing them in plain JSON.
* **Dry Run Mode:** Active (`ALLOW_LIVE_MCP_EXECUTION = false`)

## Staged Config Schema (Example)

```json
{
  "mcpServers": {
    "notebooklm-mcp": {
      "command": "{{NOTEBOOKLM_MCP_SERVER_COMMAND}}",
      "args": [],
      "env": {
        "NOTEBOOKLM_MCP_ENABLED": "{{NOTEBOOKLM_MCP_ENABLED}}",
        "NOTEBOOKLM_AUTH_PROFILE": "{{NOTEBOOKLM_AUTH_PROFILE}}",
        "GOOGLE_APPLICATION_CREDENTIALS": "{{GOOGLE_APPLICATION_CREDENTIALS}}",
        "GOOGLE_CLOUD_PROJECT": "{{GOOGLE_CLOUD_PROJECT}}",
        "NOTEBOOKLM_WORKSPACE_ID": "{{NOTEBOOKLM_WORKSPACE_ID}}"
      }
    }
  }
}
```

## Manual Copy Instructions

1. Retrieve the validated paths and parameters from your secure offline storage.
2. In your home directory configuration (e.g. `~/.claude/mcp.json` or `~/.config/mcp/`), add the `notebooklm-mcp` definition to the `mcpServers` object.
3. Replace the placeholder templates (e.g. `{{NOTEBOOKLM_WORKSPACE_ID}}`) with the corresponding active environment values.
4. **DO NOT** commit the completed configuration file back to public version control.
