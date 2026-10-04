import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Tree Groove Records Release Pipeline';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_DISTRIBUTION = false;
export const ALLOW_AUTO_SUBMISSION = false;
export const ALLOW_METADATA_PUBLISH = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_QUALITY_GATE_PASS = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Tree Groove Records Release Pipeline';
export const TOOL_TYPE = 'Automated Release Pipeline Orchestration';
export const INTEGRATION_TARGET = 'Tree Groove Records + Micro-Product Factory + Distribution Platforms';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'tree_groove_release_pipeline');
export const outputFolders = {
  root: OUTPUT_ROOT,
  releasePackages: path.join(OUTPUT_ROOT, 'release_packages'),
  qualityGates: path.join(OUTPUT_ROOT, 'quality_gates'),
  metadataValidation: path.join(OUTPUT_ROOT, 'metadata_validation'),
  submissionStaging: path.join(OUTPUT_ROOT, 'submission_staging'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Upstream sources (read-only)
export const upstreamSources = {
  connectorConfig: path.join(REPO_ROOT, 'config', 'micro-product-tree-groove-connector.ts'),
  connectorScript: path.join(REPO_ROOT, 'scripts', 'micro-product-tree-groove-connector.ts'),
  connectorCatalogMappings: path.join(REPO_ROOT, 'outputs', 'micro_product_tree_groove', 'catalog_mappings'),
  connectorReleaseStaging: path.join(REPO_ROOT, 'outputs', 'micro_product_tree_groove', 'release_staging'),
  connectorDistributionPlans: path.join(REPO_ROOT, 'outputs', 'micro_product_tree_groove', 'distribution_plans'),
  campaignData: path.join(REPO_ROOT, 'outputs', 'campaigns'),
  platformVerification: path.join(REPO_ROOT, 'outputs', 'platform_verification'),
  writeStagingDir: path.join(REPO_ROOT, 'outputs', 'write_staging'),
};

// Release types (inherited from connector)
export const releaseTypes: { type: string; description: string; minTracks: number; maxTracks: number }[] = [
  { type: 'single-track', description: 'Single release (1 track)', minTracks: 1, maxTracks: 1 },
  { type: 'ep-bundle', description: 'EP bundle (2-6 tracks)', minTracks: 2, maxTracks: 6 },
  { type: 'album-package', description: 'Full album package (7+ tracks)', minTracks: 7, maxTracks: 25 },
  { type: 'remix-collection', description: 'Remix collection (2+ remixes)', minTracks: 2, maxTracks: 20 },
  { type: 'beat-pack', description: 'Beat pack (3+ instrumentals)', minTracks: 3, maxTracks: 50 },
];

// Distribution platforms with submission requirements
export const distributionPlatforms: { platform: string; audioFormat: string; coverArt: string; metadataRequired: string[] }[] = [
  { platform: 'Spotify', audioFormat: 'FLAC 16/44.1 or WAV 16/44.1', coverArt: '3000x3000 JPEG/PNG', metadataRequired: ['ISRC', 'UPC', 'artist', 'title', 'genre', 'release_date'] },
  { platform: 'Apple Music', audioFormat: 'FLAC 16/44.1+ or ALAC', coverArt: '3000x3000 JPEG/PNG', metadataRequired: ['ISRC', 'UPC', 'artist', 'title', 'genre', 'release_date', 'copyright'] },
  { platform: 'YouTube Music', audioFormat: 'FLAC or WAV', coverArt: '2048x2048+ JPEG/PNG', metadataRequired: ['ISRC', 'artist', 'title', 'genre'] },
  { platform: 'SoundCloud', audioFormat: 'WAV/FLAC/AIFF (lossless preferred)', coverArt: '800x800+ JPEG/PNG', metadataRequired: ['artist', 'title', 'genre', 'tags'] },
  { platform: 'Bandcamp', audioFormat: 'WAV/FLAC/AIFF', coverArt: '1400x1400+ JPEG/PNG', metadataRequired: ['artist', 'title', 'price', 'genre', 'tags'] },
  { platform: 'TikTok', audioFormat: 'WAV or FLAC', coverArt: '3000x3000 JPEG/PNG', metadataRequired: ['ISRC', 'artist', 'title', 'genre'] },
];

// Quality gate checkpoints
export const qualityGateChecks: { id: string; name: string; category: string; required: boolean }[] = [
  { id: 'audio-format', name: 'Audio format compliance', category: 'technical', required: true },
  { id: 'sample-rate', name: 'Sample rate verification (44.1kHz+)', category: 'technical', required: true },
  { id: 'bit-depth', name: 'Bit depth verification (16-bit+)', category: 'technical', required: true },
  { id: 'loudness', name: 'Loudness normalization (-14 LUFS target)', category: 'technical', required: true },
  { id: 'clipping', name: 'No clipping or digital overs', category: 'technical', required: true },
  { id: 'silence-check', name: 'Leading/trailing silence check', category: 'technical', required: false },
  { id: 'cover-art-dimensions', name: 'Cover art dimensions compliance', category: 'artwork', required: true },
  { id: 'cover-art-format', name: 'Cover art format (JPEG/PNG)', category: 'artwork', required: true },
  { id: 'cover-art-content', name: 'Cover art content review', category: 'artwork', required: false },
  { id: 'isrc-assigned', name: 'ISRC code assigned per track', category: 'metadata', required: true },
  { id: 'upc-assigned', name: 'UPC/EAN code assigned per release', category: 'metadata', required: true },
  { id: 'artist-name', name: 'Artist name verified', category: 'metadata', required: true },
  { id: 'track-titles', name: 'Track titles verified', category: 'metadata', required: true },
  { id: 'genre-tags', name: 'Genre/subgenre tags assigned', category: 'metadata', required: true },
  { id: 'release-date', name: 'Release date set', category: 'metadata', required: true },
  { id: 'copyright-info', name: 'Copyright/publishing info', category: 'legal', required: true },
  { id: 'licensing-cleared', name: 'Sample licensing cleared', category: 'legal', required: false },
  { id: 'distribution-agreement', name: 'Distribution agreement on file', category: 'legal', required: true },
];

// Pipeline stages
export const pipelineStages = [
  'catalog-mapped',
  'package-assembled',
  'quality-gated',
  'metadata-validated',
  'submission-staged',
  'submitted',
  'live',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'tree_groove_release_pipeline');
