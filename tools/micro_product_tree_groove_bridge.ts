import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LEDGER_WRITES,
  ALLOW_CATALOG_PUBLISH,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_CATALOG_REVIEW,
  outputFolders,
  upstreamSources,
  releaseTypes,
  distributionPlatforms,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/micro-product-tree-groove-connector.js';

export interface MicroProductTreeGrooveBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    ledgerWrites: boolean;
    catalogPublish: boolean;
    externalApi: boolean;
    humanApproval: boolean;
    catalogReview: boolean;
  };
  outputCounts: {
    catalogMappings: number;
    releaseStaging: number;
    distributionPlans: number;
    connectorReports: number;
    logs: number;
  };
  upstreamSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  releaseTypes: string[];
  distributionPlatforms: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getMicroProductTreeGrooveBridgeStatus(): MicroProductTreeGrooveBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const exists = fs.existsSync(sourcePath);
    if (exists) {
      const stat = fs.statSync(sourcePath);
      if (stat.isFile()) {
        sourceStatus[source] = { exists: true, fileCount: 1 };
      } else {
        sourceStatus[source] = {
          exists: true,
          fileCount: fs.readdirSync(sourcePath).filter(f => !f.startsWith('.')).length
        };
      }
    } else {
      sourceStatus[source] = { exists: false, fileCount: 0 };
    }
  }

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      ledgerWrites: ALLOW_LEDGER_WRITES,
      catalogPublish: ALLOW_CATALOG_PUBLISH,
      externalApi: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      catalogReview: REQUIRE_CATALOG_REVIEW
    },
    outputCounts: {
      catalogMappings: countFiles(outputFolders.catalogMappings),
      releaseStaging: countFiles(outputFolders.releaseStaging),
      distributionPlans: countFiles(outputFolders.distributionPlans),
      connectorReports: countFiles(outputFolders.connectorReports),
      logs: countFiles(outputFolders.logs)
    },
    upstreamSourceStatus: sourceStatus,
    releaseTypes,
    distributionPlatforms
  };
}

export function generateBridgeReport(): string {
  const status = getMicroProductTreeGrooveBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.upstreamSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Micro-Product Tree Groove Records Connector Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Ledger Writes | ${status.safetyFlags.ledgerWrites} |
| Catalog Publish | ${status.safetyFlags.catalogPublish} |
| External API | ${status.safetyFlags.externalApi} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Catalog Review | ${status.safetyFlags.catalogReview} |

## Output Inventory

| Output Type | Count |
|---|---|
| Catalog Mappings | ${status.outputCounts.catalogMappings} |
| Release Staging | ${status.outputCounts.releaseStaging} |
| Distribution Plans | ${status.outputCounts.distributionPlans} |
| Connector Reports | ${status.outputCounts.connectorReports} |
| Logs | ${status.outputCounts.logs} |

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'micro_product_tree_groove_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
