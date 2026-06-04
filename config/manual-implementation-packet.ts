export const PACKET_COMPILER_ONLY = true;
export const ALLOW_SCRIPT_EXECUTION = false;
export const ALLOW_RAW_COMMAND_EXECUTION = false;
export const ALLOW_AUTO_BUILD = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NEXT_ACTIONS_AUTO_WRITE = false;
export const REQUIRE_APPROVED_PACKET = true;
export const REQUIRE_MANUAL_EXECUTION = true;
export const REQUIRE_SAFETY_REVIEW = true;

export const INPUT_FOLDERS = {
  approvedPackets: 'outputs/knowledge_harvest/pipeline_approval_router/approved_packets',
  routerReports: 'outputs/knowledge_harvest/pipeline_approval_router/reports',
  stageGatePrompts: 'outputs/knowledge_harvest/pipeline_stage_gate/prompts',
  stageGateDependencies: 'outputs/knowledge_harvest/pipeline_stage_gate/dependencies',
  stageGateReports: 'outputs/knowledge_harvest/pipeline_stage_gate/reports'
};

export const OUTPUT_FOLDERS = {
  prompts: 'outputs/knowledge_harvest/manual_implementation/prompts',
  checklists: 'outputs/knowledge_harvest/manual_implementation/checklists',
  reports: 'outputs/knowledge_harvest/manual_implementation/reports',
  logs: 'outputs/knowledge_harvest/manual_implementation/logs'
};
