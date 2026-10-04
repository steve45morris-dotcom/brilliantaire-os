import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_REMEDIATION,
  ALLOW_AUTO_FIX,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  outputFolders,
  diagnosticModules,
  diagnosticCategories,
  healthCheckTargets,
  outputDirectoriesToScan,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/system-diagnostics-runner.js';

export interface SystemDiagnosticsBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    liveRemediation: boolean;
    autoFix: boolean;
    externalApiCalls: boolean;
    humanApproval: boolean;
  };
  outputCounts: Record<string, number>;
  healthChecks: { name: string; status: string }[];
  diagnosticModuleCount: number;
  diagnosticCategoryCount: number;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getSystemDiagnosticsBridgeStatus(): SystemDiagnosticsBridgeStatus {
  const outputCounts: Record<string, number> = {};
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    outputCounts[name] = countFiles(dir);
  }

  const healthChecks = healthCheckTargets.map(t => ({
    name: t.name,
    status: fs.existsSync(path.join(REPO_ROOT, t.path)) ? 'OK' : 'MISSING',
  }));

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      liveRemediation: ALLOW_LIVE_REMEDIATION,
      autoFix: ALLOW_AUTO_FIX,
      externalApiCalls: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
    },
    outputCounts,
    healthChecks,
    diagnosticModuleCount: diagnosticModules.length,
    diagnosticCategoryCount: diagnosticCategories.length,
  };
}

export function generateBridgeReport(): string {
  const status = getSystemDiagnosticsBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  const healthTable = status.healthChecks
    .map(h => `| ${h.name} | ${h.status} |`)
    .join('\n');

  const outputTable = Object.entries(status.outputCounts)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  return `# System Diagnostics Runner Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Live Remediation | ${status.safetyFlags.liveRemediation} |
| Auto Fix | ${status.safetyFlags.autoFix} |
| External API Calls | ${status.safetyFlags.externalApiCalls} |
| Human Approval | ${status.safetyFlags.humanApproval} |

## Health Checks

| Target | Status |
|---|---|
${healthTable}

## Output Inventory

| Category | File Count |
|---|---|
${outputTable}

## Summary

- Diagnostic Modules: ${status.diagnosticModuleCount}
- Diagnostic Categories: ${status.diagnosticCategoryCount}
- Health Checks: ${status.healthChecks.length} (${status.healthChecks.filter(h => h.status === 'OK').length} passing)`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'system_diagnostics_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
