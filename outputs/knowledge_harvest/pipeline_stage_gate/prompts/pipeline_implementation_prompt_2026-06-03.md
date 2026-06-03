# Pipeline Implementation Prompt: Pipeline Integration Stage Gate

## Context
- **Current Verified Phase:** Phase 13D: Workflow Idea Scoring Engine complete
- **Selected Idea Title:** Pipeline Integration Stage Gate

## Safety Rules
- STAGE_GATE_ONLY = true
- ALLOW_RAW_COMMAND_EXECUTION = false
- ALLOW_SCRIPT_EXECUTION = false
- ALLOW_AUTO_BUILD = false
- ALLOW_OBSIDIAN_WRITE = false
- ALLOW_NEXT_ACTIONS_AUTO_WRITE = false

## Files to Create
- config/pipeline-stage-gate.ts
- scripts/pipeline-stage-gate.ts
- scripts/pipeline-stage-gate-help.ts
- templates/knowledge_harvest/pipeline_stage_gate/*

## Files to Modify
- package.json
- Taskfile.yml
- config/commands.ts
- COMMANDS.md
- SYSTEM_STATUS.md
- PROJECTS.md
- NEXT_ACTIONS.md
- README.md

## Verification & Testing
- **Tests to Run:** - npm run build
- npm run audit
- npm run pipeline-stage-gate-help
- npm run pipeline-stage-gate -- "proposal"
- **Expected Outputs:** proposal, dependency map, agent map, implementation prompt, and approval package files staged under outputs/knowledge_harvest/pipeline_stage_gate/

## Handoff & Version Control
- **Git Commit Message:** Add pipeline integration stage gate
- **Final Report Requirements:** Detailed status, files created/modified, and next action recommendations.
