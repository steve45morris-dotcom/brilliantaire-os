import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_DISTRIBUTION,
  ALLOW_AUTO_SUBMISSION,
  ALLOW_METADATA_PUBLISH,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_QUALITY_GATE_PASS,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  upstreamSources,
  releaseTypes,
  distributionPlatforms,
  qualityGateChecks,
  pipelineStages,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/tree-groove-release-pipeline.js';

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
  const logFile = path.join(logDir, `tree_groove_release_pipeline_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `TGR-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[]; isFile: boolean } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [], isFile: false };
  }
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    return { exists: true, fileCount: 1, files: [path.basename(sourcePath)], isFile: true };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files, isFile: false };
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
  console.log(`\n${PROJECT_NAME} - Pipeline Status`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Live Distribution:     ${ALLOW_LIVE_DISTRIBUTION}`);
  console.log(`  Auto Submission:       ${ALLOW_AUTO_SUBMISSION}`);
  console.log(`  Metadata Publish:      ${ALLOW_METADATA_PUBLISH}`);
  console.log(`  External API Calls:    ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Quality Gate Required: ${REQUIRE_QUALITY_GATE_PASS}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Release Packages', dir: outputFolders.releasePackages },
    { name: 'Quality Gates', dir: outputFolders.qualityGates },
    { name: 'Metadata Validation', dir: outputFolders.metadataValidation },
    { name: 'Submission Staging', dir: outputFolders.submissionStaging },
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
    const status = scan.exists
      ? (scan.isFile ? 'found (file)' : `${scan.fileCount} files`)
      : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Release Types:');
  for (const rt of releaseTypes) {
    console.log(`     - ${rt.type}: ${rt.description}`);
  }

  console.log('\n  Distribution Platforms:');
  for (const dp of distributionPlatforms) {
    console.log(`     - ${dp.platform}`);
  }

  console.log(`\n  Pipeline Stages:       ${pipelineStages.length} stages`);
  console.log(`  Quality Gate Checks:   ${qualityGateChecks.length} checks (${qualityGateChecks.filter(c => c.required).length} required)`);
  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Assemble Package Command
async function handleAssemblePackage() {
  await announceIntent('Assembling release package from connector catalog mappings and staging artifacts');
  console.log('Scanning connector outputs for release package assembly...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const packageId = generateRequestId();

  const catalogScan = scanSource(upstreamSources.connectorCatalogMappings);
  const stagingScan = scanSource(upstreamSources.connectorReleaseStaging);
  const distributionScan = scanSource(upstreamSources.connectorDistributionPlans);

  const connectorStatus: string[] = [
    `- **Catalog Mappings:** ${catalogScan.exists ? `${catalogScan.fileCount} file(s)` : 'not found'}`,
    `- **Release Staging:** ${stagingScan.exists ? `${stagingScan.fileCount} file(s)` : 'not found'}`,
    `- **Distribution Plans:** ${distributionScan.exists ? `${distributionScan.fileCount} file(s)` : 'not found'}`,
  ];

  const releaseTypeTable: string[] = [
    '| Release Type | Track Range | Package Status |',
    '|---|---|---|',
  ];
  for (const rt of releaseTypes) {
    const hasStaging = stagingScan.exists && stagingScan.files.some(f => f.includes(rt.type));
    releaseTypeTable.push(`| ${rt.type} | ${rt.minTracks}-${rt.maxTracks} | ${hasStaging ? 'Staging found' : 'No staging artifacts'} |`);
  }

  const assetChecklist: string[] = [
    '- [ ] Master audio files (FLAC/WAV lossless)',
    '- [ ] Cover artwork (3000x3000 JPEG/PNG)',
    '- [ ] Track listing with durations',
    '- [ ] Artist bio / credits',
    '- [ ] ISRC codes (one per track)',
    '- [ ] UPC/EAN code (one per release)',
    '- [ ] Copyright and publishing information',
    '- [ ] Liner notes (if applicable)',
    '- [ ] Pre-save landing page URL (if applicable)',
  ];

  const template = readTemplate('release-package-template.md');
  if (!template) {
    console.error('Error: Release package template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PACKAGE_ID: packageId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CONNECTOR_STATUS: connectorStatus.join('\n'),
    RELEASE_TYPE_TABLE: releaseTypeTable.join('\n'),
    ASSET_CHECKLIST: assetChecklist.join('\n'),
    CATALOG_FILES: catalogScan.files.length > 0
      ? catalogScan.files.map(f => `- \`${f}\``).join('\n')
      : 'No catalog mapping files found.',
  });

  const safePath = getSafeWritePath(
    outputFolders.releasePackages,
    `release_package_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Release package ${packageId}: assembled from ${catalogScan.fileCount} catalog mappings -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('ASSEMBLE_PACKAGE', msg);
  await announceCompletion(`Tree Groove release package assembled: ${packageId}`, '10');
}

// 3. Quality Gate Command
async function handleQualityGate() {
  await announceIntent('Running quality gate checks against release package requirements');
  console.log('Running quality gate evaluation...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const gateId = generateRequestId();

  const checkResults: { id: string; name: string; category: string; required: boolean; status: string; detail: string }[] = [];

  for (const check of qualityGateChecks) {
    let status = 'PENDING';
    let detail = 'Requires manual verification';

    if (check.category === 'metadata') {
      const catalogScan = scanSource(upstreamSources.connectorCatalogMappings);
      if (catalogScan.exists && catalogScan.fileCount > 0) {
        status = 'READY';
        detail = `Catalog mappings available (${catalogScan.fileCount} files)`;
      } else {
        status = 'BLOCKED';
        detail = 'No catalog mappings found — run connector scan-products first';
      }
    }

    if (check.category === 'legal') {
      status = 'PENDING';
      detail = 'Requires human operator legal review';
    }

    checkResults.push({ ...check, status, detail });
  }

  const checkTable: string[] = [
    '| ID | Check | Category | Required | Status | Detail |',
    '|---|---|---|---|---|---|',
  ];

  let passCount = 0;
  let readyCount = 0;
  let blockedCount = 0;
  for (const result of checkResults) {
    checkTable.push(`| ${result.id} | ${result.name} | ${result.category} | ${result.required ? 'Yes' : 'No'} | ${result.status} | ${result.detail} |`);
    if (result.status === 'PASS') passCount++;
    if (result.status === 'READY') readyCount++;
    if (result.status === 'BLOCKED') blockedCount++;
  }

  const categoryBreakdown: string[] = [];
  const categories = [...new Set(qualityGateChecks.map(c => c.category))];
  for (const cat of categories) {
    const catChecks = checkResults.filter(c => c.category === cat);
    const required = catChecks.filter(c => c.required).length;
    const blocked = catChecks.filter(c => c.status === 'BLOCKED').length;
    categoryBreakdown.push(`- **${cat}:** ${catChecks.length} checks (${required} required, ${blocked} blocked)`);
  }

  const overallGate = blockedCount > 0 ? 'BLOCKED' : (passCount === checkResults.filter(c => c.required).length ? 'PASS' : 'PENDING');

  const template = readTemplate('quality-gate-template.md');
  if (!template) {
    console.error('Error: Quality gate template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    GATE_ID: gateId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CHECK_TABLE: checkTable.join('\n'),
    CATEGORY_BREAKDOWN: categoryBreakdown.join('\n'),
    PASS_COUNT: String(passCount),
    READY_COUNT: String(readyCount),
    BLOCKED_COUNT: String(blockedCount),
    TOTAL_CHECKS: String(checkResults.length),
    REQUIRED_CHECKS: String(checkResults.filter(c => c.required).length),
    OVERALL_GATE: overallGate,
  });

  const safePath = getSafeWritePath(
    outputFolders.qualityGates,
    `quality_gate_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Quality gate ${gateId}: ${overallGate} (${passCount} pass, ${readyCount} ready, ${blockedCount} blocked) -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('QUALITY_GATE', msg);
  await announceCompletion(`Tree Groove quality gate evaluated: ${gateId}`, '10');
}

// 4. Validate Metadata Command
async function handleValidateMetadata() {
  await announceIntent('Validating release metadata against platform submission requirements');
  console.log('Running metadata validation...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const validationId = generateRequestId();

  const platformValidation: string[] = [
    '| Platform | Audio Format | Cover Art | Required Fields | Readiness |',
    '|---|---|---|---|---|',
  ];

  for (const platform of distributionPlatforms) {
    const requiredCount = platform.metadataRequired.length;
    platformValidation.push(
      `| ${platform.platform} | ${platform.audioFormat} | ${platform.coverArt} | ${platform.metadataRequired.join(', ')} | PENDING (${requiredCount} fields) |`
    );
  }

  const metadataFields: string[] = [];
  const allRequired = new Set(distributionPlatforms.flatMap(p => p.metadataRequired));
  for (const field of [...allRequired].sort()) {
    const platforms = distributionPlatforms
      .filter(p => p.metadataRequired.includes(field))
      .map(p => p.platform);
    metadataFields.push(`- **${field}:** Required by ${platforms.join(', ')}`);
  }

  const crossPlatformChecks: string[] = [
    '- [ ] ISRC codes follow ISO 3901 format (CC-XXX-YY-NNNNN)',
    '- [ ] UPC/EAN code is valid 12/13 digit barcode',
    '- [ ] Artist name is consistent across all platforms',
    '- [ ] Track titles match across all platform submissions',
    '- [ ] Genre tags are valid for each platform catalog',
    '- [ ] Release date is at least 2 weeks in the future',
    '- [ ] Copyright year matches release year',
    '- [ ] No explicit content flag mismatches',
  ];

  const template = readTemplate('metadata-validation-template.md');
  if (!template) {
    console.error('Error: Metadata validation template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    VALIDATION_ID: validationId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PLATFORM_TABLE: platformValidation.join('\n'),
    METADATA_FIELDS: metadataFields.join('\n'),
    CROSS_PLATFORM_CHECKS: crossPlatformChecks.join('\n'),
    TOTAL_PLATFORMS: String(distributionPlatforms.length),
    TOTAL_FIELDS: String(allRequired.size),
  });

  const safePath = getSafeWritePath(
    outputFolders.metadataValidation,
    `metadata_validation_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Metadata validation ${validationId}: ${allRequired.size} fields across ${distributionPlatforms.length} platforms -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VALIDATE_METADATA', msg);
  await announceCompletion(`Tree Groove metadata validation compiled: ${validationId}`, '10');
}

// 5. Stage Submission Command
async function handleStageSubmission() {
  if (!REQUIRE_HUMAN_APPROVAL) {
    console.error('Safety gate: REQUIRE_HUMAN_APPROVAL must be true for submission staging.');
    process.exit(1);
  }

  await announceIntent('Staging release submission packages for each distribution platform');
  console.log('Staging platform submissions...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const submissionId = generateRequestId();

  const qualityGateCount = countFiles(outputFolders.qualityGates);
  const metadataCount = countFiles(outputFolders.metadataValidation);

  const prerequisiteChecks: string[] = [
    `- [${qualityGateCount > 0 ? 'x' : ' '}] Quality gate evaluation completed (${qualityGateCount} report(s))`,
    `- [${metadataCount > 0 ? 'x' : ' '}] Metadata validation completed (${metadataCount} report(s))`,
    '- [ ] Master audio files verified and tagged',
    '- [ ] Cover artwork approved by artist/label',
    '- [ ] ISRC and UPC codes assigned',
    '- [ ] Distribution agreement signed',
    '- [ ] Release date confirmed with marketing calendar',
  ];

  const platformSubmission: string[] = [
    '| Platform | Submission Method | Status | Notes |',
    '|---|---|---|---|',
  ];

  const submissionMethods: Record<string, string> = {
    'Spotify': 'Via distributor (DistroKid/TuneCore/CD Baby)',
    'Apple Music': 'Via distributor or Apple Music for Artists',
    'YouTube Music': 'Via distributor or YouTube Artist Channel',
    'SoundCloud': 'Direct upload via SoundCloud Pro',
    'Bandcamp': 'Direct upload via Bandcamp artist account',
    'TikTok': 'Via distributor or TikTok for Artists',
  };

  for (const platform of distributionPlatforms) {
    const method = submissionMethods[platform.platform] || 'Manual upload';
    platformSubmission.push(`| ${platform.platform} | ${method} | STAGED | Awaiting human approval |`);
  }

  const timeline: string[] = [
    '### Submission Timeline',
    '',
    '| Phase | Action | Target Date | Status |',
    '|---|---|---|---|',
    '| 1 | Final master review | T-21 days | PENDING |',
    '| 2 | Distributor submission | T-14 days | STAGED |',
    '| 3 | Platform review period | T-14 to T-3 | WAITING |',
    '| 4 | Pre-save campaign launch | T-7 days | PLANNED |',
    '| 5 | Release day | T-0 | SCHEDULED |',
    '| 6 | Post-release monitoring | T+7 days | PLANNED |',
  ];

  const template = readTemplate('submission-staging-template.md');
  if (!template) {
    console.error('Error: Submission staging template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    SUBMISSION_ID: submissionId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PREREQUISITE_CHECKS: prerequisiteChecks.join('\n'),
    PLATFORM_TABLE: platformSubmission.join('\n'),
    TIMELINE: timeline.join('\n'),
    TOTAL_PLATFORMS: String(distributionPlatforms.length),
  });

  const safePath = getSafeWritePath(
    outputFolders.submissionStaging,
    `submission_staging_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Submission staging ${submissionId}: ${distributionPlatforms.length} platforms staged -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('STAGE_SUBMISSION', msg);
  await announceCompletion(`Tree Groove submission staging compiled: ${submissionId}`, '10');
}

// 6. Pipeline Report Command
async function handlePipelineReport() {
  await announceIntent('Generating comprehensive release pipeline status report');
  console.log('Generating pipeline report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  const checks: { name: string; status: boolean; detail: string }[] = [];

  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    checks.push({
      name: `Upstream: ${source}`,
      status: scan.exists,
      detail: scan.exists ? `Found (${scan.isFile ? 'file' : scan.fileCount + ' files'})` : 'Not found'
    });
  }

  checks.push({
    name: 'ALLOW_LIVE_DISTRIBUTION = false',
    status: !ALLOW_LIVE_DISTRIBUTION,
    detail: ALLOW_LIVE_DISTRIBUTION ? 'WARNING: Live distribution enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_AUTO_SUBMISSION = false',
    status: !ALLOW_AUTO_SUBMISSION,
    detail: ALLOW_AUTO_SUBMISSION ? 'WARNING: Auto submission enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'REQUIRE_HUMAN_APPROVAL = true',
    status: REQUIRE_HUMAN_APPROVAL,
    detail: REQUIRE_HUMAN_APPROVAL ? 'Correctly enforced' : 'WARNING: Human approval not required!'
  });
  checks.push({
    name: 'REQUIRE_QUALITY_GATE_PASS = true',
    status: REQUIRE_QUALITY_GATE_PASS,
    detail: REQUIRE_QUALITY_GATE_PASS ? 'Correctly enforced' : 'WARNING: Quality gate not required!'
  });

  const packageCount = countFiles(outputFolders.releasePackages);
  const gateCount = countFiles(outputFolders.qualityGates);
  const metadataCount = countFiles(outputFolders.metadataValidation);
  const submissionCount = countFiles(outputFolders.submissionStaging);

  checks.push({ name: 'Release packages assembled', status: packageCount > 0, detail: `${packageCount} package(s)` });
  checks.push({ name: 'Quality gates evaluated', status: gateCount > 0, detail: `${gateCount} evaluation(s)` });
  checks.push({ name: 'Metadata validated', status: metadataCount > 0, detail: `${metadataCount} validation(s)` });
  checks.push({ name: 'Submissions staged', status: submissionCount > 0, detail: `${submissionCount} staging(s)` });

  const checkTable: string[] = [
    '| Check | Status | Detail |',
    '|---|---|---|',
  ];

  let passCount = 0;
  for (const check of checks) {
    const statusStr = check.status ? 'PASS' : 'FAIL';
    if (check.status) passCount++;
    checkTable.push(`| ${check.name} | ${statusStr} | ${check.detail} |`);
  }

  const overallStatus = passCount === checks.length ? 'ALL CHECKS PASSED' : `${passCount}/${checks.length} PASSED`;

  const stageStatus: string[] = [];
  for (const stage of pipelineStages) {
    let status = 'NOT STARTED';
    if (stage === 'catalog-mapped') {
      const scan = scanSource(upstreamSources.connectorCatalogMappings);
      status = scan.exists && scan.fileCount > 0 ? 'COMPLETE' : 'NOT STARTED';
    } else if (stage === 'package-assembled') {
      status = packageCount > 0 ? 'COMPLETE' : 'NOT STARTED';
    } else if (stage === 'quality-gated') {
      status = gateCount > 0 ? 'COMPLETE' : 'NOT STARTED';
    } else if (stage === 'metadata-validated') {
      status = metadataCount > 0 ? 'COMPLETE' : 'NOT STARTED';
    } else if (stage === 'submission-staged') {
      status = submissionCount > 0 ? 'COMPLETE' : 'NOT STARTED';
    }
    stageStatus.push(`- **${stage}:** ${status}`);
  }

  const template = readTemplate('pipeline-report-template.md');
  if (!template) {
    console.error('Error: Pipeline report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CHECK_TABLE: checkTable.join('\n'),
    PASS_COUNT: String(passCount),
    TOTAL_CHECKS: String(checks.length),
    OVERALL_STATUS: overallStatus,
    STAGE_STATUS: stageStatus.join('\n'),
    PIPELINE_STAGES: String(pipelineStages.length),
  });

  const safePath = getSafeWritePath(
    outputFolders.releasePackages,
    `pipeline_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Pipeline report ${reportId}: ${overallStatus} -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('PIPELINE_REPORT', msg);
  await announceCompletion(`Tree Groove pipeline report compiled: ${reportId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging Tree Groove release pipeline summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  const packageCount = countFiles(outputFolders.releasePackages);
  const gateCount = countFiles(outputFolders.qualityGates);
  const metadataCount = countFiles(outputFolders.metadataValidation);
  const submissionCount = countFiles(outputFolders.submissionStaging);

  const summaryLines: string[] = [
    `- **Release Packages:** ${packageCount}`,
    `- **Quality Gate Evaluations:** ${gateCount}`,
    `- **Metadata Validations:** ${metadataCount}`,
    `- **Submission Stagings:** ${submissionCount}`,
    `- **Release Types Supported:** ${releaseTypes.length}`,
    `- **Distribution Platforms:** ${distributionPlatforms.length}`,
    `- **Quality Gate Checks:** ${qualityGateChecks.length} (${qualityGateChecks.filter(c => c.required).length} required)`,
    `- **Pipeline Stages:** ${pipelineStages.length}`,
  ];

  const sourceLines: string[] = [];
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    sourceLines.push(`- **${source}:** ${scan.exists ? 'Found' : 'Missing'}`);
  }

  let inventoryStr = 'No pipeline artifacts generated yet.';
  const allOutputs: string[] = [];
  for (const [folderName, folderPath] of Object.entries(outputFolders)) {
    if (folderName === 'root' || folderName === 'logs') continue;
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        allOutputs.push(`- \`${folderName}/${file}\``);
      }
    }
  }
  if (allOutputs.length > 0) {
    inventoryStr = allOutputs.join('\n');
  }

  const nextActionLines: string[] = [
    '- [ ] Run assemble-package to build release package from connector outputs',
    '- [ ] Run quality-gate to evaluate release readiness',
    '- [ ] Run validate-metadata to check platform submission requirements',
    '- [ ] Run stage-submission to prepare platform submission packages',
    '- [ ] Run pipeline-report to assess overall pipeline status',
    '- [ ] Complete human approval for staged submissions',
    '- [ ] Execute manual distribution uploads per platform',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PIPELINE_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: sourceLines.join('\n'),
    OUTPUT_INVENTORY: inventoryStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `tree_groove_release_pipeline_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Tree Groove release pipeline Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_LIVE_DISTRIBUTION) {
    console.error('Safety gate: ALLOW_LIVE_DISTRIBUTION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_AUTO_SUBMISSION) {
    console.error('Safety gate: ALLOW_AUTO_SUBMISSION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run tree-groove-release-pipeline-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'assemble-package':
      await handleAssemblePackage();
      break;
    case 'quality-gate':
      await handleQualityGate();
      break;
    case 'validate-metadata':
      await handleValidateMetadata();
      break;
    case 'stage-submission':
      await handleStageSubmission();
      break;
    case 'pipeline-report':
      await handlePipelineReport();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run tree-groove-release-pipeline-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
