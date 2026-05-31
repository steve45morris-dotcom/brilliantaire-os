# NotebookLM MCP Environment Variables Key Map

* **Date:** {{DATE}}

| Env Name | Purpose | Placeholder Example | Local Setup Location | Never Commit Rule |
|---|---|---|---|---|
{{ENV_KEY_MAP_ROWS}}

## Safety Boundary
Never copy plaintext values or production tokens into version control tracked files (e.g. `config/`, `scripts/`, `src/`). Ensure these variables are exclusively configured in `.env.local` which is ignored by git.
