# Final Manual Build Prompt - 2026-06-04

## Context
- **Current Verified Phase:** Phase 13D: Workflow Idea Scoring Engine complete
- **Selected Idea:** Pipeline Integration Stage Gate
- **Approval Status:** approved_for_manual_build

## Core Objective
- **Objective:** Complete manual implementation of the "Pipeline Integration Stage Gate" module. Execute code changes, configure Safe Command Router mappings, and run strict manual verification tests.

## Implementation Scope
### Files To Create
- config/pipeline-stage-gate.ts
- scripts/pipeline-stage-gate.ts
- scripts/pipeline-stage-gate-help.ts
- templates/knowledge_harvest/pipeline_stage_gate/*

### Files To Modify
- package.json
- Taskfile.yml
- config/commands.ts
- COMMANDS.md
- SYSTEM_STATUS.md
- PROJECTS.md
- NEXT_ACTIONS.md
- README.md

## Safety Rules & Guardrails
- STAGE_GATE_ONLY = true
- ALLOW_RAW_COMMAND_EXECUTION = false
- ALLOW_SCRIPT_EXECUTION = false
- ALLOW_AUTO_BUILD = false
- ALLOW_OBSIDIAN_WRITE = false
- ALLOW_NEXT_ACTIONS_AUTO_WRITE = false

## Verification & Testing
- **Tests To Run:**
- npm run build
- npm run audit
- npm run pipeline-stage-gate-help
- npm run pipeline-stage-gate -- "proposal"

- **Expected Outputs:**
proposal, dependency map, agent map, implementation prompt, and approval package files staged under outputs/knowledge_harvest/pipeline_stage_gate/

## Deliverables & Handoff
- **Commit Message:** Add pipeline integration stage gate
- **Final Report Requirements:** Detailed status, files created/modified, and next action recommendations.
