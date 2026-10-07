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
  systemIndexes,
  crossReferenceTargets,
  driftCategories,
} from '../config/documentation-drift-detector.js';

const args = process.argv.slice(2);
const command = args[0] || 'status';

function genId(): string {
  return `DDR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const logPath = path.join(outputFolders.logs, `drift_log_${dateStr()}.log`);
  fs.appendFileSync(logPath, `[${ts()}] ${message}\n`);
}

function extractCommandNamesFromRegistry(): string[] {
  const cmdPath = path.join(REPO_ROOT, 'config', 'commands.ts');
  if (!fs.existsSync(cmdPath)) return [];
  const src = fs.readFileSync(cmdPath, 'utf8');
  const matches = src.matchAll(/name:\s*['"]([^'"]+)['"]/g);
  return [...matches].map(m => m[1]);
}

function extractCommandNamesFromDoc(): string[] {
  const docPath = path.join(REPO_ROOT, 'COMMANDS.md');
  if (!fs.existsSync(docPath)) return [];
  const src = fs.readFileSync(docPath, 'utf8');
  const matches = src.matchAll(/\|\s*`([^`]+)`\s*\|/g);
  return [...matches].map(m => m[1]);
}

function extractNpmScriptNames(): string[] {
  const pkgPath = path.join(REPO_ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return Object.keys(pkg.scripts || {});
}

function extractNarratorConfigSources(): string[] {
  const cfgPath = path.join(REPO_ROOT, 'config', 'narrator-sources.ts');
  if (!fs.existsSync(cfgPath)) return [];
  const src = fs.readFileSync(cfgPath, 'utf8');
  const matches = src.matchAll(/["']([^"']+)["']/g);
  return [...matches].map(m => m[1]).filter(s => s.includes('/') || s.endsWith('.md'));
}

function extractNarratorDocSources(): string[] {
  const docPath = path.join(REPO_ROOT, 'NARRATOR.md');
  if (!fs.existsSync(docPath)) return [];
  const src = fs.readFileSync(docPath, 'utf8');
  const matches = src.matchAll(/`([^`]+(?:\/|\.md))`/g);
  return [...matches].map(m => m[1]).filter(s => !s.startsWith('npm'));
}

function getNextUpgradePointer(): string {
  const statusPath = path.join(REPO_ROOT, 'SYSTEM_STATUS.md');
  if (!fs.existsSync(statusPath)) return '';
  const src = fs.readFileSync(statusPath, 'utf8');
  const match = src.match(/Next Upgrade[^*\n]*\n[^*]*\*\*([^*]+)\*\*/);
  if (match) return match[1].trim();
  const match2 = src.match(/Next Upgrade.*?:\s*(.+)/);
  if (match2) return match2[1].trim();
  return '';
}

function isPointerCompleted(pointer: string): boolean {
  const naPath = path.join(REPO_ROOT, 'NEXT_ACTIONS.md');
  if (!fs.existsSync(naPath)) return false;
  const src = fs.readFileSync(naPath, 'utf8');
  const escaped = pointer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\[x\\].*${escaped}`, 'i');
  return re.test(src);
}

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
  console.log(`\nSystem Indexes (${systemIndexes.length}):`);
  for (const idx of systemIndexes) {
    const exists = fs.existsSync(path.join(REPO_ROOT, idx.path));
    console.log(`  ${exists ? 'OK' : 'MISSING'} ${idx.name}`);
  }
  console.log(`\nCross-Reference Targets: ${crossReferenceTargets.length}`);
  console.log(`Drift Categories: ${driftCategories.length}`);
  console.log(`\nOutput Directories:`);
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    const count = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => !f.startsWith('.')).length : 0;
    console.log(`  ${name}: ${count} files`);
  }
  appendLog('status check completed');
  announceCompletion(`${MODULE_NAME} status check complete`);
}

function cmdScanIndexes(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} scanning system indexes`);
  ensureDirs();

  const indexRows: string[] = [];
  for (const idx of systemIndexes) {
    const fullPath = path.join(REPO_ROOT, idx.path);
    const exists = fs.existsSync(fullPath);
    const stat = exists ? fs.statSync(fullPath) : null;
    const size = stat ? `${Math.round(stat.size / 1024)}KB` : 'N/A';
    indexRows.push(`| ${idx.name} | ${exists ? 'OK' : 'MISSING'} | ${size} |`);
  }

  const xrefRows: string[] = [];
  for (const xref of crossReferenceTargets) {
    const srcExists = fs.existsSync(path.join(REPO_ROOT, xref.source));
    const tgtExists = fs.existsSync(path.join(REPO_ROOT, xref.target));
    const status = srcExists && tgtExists ? 'Both present' : `${srcExists ? '' : 'Source missing '}${tgtExists ? '' : 'Target missing'}`.trim();
    xrefRows.push(`| ${xref.source} | ${xref.target} | ${xref.field} | ${status} |`);
  }

  const report = fillTemplate('scan-indexes-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    INDEX_TABLE: indexRows.join('\n'),
    XREF_TABLE: xrefRows.join('\n'),
  });

  const outPath = path.join(outputFolders.audits, `scan_indexes_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Index scan written to: ${outPath}`);
  appendLog(`scan-indexes completed: ${reqId}`);
  announceCompletion(`${MODULE_NAME} index scan complete`);
}

function cmdAuditCommands(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} auditing commands`);
  ensureDirs();

  const registryNames = extractCommandNamesFromRegistry();
  const docNames = extractCommandNamesFromDoc();
  const npmScripts = extractNpmScriptNames();

  const missingFromDocs = registryNames.filter(n => !docNames.includes(n));
  const missingFromRegistry = docNames.filter(n => !registryNames.includes(n));
  const missingNpmScripts = registryNames.filter(n => !npmScripts.includes(n));

  const totalIssues = missingFromDocs.length + missingFromRegistry.length + missingNpmScripts.length;
  const verdict = totalIssues === 0 ? 'CLEAN' : 'DRIFTED';

  const report = fillTemplate('audit-commands-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    REGISTRY_COUNT: String(registryNames.length),
    DOC_COUNT: String(docNames.length),
    NPM_SCRIPT_COUNT: String(npmScripts.length),
    MISSING_FROM_DOCS: missingFromDocs.length ? missingFromDocs.map(n => `- \`${n}\``).join('\n') : '_None_',
    MISSING_FROM_REGISTRY: missingFromRegistry.length ? missingFromRegistry.map(n => `- \`${n}\``).join('\n') : '_None_',
    MISSING_NPM_SCRIPTS: missingNpmScripts.length ? missingNpmScripts.map(n => `- \`${n}\``).join('\n') : '_None_',
    VERDICT: verdict,
    DRIFT_SUMMARY: totalIssues === 0 ? 'All commands, docs, and npm scripts are in sync.' : `${totalIssues} drift issue(s) found.`,
  });

  const outPath = path.join(outputFolders.audits, `audit_commands_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Command audit written to: ${outPath}`);
  console.log(`Verdict: ${verdict} (${totalIssues} issues)`);
  appendLog(`audit-commands completed: ${reqId} verdict=${verdict} issues=${totalIssues}`);
  announceCompletion(`${MODULE_NAME} command audit complete. ${verdict}.`);
}

function cmdAuditPointers(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} auditing pointers`);
  ensureDirs();

  const pointer = getNextUpgradePointer();
  const naExists = fs.existsSync(path.join(REPO_ROOT, 'NEXT_ACTIONS.md'));
  let pointerStatus = 'UNKNOWN';
  let detail = '';
  let verdict = 'CLEAN';

  if (!pointer) {
    pointerStatus = 'NOT_FOUND';
    detail = 'No "Next Upgrade" pointer found in SYSTEM_STATUS.md.';
    verdict = 'DRIFTED';
  } else if (!naExists) {
    pointerStatus = 'UNVERIFIABLE';
    detail = 'NEXT_ACTIONS.md does not exist. Cannot verify pointer.';
    verdict = 'DRIFTED';
  } else if (isPointerCompleted(pointer)) {
    pointerStatus = 'STALE';
    detail = `The pointer "${pointer}" references a task already marked [x] completed in NEXT_ACTIONS.md. It should be updated to the next incomplete phase.`;
    verdict = 'DRIFTED';
  } else {
    pointerStatus = 'CURRENT';
    detail = `The pointer "${pointer}" references a task that is still incomplete in NEXT_ACTIONS.md.`;
  }

  const report = fillTemplate('audit-pointers-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    CURRENT_POINTER: pointer || '_empty_',
    POINTER_FOUND: pointer ? 'Yes' : 'No',
    NEXT_ACTIONS_EXISTS: naExists ? 'Yes' : 'No',
    POINTER_STATUS: pointerStatus,
    POINTER_DETAIL: detail,
    VERDICT: verdict,
    VERDICT_DETAIL: verdict === 'CLEAN' ? 'Pointer is current and references an incomplete task.' : `Pointer is ${pointerStatus.toLowerCase()}. Update SYSTEM_STATUS.md.`,
  });

  const outPath = path.join(outputFolders.audits, `audit_pointers_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Pointer audit written to: ${outPath}`);
  console.log(`Verdict: ${verdict} (pointer: ${pointerStatus})`);
  appendLog(`audit-pointers completed: ${reqId} verdict=${verdict} status=${pointerStatus}`);
  announceCompletion(`${MODULE_NAME} pointer audit complete. ${verdict}.`);
}

function cmdAuditNarration(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} auditing narration sources`);
  ensureDirs();

  const configSources = extractNarratorConfigSources();
  const docSources = extractNarratorDocSources();

  const missingFromDoc = configSources.filter(s => !docSources.some(d => d.includes(s) || s.includes(d)));
  const missingFromConfig = docSources.filter(d => !configSources.some(s => s.includes(d) || d.includes(s)));

  const meshPath = path.join(REPO_ROOT, 'MESH_TELEMETRY.md');
  const meshExists = fs.existsSync(meshPath);
  const meshStat = meshExists ? fs.statSync(meshPath) : null;

  const totalIssues = missingFromDoc.length + missingFromConfig.length;
  const verdict = totalIssues === 0 ? 'CLEAN' : 'DRIFTED';

  const report = fillTemplate('audit-narration-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    CONFIG_SOURCE_COUNT: String(configSources.length),
    DOC_SOURCE_COUNT: String(docSources.length),
    MISSING_FROM_NARRATOR_DOC: missingFromDoc.length ? missingFromDoc.map(s => `- \`${s}\``).join('\n') : '_None_',
    MISSING_FROM_CONFIG: missingFromConfig.length ? missingFromConfig.map(s => `- \`${s}\``).join('\n') : '_None_',
    MESH_TELEMETRY_EXISTS: meshExists ? 'Yes' : 'No',
    MESH_TELEMETRY_UPDATED: meshStat ? meshStat.mtime.toISOString().split('T')[0] : 'N/A',
    VERDICT: verdict,
    VERDICT_DETAIL: totalIssues === 0 ? 'Narrator sources are in sync across config and documentation.' : `${totalIssues} narration source drift issue(s) found.`,
  });

  const outPath = path.join(outputFolders.audits, `audit_narration_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Narration audit written to: ${outPath}`);
  console.log(`Verdict: ${verdict} (${totalIssues} issues)`);
  appendLog(`audit-narration completed: ${reqId} verdict=${verdict} issues=${totalIssues}`);
  announceCompletion(`${MODULE_NAME} narration audit complete. ${verdict}.`);
}

function cmdDriftReport(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} generating comprehensive drift report`);
  ensureDirs();

  const registryNames = extractCommandNamesFromRegistry();
  const docNames = extractCommandNamesFromDoc();
  const npmScripts = extractNpmScriptNames();
  const cmdMissingDocs = registryNames.filter(n => !docNames.includes(n));
  const cmdMissingRegistry = docNames.filter(n => !registryNames.includes(n));
  const cmdMissingNpm = registryNames.filter(n => !npmScripts.includes(n));
  const cmdIssues = cmdMissingDocs.length + cmdMissingRegistry.length + cmdMissingNpm.length;

  const pointer = getNextUpgradePointer();
  const pointerStale = pointer ? isPointerCompleted(pointer) : false;
  const pointerIssues = !pointer || pointerStale ? 1 : 0;

  const configSources = extractNarratorConfigSources();
  const docSources = extractNarratorDocSources();
  const narMissingDoc = configSources.filter(s => !docSources.some(d => d.includes(s) || s.includes(d)));
  const narMissingCfg = docSources.filter(d => !configSources.some(s => s.includes(d) || d.includes(s)));
  const narIssues = narMissingDoc.length + narMissingCfg.length;

  let indexIssues = 0;
  for (const idx of systemIndexes) {
    if (!fs.existsSync(path.join(REPO_ROOT, idx.path))) indexIssues++;
  }

  const totalIssues = cmdIssues + pointerIssues + narIssues + indexIssues;
  const verdict = totalIssues === 0 ? 'CLEAN' : 'DRIFTED';

  const driftItems: string[] = [];
  if (indexIssues > 0) driftItems.push(`- **Missing system indexes:** ${indexIssues} index file(s) not found`);
  for (const n of cmdMissingDocs) driftItems.push(`- **Command \`${n}\`:** In registry but missing from COMMANDS.md`);
  for (const n of cmdMissingRegistry) driftItems.push(`- **Command \`${n}\`:** In COMMANDS.md but missing from registry`);
  for (const n of cmdMissingNpm) driftItems.push(`- **Command \`${n}\`:** In registry but missing npm script`);
  if (pointerStale) driftItems.push(`- **Stale pointer:** "${pointer}" is already completed in NEXT_ACTIONS.md`);
  if (!pointer) driftItems.push(`- **Missing pointer:** No "Next Upgrade" pointer in SYSTEM_STATUS.md`);
  for (const s of narMissingDoc) driftItems.push(`- **Narrator source \`${s}\`:** In config but missing from NARRATOR.md`);
  for (const s of narMissingCfg) driftItems.push(`- **Narrator source \`${s}\`:** In NARRATOR.md but missing from config`);

  const report = fillTemplate('drift-report-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: verdict,
    VERDICT_SUMMARY: totalIssues === 0 ? 'All system indexes, commands, pointers, and narrator sources are in sync.' : `${totalIssues} drift issue(s) detected across system indexes.`,
    INDEX_SCAN_RESULT: indexIssues === 0 ? 'CLEAN' : 'DRIFTED',
    INDEX_SCAN_ISSUES: String(indexIssues),
    COMMAND_AUDIT_RESULT: cmdIssues === 0 ? 'CLEAN' : 'DRIFTED',
    COMMAND_AUDIT_ISSUES: String(cmdIssues),
    POINTER_AUDIT_RESULT: pointerIssues === 0 ? 'CLEAN' : 'DRIFTED',
    POINTER_AUDIT_ISSUES: String(pointerIssues),
    NARRATION_AUDIT_RESULT: narIssues === 0 ? 'CLEAN' : 'DRIFTED',
    NARRATION_AUDIT_ISSUES: String(narIssues),
    DRIFT_ITEMS: driftItems.length ? driftItems.join('\n') : '_No drift detected._',
    TOTAL_AUDITS: '4',
    TOTAL_ISSUES: String(totalIssues),
    CRITICAL_ISSUES: String(pointerIssues + indexIssues),
    INDEXES_CHECKED: String(systemIndexes.length),
  });

  const outPath = path.join(outputFolders.reports, `drift_report_${dateStr()}.md`);
  fs.writeFileSync(outPath, report);
  console.log(`Drift report written to: ${outPath}`);
  console.log(`\nVerdict: ${verdict} (${totalIssues} total issues)`);
  appendLog(`drift-report completed: ${reqId} verdict=${verdict} issues=${totalIssues}`);
  announceCompletion(`${MODULE_NAME} drift report complete. ${verdict}. ${totalIssues} issues.`);
}

function cmdObsidianExport(): void {
  const reqId = genId();
  announceIntent(`${MODULE_NAME} staging Obsidian export`);
  ensureDirs();

  const reportDir = outputFolders.reports;
  const files = fs.existsSync(reportDir) ? fs.readdirSync(reportDir).filter(f => f.startsWith('drift_report_')) : [];
  const latest = files.sort().pop();

  let summary = 'No drift report found. Run `drift-report` first.';
  let findings = '_No report available._';
  let actions = '- [ ] Run drift-report to generate findings';

  if (latest) {
    const content = fs.readFileSync(path.join(reportDir, latest), 'utf8');
    const verdictMatch = content.match(/\*\*(CLEAN|DRIFTED)\*\*/);
    summary = verdictMatch ? `Latest report verdict: ${verdictMatch[1]}` : 'Report parsed but no verdict found.';
    const itemsMatch = content.match(/## Drift Items\n\n([\s\S]*?)(?=\n## )/);
    findings = itemsMatch ? itemsMatch[1].trim() : '_None extracted._';
    actions = verdictMatch?.[1] === 'DRIFTED'
      ? '- [ ] Review drift items above\n- [ ] Update stale pointers in SYSTEM_STATUS.md\n- [ ] Add missing command documentation\n- [ ] Sync narrator source lists'
      : '- [x] All indexes are in sync\n- [ ] Schedule next audit';
  }

  const report = fillTemplate('obsidian-export-template.md', {
    REPORT_ID: reqId,
    DATE: dateStr(),
    TIMESTAMP: ts(),
    VERDICT: summary,
    EXPORT_SUMMARY: summary,
    KEY_FINDINGS: findings,
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
  case 'scan-indexes': cmdScanIndexes(); break;
  case 'audit-commands': cmdAuditCommands(); break;
  case 'audit-pointers': cmdAuditPointers(); break;
  case 'audit-narration': cmdAuditNarration(); break;
  case 'drift-report': cmdDriftReport(); break;
  case 'obsidian-export': cmdObsidianExport(); break;
  case 'help': console.log('Run: npm run doc-drift-help'); break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Available: status, scan-indexes, audit-commands, audit-pointers, audit-narration, drift-report, obsidian-export');
    process.exit(1);
}
