# NotebookLM MCP Fix Tasks Checklist

- **Date:** 2026-05-31
- **Fix Cycle Status:** IN_PROGRESS

| Task | Evidence | Manual Correction | Verification Command | Pass Condition | Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Create .env.local file | .env.local file is missing in root | Create .env.local in repo root | ls -la .env.local | File exists | Knowledge Librarian | 🔴 PENDING |
| Gitignore .env.local | .env.local not found in .gitignore | Append .env.local to .gitignore | git check-ignore .env.local | File is gitignored | Knowledge Librarian | 🟢 DONE |
| Configure Client Sidecar | 'notebooklm-mcp' config not found in client settings | Copy mcp config block to client settings | npm run notebooklm-mcp-readiness-gate -- scan | Client config mapped | Knowledge Librarian | 🔴 PENDING |
| Map NOTEBOOKLM_MCP_ENABLED | NOTEBOOKLM_MCP_ENABLED not found in configurations | Define NOTEBOOKLM_MCP_ENABLED inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
| Map NOTEBOOKLM_MCP_SERVER_COMMAND | NOTEBOOKLM_MCP_SERVER_COMMAND not found in configurations | Define NOTEBOOKLM_MCP_SERVER_COMMAND inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
| Map NOTEBOOKLM_AUTH_PROFILE | NOTEBOOKLM_AUTH_PROFILE not found in configurations | Define NOTEBOOKLM_AUTH_PROFILE inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
| Map GOOGLE_APPLICATION_CREDENTIALS | GOOGLE_APPLICATION_CREDENTIALS not found in configurations | Define GOOGLE_APPLICATION_CREDENTIALS inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
| Map GOOGLE_CLOUD_PROJECT | GOOGLE_CLOUD_PROJECT not found in configurations | Define GOOGLE_CLOUD_PROJECT inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
| Map NOTEBOOKLM_WORKSPACE_ID | NOTEBOOKLM_WORKSPACE_ID not found in configurations | Define NOTEBOOKLM_WORKSPACE_ID inside .env.local | npm run notebooklm-mcp-completion-review -- env-check | Key is present | Knowledge Librarian | 🔴 PENDING |
