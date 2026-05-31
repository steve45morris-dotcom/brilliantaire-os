# NotebookLM MCP Missing Environment Variables Checklist

* **Date:** 2026-05-31

| Env Name | Purpose | Placeholder Example | Local Setup Target | Never Commit Rule | Verification Command |
|---|---|---|---|---|---|
| `NOTEBOOKLM_MCP_ENABLED` | Enables the NotebookLM Model Context Protocol adapter layers. | `NOTEBOOKLM_MCP_ENABLED=false` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |
| `NOTEBOOKLM_MCP_SERVER_COMMAND` | Mapped path or node process command to launch the NotebookLM MCP daemon. | `NOTEBOOKLM_MCP_SERVER_COMMAND="npx -y @google/notebooklm-mcp-server"` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |
| `NOTEBOOKLM_AUTH_PROFILE` | Selects authorization profile for local sandbox or cloud settings. | `NOTEBOOKLM_AUTH_PROFILE="sandbox-profile-default"` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the Google Service Account JSON key file. | `GOOGLE_APPLICATION_CREDENTIALS="/Users/alexanderanthony/secrets/gcp-sa-key.json"` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |
| `GOOGLE_CLOUD_PROJECT` | Target Google Cloud Platform Project ID for NotebookLM API gateway. | `GOOGLE_CLOUD_PROJECT="brilliantaire-os-prod"` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |
| `NOTEBOOKLM_WORKSPACE_ID` | Unique identifier of your target NotebookLM workspace instance. | `NOTEBOOKLM_WORKSPACE_ID="workspace-mcp-908124"` | `.env.local` | **Local-Only (Never Commit)** | `npm run notebooklm-mcp-completion-review -- env-check` |

## ⚠️ Security Notice
Do not commit raw secret values into the repository. Use `.env.local` which must be gitignored at all times.
