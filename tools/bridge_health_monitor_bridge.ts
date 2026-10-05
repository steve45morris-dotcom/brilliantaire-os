import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTO_FIX,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_REVIEW,
  outputFolders,
  bridgeModules,
  healthCategories,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/bridge-health-monitor.js';

export interface BridgeHealthMonitorStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    autoFix: boolean;
    externalApiCalls: boolean;
    directObsidianWrite: boolean;
    humanApproval: boolean;
    manualReview: boolean;
  };
  outputCounts: Record<string, number>;
  bridgeChecks: { name: string; bridgeStatus: string; configStatus: string }[];
  bridgeModuleCount: number;
  healthCategoryCount: number;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getBridgeHealthMonitorStatus(): BridgeHealthMonitorStatus {
  const outputCounts: Record<string, number> = {};
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    outputCounts[name] = countFiles(dir);
  }

  const bridgeChecks = bridgeModules.map(mod => ({
    name: mod.name,
    bridgeStatus: fs.existsSync(path.join(REPO_ROOT, mod.bridge)) ? 'OK' : 'MISSING',
    configStatus: fs.existsSync(path.join(REPO_ROOT, mod.config)) ? 'OK' : 'MISSING',
  }));

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      autoFix: ALLOW_AUTO_FIX,
      externalApiCalls: ALLOW_EXTERNAL_API_CALLS,
      directObsidianWrite: ALLOW_DIRECT_OBSIDIAN_WRITE,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      manualReview: REQUIRE_MANUAL_REVIEW,
    },
    outputCounts,
    bridgeChecks,
    bridgeModuleCount: bridgeModules.length,
    healthCategoryCount: healthCategories.length,
  };
}

export function generateBridgeReport(): string {
  const status = getBridgeHealthMonitorStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  const bridgeTable = status.bridgeChecks
    .map(b => `| ${b.name} | ${b.bridgeStatus} | ${b.configStatus} |`)
    .join('\n');

  const outputTable = Object.entries(status.outputCounts)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  return `# Bridge Health Monitor Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Auto Fix | ${status.safetyFlags.autoFix} |
| External API Calls | ${status.safetyFlags.externalApiCalls} |
| Direct Obsidian Write | ${status.safetyFlags.directObsidianWrite} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Manual Review | ${status.safetyFlags.manualReview} |

## Bridge Checks

| Bridge | Bridge File | Config File |
|---|---|---|
${bridgeTable}

## Output Inventory

| Category | File Count |
|---|---|
${outputTable}

## Summary

- Bridge Modules: ${status.bridgeModuleCount}
- Health Categories: ${status.healthCategoryCount}
- Bridge Checks: ${status.bridgeChecks.length} (${status.bridgeChecks.filter(b => b.bridgeStatus === 'OK').length} bridges present, ${status.bridgeChecks.filter(b => b.configStatus === 'OK').length} configs present)`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'bridge_health_monitor_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
