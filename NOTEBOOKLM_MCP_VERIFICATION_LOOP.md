# NOTEBOOKLM MCP VERIFICATION LOOP SPECIFICATION

## 🌌 Overview & Mandate
To maintain a safe local verification loop for the NotebookLM Model Context Protocol (MCP) sidecar adapter without external dependencies, credentials leaks, or premature live command executions.

This phase follows **Phase 11K: MCP Setup Fix Cycle** to let the operator manually define credentials locally outside version control, execute a diagnostic chain of safe checks, and evaluate overall eligibility.

## 🛡️ Key Governance Policies

### 1. Local-Only Verification Rule
All environment variables and authorization JSON structures must live strictly in `.env.local` or the user config folder. They **MUST NEVER** be committed to public repository files. The verification loop checks file presence safely, but is strictly prohibited from parsing or displaying private credential values.

### 2. No Live Execution Rule
Under no circumstances should live NotebookLM MCP queries be executed during this phase. The global toggle `ALLOW_LIVE_MCP_EXECUTION` must remain configured as `false` in the readiness gate config files.

---

## ⛓️ Command Chain Sequence
The verification loop executes the complete chain of diagnostic check targets in sequence via `npm run`:

1. `npm run notebooklm-mcp-auth -- "scan"` — Scans local files outside the repository for active GID profiles.
2. `npm run notebooklm-mcp-auth -- "status"` — Prints authorization profile checks summary.
3. `npm run notebooklm-mcp-harden -- "readiness-recheck"` — Scans codebase for plain-text secrets leaks.
4. `npm run notebooklm-mcp-readiness-gate -- "scan"` — Primary readiness validator checks.
5. `npm run notebooklm-mcp-readiness-gate -- "decision"` — Readiness gate score generator.
6. `npm run notebooklm-mcp-completion-review -- "env-check"` — Environment presence assertions.
7. `npm run notebooklm-mcp-completion-review -- "review"` — Completion review report compiler.
8. `npm run notebooklm-mcp-completion-review -- "eligibility"` — Evaluates threshold conditions.
9. `npm run notebooklm-mcp-completion-review -- "status"` — High-level telemetry output.
10. `npm run notebooklm-mcp-fix-cycle -- "decision-summary"` — Fix cycle decision summary update.

---

## 🧠 Final Eligibility Decision Rules
The eligibility parser evaluates the latest workspace checks to output the final eligibility status:
* **Eligible Conditions:**
  - Readiness Score $\ge 90\%$ (i.e. all required environment keys mapped locally).
  - Safety Lock Active (`ALLOW_LIVE_MCP_EXECUTION` is `false`).
* **Transition Decision:**
  - **Yes:** Setup is eligible for Phase 11M Live MCP Query Adapter With Manual Enable.
  - **No:** Setup is not eligible. Operator must complete missing local variables setup and rerun check.

---

## 🛠️ CLI Interface Operations

Execute help guide:
```bash
npm run notebooklm-mcp-verify-loop-help
```

Run command chain:
```bash
npm run notebooklm-mcp-verify-loop -- "chain"
```

Compile final eligibility check report:
```bash
npm run notebooklm-mcp-verify-loop -- "final-check"
```

Read latest verification loop status:
```bash
npm run notebooklm-mcp-verify-loop -- "status"
```
