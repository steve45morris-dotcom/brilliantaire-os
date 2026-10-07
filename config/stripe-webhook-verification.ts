import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Stripe Webhook Signature Verification Gate';
export const BRIDGE_MODE = "manual-first";
export const ALLOW_LIVE_STRIPE_API = false;
export const ALLOW_PAYMENT_PROCESSING = false;
export const ALLOW_WEBHOOK_FORWARDING = false;
export const REQUIRE_HUMAN_APPROVAL = true;
export const REQUIRE_SIGNATURE_VERIFICATION = true;
export const ALLOW_DIRECT_OBSIDIAN_WRITE = false;

// Project context
export const PROJECT_NAME = 'Stripe Webhook Signature Verification Gate';
export const TOOL_TYPE = 'Webhook Signature Verification Staging';
export const INTEGRATION_TARGET = 'Stripe Webhook Verification Pipeline';

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'stripe_webhook_verification');
export const outputFolders = {
  root: OUTPUT_ROOT,
  signatureAudits: path.join(OUTPUT_ROOT, 'signature_audits'),
  mockEventLogs: path.join(OUTPUT_ROOT, 'mock_event_logs'),
  transitionPlans: path.join(OUTPUT_ROOT, 'transition_plans'),
  verificationReports: path.join(OUTPUT_ROOT, 'verification_reports'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Mock source paths (read-only)
export const mockSources = {
  settleRoute: path.join(REPO_ROOT, 'sentinel-os', 'app', 'api', 'mesh', 'settle'),
  settlementBridge: path.join(REPO_ROOT, 'sentinel-os', 'lib', 'settlement-bridge.ts'),
  meshLayer: path.join(REPO_ROOT, 'sentinel-os', 'lib', 'mesh_layer.ts'),
};

// Supported webhook event types
export const supportedWebhookEventTypes = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.failed',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.deleted',
];

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates', 'stripe_webhook_verification');
