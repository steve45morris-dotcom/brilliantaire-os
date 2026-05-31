# NotebookLM MCP Outstanding Blockers List

* **Scan Date:** {{DATE}}

| Blocker | Evidence | Severity | Required Manual Action | Rerun Command |
|---|---|---|---|---|
{{BLOCKERS_TABLE_ROWS}}

## Re-evaluation Guidance
Once you have resolved the outstanding blockers by manually copying local templates and defining environment parameters in `.env.local`, rerun the readiness gate checks to update status:
```bash
npm run notebooklm-mcp-readiness-gate -- "scan"
npm run notebooklm-mcp-readiness-gate -- "status"
```
