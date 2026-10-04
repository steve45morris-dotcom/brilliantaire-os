import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_BUILD,
  ALLOW_CODE_GENERATION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_SCRIPT_EXECUTION,
  ALLOW_RAW_COMMAND_EXECUTION,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_REVIEW,
  REQUIRE_SAFETY_REVIEW,
  REQUIRE_APPROVED_PACKET,
  REQUIRE_MANUAL_EXECUTION,
  outputFolders,
  INPUT_FOLDERS,
  supportedCommands,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/manual-implementation-packet.js';

export interface ManualImplementationPacketBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    automatedBuild: boolean;
    codeGeneration: boolean;
    externalApiCalls: boolean;
    scriptExecution: boolean;
    rawCommandExecution: boolean;
    obsidianWrite: boolean;
    humanReviewRequired: boolean;
    safetyReviewRequired: boolean;
    approvedPacketRequired: boolean;
    manualExecutionRequired: boolean;
  };
  assetCounts: {
    buildPrompts: number;
    checklists: number;
    safetyReviews: number;
    handoffs: number;
    obsidianExports: number;
  };
  inputCounts: {
    approvedPackets: number;
    stageGatePrompts: number;
  };
  supportedCommands: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

export function getManualImplementationPacketBridgeStatus(): ManualImplementationPacketBridgeStatus {
  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      automatedBuild: ALLOW_AUTOMATED_BUILD,
      codeGeneration: ALLOW_CODE_GENERATION,
      externalApiCalls: ALLOW_EXTERNAL_API_CALLS,
      scriptExecution: ALLOW_SCRIPT_EXECUTION,
      rawCommandExecution: ALLOW_RAW_COMMAND_EXECUTION,
      obsidianWrite: ALLOW_OBSIDIAN_WRITE,
      humanReviewRequired: REQUIRE_HUMAN_REVIEW,
      safetyReviewRequired: REQUIRE_SAFETY_REVIEW,
      approvedPacketRequired: REQUIRE_APPROVED_PACKET,
      manualExecutionRequired: REQUIRE_MANUAL_EXECUTION
    },
    assetCounts: {
      buildPrompts: countFiles(outputFolders.buildPrompts),
      checklists: countFiles(outputFolders.checklists),
      safetyReviews: countFiles(outputFolders.safetyReviews),
      handoffs: countFiles(outputFolders.handoffs),
      obsidianExports: countFiles(outputFolders.obsidianExports)
    },
    inputCounts: {
      approvedPackets: countFiles(INPUT_FOLDERS.approvedPackets) + countFiles(INPUT_FOLDERS.knowledgeHarvestApprovedPackets),
      stageGatePrompts: countFiles(INPUT_FOLDERS.stageGatePrompts) + countFiles(INPUT_FOLDERS.knowledgeHarvestStageGatePrompts)
    },
    supportedCommands
  };
}

export function generateBridgeReport(): string {
  const status = getManualImplementationPacketBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  return `# Manual Implementation Packet Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Automated Build | ${status.safetyFlags.automatedBuild} |
| Code Generation | ${status.safetyFlags.codeGeneration} |
| External API Calls | ${status.safetyFlags.externalApiCalls} |
| Script Execution | ${status.safetyFlags.scriptExecution} |
| Raw Command Execution | ${status.safetyFlags.rawCommandExecution} |
| Obsidian Write | ${status.safetyFlags.obsidianWrite} |
| Human Review Required | ${status.safetyFlags.humanReviewRequired} |
| Safety Review Required | ${status.safetyFlags.safetyReviewRequired} |
| Approved Packet Required | ${status.safetyFlags.approvedPacketRequired} |
| Manual Execution Required | ${status.safetyFlags.manualExecutionRequired} |

## Output Inventory

| Artifact Type | Count |
|---|---|
| Build Prompts | ${status.assetCounts.buildPrompts} |
| Checklists | ${status.assetCounts.checklists} |
| Safety Reviews | ${status.assetCounts.safetyReviews} |
| Handoffs | ${status.assetCounts.handoffs} |
| Obsidian Exports | ${status.assetCounts.obsidianExports} |

## Input Inventory

| Source Type | Count |
|---|---|
| Approved Packets | ${status.inputCounts.approvedPackets} |
| Stage Gate Prompts | ${status.inputCounts.stageGatePrompts} |

## Supported Commands

${status.supportedCommands.map(c => `- ${c}`).join('\n')}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'mip_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
