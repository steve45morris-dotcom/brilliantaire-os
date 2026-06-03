# Pipeline Integration Stage Gate

## 1. Purpose
The **Pipeline Integration Stage Gate** (Phase 13E) establishes a formal, manual-first safety gate in the Brilliantaire OS development lifecycle. It sits between idea scoring/recommendation and execution, ensuring all proposed builds are fully mapped, analyzed, assigned, and approved before any files are modified or code is run.

## 2. Why Stage Gate Follows Workflow Scoring
In the previous phase (Phase 13D), the *Workflow Idea Scoring Engine* extracted, scored, and recommended the top workflows to build. However, jumping directly from recommendation to automated build execution introduces risk. The Stage Gate ensures that the highest-scored recommendation is analyzed for system fit and dependencies, rather than blindly executed.

## 3. Strict Safety Boundaries
- **No Direct Execution:** This module is completely document-staged. It will not compile, run, or execute any staged code or shell scripts.
- **No Raw Command Execution:** Raw OS-level shell calls are strictly prohibited.
- **No Automated Obsidian Writes:** Reading from grounded notes is permitted; however, direct writes to active Obsidian vaults are restricted.
- **No Automated NEXT_ACTIONS.md Writes:** Writing to NEXT_ACTIONS.md is handled manually by developers at phase checkpoints.

## 4. Operational Flows

### A. Proposal Staging Flow
Reads the highest-scored recommendation from the workflow scoring engine outputs and creates a detailed `pipeline_build_proposal_YYYY-MM-DD.md` outlining the idea, score, target system, and build scope.

### B. Dependency Mapping Flow
Extracts target systems and traces all modules, file system routes, input/output paths, command router entries, and safety rules required to support the proposed idea. Writes to `pipeline_dependency_map_YYYY-MM-DD.md`.

### C. Agent Assignment Flow
Maps specialized AI agents in the Brilliantaire OS council to their respective responsibilities (e.g. Workflow Auditor for safety review, Build Operator for compilation, OS Architect for system rules). Writes to `pipeline_agent_assignment_YYYY-MM-DD.md`.

### D. Implementation Prompt Staging Flow
Generates a structured prompt detailing current verified phase, files to create, files to modify, tests to run, and commit directives. This is staged in `pipeline_implementation_prompt_YYYY-MM-DD.md` but is **not** executed.

### E. Approval Package Flow
Aggregates the proposal, dependency map, agent map, and prompt into a unified `pipeline_approval_package_YYYY-MM-DD.md` checkbook. This includes a manual check-off table and a recommended decision (e.g., *approve*, *revise*, *reject*, *defer*).

## 5. Command Interface
All operations are routed through the Safe Command Router:
```bash
# Get CLI Help
npm run command -- "pipeline-stage-gate-help"

# Stage Proposal
npm run command -- "pipeline-stage-gate proposal"

# Stage Dependency Map
npm run command -- "pipeline-stage-gate dependency-map"

# Stage Agent Matrix
npm run command -- "pipeline-stage-gate agent-map"

# Stage Implementation Instructions Prompt
npm run command -- "pipeline-stage-gate implementation-prompt"

# Assemble Approval Package
npm run command -- "pipeline-stage-gate approval-package"

# Review Readiness Status
npm run command -- "pipeline-stage-gate status"
```

## 6. Future Execution Boundary
Once the approval package is signed off, the staged prompt serves as the absolute specification source for subsequent phases. Execution of builds remains isolated outside this stage gate's boundary.
