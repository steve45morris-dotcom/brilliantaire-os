import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_VERIFICATION,
  ALLOW_PRODUCTION_PAYLOAD_ACCESS,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_PROOF_REVIEW,
  outputFolders,
  upstreamSources,
  proofTypes,
  hashAlgorithms,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/zk-webhook-verification.js';

export interface ZkWebhookVerificationBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    liveVerification: boolean;
    productionPayloadAccess: boolean;
    externalApi: boolean;
    humanApproval: boolean;
    proofReview: boolean;
  };
  outputCounts: {
    proofCompilations: number;
    integrityReports: number;
    payloadAudits: number;
    verificationChains: number;
    logs: number;
  };
  upstreamSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  proofTypes: string[];
  hashAlgorithms: { primary: string; extended: string };
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getZkWebhookVerificationBridgeStatus(): ZkWebhookVerificationBridgeStatus {
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
      liveVerification: ALLOW_LIVE_VERIFICATION,
      productionPayloadAccess: ALLOW_PRODUCTION_PAYLOAD_ACCESS,
      externalApi: ALLOW_EXTERNAL_API_CALLS,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      proofReview: REQUIRE_PROOF_REVIEW
    },
    outputCounts: {
      proofCompilations: countFiles(outputFolders.proofCompilations),
      integrityReports: countFiles(outputFolders.integrityReports),
      payloadAudits: countFiles(outputFolders.payloadAudits),
      verificationChains: countFiles(outputFolders.verificationChains),
      logs: countFiles(outputFolders.logs)
    },
    upstreamSourceStatus: sourceStatus,
    proofTypes,
    hashAlgorithms
  };
}

export function generateBridgeReport(): string {
  const status = getZkWebhookVerificationBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.upstreamSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# ZK Webhook Verification Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Live Verification | ${status.safetyFlags.liveVerification} |
| Production Payload Access | ${status.safetyFlags.productionPayloadAccess} |
| External API | ${status.safetyFlags.externalApi} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Proof Review | ${status.safetyFlags.proofReview} |

## Output Inventory

| Output Type | Count |
|---|---|
| Proof Compilations | ${status.outputCounts.proofCompilations} |
| Integrity Reports | ${status.outputCounts.integrityReports} |
| Payload Audits | ${status.outputCounts.payloadAudits} |
| Verification Chains | ${status.outputCounts.verificationChains} |
| Logs | ${status.outputCounts.logs} |

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'zk_webhook_verification_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
