import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_AUTOMATED_FILE_MOVES,
  ALLOW_AUTOMATED_VALIDATION,
  ALLOW_EXTERNAL_ASSET_FETCH,
  REQUIRE_HUMAN_REVIEW,
  REQUIRE_ASSEMBLY_APPROVAL,
  outputFolders,
  inputFolders,
  supportedAssetTypes,
  assetExtensionMap,
  assetCategories,
  categoryExtensions,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/render-intake.js';

export interface RenderIntakeBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    automatedFileMoves: boolean;
    automatedValidation: boolean;
    externalAssetFetch: boolean;
    humanReviewRequired: boolean;
    assemblyApprovalRequired: boolean;
  };
  assetCounts: {
    incoming: number;
    reviewed: number;
  };
  reportCounts: {
    scans: number;
    validations: number;
    continuityChecklists: number;
    readinessReports: number;
    revisionLogs: number;
    obsidianExports: number;
  };
  supportedAssetTypes: string[];
}

function countFiles(dir: string, ext: string = '.md'): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith(ext)).length;
}

function countAssets(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext in assetExtensionMap;
  }).length;
}

export function getRenderIntakeBridgeStatus(): RenderIntakeBridgeStatus {
  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      automatedFileMoves: ALLOW_AUTOMATED_FILE_MOVES,
      automatedValidation: ALLOW_AUTOMATED_VALIDATION,
      externalAssetFetch: ALLOW_EXTERNAL_ASSET_FETCH,
      humanReviewRequired: REQUIRE_HUMAN_REVIEW,
      assemblyApprovalRequired: REQUIRE_ASSEMBLY_APPROVAL
    },
    assetCounts: {
      incoming: countAssets(inputFolders.incoming),
      reviewed: countAssets(inputFolders.reviewed)
    },
    reportCounts: {
      scans: countFiles(outputFolders.scans),
      validations: countFiles(outputFolders.validations),
      continuityChecklists: countFiles(outputFolders.continuityChecklists),
      readinessReports: countFiles(outputFolders.readinessReports),
      revisionLogs: countFiles(outputFolders.revisionLogs),
      obsidianExports: countFiles(outputFolders.obsidianExports)
    },
    supportedAssetTypes
  };
}

export function generateBridgeReport(): string {
  const status = getRenderIntakeBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  return `# Render Intake Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Automated File Moves | ${status.safetyFlags.automatedFileMoves} |
| Automated Validation | ${status.safetyFlags.automatedValidation} |
| External Asset Fetch | ${status.safetyFlags.externalAssetFetch} |
| Human Review Required | ${status.safetyFlags.humanReviewRequired} |
| Assembly Approval Required | ${status.safetyFlags.assemblyApprovalRequired} |

## Asset Inventory

| Location | Count |
|---|---|
| Incoming Assets | ${status.assetCounts.incoming} |
| Reviewed Assets | ${status.assetCounts.reviewed} |

## Report Inventory

| Report Type | Count |
|---|---|
| Scan Reports | ${status.reportCounts.scans} |
| Validation Reports | ${status.reportCounts.validations} |
| Continuity Checklists | ${status.reportCounts.continuityChecklists} |
| Readiness Reports | ${status.reportCounts.readinessReports} |
| Revision Logs | ${status.reportCounts.revisionLogs} |
| Obsidian Exports | ${status.reportCounts.obsidianExports} |
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'render_intake_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
