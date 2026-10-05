import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const MODULE_NAME = 'Bridge Health Monitor';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTO_FIX = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_MANUAL_REVIEW = true;

export const PROJECT_NAME = 'Bridge Health Monitor';
export const TOOL_TYPE = 'Unified Bridge Health Aggregator';
export const INTEGRATION_TARGET = 'tools/*_bridge.ts + config/*.ts — all 15 bridge modules with safety flag and export validation';

export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'bridge_health_monitor');
export const outputFolders = {
  root: OUTPUT_ROOT,
  reports: path.join(OUTPUT_ROOT, 'reports'),
  scans: path.join(OUTPUT_ROOT, 'scans'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'bridge_health_monitor');

// All 15 bridge modules (14 + self)
export const bridgeModules = [
  { name: 'ASR Human Approval Selection Bridge', bridge: 'tools/asr_human_approval_selection_bridge.ts', config: 'config/asr-human-approval-selection-packet.ts' },
  { name: 'Documentation Drift Detector Bridge', bridge: 'tools/documentation_drift_detector_bridge.ts', config: 'config/documentation-drift-detector.ts' },
  { name: 'Higgsfield AI Bridge', bridge: 'tools/higgsfield_ai_bridge.ts', config: 'config/higgsfield-ai.ts' },
  { name: 'Live Microphone Audio Streamer Bridge', bridge: 'tools/live_microphone_audio_streamer_bridge.ts', config: 'config/live-microphone-audio-streamer.ts' },
  { name: 'Local Inference Bridge', bridge: 'tools/local_inference_bridge.ts', config: 'config/local-inference.ts' },
  { name: 'Manual Implementation Packet Bridge', bridge: 'tools/manual_implementation_packet_bridge.ts', config: 'config/manual-implementation-packet.ts' },
  { name: 'Micro Product Tree Groove Bridge', bridge: 'tools/micro_product_tree_groove_bridge.ts', config: 'config/micro-product-tree-groove-connector.ts' },
  { name: 'Obsidian Sync Layer Bridge', bridge: 'tools/obsidian_sync_layer_bridge.ts', config: 'config/obsidian-sync-layer.ts' },
  { name: 'Render Intake Bridge', bridge: 'tools/render_intake_bridge.ts', config: 'config/render-intake.ts' },
  { name: 'Stripe Webhook Verification Bridge', bridge: 'tools/stripe_webhook_verification_bridge.ts', config: 'config/stripe-webhook-verification.ts' },
  { name: 'System Diagnostics Runner Bridge', bridge: 'tools/system_diagnostics_runner_bridge.ts', config: 'config/system-diagnostics-runner.ts' },
  { name: 'Tree Groove Release Pipeline Bridge', bridge: 'tools/tree_groove_release_pipeline_bridge.ts', config: 'config/tree-groove-release-pipeline.ts' },
  { name: 'Verification Rerun Planner Bridge', bridge: 'tools/verification_rerun_planner_bridge.ts', config: 'config/grinders-keep-verification-rerun-planner.ts' },
  { name: 'ZK Webhook Verification Bridge', bridge: 'tools/zk_webhook_verification_bridge.ts', config: 'config/zk-webhook-verification.ts' },
  { name: 'Bridge Health Monitor Bridge', bridge: 'tools/bridge_health_monitor_bridge.ts', config: 'config/bridge-health-monitor.ts' },
];

// Health categories for anomaly detection
export const healthCategories = [
  'bridge-missing',
  'config-missing',
  'safety-flag-violation',
  'output-dir-missing',
  'mode-mismatch',
  'export-missing',
] as const;
