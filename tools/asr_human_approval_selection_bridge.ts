import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_ASR,
  ALLOW_MODEL_DOWNLOADS,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_MANUAL_SELECTION,
  outputFolders,
  asrSources,
  supportedModelFamilies,
  evaluationCriteria,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/asr-human-approval-selection-packet.js';

export interface AsrHumanApprovalSelectionBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    automatedAsr: boolean;
    modelDownloads: boolean;
    externalApi: boolean;
    humanApproval: boolean;
    manualSelection: boolean;
  };
  outputCounts: {
    selectionPackets: number;
    candidateReviews: number;
    modelReviews: number;
    approvalRecords: number;
    logs: number;
  };
  asrSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  supportedModelFamilies: string[];
  evaluationCriteria: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getAsrHumanApprovalSelectionBridgeStatus(): AsrHumanApprovalSelectionBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(asrSources)) {
    const exists = fs.existsSync(sourcePath);
    sourceStatus[source] = {
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
      automatedAsr: ALLOW_AUTOMATED_ASR,
      modelDownloads: ALLOW_MODEL_DOWNLOADS,
      externalApi: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      manualSelection: REQUIRE_MANUAL_SELECTION
    },
    outputCounts: {
      selectionPackets: countFiles(outputFolders.selectionPackets),
      candidateReviews: countFiles(outputFolders.candidateReviews),
      modelReviews: countFiles(outputFolders.modelReviews),
      approvalRecords: countFiles(outputFolders.approvalRecords),
      logs: countFiles(outputFolders.logs)
    },
    asrSourceStatus: sourceStatus,
    supportedModelFamilies,
    evaluationCriteria
  };
}

export function generateBridgeReport(): string {
  const status = getAsrHumanApprovalSelectionBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.asrSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# ASR Human Approval Selection Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Automated ASR | ${status.safetyFlags.automatedAsr} |
| Model Downloads | ${status.safetyFlags.modelDownloads} |
| External API | ${status.safetyFlags.externalApi} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Manual Selection | ${status.safetyFlags.manualSelection} |

## Output Inventory

| Output Type | Count |
|---|---|
| Selection Packets | ${status.outputCounts.selectionPackets} |
| Candidate Reviews | ${status.outputCounts.candidateReviews} |
| Model Reviews | ${status.outputCounts.modelReviews} |
| Approval Records | ${status.outputCounts.approvalRecords} |
| Logs | ${status.outputCounts.logs} |

## ASR Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'asr_human_approval_selection_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
