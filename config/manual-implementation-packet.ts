import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTOMATED_BUILD = false;
export const ALLOW_CODE_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_SCRIPT_EXECUTION = false;
export const ALLOW_RAW_COMMAND_EXECUTION = false;
export const ALLOW_AUTO_BUILD = false;
export const ALLOW_OBSIDIAN_WRITE = false;
export const ALLOW_NEXT_ACTIONS_AUTO_WRITE = false;
export const REQUIRE_HUMAN_REVIEW = true;
export const REQUIRE_SAFETY_REVIEW = true;
export const REQUIRE_APPROVED_PACKET = true;
export const REQUIRE_MANUAL_EXECUTION = true;
export const PACKET_COMPILER_ONLY = true;

export const PROJECT_NAME = "Manual Implementation Packet Compiler";
export const TOOL_TYPE = "Pipeline Implementation Compiler";
export const INTEGRATION_TARGET = "BRILLIANTAIRE OS Pipeline";

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet'),
  buildPrompts: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'build_prompts'),
  checklists: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'checklists'),
  safetyReviews: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'safety_reviews'),
  handoffs: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'handoffs'),
  obsidianExports: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'obsidian_exports'),
  logs: path.join(REPO_ROOT, 'outputs', 'manual_implementation_packet', 'logs')
};

export const INPUT_FOLDERS = {
  approvedPackets: path.join(REPO_ROOT, 'outputs', 'pipeline_approval_router'),
  routerReports: path.join(REPO_ROOT, 'outputs', 'pipeline_approval_router'),
  stageGatePrompts: path.join(REPO_ROOT, 'outputs', 'pipeline_stage_gate'),
  stageGateDependencies: path.join(REPO_ROOT, 'outputs', 'pipeline_stage_gate'),
  stageGateReports: path.join(REPO_ROOT, 'outputs', 'pipeline_stage_gate'),
  knowledgeHarvestApprovedPackets: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'pipeline_approval_router', 'approved_packets'),
  knowledgeHarvestRouterReports: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'pipeline_approval_router', 'reports'),
  knowledgeHarvestStageGatePrompts: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'pipeline_stage_gate', 'prompts'),
  knowledgeHarvestStageGateDependencies: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'pipeline_stage_gate', 'dependencies'),
  knowledgeHarvestStageGateReports: path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'pipeline_stage_gate', 'reports')
};

export const supportedCommands = [
  'status',
  'compile-prompt',
  'checklist',
  'safety-review',
  'handoff',
  'obsidian-export'
];

export { REPO_ROOT };
