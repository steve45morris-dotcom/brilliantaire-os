import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LEDGER_WRITES,
  ALLOW_CATALOG_PUBLISH,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_CATALOG_REVIEW,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  upstreamSources,
  releaseTypes,
  distributionPlatforms,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/micro-product-tree-groove-connector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `micro_product_tree_groove_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `MPT-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[] } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [] };
  }
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    return { exists: true, fileCount: 1, files: [path.basename(sourcePath)] };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files };
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function readTemplate(filename: string): string {
  const filePath = path.join(TEMPLATE_ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] Template file not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function ensureOutputDirs() {
  for (const [, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Ledger Writes:         ${ALLOW_LEDGER_WRITES}`);
  console.log(`  Catalog Publish:       ${ALLOW_CATALOG_PUBLISH}`);
  console.log(`  External API:          ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Catalog Review:        ${REQUIRE_CATALOG_REVIEW}`);
  console.log(`  Direct Obsidian:       ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`${'─'.repeat(60)}`);

  const folders = [
    { name: 'Catalog Mappings', dir: outputFolders.catalogMappings },
    { name: 'Release Staging', dir: outputFolders.releaseStaging },
    { name: 'Distribution Plans', dir: outputFolders.distributionPlans },
    { name: 'Connector Reports', dir: outputFolders.connectorReports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  Upstream Sources:');
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists ? `${scan.fileCount} files` : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Release Types:');
  for (const releaseType of releaseTypes) {
    console.log(`     - ${releaseType}`);
  }

  console.log('\n  Distribution Platforms:');
  for (const platform of distributionPlatforms) {
    console.log(`     - ${platform}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Scan Products Command
async function handleScanProducts() {
  await announceIntent('Scanning micro-product ledger entries for catalog mapping candidates');
  console.log('Scanning micro-product ledger for catalog mapping candidates...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const mappingId = generateRequestId();

  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  const candidateLines: string[] = [
    '| Source | Status | Files | Candidate Entries |',
    '|---|---|---|---|',
  ];

  let totalCandidates = 0;
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    const candidates = result.fileCount;
    totalCandidates += candidates;
    candidateLines.push(`| ${source} | ${status} | ${result.fileCount} | ${candidates} |`);
  }

  const fileListLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    if (result.exists && result.files.length > 0) {
      fileListLines.push(`\n### ${source}`);
      for (const file of result.files.slice(0, 15)) {
        fileListLines.push(`- \`${file}\``);
      }
      if (result.files.length > 15) {
        fileListLines.push(`- ... and ${result.files.length - 15} more`);
      }
    }
  }

  // Build source status for template
  const sourceStatusLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const statusStr = result.exists ? `Found (${result.fileCount} files)` : 'Not found';
    sourceStatusLines.push(`- **${source}:** ${statusStr}`);
  }

  const template = readTemplate('catalog-mapping-template.md');
  if (!template) {
    console.error('Error: Catalog mapping template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    MAPPING_ID: mappingId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SOURCE_STATUS: sourceStatusLines.join('\n'),
    CANDIDATE_TABLE: candidateLines.join('\n'),
    CAMPAIGN_DATA: fileListLines.join('\n') || 'No campaign data files found in upstream sources.',
  });

  const safePath = getSafeWritePath(
    outputFolders.catalogMappings,
    `catalog_scan_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Catalog scan ${mappingId}: ${totalCandidates} candidates across ${Object.keys(sourceResults).length} sources → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('SCAN_PRODUCTS', msg);
  await announceCompletion(`Micro-product catalog scan compiled: ${mappingId}`, '10');
}

// 3. Map Catalog Command
async function handleMapCatalog() {
  await announceIntent('Mapping micro-product entries to Tree Groove Records release catalog format');
  console.log('Mapping micro-product entries to catalog format...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const mappingId = generateRequestId();

  // Scan upstream sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  // Build source status
  const sourceStatusLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const statusStr = result.exists ? `Found (${result.fileCount} files)` : 'Not found';
    sourceStatusLines.push(`- **${source}:** ${statusStr}`);
  }

  // Build catalog mapping table
  const mappingLines: string[] = [
    '| Release Type | Mapped Entries | Status |',
    '|---|---|---|',
  ];

  for (const releaseType of releaseTypes) {
    mappingLines.push(`| ${releaseType} | 0 (pending scan) | Awaiting mapping |`);
  }

  // Campaign cross-reference
  const campaignScan = scanSource(upstreamSources.campaignData);
  let campaignDataStr = 'No campaign data directory found.';
  if (campaignScan.exists && campaignScan.files.length > 0) {
    const campaignLines: string[] = [];
    for (const file of campaignScan.files.slice(0, 15)) {
      campaignLines.push(`- \`${file}\``);
    }
    if (campaignScan.files.length > 15) {
      campaignLines.push(`- ... and ${campaignScan.files.length - 15} more`);
    }
    campaignDataStr = campaignLines.join('\n');
  }

  const template = readTemplate('catalog-mapping-template.md');
  if (!template) {
    console.error('Error: Catalog mapping template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    MAPPING_ID: mappingId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SOURCE_STATUS: sourceStatusLines.join('\n'),
    CANDIDATE_TABLE: mappingLines.join('\n'),
    CAMPAIGN_DATA: campaignDataStr,
  });

  const safePath = getSafeWritePath(
    outputFolders.catalogMappings,
    `catalog_mapping_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Catalog mapping ${mappingId}: ${releaseTypes.length} release types mapped → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('MAP_CATALOG', msg);
  await announceCompletion(`Micro-product catalog mapping compiled: ${mappingId}`, '10');
}

// 4. Stage Release Command
async function handleStageRelease() {
  if (!REQUIRE_HUMAN_APPROVAL) {
    console.error('Safety violation: REQUIRE_HUMAN_APPROVAL is disabled but should be enabled.');
    process.exit(1);
  }

  await announceIntent('Staging release package from mapped catalog entries for human review');
  console.log('Staging release package...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const stagingId = generateRequestId();

  // Check for existing catalog mappings
  const mappingCount = countFiles(outputFolders.catalogMappings);

  // Build catalog summary
  let catalogSummaryStr = 'No catalog mappings found. Run `scan-products` or `map-catalog` first.';
  if (mappingCount > 0) {
    const mappingFiles = fs.readdirSync(outputFolders.catalogMappings).filter(f => f.endsWith('.md'));
    catalogSummaryStr = `**${mappingCount} catalog mapping(s) available:**\n\n` + mappingFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Build release type distribution
  const releaseTypeLines: string[] = [
    '| Release Type | Description | Selection |',
    '|---|---|---|',
  ];

  const releaseDescriptions: Record<string, string> = {
    'single-track': 'Individual track release for streaming platforms',
    'ep-bundle': 'Extended play bundle (3-6 tracks)',
    'album-package': 'Full album release package (7+ tracks)',
    'remix-collection': 'Collection of remixes and alternate versions',
    'beat-pack': 'Instrumental beat pack for licensing/sale',
  };

  for (const releaseType of releaseTypes) {
    const desc = releaseDescriptions[releaseType] || 'General release';
    releaseTypeLines.push(`| ${releaseType} | ${desc} | [ ] |`);
  }

  // Build platform readiness
  const platformLines: string[] = [
    '| Platform | Format Ready | Metadata Ready | Status |',
    '|---|---|---|---|',
  ];

  for (const platform of distributionPlatforms) {
    platformLines.push(`| ${platform} | Pending | Pending | Not verified |`);
  }

  // Prerequisites
  const prereqLines: string[] = [
    '- [ ] Micro-product ledger entries scanned via `scan-products`',
    '- [ ] Catalog mapping completed via `map-catalog`',
    '- [ ] Release type selected by human operator',
    '- [ ] Audio assets verified and staged locally',
    '- [ ] Metadata (title, artist, ISRC, UPC) confirmed',
    '- [ ] Cover art assets prepared per platform specs',
    '- [ ] Human operator available for release decision',
  ];

  const template = readTemplate('release-staging-template.md');
  if (!template) {
    console.error('Error: Release staging template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    STAGING_ID: stagingId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CATALOG_SUMMARY: catalogSummaryStr,
    RELEASE_TYPES: releaseTypeLines.join('\n'),
    PLATFORM_READINESS: platformLines.join('\n'),
    PREREQUISITES: prereqLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.releaseStaging,
    `release_staging_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Release staging package ${stagingId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('STAGE_RELEASE', msg);
  await announceCompletion(`Release staging package staged for human review: ${stagingId}`, '10');
}

// 5. Distribution Plan Command
async function handleDistributionPlan() {
  await announceIntent('Generating platform distribution plan for staged releases');
  console.log('Generating distribution plan...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const planId = generateRequestId();

  // Build platform table
  const platformLines: string[] = [
    '| Platform | Format Requirements | Metadata Requirements | Distribution Status |',
    '|---|---|---|---|',
  ];

  const platformFormats: Record<string, string> = {
    'Spotify': 'FLAC/WAV, 16-bit/44.1kHz minimum',
    'Apple Music': 'ALAC/FLAC/WAV, 16-bit/44.1kHz minimum',
    'YouTube Music': 'FLAC/WAV, video optional',
    'SoundCloud': 'WAV/FLAC/MP3 320kbps',
    'Bandcamp': 'FLAC/WAV (lossless preferred)',
    'TikTok': 'MP3/AAC, 30-60 second clips supported',
  };

  const platformMetadata: Record<string, string> = {
    'Spotify': 'ISRC, UPC, artist profile, cover art 3000x3000',
    'Apple Music': 'ISRC, UPC, Apple ID, cover art 3000x3000',
    'YouTube Music': 'ISRC, channel link, thumbnail 1280x720',
    'SoundCloud': 'Tags, description, cover art 800x800',
    'Bandcamp': 'Album art 1400x1400, pricing, tags',
    'TikTok': 'Sound ID, clip metadata, hashtags',
  };

  for (const platform of distributionPlatforms) {
    const format = platformFormats[platform] || 'Standard audio';
    const metadata = platformMetadata[platform] || 'Standard metadata';
    platformLines.push(`| ${platform} | ${format} | ${metadata} | Not started |`);
  }

  // Build release coverage
  const coverageLines: string[] = [
    '| Release Type | Platform Coverage | Readiness |',
    '|---|---|---|',
  ];

  for (const releaseType of releaseTypes) {
    coverageLines.push(`| ${releaseType} | ${distributionPlatforms.length} platforms | Pending verification |`);
  }

  // Timeline
  const timelineLines: string[] = [
    '| Phase | Description | Status |',
    '|---|---|---|',
    '| 1. Asset Preparation | Audio mastering, cover art, metadata | Not started |',
    '| 2. Platform Verification | Per-platform format and metadata check | Not started |',
    '| 3. Distributor Upload | Manual upload to each platform/aggregator | Not started |',
    '| 4. Release Scheduling | Set release dates per platform | Not started |',
    '| 5. Post-Release Monitoring | Track availability and metrics | Not started |',
  ];

  // Safety notes
  const safetyLines: string[] = [
    '- Distribution plan is advisory only (ALLOW_CATALOG_PUBLISH = false)',
    '- No external API calls will be made (ALLOW_EXTERNAL_API_CALLS = false)',
    '- All platform uploads must be performed manually by human operator',
    '- No ledger modifications triggered (ALLOW_LEDGER_WRITES = false)',
    '- Human approval required before any distribution action (REQUIRE_HUMAN_APPROVAL = true)',
  ];

  const template = readTemplate('distribution-plan-template.md');
  if (!template) {
    console.error('Error: Distribution plan template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PLAN_ID: planId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PLATFORM_TABLE: platformLines.join('\n'),
    RELEASE_COVERAGE: coverageLines.join('\n'),
    TIMELINE: timelineLines.join('\n'),
    SAFETY_NOTES: safetyLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.distributionPlans,
    `distribution_plan_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Distribution plan ${planId}: ${distributionPlatforms.length} platforms documented → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('DISTRIBUTION_PLAN', msg);
  await announceCompletion(`Distribution plan compiled: ${planId}`, '10');
}

// 6. Connector Report Command
async function handleConnectorReport() {
  await announceIntent('Compiling connector status report showing mapping coverage and gaps');
  console.log('Compiling connector status report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  // Mapping coverage
  const mappingCount = countFiles(outputFolders.catalogMappings);
  const mappingCoverageLines: string[] = [
    `- **Total Catalog Mappings:** ${mappingCount}`,
    `- **Release Types Supported:** ${releaseTypes.length}`,
    `- **Distribution Platforms:** ${distributionPlatforms.length}`,
  ];

  if (mappingCount > 0) {
    const mappingFiles = fs.readdirSync(outputFolders.catalogMappings).filter(f => f.endsWith('.md'));
    mappingCoverageLines.push('\n**Mapping Files:**');
    for (const file of mappingFiles) {
      mappingCoverageLines.push(`- \`${file}\``);
    }
  }

  // Release staging summary
  const stagingCount = countFiles(outputFolders.releaseStaging);
  const stagingSummaryLines: string[] = [
    `- **Staged Release Packages:** ${stagingCount}`,
  ];

  if (stagingCount > 0) {
    const stagingFiles = fs.readdirSync(outputFolders.releaseStaging).filter(f => f.endsWith('.md'));
    stagingSummaryLines.push('\n**Staging Files:**');
    for (const file of stagingFiles) {
      stagingSummaryLines.push(`- \`${file}\``);
    }
  }

  // Distribution plan summary
  const planCount = countFiles(outputFolders.distributionPlans);
  const distributionSummaryLines: string[] = [
    `- **Distribution Plans:** ${planCount}`,
  ];

  if (planCount > 0) {
    const planFiles = fs.readdirSync(outputFolders.distributionPlans).filter(f => f.endsWith('.md'));
    distributionSummaryLines.push('\n**Plan Files:**');
    for (const file of planFiles) {
      distributionSummaryLines.push(`- \`${file}\``);
    }
  }

  // Identify gaps
  const gapLines: string[] = [];
  if (mappingCount === 0) {
    gapLines.push('- **No catalog mappings exist.** Run `scan-products` and `map-catalog` to create mappings.');
  }
  if (stagingCount === 0) {
    gapLines.push('- **No release packages staged.** Run `stage-release` after creating catalog mappings.');
  }
  if (planCount === 0) {
    gapLines.push('- **No distribution plans created.** Run `distribution-plan` to generate platform plans.');
  }

  // Check upstream sources
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    if (!scan.exists) {
      gapLines.push(`- **Upstream source missing:** ${source} (${sourcePath})`);
    }
  }

  if (gapLines.length === 0) {
    gapLines.push('- No critical gaps identified. All connector phases have outputs.');
  }

  // Recommendations
  const recommendationLines: string[] = [
    '1. Ensure all upstream micro-product ledger entries are scanned',
    '2. Map each ledger entry to the appropriate release type',
    '3. Stage release packages for human review before distribution',
    '4. Generate distribution plans per target platform',
    '5. Verify platform metadata requirements are met',
    '6. Record all decisions in the connector report for audit trail',
  ];

  const template = readTemplate('connector-report-template.md');
  if (!template) {
    console.error('Error: Connector report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    MAPPING_COVERAGE: mappingCoverageLines.join('\n'),
    STAGING_SUMMARY: stagingSummaryLines.join('\n'),
    DISTRIBUTION_SUMMARY: distributionSummaryLines.join('\n'),
    GAPS: gapLines.join('\n'),
    RECOMMENDATIONS: recommendationLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.connectorReports,
    `connector_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Connector report ${reportId}: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('CONNECTOR_REPORT', msg);
  await announceCompletion(`Connector status report compiled: ${reportId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging micro-product Tree Groove connector summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  // Scan upstream sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  // Compute summary
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const totalFiles = Object.values(sourceResults).reduce((sum, r) => sum + r.fileCount, 0);
  const mappingCount = countFiles(outputFolders.catalogMappings);
  const stagingCount = countFiles(outputFolders.releaseStaging);
  const planCount = countFiles(outputFolders.distributionPlans);
  const reportCount = countFiles(outputFolders.connectorReports);

  const summaryLines: string[] = [
    `- **Upstream Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Total Source Files:** ${totalFiles}`,
    `- **Catalog Mappings:** ${mappingCount}`,
    `- **Release Staging Packages:** ${stagingCount}`,
    `- **Distribution Plans:** ${planCount}`,
    `- **Connector Reports:** ${reportCount}`,
  ];

  // Source states
  const stateLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    stateLines.push(`- **${source}:** ${status} (${result.fileCount} files)`);
  }

  // Catalog mapping status
  let mappingStr = 'No catalog mappings staged yet. Run `scan-products` or `map-catalog` to create mappings.';
  if (mappingCount > 0) {
    const mappingFiles = fs.readdirSync(outputFolders.catalogMappings).filter(f => f.endsWith('.md'));
    mappingStr = mappingFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Release staging status
  let stagingStr = 'No release packages staged yet. Run `stage-release` to create one.';
  if (stagingCount > 0) {
    const stagingFiles = fs.readdirSync(outputFolders.releaseStaging).filter(f => f.endsWith('.md'));
    stagingStr = stagingFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Next actions
  const nextActionLines: string[] = [
    '- [ ] Scan micro-product ledger entries for catalog candidates',
    '- [ ] Map entries to Tree Groove Records release catalog format',
    '- [ ] Stage release packages for human review',
    '- [ ] Generate distribution plans per target platform',
    '- [ ] Compile connector report for coverage and gap analysis',
    '- [ ] Proceed to manual distribution if all reviews pass',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CONNECTOR_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: stateLines.join('\n'),
    MAPPING_STATUS: mappingStr,
    STAGING_STATUS: stagingStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `micro_product_tree_groove_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Micro-product Tree Groove connector Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_LEDGER_WRITES) {
    console.error('Safety gate: ALLOW_LEDGER_WRITES is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_CATALOG_PUBLISH) {
    console.error('Safety gate: ALLOW_CATALOG_PUBLISH is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run micro-product-tree-groove-connector-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'scan-products':
      await handleScanProducts();
      break;
    case 'map-catalog':
      await handleMapCatalog();
      break;
    case 'stage-release':
      await handleStageRelease();
      break;
    case 'distribution-plan':
      await handleDistributionPlan();
      break;
    case 'connector-report':
      await handleConnectorReport();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run micro-product-tree-groove-connector-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
