import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_INFERENCE_CALLS,
  ALLOW_AUTONOMOUS_INFERENCE,
  ALLOW_EXTERNAL_MODEL_DOWNLOAD,
  REQUIRE_MANUAL_PROMPT_REVIEW,
  REQUIRE_RESPONSE_AUDIT,
  outputFolders,
  supportedModels,
  approvedUseCases,
  claudeCodeIntegrationPoints,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  SERVER_CONFIG,
  REPO_ROOT
} from '../config/local-inference.js';

export interface LocalInferenceBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  serverConfig: {
    baseUrl: string;
    completionsEndpoint: string;
    model: string;
    requiresCredentials: boolean;
    protocol: string;
  };
  safetyFlags: {
    liveInferenceCalls: boolean;
    autonomousInference: boolean;
    externalModelDownload: boolean;
    manualPromptReview: boolean;
    responseAudit: boolean;
  };
  assetCounts: {
    chatRequests: number;
    responses: number;
    stagedPrompts: number;
    obsidianExports: number;
  };
  supportedModels: string[];
  approvedUseCases: string[];
  integrationPoints: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json')).length;
}

export function getLocalInferenceBridgeStatus(): LocalInferenceBridgeStatus {
  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    serverConfig: { ...SERVER_CONFIG },
    safetyFlags: {
      liveInferenceCalls: ALLOW_LIVE_INFERENCE_CALLS,
      autonomousInference: ALLOW_AUTONOMOUS_INFERENCE,
      externalModelDownload: ALLOW_EXTERNAL_MODEL_DOWNLOAD,
      manualPromptReview: REQUIRE_MANUAL_PROMPT_REVIEW,
      responseAudit: REQUIRE_RESPONSE_AUDIT
    },
    assetCounts: {
      chatRequests: countFiles(outputFolders.chatRequests),
      responses: countFiles(outputFolders.responses),
      stagedPrompts: countFiles(outputFolders.promptStaging),
      obsidianExports: countFiles(outputFolders.obsidianExports)
    },
    supportedModels,
    approvedUseCases,
    integrationPoints: claudeCodeIntegrationPoints
  };
}

export function generateBridgeReport(): string {
  const status = getLocalInferenceBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  return `# Local Inference Server Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Server Configuration

| Parameter | Value |
|---|---|
| Base URL | ${status.serverConfig.baseUrl} |
| Endpoint | ${status.serverConfig.completionsEndpoint} |
| Model | ${status.serverConfig.model} |
| Protocol | ${status.serverConfig.protocol} |
| Credentials | ${status.serverConfig.requiresCredentials ? 'required' : 'none'} |

## Safety Flags

| Flag | Status |
|---|---|
| Live Inference Calls | ${status.safetyFlags.liveInferenceCalls} |
| Autonomous Inference | ${status.safetyFlags.autonomousInference} |
| External Model Download | ${status.safetyFlags.externalModelDownload} |
| Manual Prompt Review | ${status.safetyFlags.manualPromptReview} |
| Response Audit | ${status.safetyFlags.responseAudit} |

## Asset Inventory

| Asset Type | Count |
|---|---|
| Chat Requests | ${status.assetCounts.chatRequests} |
| Responses | ${status.assetCounts.responses} |
| Staged Prompts | ${status.assetCounts.stagedPrompts} |
| Obsidian Exports | ${status.assetCounts.obsidianExports} |
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'local_inference_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Bridge report written to: ${reportPath}`);
}
