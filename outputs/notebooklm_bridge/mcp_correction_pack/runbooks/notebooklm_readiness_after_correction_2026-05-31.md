# NotebookLM Readiness After Correction Runbook

* **Date:** 2026-05-31

| Command | Purpose | Expected Result | Pass Condition | Next Step |
|---|---|---|---|---|
| `npm run notebooklm-mcp-auth -- "scan"` | Verify Auth environment variables setup | Auth variables exist logs as Yes | Readiness score shows positive change | Run status checks |
| `npm run notebooklm-mcp-auth -- "status"` | Display auth parameters and checklist status | Outputs auth scan parameters | Config lists status passes | Run hardening recheck |
| `npm run notebooklm-mcp-harden -- "readiness-recheck"` | Scan codebase for plain credentials | Hygiene scans find 0 plain credentials | Exit code 0 and reports show clean status | Run setup readiness scan |
| `npm run notebooklm-mcp-readiness-gate -- "scan"` | Scan gate review setup state | Required env variables found logs as Yes | Gate scan score reaches 90% or above | Run decision report builder |
| `npm run notebooklm-mcp-readiness-gate -- "decision"` | Compile live integration eligibility decision | Eligibility decision compiled successfully | Eligibility outputs ELIGIBLE | Run final status review |
| `npm run notebooklm-mcp-readiness-gate -- "status"` | Display overall setup state review | Outputs status parameters review | Overall Eligible lists as Yes | Operator manual approval |

## Summary of Verification Checks
Run these scripts sequentially. Ensure each returns a successful/passing exit status before moving to the next command.
