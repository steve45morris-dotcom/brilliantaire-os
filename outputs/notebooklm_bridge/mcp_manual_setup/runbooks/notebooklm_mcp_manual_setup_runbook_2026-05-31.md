# NotebookLM MCP Manual Setup Runbook

* **Date:** 2026-05-31
* **Setup Purpose:** Establish local, offline credentials references for NotebookLM MCP without committing private credentials.
* **Already Complete:** Phase 11E Auth Validation and Phase 11F Configuration Hardening have verified local directories and credentials-free template assets.

## Manual Steps Required
1. Configure your local environment file (`.env.local`) with the actual keys.
2. Manually copy the staged MCP server settings block into your home directory's MCP client configuration folder.
3. Validate that variables are loaded in the environment but not committed.
4. Rerun validation scripts to confirm readiness score.

## Required Environment Variables (No values committed!)
- `NOTEBOOKLM_MCP_ENABLED`
- `NOTEBOOKLM_MCP_SERVER_COMMAND`
- `NOTEBOOKLM_AUTH_PROFILE`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_CLOUD_PROJECT`
- `NOTEBOOKLM_WORKSPACE_ID`

## Files Never To Commit
- `.env.local`
- `~/.claude/mcp.json` (or any global file containing active values)
- Any active service account private key JSON files

## Validation Commands
* Rerun auth validation checks:
  ```bash
  npm run notebooklm-mcp-auth -- "scan"
  npm run notebooklm-mcp-auth -- "status"
  ```
* Recheck hardening matrices:
  ```bash
  npm run notebooklm-mcp-harden -- "readiness-recheck"
  ```

## Live Execution Boundary
Live execution is strictly blocked (`ALLOW_LIVE_MCP_EXECUTION = false` by default). Do not enable active queries until all offline parameters are verified and manual approval is completed.
