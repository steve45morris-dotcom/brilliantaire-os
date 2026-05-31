# NotebookLM MCP Environment Variables Hardened Template

This staged template outlines the environment variables required to integrate NotebookLM MCP safely into the Brilliantaire OS runtime.

## Required Variables Matrix

| Required Env Name | Placeholder Value | Purpose | Safety Note |
|---|---|---|---|
| **NOTEBOOKLM_MCP_ENABLED** | `false` | Enable/disable NotebookLM MCP queries | Set to `false` by default to prevent unauthorized execution |
| **NOTEBOOKLM_MCP_SERVER_COMMAND** | `npx -y @google/notebooklm-mcp-server` | Command used to spawn MCP process | Hardened path verification is required to avoid arbitrary command execution |
| **NOTEBOOKLM_AUTH_PROFILE** | `default-profile` | Identity profile reference | Never hardcode active credentials directly in this value |
| **GOOGLE_APPLICATION_CREDENTIALS** | `/path/to/secured/keys.json` | Path to Google Cloud Service Account JSON key | Do not store or commit this JSON key file inside the repo |
| **GOOGLE_CLOUD_PROJECT** | `your-google-cloud-project-id` | GCP Project ID hosting NotebookLM API | Must be verified to match target Workspace bounds |
| **NOTEBOOKLM_WORKSPACE_ID** | `your-notebooklm-workspace-id` | Target workspace identifier | Ensure workspace access conforms to the scope review parameters |

---

### Hardening Safety Constraints
* **No Real Secrets:** Staged templates contain zero credentials.
* **No Direct Write:** Real variables must be written in the system's external environment settings or manually copied to your local `.env`.
* **Zero Commit Rule:** Ensure any local `.env` or `.env.local` containing values is registered in `.gitignore`.
