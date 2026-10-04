import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_STRIPE_API,
  ALLOW_PAYMENT_PROCESSING,
  ALLOW_WEBHOOK_FORWARDING,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_SIGNATURE_VERIFICATION,
  outputFolders,
  mockSources,
  supportedWebhookEventTypes,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  REPO_ROOT
} from '../config/stripe-webhook-verification.js';

export interface StripeWebhookVerificationBridgeStatus {
  projectName: string;
  toolType: string;
  bridgeMode: string;
  integrationTarget: string;
  safetyFlags: {
    liveStripeApi: boolean;
    paymentProcessing: boolean;
    webhookForwarding: boolean;
    humanApproval: boolean;
    signatureVerification: boolean;
  };
  outputCounts: {
    signatureAudits: number;
    mockEventLogs: number;
    transitionPlans: number;
    verificationReports: number;
    logs: number;
  };
  mockSourceStatus: Record<string, { exists: boolean; fileCount: number }>;
  supportedWebhookEventTypes: string[];
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

export function getStripeWebhookVerificationBridgeStatus(): StripeWebhookVerificationBridgeStatus {
  const sourceStatus: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(mockSources)) {
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
      liveStripeApi: ALLOW_LIVE_STRIPE_API,
      paymentProcessing: ALLOW_PAYMENT_PROCESSING,
      webhookForwarding: ALLOW_WEBHOOK_FORWARDING,
      humanApproval: REQUIRE_HUMAN_APPROVAL,
      signatureVerification: REQUIRE_SIGNATURE_VERIFICATION
    },
    outputCounts: {
      signatureAudits: countFiles(outputFolders.signatureAudits),
      mockEventLogs: countFiles(outputFolders.mockEventLogs),
      transitionPlans: countFiles(outputFolders.transitionPlans),
      verificationReports: countFiles(outputFolders.verificationReports),
      logs: countFiles(outputFolders.logs)
    },
    mockSourceStatus: sourceStatus,
    supportedWebhookEventTypes
  };
}

export function generateBridgeReport(): string {
  const status = getStripeWebhookVerificationBridgeStatus();
  const dateStr = new Date().toISOString().split('T')[0];

  let sourceTable = '';
  for (const [source, info] of Object.entries(status.mockSourceStatus)) {
    sourceTable += `| ${source} | ${info.exists} | ${info.fileCount} |\n`;
  }

  return `# Stripe Webhook Verification Bridge Report

- **Date:** ${dateStr}
- **Project:** ${status.projectName}
- **Tool Type:** ${status.toolType}
- **Bridge Mode:** ${status.bridgeMode}
- **Integration Target:** ${status.integrationTarget}

## Safety Flags

| Flag | Status |
|---|---|
| Live Stripe API | ${status.safetyFlags.liveStripeApi} |
| Payment Processing | ${status.safetyFlags.paymentProcessing} |
| Webhook Forwarding | ${status.safetyFlags.webhookForwarding} |
| Human Approval | ${status.safetyFlags.humanApproval} |
| Signature Verification | ${status.safetyFlags.signatureVerification} |

## Output Inventory

| Output Type | Count |
|---|---|
| Signature Audits | ${status.outputCounts.signatureAudits} |
| Mock Event Logs | ${status.outputCounts.mockEventLogs} |
| Transition Plans | ${status.outputCounts.transitionPlans} |
| Verification Reports | ${status.outputCounts.verificationReports} |
| Logs | ${status.outputCounts.logs} |

## Mock Source Status

| Source | Exists | File Count |
|---|---|---|
${sourceTable}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = generateBridgeReport();
  const reportPath = path.join(outputFolders.root, 'stripe_webhook_verification_bridge_report.md');
  if (!fs.existsSync(outputFolders.root)) {
    fs.mkdirSync(outputFolders.root, { recursive: true });
  }
  fs.writeFileSync(reportPath, report);
  console.log(`Bridge report written to: ${reportPath}`);
}
