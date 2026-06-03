# Pipeline Dependency Map: Pipeline Integration Stage Gate

- **Proposal Reference:** /Users/alexanderanthony/outputs/knowledge_harvest/pipeline_stage_gate/proposals/pipeline_build_proposal_2026-06-03.md
- **Readiness Status:** Ready for Manual Stage Gate Review

## Module Dependencies
- **Target Module:** Pipeline Integration Stage Gate
- **Existing Dependencies Needed:** Knowledge Harvest Engine, Command Router

## File System & I/O
- **Required Inputs:** outputs/knowledge_harvest/workflow_scoring/ranked_ideas/ranked_workflow_ideas_2026-06-03.md
- **Required Outputs:** outputs/knowledge_harvest/pipeline_stage_gate/proposals/, dependencies/, prompts/, reports/, logs/

## Command Router Configuration
- **Command Router Dependencies:** pipeline-stage-gate, pipeline-stage-gate-help
- **Safety Gates Needed:** Safe Command Router, Manual Stage Gate Checklist

## Blockers & Risk Analysis
- **Blocked Dependencies:** Local Script Executor (blocked in Phase 13E), Raw Command Execution (strictly blocked)
