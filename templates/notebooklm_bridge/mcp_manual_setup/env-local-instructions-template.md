# NotebookLM MCP Local Environment Variables Checklist

* **Date:** {{DATE}}
* **File:** `.env.local`

## Required Environment Variables Checklist

| Required Env Name | Placeholder Example | Purpose | Safety Note | Git Rule |
|---|---|---|---|---|
| **NOTEBOOKLM_MCP_ENABLED** | `false` | Enable/Disable NotebookLM queries | Do not set to `true` globally until validation passes | Must not be committed |
| **NOTEBOOKLM_MCP_SERVER_COMMAND** | `npx -y @google/notebooklm-mcp-server` | Spawns sidecar MCP process | Ensure verified executable path | Must not be committed |
| **NOTEBOOKLM_AUTH_PROFILE** | `default-profile` | Credentials profile tag | Never use actual password strings | Must not be committed |
| **GOOGLE_APPLICATION_CREDENTIALS** | `/absolute/path/to/key.json` | GCP service account credential file | Keep file isolated from workspace | Must not be committed |
| **GOOGLE_CLOUD_PROJECT** | `your-gcp-project` | GCP project ID hosting API | Verified workspace matching GCloud project ID | Must not be committed |
| **NOTEBOOKLM_WORKSPACE_ID** | `your-workspace-id` | Target workspace ID | Restrict permission bounds | Must not be committed |

## Safety Warnings
* **Local Only:** `.env.local` must remain exclusively on the host filesystem.
* **Git ignored:** Ensure `.env.local` is listed in your repository `.gitignore` file before adding any values.
* **Credentials Isolation:** Do not copy service account keys inside any folder tracked by version control.
