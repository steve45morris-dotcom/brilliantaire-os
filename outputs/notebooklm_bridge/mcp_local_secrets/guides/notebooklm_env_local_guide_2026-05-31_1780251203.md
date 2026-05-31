# NotebookLM MCP env.local Configuration Guide

## 🌌 Purpose of .env.local
The `.env.local` file acts as a local override boundary that configures environment variables on your system without leaking them into git history. Real secrets, private keys, or API tokens must reside only in this local boundary.

## 📋 Expected Environment Variables
| Env Name | Placeholder Example | Purpose | Local Setup Location | Never Commit Rule |
|---|---|---|---|---|
| `NOTEBOOKLM_MCP_ENABLED` | `false` | Configures if sidecar bridge execution is enabled | Local `.env.local` override | **NEVER COMMIT** |
| `NOTEBOOKLM_MCP_SERVER_COMMAND` | `"npx -y @google/notebooklm-mcp-server"` | Daemon startup command sequence | Local `.env.local` override | **NEVER COMMIT** |
| `NOTEBOOKLM_AUTH_PROFILE` | `"sandbox-profile-default"` | Authorization credential lookup reference | Local `.env.local` override | **NEVER COMMIT** |
| `GOOGLE_APPLICATION_CREDENTIALS` | `"/Users/username/secrets/gcp-sa-key.json"` | Absolute local path to GCP service account key | Local `.env.local` override | **NEVER COMMIT** |
| `GOOGLE_CLOUD_PROJECT` | `"brilliantaire-os-project"` | Target GCP project identifier | Local `.env.local` override | **NEVER COMMIT** |
| `NOTEBOOKLM_WORKSPACE_ID` | `"workspace-12345"` | Unique reference of Target NotebookLM Workspace | Local `.env.local` override | **NEVER COMMIT** |

## 🛡️ Critical Safety Policies
1. **Never Commit Secrets:** Do not commit `.env.local` or write real credentials inside tracked files.
2. **Deactivation Toggle:** Keep `NOTEBOOKLM_MCP_ENABLED=false` inside `.env.local` until the readiness gate recheck score successfully reaches **90%** or higher and passes completion reviews.
3. **Local Staging:** If you have keys stored in environment managers, define them in a custom helper script or configure them only in `.env.local` which is locked in `.gitignore`.
