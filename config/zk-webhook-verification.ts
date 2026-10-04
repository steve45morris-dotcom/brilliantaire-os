import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Zero-Knowledge Webhook Transaction Verification';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_VERIFICATION = false;
export const ALLOW_PRODUCTION_PAYLOAD_ACCESS = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_PROOF_REVIEW = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'ZK Webhook Transaction Verification Proofs';
export const TOOL_TYPE = 'ZK Proof Compilation & Verification';
export const INTEGRATION_TARGET = 'Webhook Transaction Integrity Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'zk_webhook_verification');
export const outputFolders = {
  root: OUTPUT_ROOT,
  proofCompilations: path.join(OUTPUT_ROOT, 'proof_compilations'),
  integrityReports: path.join(OUTPUT_ROOT, 'integrity_reports'),
  payloadAudits: path.join(OUTPUT_ROOT, 'payload_audits'),
  verificationChains: path.join(OUTPUT_ROOT, 'verification_chains'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Upstream sources (read-only)
export const upstreamSources = {
  meshLayerZkAudit: path.join(REPO_ROOT, 'sentinel-os', 'lib', 'mesh_layer.ts'),
  zkAuditApi: path.join(REPO_ROOT, 'sentinel-os', 'app', 'api', 'mesh', 'zk-audit'),
  stripeWebhookVerification: path.join(REPO_ROOT, 'outputs', 'stripe_webhook_verification'),
};

// Proof types
export const proofTypes = [
  'payload-hash-chain',
  'transaction-integrity-proof',
  'settlement-receipt-proof',
  'ledger-consistency-proof',
  'webhook-signature-proof',
];

// Hash algorithms
export const hashAlgorithms = {
  primary: 'SHA-256',
  extended: 'SHA-512',
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'zk_webhook_verification');
