import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_DISTRIBUTION,
  ALLOW_AUTO_SUBMISSION,
  ALLOW_METADATA_PUBLISH,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_QUALITY_GATE_PASS,
  outputFolders,
  upstreamSources,
  releaseTypes,
  distributionPlatforms,
  qualityGateChecks,
  pipelineStages,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/tree-groove-release-pipeline.js';

export interface TreeGrooveReleasePipelineBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    liveDistribution: boolean;
    autoSubmission: boolean;
    metadataPublish: boolean;
    externalApiCalls: boolean;
    humanApproval: boolean;
    qualityGatePass: boolean;
  };
  outputCounts: {
    releasePackages: number;
    qualityGates: number;
    metadataValidation: number;
    submissionStaging: number;
    logs: number;
  };
  upstreamSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  releaseTypeCount: number;
  platformCount: number;
  qualityGateCount: number;
  pipelineStages: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getTreeGrooveReleasePipelineBridgeStatus(): TreeGrooveReleasePipelineBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const exists = fs.existsSync(sourcePath);
    let fileCount = 0;
    if (exists) {
      const stat = fs.statSync(sourcePath);
      if (stat.isFile()) {
        fileCount = 1;
      } else {
        fileCount = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.')).length;
      }
    }
    sourceStatus[source] = { exists, fileCount };
  }

  return {
    projectName: PROJECT_NAME,
    toolType: TOOL_TYPE,
    bridgeMode: BRIDGE_MODE,
    integrationTarget: INTEGRATION_TARGET,
    safetyFlags: {
      liveDistribution: ALLOW_LIVE_DISTRIBUTION,
      autoSubmission: ALLOW_AUTO_SUBMISSION,
      metadataPublish: ALLOW_METADATA_PUBLISH,
      externalApiCalls: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      qualityGatePass: REQUIRE_QUALITY_GATE_PASS
    },
    outputCounts: {
      releasePackages: countFiles(outputFolders.releasePackages),
      qualityGates: countFiles(outputFolders.qualityGates),
      metadataValidation: countFiles(outputFolders.metadataValidation),
      submissionStaging: countFiles(outputFolders.submissionStaging),
      logs: countFiles(outputFolders.logs)
    },
    upstreamSourceStatus: sourceStatus,
    releaseTypeCount: releaseTypes.length,
    platformCount: distributionPlatforms.length,
    qualityGateCount: qualityGateChecks.length,
    pipelineStages
  };
}

export function generateBridgeReport(): string {
  const status = getTreeGrooveReleasePipelineBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.upstreamSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Tree Groove Records Release Pipeline Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Live Distribution | ${status.safetyFlags.liveDistribution} |
| Auto Submission | ${status.safetyFlags.autoSubmission} |
| Metadata Publish | ${status.safetyFlags.metadataPublish} |
| External API Calls | ${status.safetyFlags.externalApiCalls} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Quality Gate Pass | ${status.safetyFlags.qualityGatePass} |

## Output Inventory

| Output Type | Count |
|---|---|
| Release Packages | ${status.outputCounts.releasePackages} |
| Quality Gates | ${status.outputCounts.qualityGates} |
| Metadata Validation | ${status.outputCounts.metadataValidation} |
| Submission Staging | ${status.outputCounts.submissionStaging} |
| Logs | ${status.outputCounts.logs} |

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}
## Pipeline Stages

${status.pipelineStages.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Summary

- Release Types: ${status.releaseTypeCount}
- Distribution Platforms: ${status.platformCount}
- Quality Gate Checks: ${status.qualityGateCount}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'tree_groove_release_pipeline_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
