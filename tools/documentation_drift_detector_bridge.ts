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
  systemIndexes,
  crossReferenceTargets,
  driftCategories,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/documentation-drift-detector.js';

export interface DocDriftBridgeStatus {
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
  indexChecks: { name: string; status: string }[];
  systemIndexCount: number;
  crossReferenceCount: number;
  driftCategoryCount: number;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getDocDriftBridgeStatus(): DocDriftBridgeStatus {
  const outputCounts: Record<string, number> = {};
  for (const [name, dir] of Object.entries(outputFolders)) {
    if (name === 'root') continue;
    outputCounts[name] = countFiles(dir);
  }

  const indexChecks = systemIndexes.map(idx => ({
    name: idx.name,
    status: fs.existsSync(path.join(REPO_ROOT, idx.path)) ? 'OK' : 'MISSING',
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
    indexChecks,
    systemIndexCount: systemIndexes.length,
    crossReferenceCount: crossReferenceTargets.length,
    driftCategoryCount: driftCategories.length,
  };
}

export function generateBridgeReport(): string {
  const status = getDocDriftBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  const indexTable = status.indexChecks
    .map(h => `| ${h.name} | ${h.status} |`)
    .join('\n');

  const outputTable = Object.entries(status.outputCounts)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  return `# Documentation Drift Detector Bridge Report

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

## System Index Checks

| Index | Status |
|---|---|
${indexTable}

## Output Inventory

| Category | File Count |
|---|---|
${outputTable}

## Summary

- System Indexes: ${status.systemIndexCount}
- Cross-Reference Targets: ${status.crossReferenceCount}
- Drift Categories: ${status.driftCategoryCount}
- Index Checks: ${status.indexChecks.length} (${status.indexChecks.filter(h => h.status === 'OK').length} passing)`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'documentation_drift_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
