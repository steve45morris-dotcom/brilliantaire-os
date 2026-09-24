import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Micro-Product Factory Tree Groove Records Connector';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LEDGER_WRITES = false;
export const ALLOW_CATALOG_PUBLISH = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_CATALOG_REVIEW = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Micro-Product Factory Tree Groove Records Connector';
export const TOOL_TYPE = 'Catalog Mapping & Release Staging';
export const INTEGRATION_TARGET = 'Tree Groove Records Release Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'micro_product_tree_groove');
export const outputFolders = {
  root: OUTPUT_ROOT,
  catalogMappings: path.join(OUTPUT_ROOT, 'catalog_mappings'),
  releaseStaging: path.join(OUTPUT_ROOT, 'release_staging'),
  distributionPlans: path.join(OUTPUT_ROOT, 'distribution_plans'),
  connectorReports: path.join(OUTPUT_ROOT, 'connector_reports'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Upstream sources (read-only)
export const upstreamSources = {
  microProductFactory: path.join(REPO_ROOT, 'sentinel-os', 'lib', 'mesh_layer.ts'),
  campaignData: path.join(REPO_ROOT, 'outputs', 'campaigns'),
  platformVerification: path.join(REPO_ROOT, 'outputs', 'platform_verification'),
};

// Release types supported by Tree Groove Records
export const releaseTypes = [
  'single-track',
  'ep-bundle',
  'album-package',
  'remix-collection',
  'beat-pack',
];

// Distribution platforms
export const distributionPlatforms = [
  'Spotify',
  'Apple Music',
  'YouTube Music',
  'SoundCloud',
  'Bandcamp',
  'TikTok',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'micro_product_tree_groove');
