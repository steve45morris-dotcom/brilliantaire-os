# NotebookLM MCP Blocker Correction Guide

* **Date:** {{DATE}}

| Blocker | Severity | Why It Matters | Manual Correction | Verification Command | Pass Condition |
|---|---|---|---|---|---|
{{BLOCKER_ROWS}}

## Re-scan Execution
Once corrections are implemented, run:
```bash
npm run notebooklm-mcp-readiness-gate -- "scan"
```
