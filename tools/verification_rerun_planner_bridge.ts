import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_EXECUTION,
  ALLOW_SCHEDULED_RUNS,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_COMMAND_EXECUTION,
  outputFolders,
  evidenceSources,
  verificationTaskTypes,
  schedulingModes,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/grinders-keep-verification-rerun-planner.js';

export interface VerificationRerunPlannerBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    automatedExecution: boolean;
    scheduledRuns: boolean;
    externalApi: boolean;
    humanApproval: boolean;
    manualCommandExecution: boolean;
  };
  outputCounts: {
    rerunPlans: number;
    commandSheets: number;
    scheduleRecommendations: number;
    verificationStatus: number;
    logs: number;
  };
  evidenceSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  verificationTaskTypes: string[];
  schedulingModes: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getVerificationRerunPlannerBridgeStatus(): VerificationRerunPlannerBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [phase, sourcePath] of Object.entries(evidenceSources)) {
    const exists = fs.existsSync(sourcePath);
    sourceStatus[phase] = {
      exists,
      fileCount: exists ? fs.readdirSync(sourcePath).filter(f => !f.startsWith('.')).length : 0
    };
  }

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      automatedExecution: ALLOW_AUTOMATED_EXECUTION,
      scheduledRuns: ALLOW_SCHEDULED_RUNS,
      externalApi: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      manualCommandExecution: REQUIRE_MANUAL_COMMAND_EXECUTION
    },
    outputCounts: {
      rerunPlans: countFiles(outputFolders.rerunPlans),
      commandSheets: countFiles(outputFolders.commandSheets),
      scheduleRecommendations: countFiles(outputFolders.scheduleRecommendations),
      verificationStatus: countFiles(outputFolders.verificationStatus),
      logs: countFiles(outputFolders.logs)
    },
    evidenceSourceStatus: sourceStatus,
    verificationTaskTypes,
    schedulingModes
  };
}

export function generateBridgeReport(): string {
  const status = getVerificationRerunPlannerBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [phase, info] of Object.entries(status.evidenceSourceStatus)) {
    sourceTable += `| ${phase} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Verification Rerun Planner Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Automated Execution | ${status.safetyFlags.automatedExecution} |
| Scheduled Runs | ${status.safetyFlags.scheduledRuns} |
| External API | ${status.safetyFlags.externalApi} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Manual Command Execution | ${status.safetyFlags.manualCommandExecution} |

## Output Inventory

| Output Type | Count |
|---|---|
| Rerun Plans | ${status.outputCounts.rerunPlans} |
| Command Sheets | ${status.outputCounts.commandSheets} |
| Schedule Recommendations | ${status.outputCounts.scheduleRecommendations} |
| Verification Status | ${status.outputCounts.verificationStatus} |
| Logs | ${status.outputCounts.logs} |

## Evidence Source Status

| Phase | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'verification_rerun_planner_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
