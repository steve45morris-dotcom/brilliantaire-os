export const STAGE_GATE_ONLY = true;
export const ALLOW_RAW_COMMAND_EXECUTION = false;
export const ALLOW_SCRIPT_EXECUTION = false;
export const ALLOW_AUTO_BUILD = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NEXT_ACTIONS_AUTO_WRITE = false;
export const REQUIRE_MANUAL_APPROVAL = true;
export const REQUIRE_DEPENDENCY_MAP = true;
export const REQUIRE_AGENT_ASSIGNMENT = true;

export const INPUT_FOLDERS = {
  workflowScoringReports: 'outputs/knowledge_harvest/workflow_scoring/reports',
  workflowScoringRankedIdeas: 'outputs/knowledge_harvest/workflow_scoring/ranked_ideas',
  groundedNotes: 'outputs/knowledge_harvest/grounded_notes',
  groundedSourcePacks: 'outputs/knowledge_harvest/grounded_source_packs'
};

export const OUTPUT_FOLDERS = {
  proposals: 'outputs/knowledge_harvest/pipeline_stage_gate/proposals',
  dependencies: 'outputs/knowledge_harvest/pipeline_stage_gate/dependencies',
  prompts: 'outputs/knowledge_harvest/pipeline_stage_gate/prompts',
  reports: 'outputs/knowledge_harvest/pipeline_stage_gate/reports',
  logs: 'outputs/knowledge_harvest/pipeline_stage_gate/logs'
};

export const SUPPORTED_STATUS_LABELS = [
  'staged',
  'needs_review',
  'approved_for_prompting',
  'blocked',
  'archived'
] as const;

export type ProposalStatus = typeof SUPPORTED_STATUS_LABELS[number];

export const RELEVANT_AGENTS = [
  'Knowledge Librarian',
  'Workflow Auditor',
  'OS Architect',
  'Prompt Engineer',
  'Build Operator',
  'Creative Revenue Strategist'
] as const;

export type RelevantAgent = typeof RELEVANT_AGENTS[number];
