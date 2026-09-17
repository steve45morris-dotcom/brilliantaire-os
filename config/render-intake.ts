import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BRIDGE_MODE = "manual-first";
export const ALLOW_AUTOMATED_FILE_MOVES = false;
export const ALLOW_AUTOMATED_VALIDATION = false;
export const ALLOW_EXTERNAL_ASSET_FETCH = false;
export const REQUIRE_HUMAN_REVIEW = true;
export const REQUIRE_ASSEMBLY_APPROVAL = true;

export const PROJECT_NAME = "Episode 1 Manual Render Intake";
export const TOOL_TYPE = "Render Asset Intake & Validation";
export const INTEGRATION_TARGET = "ICYFLAMZE CORE";

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'render_intake'),
  scans: path.join(REPO_ROOT, 'outputs', 'render_intake', 'scans'),
  validations: path.join(REPO_ROOT, 'outputs', 'render_intake', 'validations'),
  continuityChecklists: path.join(REPO_ROOT, 'outputs', 'render_intake', 'continuity_checklists'),
  readinessReports: path.join(REPO_ROOT, 'outputs', 'render_intake', 'readiness_reports'),
  revisionLogs: path.join(REPO_ROOT, 'outputs', 'render_intake', 'revision_logs'),
  obsidianExports: path.join(REPO_ROOT, 'outputs', 'render_intake', 'obsidian_exports'),
  logs: path.join(REPO_ROOT, 'outputs', 'render_intake', 'logs')
};

export const inputFolders = {
  incoming: path.join(REPO_ROOT, 'inputs', 'render_intake', 'incoming'),
  reviewed: path.join(REPO_ROOT, 'inputs', 'render_intake', 'reviewed')
};

export const supportedAssetTypes = [
  'image/png',
  'image/jpg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/wav',
  'audio/mp3',
  'audio/flac'
];

export const assetExtensionMap: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mp3',
  '.flac': 'audio/flac'
};

export const assetCategories = ['image', 'video', 'audio'] as const;
export type AssetCategory = typeof assetCategories[number];

export const categoryExtensions: Record<AssetCategory, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.webp'],
  video: ['.mp4', '.webm'],
  audio: ['.wav', '.mp3', '.flac']
};

export { REPO_ROOT };
