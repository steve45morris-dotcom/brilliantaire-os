import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  REPO_ROOT,
  MODULE_NAME,
  BRIDGE_MODE,
  ALLOW_AUTO_FIX,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_REVIEW,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  OUTPUT_ROOT,
  outputFolders,
  TEMPLATE_ROOT,
  bridgeModules,
  healthCategories,
} from '../config/bridge-health-monitor.js';

const args = process.argv.slice(2);
const command = args[0] || 'status';

function genId(): string {
  return `BHM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ts(): string {
  return new Date().toISOString();
}

function dateStr(): string {
  return new Date().toISOString().split('T')[0];
}

function announceIntent(msg: string): void {
  try { execSync(`say "${msg}"`, { stdio: 'ignore' }); } catch {}
}

function announceCompletion(msg: string): void {
  try { execSync(`say "${msg}"`, { stdio: 'ignore' }); } catch {}
}

function ensureDirs(): void {
  for (const dir of Object.values(outputFolders)) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function fillTemplate(name: string, vars: Record<string, string>): string {
  const tplPath = path.join(TEMPLATE_ROOT, name);
  if (!fs.existsSync(tplPath)) return `Template not found: ${name}`;
  let content = fs.readFileSync(tplPath, 'utf8');
  for (const [key, val] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  return content;
}

function appendLog(message: string): void {
  const logPath = path.join(outputFolders.logs, `bhm_log_${dateStr()}.log`);
  fs.appendFileSync(logPath, `[${ts()}] ${message}\n`);
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

// --- Bridge inspection helpers (read source as text, never import) ---

interface BridgeScanResult {
  name: string;
  bridgePath: string;
  configPath: string;
  bridgeExists: boolean;
  configExists: boolean;
  hasBridgeMode: boolean;
  hasSafetyFlags: boolean;
  hasStatusExport: boolean;
  hasReportExport: boolean;
  hasCliGuard: boolean;
  safetyFlags: Record<string, boolean>;
  issues: string[];
}

function scanBridge(mod: { name: string; bridge: string; config: string }): BridgeScanResult {
  const bridgeFullPath = path.join(REPO_ROOT, mod.bridge);
  const configFullPath = path.join(REPO_ROOT, mod.config);
  const bridgeExists = fs.existsSync(bridgeFullPath);
  const configExists = fs.existsSync(configFullPath);

  let hasBridgeMode = false;
  let hasSafetyFlags = false;
  let hasStatusExport = false;
  let hasReportExport = false;
  let hasCliGuard = false;
  const safetyFlags: Record<string, boolean> = {};
  const issues: string[] = [];

  if (!bridgeExists) {
    issues.push('Bridge file missing');
  } else {
    const bridgeSrc = fs.readFileSync(bridgeFullPath, 'utf8');
    hasBridgeMode = /BRIDGE_MODE/.test(bridgeSrc);
    hasStatusExport = /export\s+function\s+get\w+Status/.test(bridgeSrc);
    hasReportExport = /export\s+function\s+generateBridgeReport/.test(bridgeSrc) || /export\s+function\s+generate\w+Report/.test(bridgeSrc);
    hasCliGuard = /import\.meta\.url\s*===/.test(bridgeSrc);

    if (!hasBridgeMode) issues.push('No BRIDGE_MODE reference in bridge');
    if (!hasStatusExport) issues.push('No status export function');
    if (!hasReportExport) issues.push('No report generator export');
    if (!hasCliGuard) issues.push('No CLI entry guard');
  }

  if (!configExists) {
    issues.push('Config file missing');
  } else {
    const configSrc = fs.readFileSync(configFullPath, 'utf8');
    const allowMatches = configSrc.matchAll(/export\s+const\s+(ALLOW_\w+)\s*=\s*(true|false)/g);
    const requireMatches = configSrc.matchAll(/export\s+const\s+(REQUIRE_\w+)\s*=\s*(true|false)/g);
    for (const m of allowMatches) safetyFlags[m[1]] = m[2] === 'true';
    for (const m of requireMatches) safetyFlags[m[1]] = m[2] === 'true';
    hasSafetyFlags = Object.keys(safetyFlags).length > 0;

    if (!hasSafetyFlags) issues.push('No safety flags in config');

    // Check for safety flag violations
    for (const [flag, value] of Object.entries(safetyFlags)) {
      if (flag.startsWith('ALLOW_') && value === true) {
        issues.push(`Safety violation: ${flag} = true (should default to false)`);
      }
      if (flag.startsWith('REQUIRE_') && value === false) {
        issues.push(`Safety violation: ${flag} = false (should default to true)`);
      }
    }

    // Check for BRIDGE_MODE in config
    if (!/BRIDGE_MODE/.test(configSrc)) {
      issues.push('No BRIDGE_MODE export in config');
    }
  }

  return {
    name: mod.name,
    bridgePath: mod.bridge,
    configPath: mod.config,
    bridgeExists,
    configExists,
    hasBridgeMode,
    hasSafetyFlags,
    hasStatusExport,
    hasReportExport,
    hasCliGuard,
    safetyFlags,
    issues,
  };
}

function scanAllBridges(): BridgeScanResult[] {
  return bridgeModules.map(mod => scanBridge(mod));
}

function getBridgeVerdict(scan: BridgeScanResult): 'PASS' | 'WARN' | 'FAIL' {
  if (!scan.bridgeExists || !scan.configExists) return 'FAIL';
  if (scan.issues.length === 0) return 'PASS';
  const hasCritical = scan.issues.some(i =>
    i.includes('missing') || i.includes('Safety violation')
  );
  return hasCritical ? 'FAIL' : 'WARN';
}

// --- Commands ---

function cmdStatus(): void {
  announceIntent(`${MODULE_NAME} status check`);
  console.log(`\n=== ${MODULE_NAME} Status ===\n`);
  console.log(`Project: ${PROJECT_NAME}`);
  console.log(`Tool Type: ${TOOL_TYPE}`);
  console.log(`Bridge Mode: ${BRIDGE_MODE}`);
  console.log(`Integration Target: ${INTEGRATION_TARGET}`);
  console.log(`\nSafety Flags:`);
  console.log(`  ALLOW_AUTO_FIX: ${ALLOW_AUTO_FIX}`);
  console.log(`  ALLOW_EXTERNAL_API_CALLS: ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  ALLOW_DIRECT_OBSIDIAN_WRITE: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`  REQUIRE_HUMAN_APPROVAL: ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  REQUIRE_MANUAL_REVIEW: ${REQUIRE_MANUAL_REVIEW}`);
  console.log(`\nBridge Modules (${bridgeModules.length}):`);
  for (const mod of bridgeModules) {
    const bridgeExists = fs.existsSync(path.join(REPO_ROOT, mod.bridge));
    const configExists = fs.existsSync(path.join(REPO_ROOT, mod.config));
    const status = bridgeExists && configExists ? 'OK' : bridgeExists ? 'CONFIG MISSING' : configExists ? 'BRIDGE MISSING' : 'BOTH MISSING';
    console.log(`  ${status.padEnd(16)} ${mod.name}`);
  }
  console.log(`\nHealth Categories: ${healthCategories.length}`);
  console.log(`\nOutput Directories:`);
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => !f.startsWith('.')).length : 0;
    console.log(`  ${name}: ${count} files`);
  }
  appendLog('status check completed');
  announceCompletion(`${MODULE_NAME} status check complete`);
}

function cmdScanBridges(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} scanning all bridge modules`);
  ensureDirs();

  const results = scanAllBridges();

  const bridgeTable = results.map(r =>
    `| ${r.name} | ${r.bridgeExists ? 'OK' : 'MISSING'} | ${r.configExists ? 'OK' : 'MISSING'} |`
  ).join('\n');

  const capabilityTable = results.map(r =>
    `| ${r.name} | ${r.hasBridgeMode ? 'Yes' : 'No'} | ${r.hasSafetyFlags ? 'Yes' : 'No'} | ${r.hasStatusExport ? 'Yes' : 'No'} | ${r.hasReportExport ? 'Yes' : 'No'} | ${r.hasCliGuard ? 'Yes' : 'No'} |`
  ).join('\n');

  const report = fillTemplate('scan-bridges-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    BRIDGE_TABLE: bridgeTable,
    CAPABILITY_TABLE: capabilityTable,
    TOTAL_BRIDGES: String(results.length),
    BRIDGE_PRESENT: String(results.filter(r => r.bridgeExists).length),
    CONFIG_PRESENT: String(results.filter(r => r.configExists).length),
    HAS_MODE: String(results.filter(r => r.hasBridgeMode).length),
    HAS_FLAGS: String(results.filter(r => r.hasSafetyFlags).length),
  });

  const outPath = path.join(outputFolders.scans, `scan_bridges_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Bridge scan written to: ${outPath}`);
  console.log(`\nBridges: ${results.filter(r => r.bridgeExists).length}/${results.length} present`);
  console.log(`Configs: ${results.filter(r => r.configExists).length}/${results.length} present`);
  appendLog(`scan-bridges completed: ${reqId}`);
  announceCompletion(`${MODULE_NAME} bridge scan complete`);
}

function cmdHealthReport(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} generating comprehensive health report`);
  ensureDirs();

  const results = scanAllBridges();

  let bridgeMissingCount = 0;
  let configMissingCount = 0;
  let safetyViolationCount = 0;
  let modeMismatchCount = 0;
  let exportMissingCount = 0;

  for (const r of results) {
    if (!r.bridgeExists) bridgeMissingCount++;
    if (!r.configExists) configMissingCount++;
    for (const issue of r.issues) {
      if (issue.includes('Safety violation')) safetyViolationCount++;
      if (issue.includes('BRIDGE_MODE')) modeMismatchCount++;
      if (issue.includes('No status export') || issue.includes('No report generator')) exportMissingCount++;
    }
  }

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const verdicts = results.map(r => getBridgeVerdict(r));
  const passCount = verdicts.filter(v => v === 'PASS').length;
  const warnCount = verdicts.filter(v => v === 'WARN').length;
  const failCount = verdicts.filter(v => v === 'FAIL').length;

  const overallVerdict = failCount > 0 ? 'DEGRADED' : warnCount > 0 ? 'WARNING' : 'HEALTHY';

  const bridgeHealthTable = results.map((r, i) =>
    `| ${r.name} | ${verdicts[i]} | ${r.issues.length} |`
  ).join('\n');

  const findings = results
    .filter(r => r.issues.length > 0)
    .map(r => `### ${r.name}\n${r.issues.map(i => `- ${i}`).join('\n')}`)
    .join('\n\n');

  const report = fillTemplate('health-report-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: overallVerdict,
    VERDICT_SUMMARY: totalIssues === 0
      ? 'All bridge modules are healthy with correct safety flags and exports.'
      : `${totalIssues} issue(s) detected across ${results.filter(r => r.issues.length > 0).length} bridge(s).`,
    BRIDGE_HEALTH_TABLE: bridgeHealthTable,
    BRIDGE_MISSING_COUNT: String(bridgeMissingCount),
    CONFIG_MISSING_COUNT: String(configMissingCount),
    SAFETY_VIOLATION_COUNT: String(safetyViolationCount),
    MODE_MISMATCH_COUNT: String(modeMismatchCount),
    EXPORT_MISSING_COUNT: String(exportMissingCount),
    FINDINGS: findings || '_No issues detected._',
    TOTAL_BRIDGES: String(results.length),
    PASS_COUNT: String(passCount),
    WARN_COUNT: String(warnCount),
    FAIL_COUNT: String(failCount),
    TOTAL_ISSUES: String(totalIssues),
  });

  const outPath = path.join(outputFolders.reports, `health_report_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Health report written to: ${outPath}`);
  console.log(`\nVerdict: ${overallVerdict} (${passCount} pass, ${warnCount} warn, ${failCount} fail)`);
  console.log(`Total issues: ${totalIssues}`);
  appendLog(`health-report completed: ${reqId} verdict=${overallVerdict} issues=${totalIssues}`);
  announceCompletion(`${MODULE_NAME} health report complete. ${overallVerdict}. ${totalIssues} issues.`);
}

function cmdBridgeDetail(): void {
  const reqId = genId();
  const bridgeName = args[1];
  if (!bridgeName) {
    console.error('Usage: bridge-detail <bridge-name>');
    console.error('Available bridges:');
    for (const mod of bridgeModules) {
      console.error(`  ${mod.name}`);
    }
    process.exit(1);
  }

  const mod = bridgeModules.find(m =>
    m.name.toLowerCase().includes(bridgeName.toLowerCase()) ||
    m.bridge.toLowerCase().includes(bridgeName.toLowerCase())
  );

  if (!mod) {
    console.error(`Bridge not found: ${bridgeName}`);
    console.error('Available bridges:');
    for (const m of bridgeModules) {
      console.error(`  ${m.name}`);
    }
    process.exit(1);
  }

  announceIntent(`${MODULE_NAME} showing detail for ${mod.name}`);
  ensureDirs();

  const result = scanBridge(mod);

  const flagRows = Object.keys(result.safetyFlags).length > 0
    ? Object.entries(result.safetyFlags).map(([flag, val]) => `- \`${flag}\` = ${val}`).join('\n')
    : '_No safety flags found._';

  const issueRows = result.issues.length > 0
    ? result.issues.map(i => `- ${i}`).join('\n')
    : '_No issues detected._';

  const report = fillTemplate('bridge-detail-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    BRIDGE_NAME: result.name,
    BRIDGE_PATH: result.bridgePath,
    CONFIG_PATH: result.configPath,
    BRIDGE_EXISTS: result.bridgeExists ? 'Yes' : 'No',
    CONFIG_EXISTS: result.configExists ? 'Yes' : 'No',
    HAS_BRIDGE_MODE: result.hasBridgeMode ? 'Yes' : 'No',
    HAS_SAFETY_FLAGS: result.hasSafetyFlags ? 'Yes' : 'No',
    HAS_STATUS_EXPORT: result.hasStatusExport ? 'Yes' : 'No',
    HAS_REPORT_EXPORT: result.hasReportExport ? 'Yes' : 'No',
    HAS_CLI_GUARD: result.hasCliGuard ? 'Yes' : 'No',
    SAFETY_FLAGS: flagRows,
    ISSUES: issueRows,
  });

  const safeName = mod.name.toLowerCase().replace(/\s+/g, '_');
  const outPath = path.join(outputFolders.scans, `bridge_detail_${safeName}_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Bridge detail written to: ${outPath}`);
  appendLog(`bridge-detail completed: ${reqId} bridge=${mod.name}`);
  announceCompletion(`${MODULE_NAME} bridge detail for ${mod.name} complete`);
}

function cmdAnomalyScan(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} running anomaly scan`);
  ensureDirs();

  const results = scanAllBridges();
  const anomalies: string[] = [];

  let missingFlagsCount = 0;
  let missingModeCount = 0;
  let missingDirsCount = 0;
  let violationCount = 0;

  for (const r of results) {
    if (!r.bridgeExists) {
      anomalies.push(`- **${r.name}:** Bridge file missing (\`${r.bridgePath}\`)`);
    }
    if (!r.configExists) {
      anomalies.push(`- **${r.name}:** Config file missing (\`${r.configPath}\`)`);
    }
    if (r.configExists && !r.hasSafetyFlags) {
      anomalies.push(`- **${r.name}:** Config has no ALLOW_* or REQUIRE_* safety flags`);
      missingFlagsCount++;
    }
    if (r.bridgeExists && !r.hasBridgeMode) {
      anomalies.push(`- **${r.name}:** Bridge does not reference BRIDGE_MODE`);
      missingModeCount++;
    }
    for (const issue of r.issues) {
      if (issue.includes('Safety violation')) {
        anomalies.push(`- **${r.name}:** ${issue}`);
        violationCount++;
      }
    }
  }

  // Check for output directory anomalies
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    if (!fs.existsSync(dir)) {
      anomalies.push(`- **Output directory missing:** \`${name}\` (\`${dir}\`)`);
      missingDirsCount++;
    }
  }

  const totalAnomalies = anomalies.length;
  const verdict = totalAnomalies === 0 ? 'CLEAN' : 'ANOMALIES_DETECTED';

  const report = fillTemplate('anomaly-scan-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: verdict,
    VERDICT_SUMMARY: totalAnomalies === 0
      ? 'No anomalies detected across all bridge modules.'
      : `${totalAnomalies} anomaly/anomalies detected across bridge modules.`,
    ANOMALY_LIST: anomalies.length > 0 ? anomalies.join('\n') : '_No anomalies detected._',
    MISSING_FLAGS_COUNT: String(missingFlagsCount),
    MISSING_MODE_COUNT: String(missingModeCount),
    MISSING_DIRS_COUNT: String(missingDirsCount),
    VIOLATION_COUNT: String(violationCount),
    TOTAL_BRIDGES: String(results.length),
    TOTAL_ANOMALIES: String(totalAnomalies),
  });

  const outPath = path.join(outputFolders.scans, `anomaly_scan_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Anomaly scan written to: ${outPath}`);
  console.log(`\nVerdict: ${verdict} (${totalAnomalies} anomalies)`);
  appendLog(`anomaly-scan completed: ${reqId} verdict=${verdict} anomalies=${totalAnomalies}`);
  announceCompletion(`${MODULE_NAME} anomaly scan complete. ${verdict}. ${totalAnomalies} anomalies.`);
}

function cmdDashboardExport(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} exporting dashboard JSON`);
  ensureDirs();

  const results = scanAllBridges();
  const verdicts = results.map(r => getBridgeVerdict(r));
  const passCount = verdicts.filter(v => v === 'PASS').length;
  const warnCount = verdicts.filter(v => v === 'WARN').length;
  const failCount = verdicts.filter(v => v === 'FAIL').length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const overallVerdict = failCount > 0 ? 'DEGRADED' : warnCount > 0 ? 'WARNING' : 'HEALTHY';

  let bridgeMissingCount = 0;
  let configMissingCount = 0;
  let safetyViolationCount = 0;
  let modeMismatchCount = 0;
  let exportMissingCount = 0;

  for (const r of results) {
    if (!r.bridgeExists) bridgeMissingCount++;
    if (!r.configExists) configMissingCount++;
    for (const issue of r.issues) {
      if (issue.includes('Safety violation')) safetyViolationCount++;
      if (issue.includes('BRIDGE_MODE')) modeMismatchCount++;
      if (issue.includes('No status export') || issue.includes('No report generator')) exportMissingCount++;
    }
  }

  const bridgeJsonRows = results.map((r, i) => {
    const v = verdicts[i];
    return `    {"name": "${r.name}", "verdict": "${v}", "bridgeExists": ${r.bridgeExists}, "configExists": ${r.configExists}, "issues": ${r.issues.length}}`;
  }).join(',\n');

  const report = fillTemplate('dashboard-export-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: overallVerdict,
    TOTAL_BRIDGES: String(results.length),
    PASS_COUNT: String(passCount),
    WARN_COUNT: String(warnCount),
    FAIL_COUNT: String(failCount),
    TOTAL_ISSUES: String(totalIssues),
    BRIDGE_MISSING_COUNT: String(bridgeMissingCount),
    CONFIG_MISSING_COUNT: String(configMissingCount),
    SAFETY_VIOLATION_COUNT: String(safetyViolationCount),
    MODE_MISMATCH_COUNT: String(modeMismatchCount),
    EXPORT_MISSING_COUNT: String(exportMissingCount),
    BRIDGE_JSON_ROWS: bridgeJsonRows,
  });

  const outPath = path.join(outputFolders.reports, `dashboard_export_${dateStr()}.json`);
  fs.writeFileSync(outPath, report);
  console.log(`Dashboard export written to: ${outPath}`);
  console.log(`Verdict: ${overallVerdict}`);
  appendLog(`dashboard-export completed: ${reqId} verdict=${overallVerdict}`);
  announceCompletion(`${MODULE_NAME} dashboard export complete`);
}

function cmdObsidianExport(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} staging Obsidian export`);
  ensureDirs();

  const results = scanAllBridges();
  const verdicts = results.map(r => getBridgeVerdict(r));
  const passCount = verdicts.filter(v => v === 'PASS').length;
  const failCount = verdicts.filter(v => v === 'FAIL').length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const overallVerdict = failCount > 0 ? 'DEGRADED' : totalIssues > 0 ? 'WARNING' : 'HEALTHY';

  const bridgeChecklist = results.map((r, i) =>
    `- [${verdicts[i] === 'PASS' ? 'x' : ' '}] ${r.name}`
  ).join('\n');

  const failingBridges = results.filter(r => r.issues.length > 0);
  const keyFindings = failingBridges.length > 0
    ? failingBridges.map(r => `- **${r.name}:** ${r.issues.join('; ')}`).join('\n')
    : '_All bridges healthy._';

  const actions = failCount > 0
    ? '- [ ] Review failing bridges above\n- [ ] Add missing bridge or config files\n- [ ] Fix safety flag violations\n- [ ] Add missing exports'
    : totalIssues > 0
    ? '- [ ] Review warnings above\n- [ ] Address non-critical issues\n- [ ] Schedule next audit'
    : '- [x] All bridges are healthy\n- [ ] Schedule next audit';

  const report = fillTemplate('obsidian-export-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: overallVerdict,
    EXPORT_SUMMARY: `${passCount}/${results.length} bridges passing. ${totalIssues} total issue(s).`,
    BRIDGE_CHECKLIST: bridgeChecklist,
    KEY_FINDINGS: keyFindings,
    ACTION_ITEMS: actions,
  });

  const outPath = path.join(outputFolders.reports, `obsidian_export_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Obsidian export staged at: ${outPath}`);
  appendLog(`obsidian-export completed: ${reqId}`);
  announceCompletion(`${MODULE_NAME} Obsidian export staged`);
}

switch (command) {
  case 'status': cmdStatus(); break;
  case 'scan-bridges': cmdScanBridges(); break;
  case 'health-report': cmdHealthReport(); break;
  case 'bridge-detail': cmdBridgeDetail(); break;
  case 'anomaly-scan': cmdAnomalyScan(); break;
  case 'dashboard-export': cmdDashboardExport(); break;
  case 'obsidian-export': cmdObsidianExport(); break;
  case 'help': console.log('Run: npm run bridge-health-help'); break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Available: status, scan-bridges, health-report, bridge-detail, anomaly-scan, dashboard-export, obsidian-export');
    process.exit(1);
}
