export const APPROVAL_ROUTER_ONLY = true;
export const ALLOW_SCRIPT_EXECUTION = false;
export const ALLOW_RAW_COMMAND_EXECUTION = false;
export const ALLOW_AUTO_BUILD = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NEXT_ACTIONS_AUTO_WRITE = false;
export const REQUIRE_APPROVAL_PACKAGE = true;
export const REQUIRE_APPROVE_DECISION = true;
export const REQUIRE_MANUAL_EXECUTION = true;

export const INPUT_FOLDERS = {
  reports: 'outputs/knowledge_harvest/pipeline_stage_gate/reports',
  proposals: 'outputs/knowledge_harvest/pipeline_stage_gate/proposals',
  dependencies: 'outputs/knowledge_harvest/pipeline_stage_gate/dependencies',
  prompts: 'outputs/knowledge_harvest/pipeline_stage_gate/prompts'
};

export const OUTPUT_FOLDERS = {
  approvedPackets: 'outputs/knowledge_harvest/pipeline_approval_router/approved_packets',
  reports: 'outputs/knowledge_harvest/pipeline_approval_router/reports',
  logs: 'outputs/knowledge_harvest/pipeline_approval_router/logs'
};

export const DECISION_LABELS = [
  'approve',
  'revise',
  'reject',
  'defer',
  'unknown'
] as const;

export type DecisionLabel = typeof DECISION_LABELS[number];

export const APPROVAL_STATUS_LABELS = [
  'approved_for_manual_build',
  'blocked',
  'needs_revision',
  'deferred',
  'rejected'
] as const;

export type ApprovalStatusLabel = typeof APPROVAL_STATUS_LABELS[number];
