# NotebookLM MCP Environment Variables Key Map

* **Date:** 2026-05-31

| Env Name | Purpose | Placeholder Example | Local Setup Location | Never Commit Rule |
|---|---|---|---|---|
| NOTEBOOKLM_MCP_ENABLED | Enable MCP Sidecar Bridge | `false` | .env.local | Do not commit to version control |
| NOTEBOOKLM_MCP_SERVER_COMMAND | Local MCP executable script command | `node dist/scripts/notebooklm-bridge.js` | .env.local | Do not commit to version control |
| NOTEBOOKLM_AUTH_PROFILE | Named auth profile to load | `dev-profile` | .env.local | Do not commit to version control |
| GOOGLE_APPLICATION_CREDENTIALS | Local filesystem path to Google Service Account JSON | `/Users/username/.config/gcloud/sa.json` | .env.local | Do not commit to version control |
| GOOGLE_CLOUD_PROJECT | Google Cloud project ID to reference | `brilliantaire-os-project` | .env.local | Do not commit to version control |
| NOTEBOOKLM_WORKSPACE_ID | NotebookLM workspace identifier token | `workspace-abc-123` | .env.local | Do not commit to version control |

## Safety Boundary
Never copy plaintext values or production tokens into version control tracked files (e.g. `config/`, `scripts/`, `src/`). Ensure these variables are exclusively configured in `.env.local` which is ignored by git.
