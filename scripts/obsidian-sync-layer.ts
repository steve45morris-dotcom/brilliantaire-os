import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_DIRECT_VAULT_WRITE,
  ALLOW_AUTO_SYNC,
  ALLOW_VAULT_DELETION,
  ALLOW_VAULT_MODIFICATION,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_VAULT_PRESENCE,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  upstreamSources,
  moduleExportSources,
  vaultRoutingRules,
  VAULT_CANDIDATE_PATHS,
  SAFE_WRITE_FOLDER,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/obsidian-sync-layer.js';

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
  const logFile = path.join(logDir, `obsidian_sync_layer_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `OSL-${dateStr}-${suffix}`;
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

function detectVaultPath(): string | null {
  for (const candidate of VAULT_CANDIDATE_PATHS) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function matchGlobPattern(filename: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`).test(filename);
}

function resolveVaultSubfolder(filename: string): string {
  for (const rule of vaultRoutingRules) {
    if (filename.startsWith(rule.filenamePrefix)) {
      return rule.vaultSubfolder;
    }
  }
  return 'unrouted';
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Sync Layer Status`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Direct Vault Write:    ${ALLOW_DIRECT_VAULT_WRITE}`);
  console.log(`  Auto Sync:             ${ALLOW_AUTO_SYNC}`);
  console.log(`  Vault Deletion:        ${ALLOW_VAULT_DELETION}`);
  console.log(`  Vault Modification:    ${ALLOW_VAULT_MODIFICATION}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Vault Presence Req:    ${REQUIRE_VAULT_PRESENCE}`);
  console.log(`${'─'.repeat(55)}`);

  const vaultPath = detectVaultPath();
  console.log(`\n  Vault Detection:`);
  if (vaultPath) {
    console.log(`     Vault Found:        ${vaultPath}`);
    const safeFolder = path.join(vaultPath, SAFE_WRITE_FOLDER);
    console.log(`     Safe Write Folder:  ${fs.existsSync(safeFolder) ? 'present' : 'not found'}`);
  } else {
    console.log(`     Vault Found:        none detected`);
  }

  const folders = [
    { name: 'Sync Manifests', dir: outputFolders.syncManifests },
    { name: 'Route Previews', dir: outputFolders.routePreviews },
    { name: 'Sync Reports', dir: outputFolders.syncReports },
    { name: 'Vault Health', dir: outputFolders.vaultHealth },
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
      ? (scan.isFile ? `found (file)` : `${scan.fileCount} files`)
      : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  let pendingCount = 0;
  for (const mod of moduleExportSources) {
    if (fs.existsSync(mod.dir)) {
      const files = fs.readdirSync(mod.dir).filter(f => matchGlobPattern(f, mod.pattern));
      pendingCount += files.length;
    }
  }
  console.log(`\n  Pending Staged Files:  ${pendingCount} across ${moduleExportSources.length} modules`);
  console.log(`  Vault Routing Rules:   ${vaultRoutingRules.length} prefix mappings`);
  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Discover Staged Command
async function handleDiscoverStaged() {
  await announceIntent('Scanning all module export directories for Obsidian-ready staged files');
  console.log('Scanning module export directories...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const discoveryId = generateRequestId();

  const discoveryResults: { module: string; dir: string; pattern: string; files: string[]; exists: boolean }[] = [];

  for (const mod of moduleExportSources) {
    const exists = fs.existsSync(mod.dir);
    let matchedFiles: string[] = [];
    if (exists) {
      matchedFiles = fs.readdirSync(mod.dir)
        .filter(f => !f.startsWith('.'))
        .filter(f => matchGlobPattern(f, mod.pattern));
    }
    discoveryResults.push({
      module: mod.module,
      dir: mod.dir,
      pattern: mod.pattern,
      files: matchedFiles,
      exists
    });
  }

  const discoveryTable: string[] = [
    '| Module | Pattern | Status | Files Found |',
    '|---|---|---|---|',
  ];

  let totalFiles = 0;
  let activeModules = 0;

  for (const result of discoveryResults) {
    const status = result.exists ? 'Found' : 'Missing';
    const fileCount = result.files.length;
    totalFiles += fileCount;
    if (fileCount > 0) activeModules++;
    discoveryTable.push(`| ${result.module} | \`${result.pattern}\` | ${status} | ${fileCount} |`);
  }

  const fileListLines: string[] = [];
  for (const result of discoveryResults) {
    if (result.files.length > 0) {
      fileListLines.push(`\n### ${result.module}`);
      for (const file of result.files) {
        const route = resolveVaultSubfolder(file);
        fileListLines.push(`- \`${file}\` → ${route}`);
      }
    }
  }

  const template = readTemplate('sync-manifest-template.md');
  if (!template) {
    console.error('Error: Sync manifest template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    MANIFEST_ID: discoveryId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    DISCOVERY_TABLE: discoveryTable.join('\n'),
    TOTAL_FILES: String(totalFiles),
    ACTIVE_MODULES: String(activeModules),
    TOTAL_MODULES: String(moduleExportSources.length),
    FILE_LIST: fileListLines.length > 0 ? fileListLines.join('\n') : 'No staged files found.',
  });

  const safePath = getSafeWritePath(
    outputFolders.syncManifests,
    `sync_manifest_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Discovery ${discoveryId}: ${totalFiles} files across ${activeModules} active modules -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('DISCOVER_STAGED', msg);
  await announceCompletion(`Obsidian sync layer discovery complete: ${discoveryId}`, '10');
}

// 3. Compile Manifest Command
async function handleCompileManifest() {
  await announceIntent('Building unified sync manifest of all pending exports with routing assignments');
  console.log('Compiling unified sync manifest...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const manifestId = generateRequestId();

  const manifestEntries: { module: string; file: string; route: string; size: number; modified: string }[] = [];

  for (const mod of moduleExportSources) {
    if (!fs.existsSync(mod.dir)) continue;
    const files = fs.readdirSync(mod.dir)
      .filter(f => !f.startsWith('.'))
      .filter(f => matchGlobPattern(f, mod.pattern));

    for (const file of files) {
      const filePath = path.join(mod.dir, file);
      const stat = fs.statSync(filePath);
      manifestEntries.push({
        module: mod.module,
        file,
        route: resolveVaultSubfolder(file),
        size: stat.size,
        modified: stat.mtime.toISOString().split('T')[0]
      });
    }
  }

  const manifestTable: string[] = [
    '| Module | File | Vault Route | Size | Last Modified |',
    '|---|---|---|---|---|',
  ];

  for (const entry of manifestEntries) {
    const sizeStr = entry.size > 1024
      ? `${(entry.size / 1024).toFixed(1)} KB`
      : `${entry.size} B`;
    manifestTable.push(`| ${entry.module} | \`${entry.file}\` | ${entry.route} | ${sizeStr} | ${entry.modified} |`);
  }

  const routeCoverage: Record<string, number> = {};
  for (const entry of manifestEntries) {
    routeCoverage[entry.route] = (routeCoverage[entry.route] || 0) + 1;
  }
  const coverageLines: string[] = [];
  for (const [route, count] of Object.entries(routeCoverage).sort()) {
    coverageLines.push(`- **${route}:** ${count} file(s)`);
  }

  const unroutedCount = routeCoverage['unrouted'] || 0;

  const template = readTemplate('sync-manifest-template.md');
  if (!template) {
    console.error('Error: Sync manifest template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    MANIFEST_ID: manifestId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    DISCOVERY_TABLE: manifestTable.join('\n'),
    TOTAL_FILES: String(manifestEntries.length),
    ACTIVE_MODULES: String(new Set(manifestEntries.map(e => e.module)).size),
    TOTAL_MODULES: String(moduleExportSources.length),
    FILE_LIST: coverageLines.length > 0
      ? `## Route Coverage\n\n${coverageLines.join('\n')}\n\n**Unrouted files:** ${unroutedCount}`
      : 'No staged files found.',
  });

  const safePath = getSafeWritePath(
    outputFolders.syncManifests,
    `compiled_manifest_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Manifest ${manifestId}: ${manifestEntries.length} entries compiled with ${Object.keys(routeCoverage).length} routes -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('COMPILE_MANIFEST', msg);
  await announceCompletion(`Obsidian sync manifest compiled: ${manifestId}`, '10');
}

// 4. Preview Routes Command
async function handlePreviewRoutes() {
  await announceIntent('Previewing vault routing for all staged Obsidian exports');
  console.log('Generating route preview...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const previewId = generateRequestId();

  const vaultPath = detectVaultPath();

  const routeEntries: { file: string; module: string; prefix: string; vaultSubfolder: string; fullTarget: string }[] = [];

  for (const mod of moduleExportSources) {
    if (!fs.existsSync(mod.dir)) continue;
    const files = fs.readdirSync(mod.dir)
      .filter(f => !f.startsWith('.'))
      .filter(f => matchGlobPattern(f, mod.pattern));

    for (const file of files) {
      const subfolder = resolveVaultSubfolder(file);
      const matchedRule = vaultRoutingRules.find(r => file.startsWith(r.filenamePrefix));
      const prefix = matchedRule ? matchedRule.filenamePrefix : '(none)';
      const target = vaultPath
        ? path.join(vaultPath, SAFE_WRITE_FOLDER, subfolder, file)
        : path.join(`<vault>`, SAFE_WRITE_FOLDER, subfolder, file);

      routeEntries.push({
        file,
        module: mod.module,
        prefix,
        vaultSubfolder: subfolder,
        fullTarget: target
      });
    }
  }

  const routeTable: string[] = [
    '| File | Module | Prefix Match | Vault Subfolder | Target Path |',
    '|---|---|---|---|---|',
  ];

  for (const entry of routeEntries) {
    routeTable.push(`| \`${entry.file}\` | ${entry.module} | \`${entry.prefix}\` | ${entry.vaultSubfolder} | \`${entry.fullTarget}\` |`);
  }

  const ruleTable: string[] = [
    '| Filename Prefix | Vault Subfolder |',
    '|---|---|',
  ];
  for (const rule of vaultRoutingRules) {
    const matchCount = routeEntries.filter(e => e.prefix === rule.filenamePrefix).length;
    ruleTable.push(`| \`${rule.filenamePrefix}\` | ${rule.vaultSubfolder} | ${matchCount} matches |`);
  }

  const template = readTemplate('route-preview-template.md');
  if (!template) {
    console.error('Error: Route preview template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PREVIEW_ID: previewId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    VAULT_PATH: vaultPath || 'not detected',
    SAFE_WRITE_FOLDER,
    ROUTE_TABLE: routeTable.join('\n'),
    RULE_TABLE: ruleTable.join('\n'),
    TOTAL_FILES: String(routeEntries.length),
    UNROUTED_COUNT: String(routeEntries.filter(e => e.vaultSubfolder === 'unrouted').length),
  });

  const safePath = getSafeWritePath(
    outputFolders.routePreviews,
    `route_preview_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Route preview ${previewId}: ${routeEntries.length} files mapped -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('PREVIEW_ROUTES', msg);
  await announceCompletion(`Obsidian route preview compiled: ${previewId}`, '10');
}

// 5. Sync Report Command
async function handleSyncReport() {
  await announceIntent('Generating comprehensive sync health report with pipeline coverage analysis');
  console.log('Generating sync report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  const vaultPath = detectVaultPath();

  const pipelineChecks: { name: string; status: boolean; detail: string }[] = [];

  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    pipelineChecks.push({
      name: `Upstream: ${source}`,
      status: scan.exists,
      detail: scan.exists ? `Found (${scan.isFile ? 'file' : scan.fileCount + ' files'})` : 'Not found'
    });
  }

  pipelineChecks.push({
    name: 'ALLOW_DIRECT_VAULT_WRITE = false',
    status: !ALLOW_DIRECT_VAULT_WRITE,
    detail: ALLOW_DIRECT_VAULT_WRITE ? 'WARNING: Direct vault write enabled!' : 'Correctly disabled'
  });
  pipelineChecks.push({
    name: 'ALLOW_AUTO_SYNC = false',
    status: !ALLOW_AUTO_SYNC,
    detail: ALLOW_AUTO_SYNC ? 'WARNING: Auto sync enabled!' : 'Correctly disabled'
  });
  pipelineChecks.push({
    name: 'REQUIRE_HUMAN_APPROVAL = true',
    status: REQUIRE_HUMAN_APPROVAL,
    detail: REQUIRE_HUMAN_APPROVAL ? 'Correctly enforced' : 'WARNING: Human approval not required!'
  });
  pipelineChecks.push({
    name: 'REQUIRE_VAULT_PRESENCE = true',
    status: REQUIRE_VAULT_PRESENCE,
    detail: REQUIRE_VAULT_PRESENCE ? 'Correctly enforced' : 'WARNING: Vault presence not required!'
  });
  pipelineChecks.push({
    name: 'Vault detected',
    status: vaultPath !== null,
    detail: vaultPath ? vaultPath : 'No vault found in candidate paths'
  });

  let totalStaged = 0;
  let modulesWithFiles = 0;
  const moduleCoverage: string[] = [];
  for (const mod of moduleExportSources) {
    const exists = fs.existsSync(mod.dir);
    let fileCount = 0;
    if (exists) {
      fileCount = fs.readdirSync(mod.dir)
        .filter(f => !f.startsWith('.'))
        .filter(f => matchGlobPattern(f, mod.pattern))
        .length;
    }
    totalStaged += fileCount;
    if (fileCount > 0) modulesWithFiles++;
    moduleCoverage.push(`- **${mod.module}:** ${exists ? `${fileCount} file(s)` : 'directory missing'}`);
  }

  const checkTable: string[] = [
    '| Check | Status | Detail |',
    '|---|---|---|',
  ];
  let passCount = 0;
  for (const check of pipelineChecks) {
    const statusStr = check.status ? 'PASS' : 'FAIL';
    if (check.status) passCount++;
    checkTable.push(`| ${check.name} | ${statusStr} | ${check.detail} |`);
  }

  const overallStatus = passCount === pipelineChecks.length ? 'ALL CHECKS PASSED' : `${passCount}/${pipelineChecks.length} PASSED`;

  const template = readTemplate('sync-report-template.md');
  if (!template) {
    console.error('Error: Sync report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CHECK_TABLE: checkTable.join('\n'),
    PASS_COUNT: String(passCount),
    TOTAL_CHECKS: String(pipelineChecks.length),
    OVERALL_STATUS: overallStatus,
    MODULE_COVERAGE: moduleCoverage.join('\n'),
    TOTAL_STAGED: String(totalStaged),
    MODULES_WITH_FILES: String(modulesWithFiles),
    TOTAL_MODULES: String(moduleExportSources.length),
    VAULT_PATH: vaultPath || 'not detected',
  });

  const safePath = getSafeWritePath(
    outputFolders.syncReports,
    `sync_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Sync report ${reportId}: ${overallStatus}, ${totalStaged} files staged -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('SYNC_REPORT', msg);
  await announceCompletion(`Obsidian sync report compiled: ${reportId}`, '10');
}

// 6. Vault Health Command
async function handleVaultHealth() {
  await announceIntent('Checking vault structure, subfolder presence, and routing coverage');
  console.log('Running vault health check...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const healthId = generateRequestId();

  const vaultPath = detectVaultPath();

  const subfolderChecks: { subfolder: string; exists: boolean; fileCount: number }[] = [];
  const uniqueSubfolders = [...new Set(vaultRoutingRules.map(r => r.vaultSubfolder))];

  for (const subfolder of uniqueSubfolders) {
    if (vaultPath) {
      const fullPath = path.join(vaultPath, SAFE_WRITE_FOLDER, subfolder);
      const exists = fs.existsSync(fullPath);
      const fileCount = exists ? fs.readdirSync(fullPath).filter(f => !f.startsWith('.')).length : 0;
      subfolderChecks.push({ subfolder, exists, fileCount });
    } else {
      subfolderChecks.push({ subfolder, exists: false, fileCount: 0 });
    }
  }

  const subfolderTable: string[] = [
    '| Subfolder | Exists | Files |',
    '|---|---|---|',
  ];
  for (const check of subfolderChecks) {
    subfolderTable.push(`| ${check.subfolder} | ${check.exists ? 'Yes' : 'No'} | ${check.fileCount} |`);
  }

  const candidateStatus: string[] = [];
  for (const candidate of VAULT_CANDIDATE_PATHS) {
    const exists = fs.existsSync(candidate);
    candidateStatus.push(`- \`${candidate}\`: ${exists ? 'FOUND' : 'not found'}`);
  }

  let briefsFreshness = 'N/A';
  if (vaultPath) {
    const briefsDir = path.join(vaultPath, SAFE_WRITE_FOLDER);
    if (fs.existsSync(briefsDir)) {
      const files = fs.readdirSync(briefsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const stat = fs.statSync(path.join(briefsDir, f));
          return { name: f, mtime: stat.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      if (files.length > 0) {
        const newest = files[0];
        const ageMs = Date.now() - newest.mtime.getTime();
        const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
        briefsFreshness = `${newest.name} (${ageHours}h ago)`;
      }
    }
  }

  const presentCount = subfolderChecks.filter(c => c.exists).length;
  const healthScore = vaultPath
    ? `${Math.round((presentCount / subfolderChecks.length) * 100)}% (${presentCount}/${subfolderChecks.length} subfolders present)`
    : 'Cannot compute — vault not detected';

  const template = readTemplate('vault-health-template.md');
  if (!template) {
    console.error('Error: Vault health template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    HEALTH_ID: healthId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    VAULT_PATH: vaultPath || 'not detected',
    SAFE_WRITE_FOLDER,
    SUBFOLDER_TABLE: subfolderTable.join('\n'),
    CANDIDATE_STATUS: candidateStatus.join('\n'),
    BRIEFS_FRESHNESS: briefsFreshness,
    HEALTH_SCORE: healthScore,
    ROUTING_RULE_COUNT: String(vaultRoutingRules.length),
  });

  const safePath = getSafeWritePath(
    outputFolders.vaultHealth,
    `vault_health_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Vault health ${healthId}: ${healthScore} -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VAULT_HEALTH', msg);
  await announceCompletion(`Vault health check compiled: ${healthId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging Obsidian sync layer summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  const vaultPath = detectVaultPath();

  let totalStaged = 0;
  let modulesWithFiles = 0;
  for (const mod of moduleExportSources) {
    if (fs.existsSync(mod.dir)) {
      const files = fs.readdirSync(mod.dir)
        .filter(f => !f.startsWith('.'))
        .filter(f => matchGlobPattern(f, mod.pattern));
      if (files.length > 0) modulesWithFiles++;
      totalStaged += files.length;
    }
  }

  const summaryLines: string[] = [
    `- **Vault Detected:** ${vaultPath || 'none'}`,
    `- **Total Staged Files:** ${totalStaged}`,
    `- **Active Modules:** ${modulesWithFiles} of ${moduleExportSources.length}`,
    `- **Vault Routing Rules:** ${vaultRoutingRules.length}`,
    `- **Sync Manifests Generated:** ${countFiles(outputFolders.syncManifests)}`,
    `- **Route Previews Generated:** ${countFiles(outputFolders.routePreviews)}`,
    `- **Sync Reports Generated:** ${countFiles(outputFolders.syncReports)}`,
    `- **Vault Health Checks:** ${countFiles(outputFolders.vaultHealth)}`,
  ];

  const sourceLines: string[] = [];
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    sourceLines.push(`- **${source}:** ${scan.exists ? 'Found' : 'Missing'}`);
  }

  let inventoryStr = 'No sync layer artifacts generated yet.';
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
    '- [ ] Run discover-staged to scan all module export directories',
    '- [ ] Compile sync manifest to build unified routing table',
    '- [ ] Preview routes to verify vault subfolder assignments',
    '- [ ] Generate sync report to check pipeline coverage',
    '- [ ] Run vault health to verify vault subfolder structure',
    '- [ ] Review unrouted files and add routing rules as needed',
    '- [ ] Stage approved files through the Obsidian Write Gateway',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SYNC_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: sourceLines.join('\n'),
    OUTPUT_INVENTORY: inventoryStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `obsidian_sync_layer_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Obsidian sync layer export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_DIRECT_VAULT_WRITE) {
    console.error('Safety gate: ALLOW_DIRECT_VAULT_WRITE is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_AUTO_SYNC) {
    console.error('Safety gate: ALLOW_AUTO_SYNC is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_VAULT_DELETION) {
    console.error('Safety gate: ALLOW_VAULT_DELETION is enabled. This is not permitted.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run obsidian-sync-layer-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'discover-staged':
      await handleDiscoverStaged();
      break;
    case 'compile-manifest':
      await handleCompileManifest();
      break;
    case 'preview-routes':
      await handlePreviewRoutes();
      break;
    case 'sync-report':
      await handleSyncReport();
      break;
    case 'vault-health':
      await handleVaultHealth();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run obsidian-sync-layer-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
