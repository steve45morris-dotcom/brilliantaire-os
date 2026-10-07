import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_REMEDIATION,
  ALLOW_AUTO_FIX,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  diagnosticModules,
  diagnosticCategories,
  healthCheckTargets,
  outputDirectoriesToScan,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/system-diagnostics-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    targetPath = path.join(dir, `${baseName}_${Math.floor(Date.now() / 1000)}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `diagnostics_log_${getFormattedDate()}.md`);
  fs.appendFileSync(logFile, `- [${new Date().toISOString()}] **${action}**: ${detail}\n`);
}

function generateRequestId(): string {
  return `SDR-${getFormattedDate().replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function countFiles(dir: string): number {
  const fullPath = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullPath)) return 0;
  return fs.readdirSync(fullPath).filter(f => !f.startsWith('.')).length;
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
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
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  }
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Diagnostics Status`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Live Remediation:      ${ALLOW_LIVE_REMEDIATION}`);
  console.log(`  Auto Fix:              ${ALLOW_AUTO_FIX}`);
  console.log(`  External API Calls:    ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`${'─'.repeat(55)}`);

  console.log('\n  Diagnostic Categories:');
  for (const cat of diagnosticCategories) {
    console.log(`     - ${cat.name}: ${cat.description}`);
  }

  console.log('\n  Health Check Targets:');
  for (const target of healthCheckTargets) {
    const fullPath = path.join(REPO_ROOT, target.path);
    const exists = fs.existsSync(fullPath);
    console.log(`     ${target.name.padEnd(24)} ${exists ? 'OK' : 'MISSING'}`);
  }

  console.log('\n  Output Directories:');
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    const count = countFiles(dir);
    console.log(`     ${name.padEnd(24)} ${fs.existsSync(dir) ? `${count} files` : 'not created'}`);
  }

  console.log('');
  logEvent('STATUS', 'Diagnostics status report generated');
}

// 2. Run Tests Command
async function handleRunTests() {
  await announceIntent('Running Vitest test suite and capturing results');
  console.log('Running test suite...');
  ensureOutputDirs();

  const requestId = generateRequestId();
  let testOutput = '';
  let exitCode = 0;

  try {
    testOutput = execSync('npx vitest run --reporter=verbose 2>&1', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 120000,
    });
  } catch (err: any) {
    testOutput = err.stdout || err.message || 'Test execution failed';
    exitCode = err.status || 1;
  }

  const passMatch = testOutput.match(/(\d+)\s+passed/);
  const failMatch = testOutput.match(/(\d+)\s+failed/);
  const skipMatch = testOutput.match(/(\d+)\s+skipped/);
  const durationMatch = testOutput.match(/Duration\s+([\d.]+s)/);

  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;
  const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
  const duration = durationMatch ? durationMatch[1] : 'unknown';
  const total = passed + failed + skipped;
  const verdict = failed === 0 ? 'PASS' : 'FAIL';

  const templateContent = readTemplate('test-report-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    TOTAL_TESTS: String(total),
    PASSED: String(passed),
    FAILED: String(failed),
    SKIPPED: String(skipped),
    DURATION: duration,
    VERDICT: verdict,
    EXIT_CODE: String(exitCode),
    TEST_OUTPUT: testOutput.slice(-2000),
  });

  const reportPath = getSafeWritePath(outputFolders.testReports, `test_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, report);

  const jsonPath = getSafeWritePath(outputFolders.testReports, `test_results_${getFormattedDate()}`, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    requestId, date: getFormattedDate(), passed, failed, skipped, total, duration, verdict, exitCode
  }, null, 2));

  console.log(`\n  Test Suite Results:`);
  console.log(`     Passed:   ${passed}`);
  console.log(`     Failed:   ${failed}`);
  console.log(`     Skipped:  ${skipped}`);
  console.log(`     Total:    ${total}`);
  console.log(`     Duration: ${duration}`);
  console.log(`     Verdict:  ${verdict}`);
  console.log(`\n  Report: ${reportPath}`);
  console.log(`  JSON:   ${jsonPath}`);

  logEvent('RUN-TESTS', `Test suite: ${passed} passed, ${failed} failed, ${skipped} skipped — ${verdict}`);
  await announceCompletion(`Test suite complete: ${verdict} (${passed}/${total} passed)`);
}

// 3. Module Health Command
async function handleModuleHealth() {
  await announceIntent('Scanning module configurations for health and safety flag validation');
  console.log('Scanning module configurations...');
  ensureOutputDirs();

  const requestId = generateRequestId();
  const results: { module: string; exists: boolean; safetyFlags: Record<string, any> }[] = [];

  for (const modulePath of diagnosticModules) {
    const fullPath = path.join(REPO_ROOT, modulePath);
    const exists = fs.existsSync(fullPath);
    const safetyFlags: Record<string, any> = {};

    if (exists) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const allowMatches = content.matchAll(/export\s+const\s+(ALLOW_\w+)\s*=\s*(true|false)/g);
      const requireMatches = content.matchAll(/export\s+const\s+(REQUIRE_\w+)\s*=\s*(true|false)/g);
      for (const m of allowMatches) safetyFlags[m[1]] = m[2] === 'true';
      for (const m of requireMatches) safetyFlags[m[1]] = m[2] === 'true';
    }

    results.push({ module: modulePath, exists, safetyFlags });
  }

  const violations: string[] = [];
  for (const r of results) {
    if (!r.exists) continue;
    for (const [flag, value] of Object.entries(r.safetyFlags)) {
      if (flag.startsWith('ALLOW_') && value === true) {
        violations.push(`${r.module}: ${flag} = true (should default to false)`);
      }
      if (flag.startsWith('REQUIRE_') && value === false) {
        violations.push(`${r.module}: ${flag} = false (should default to true)`);
      }
    }
  }

  const moduleTable = results.map(r => {
    const flagCount = Object.keys(r.safetyFlags).length;
    return `| ${r.module} | ${r.exists ? 'OK' : 'MISSING'} | ${flagCount} |`;
  }).join('\n');

  const templateContent = readTemplate('module-health-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    MODULE_COUNT: String(results.length),
    PRESENT_COUNT: String(results.filter(r => r.exists).length),
    MISSING_COUNT: String(results.filter(r => !r.exists).length),
    VIOLATION_COUNT: String(violations.length),
    MODULE_TABLE: moduleTable,
    VIOLATIONS: violations.length > 0 ? violations.map(v => `- ${v}`).join('\n') : 'None detected',
  });

  const reportPath = getSafeWritePath(outputFolders.moduleHealth, `module_health_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n  Module Health:`);
  console.log(`     Scanned:   ${results.length} modules`);
  console.log(`     Present:   ${results.filter(r => r.exists).length}`);
  console.log(`     Missing:   ${results.filter(r => !r.exists).length}`);
  console.log(`     Violations: ${violations.length}`);
  console.log(`\n  Report: ${reportPath}`);

  logEvent('MODULE-HEALTH', `${results.length} modules scanned, ${violations.length} violations`);
  await announceCompletion(`Module health: ${results.filter(r => r.exists).length}/${results.length} present, ${violations.length} violations`);
}

// 4. Config Audit Command
async function handleConfigAudit() {
  await announceIntent('Auditing command registry for integrity, duplicates, and disabled entries');
  console.log('Auditing command registry...');
  ensureOutputDirs();

  const requestId = generateRequestId();
  const commandsPath = path.join(REPO_ROOT, 'config', 'commands.ts');
  const content = fs.readFileSync(commandsPath, 'utf-8');

  const nameMatches = [...content.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
  const enabledMatches = [...content.matchAll(/enabled:\s*(true|false)/g)].map(m => m[1] === 'true');
  const riskMatches = [...content.matchAll(/riskLevel:\s*'([^']+)'/g)].map(m => m[1]);

  const totalCommands = nameMatches.length;
  const enabledCount = enabledMatches.filter(Boolean).length;
  const disabledCount = enabledMatches.filter(e => !e).length;

  const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const name of nameMatches) {
    if (seen.has(name)) duplicates.push(name);
    seen.add(name);
  }

  const riskBreakdown: Record<string, number> = {};
  for (const risk of riskMatches) {
    riskBreakdown[risk] = (riskBreakdown[risk] || 0) + 1;
  }

  const riskTable = Object.entries(riskBreakdown)
    .map(([level, count]) => `| ${level} | ${count} |`)
    .join('\n');

  const templateContent = readTemplate('config-audit-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    TOTAL_COMMANDS: String(totalCommands),
    ENABLED_COUNT: String(enabledCount),
    DISABLED_COUNT: String(disabledCount),
    DUPLICATE_COUNT: String(duplicates.length),
    DUPLICATES: duplicates.length > 0 ? duplicates.map(d => `- ${d}`).join('\n') : 'None',
    RISK_TABLE: riskTable,
  });

  const reportPath = getSafeWritePath(outputFolders.configAudits, `config_audit_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n  Config Audit:`);
  console.log(`     Commands:   ${totalCommands}`);
  console.log(`     Enabled:    ${enabledCount}`);
  console.log(`     Disabled:   ${disabledCount}`);
  console.log(`     Duplicates: ${duplicates.length}`);
  console.log(`\n  Report: ${reportPath}`);

  logEvent('CONFIG-AUDIT', `${totalCommands} commands, ${duplicates.length} duplicates`);
  await announceCompletion(`Config audit: ${totalCommands} commands, ${duplicates.length} duplicates`);
}

// 5. Integration Status Command
async function handleIntegrationStatus() {
  await announceIntent('Checking integration registry and GitHub module health');
  console.log('Checking integration status...');
  ensureOutputDirs();

  const requestId = generateRequestId();
  const integrationFiles = [
    { name: 'Integration Registry', path: 'src/integrations/core/IntegrationRegistry.ts' },
    { name: 'Integration Lifecycle', path: 'src/integrations/core/IntegrationLifecycle.ts' },
    { name: 'Integration Security', path: 'src/integrations/core/IntegrationSecurity.ts' },
    { name: 'Integration Bridge', path: 'src/integrations/core/IntegrationBridge.ts' },
    { name: 'Integration Health', path: 'src/integrations/core/IntegrationHealth.ts' },
    { name: 'Integration Permissions', path: 'src/integrations/core/IntegrationPermissions.ts' },
    { name: 'Integration Scheduler', path: 'src/integrations/core/IntegrationScheduler.ts' },
    { name: 'Integration Metrics', path: 'src/integrations/core/IntegrationMetrics.ts' },
    { name: 'Integration Logger', path: 'src/integrations/core/IntegrationLogger.ts' },
    { name: 'Integration Factory', path: 'src/integrations/core/IntegrationFactory.ts' },
    { name: 'Integration State', path: 'src/integrations/core/IntegrationState.ts' },
    { name: 'GitHub Config', path: 'src/integrations/github/GitHubConfig.ts' },
    { name: 'GitHub Repository Service', path: 'src/integrations/github/GitHubRepositoryService.ts' },
    { name: 'GitHub Health Service', path: 'src/integrations/github/GitHubHealthService.ts' },
    { name: 'GitHub Knowledge Sync', path: 'src/integrations/github/GitHubKnowledgeSync.ts' },
    { name: 'GitHub Live Ops Sync', path: 'src/integrations/github/GitHubLiveOperationsSync.ts' },
    { name: 'GitHub Integration Contract', path: 'src/integrations/github/GitHubIntegrationContract.ts' },
  ];

  const results = integrationFiles.map(f => ({
    ...f,
    exists: fs.existsSync(path.join(REPO_ROOT, f.path)),
  }));

  const integrationTable = results
    .map(r => `| ${r.name} | ${r.exists ? 'OK' : 'MISSING'} |`)
    .join('\n');

  const templateContent = readTemplate('integration-status-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    TOTAL_INTEGRATIONS: String(results.length),
    PRESENT_COUNT: String(results.filter(r => r.exists).length),
    MISSING_COUNT: String(results.filter(r => !r.exists).length),
    INTEGRATION_TABLE: integrationTable,
  });

  const reportPath = getSafeWritePath(outputFolders.integrationStatus, `integration_status_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n  Integration Status:`);
  console.log(`     Total:   ${results.length}`);
  console.log(`     Present: ${results.filter(r => r.exists).length}`);
  console.log(`     Missing: ${results.filter(r => !r.exists).length}`);
  console.log(`\n  Report: ${reportPath}`);

  logEvent('INTEGRATION-STATUS', `${results.length} integration files checked`);
  await announceCompletion(`Integration status: ${results.filter(r => r.exists).length}/${results.length} present`);
}

// 6. Full Diagnostics Report Command
async function handleDiagnosticsReport() {
  await announceIntent('Generating comprehensive system diagnostics report');
  console.log('Compiling full diagnostics report...');
  ensureOutputDirs();

  const requestId = generateRequestId();

  const healthResults = healthCheckTargets.map(t => {
    const fullPath = path.join(REPO_ROOT, t.path);
    const exists = fs.existsSync(fullPath);
    let detail = '';
    if (exists && t.type === 'directory') {
      detail = `${countFiles(fullPath)} items`;
    } else if (exists && t.type === 'file') {
      const stat = fs.statSync(fullPath);
      detail = `${(stat.size / 1024).toFixed(1)} KB`;
    }
    return { name: t.name, path: t.path, exists, detail };
  });

  const outputScan = outputDirectoriesToScan.map(dir => ({
    directory: dir,
    exists: fs.existsSync(path.join(REPO_ROOT, dir)),
    fileCount: countFiles(dir),
  }));

  const healthTable = healthResults
    .map(r => `| ${r.name} | ${r.exists ? 'OK' : 'MISSING'} | ${r.detail} |`)
    .join('\n');

  const outputTable = outputScan
    .map(o => `| ${o.directory} | ${o.exists ? 'OK' : 'N/A'} | ${o.fileCount} |`)
    .join('\n');

  const scriptCount = countFiles(path.join(REPO_ROOT, 'scripts'));
  const configCount = countFiles(path.join(REPO_ROOT, 'config'));
  const testFileCount = countFiles(path.join(REPO_ROOT, 'src'));
  const totalOutputFiles = outputScan.reduce((sum, o) => sum + o.fileCount, 0);
  const allPresent = healthResults.every(r => r.exists);

  const templateContent = readTemplate('diagnostics-report-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    HEALTH_TABLE: healthTable,
    OUTPUT_TABLE: outputTable,
    SCRIPT_COUNT: String(scriptCount),
    CONFIG_COUNT: String(configCount),
    SRC_FILE_COUNT: String(testFileCount),
    TOTAL_OUTPUT_FILES: String(totalOutputFiles),
    OVERALL_HEALTH: allPresent ? 'HEALTHY' : 'DEGRADED',
  });

  const reportPath = getSafeWritePath(outputFolders.root, `diagnostics_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(reportPath, report);

  const jsonPath = getSafeWritePath(outputFolders.root, `diagnostics_summary_${getFormattedDate()}`, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    requestId,
    date: getFormattedDate(),
    overallHealth: allPresent ? 'HEALTHY' : 'DEGRADED',
    scriptCount,
    configCount,
    srcFileCount: testFileCount,
    totalOutputFiles,
    healthChecks: healthResults,
    outputInventory: outputScan,
  }, null, 2));

  console.log(`\n  System Diagnostics Report:`);
  console.log(`     Overall Health: ${allPresent ? 'HEALTHY' : 'DEGRADED'}`);
  console.log(`     Scripts:        ${scriptCount}`);
  console.log(`     Configs:        ${configCount}`);
  console.log(`     Source Files:   ${testFileCount}`);
  console.log(`     Output Files:   ${totalOutputFiles}`);
  console.log(`\n  Report: ${reportPath}`);
  console.log(`  JSON:   ${jsonPath}`);

  logEvent('DIAGNOSTICS-REPORT', `Overall health: ${allPresent ? 'HEALTHY' : 'DEGRADED'}`);
  await announceCompletion(`Diagnostics report: ${allPresent ? 'HEALTHY' : 'DEGRADED'}`);
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  await announceIntent('Staging diagnostics summary for Obsidian export');
  console.log('Staging Obsidian export...');
  ensureOutputDirs();

  const requestId = generateRequestId();

  const healthResults = healthCheckTargets.map(t => ({
    name: t.name,
    exists: fs.existsSync(path.join(REPO_ROOT, t.path)),
  }));

  const allPresent = healthResults.every(r => r.exists);
  const scriptCount = countFiles(path.join(REPO_ROOT, 'scripts'));
  const configCount = countFiles(path.join(REPO_ROOT, 'config'));

  const templateContent = readTemplate('obsidian-export-template.md');
  const report = fillTemplate(templateContent, {
    REPORT_ID: requestId,
    DATE: getFormattedDate(),
    TIMESTAMP: new Date().toISOString(),
    OVERALL_HEALTH: allPresent ? 'HEALTHY' : 'DEGRADED',
    SCRIPT_COUNT: String(scriptCount),
    CONFIG_COUNT: String(configCount),
    HEALTH_CHECKLIST: healthResults.map(r => `- [${r.exists ? 'x' : ' '}] ${r.name}`).join('\n'),
  });

  const writeStagingDir = path.join(REPO_ROOT, 'outputs', 'write_staging');
  if (!fs.existsSync(writeStagingDir)) fs.mkdirSync(writeStagingDir, { recursive: true });

  const exportPath = getSafeWritePath(writeStagingDir, `system_diagnostics_${getFormattedDate()}`, '.md');
  fs.writeFileSync(exportPath, report);
  console.log(`\n  Obsidian Export staged: ${exportPath}`);
  console.log('  Route via Approved Write Gateway to publish.');

  logEvent('OBSIDIAN-EXPORT', `Export staged: ${exportPath}`);
  await announceCompletion('Diagnostics summary staged for Obsidian export');
}

// Main dispatch
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase()?.trim() || 'status';

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'run-tests':
      await handleRunTests();
      break;
    case 'module-health':
      await handleModuleHealth();
      break;
    case 'config-audit':
      await handleConfigAudit();
      break;
    case 'integration-status':
      await handleIntegrationStatus();
      break;
    case 'diagnostics-report':
      await handleDiagnosticsReport();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available: status, run-tests, module-health, config-audit, integration-status, diagnostics-report, obsidian-export');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('System Diagnostics Runner error:', err);
  process.exit(1);
});
