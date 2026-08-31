import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_DIRECT_HIGGSFIELD_API,
  ALLOW_AUTONOMOUS_RENDER,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_APPROVAL,
  REQUIRE_RENDER_REVIEW,
  outputFolders,
  supportedRenderTypes,
  approvedVisualStyles,
  icyflamzeCoreIntegrationPoints,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/higgsfield-ai.js';

export interface HiggsFieldBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    apiEnabled: boolean;
    autonomousRender: boolean;
    externalApi: boolean;
    manualApproval: boolean;
    renderReview: boolean;
  };
  assetCounts: {
    renderRequests: number;
    sceneDescriptions: number;
    storyboards: number;
    approvedRenders: number;
    narratorSyncPackages: number;
    obsidianExports: number;
  };
  supportedRenderTypes: string[];
  approvedVisualStyles: string[];
  integrationPoints: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

export function getHiggsFieldBridgeStatus(): HiggsFieldBridgeStatus {
  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      apiEnabled: ALLOW_DIRECT_HIGGSFIELD_API,
      autonomousRender: ALLOW_AUTONOMOUS_RENDER,
      externalApi: ALLOW_EXTERNAL_API_CALLS,
      manualApproval: REQUIRE_MANUAL_APPROVAL,
      renderReview: REQUIRE_RENDER_REVIEW
    },
    assetCounts: {
      renderRequests: countFiles(outputFolders.renderRequests),
      sceneDescriptions: countFiles(outputFolders.sceneDescriptions),
      storyboards: countFiles(outputFolders.storyboards),
      approvedRenders: countFiles(outputFolders.approvedRenders),
      narratorSyncPackages: countFiles(outputFolders.narratorSync),
      obsidianExports: countFiles(outputFolders.obsidianExports)
    },
    supportedRenderTypes,
    approvedVisualStyles,
    integrationPoints: icyflamzeCoreIntegrationPoints
  };
}

export function generateBridgeReport(): string {
  const status = getHiggsFieldBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  return `# Higgsfield AI Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| API Enabled | ${status.safetyFlags.apiEnabled} |
| Autonomous Render | ${status.safetyFlags.autonomousRender} |
| External API | ${status.safetyFlags.externalApi} |
| Manual Approval | ${status.safetyFlags.manualApproval} |
| Render Review | ${status.safetyFlags.renderReview} |

## Asset Inventory

| Asset Type | Count |
|---|---|
| Render Requests | ${status.assetCounts.renderRequests} |
| Scene Descriptions | ${status.assetCounts.sceneDescriptions} |
| Storyboards | ${status.assetCounts.storyboards} |
| Approved Renders | ${status.assetCounts.approvedRenders} |
| Narrator Sync Packages | ${status.assetCounts.narratorSyncPackages} |
| Obsidian Exports | ${status.assetCounts.obsidianExports} |
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'higgsfield_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Bridge report written to: ${reportPath}`);
}
