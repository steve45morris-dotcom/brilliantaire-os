import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_STRIPE_API,
  ALLOW_PAYMENT_PROCESSING,
  ALLOW_WEBHOOK_FORWARDING,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_SIGNATURE_VERIFICATION,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  mockSources,
  supportedWebhookEventTypes,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/stripe-webhook-verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `stripe_webhook_verification_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `SWV-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[]; isFile: boolean } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [], isFile: false };
  }
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    return { exists: true, fileCount: 1, files: [path.basename(sourcePath)], isFile: true };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files, isFile: false };
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function readTemplate(filename: string): string {
  const filePath = path.join(TEMPLATE_ROOT, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARNING] Template file not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function ensureOutputDirs() {
  for (const [, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
}

function scanFileForStripePatterns(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const patterns: string[] = [];
  if (/stripe/i.test(content)) patterns.push('stripe-reference');
  if (/stripe_id/i.test(content)) patterns.push('stripe_id-generation');
  if (/webhook/i.test(content)) patterns.push('webhook-handling');
  if (/checkout\.session/i.test(content)) patterns.push('checkout.session');
  if (/payment_intent/i.test(content)) patterns.push('payment_intent');
  if (/invoice\./i.test(content)) patterns.push('invoice-event');
  if (/customer\.subscription/i.test(content)) patterns.push('customer.subscription');
  if (/signature/i.test(content)) patterns.push('signature-reference');
  if (/hmac/i.test(content)) patterns.push('hmac-reference');
  if (/whsec_/i.test(content)) patterns.push('signing-secret-reference');
  return patterns;
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Live Stripe API:       ${ALLOW_LIVE_STRIPE_API}`);
  console.log(`  Payment Processing:    ${ALLOW_PAYMENT_PROCESSING}`);
  console.log(`  Webhook Forwarding:    ${ALLOW_WEBHOOK_FORWARDING}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Signature Verify:      ${REQUIRE_SIGNATURE_VERIFICATION}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Signature Audits', dir: outputFolders.signatureAudits },
    { name: 'Mock Event Logs', dir: outputFolders.mockEventLogs },
    { name: 'Transition Plans', dir: outputFolders.transitionPlans },
    { name: 'Verification Reports', dir: outputFolders.verificationReports },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  Mock Source Paths:');
  for (const [source, sourcePath] of Object.entries(mockSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists
      ? (scan.isFile ? `found (file)` : `${scan.fileCount} files`)
      : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Supported Webhook Event Types:');
  for (const eventType of supportedWebhookEventTypes) {
    console.log(`     - ${eventType}`);
  }

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Audit Signatures Command
async function handleAuditSignatures() {
  await announceIntent('Scanning mock webhook events and compiling signature verification readiness report');
  console.log('Scanning mock sources for signature verification readiness...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const auditId = generateRequestId();

  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[]; isFile: boolean; patterns: string[] }> = {};
  for (const [source, sourcePath] of Object.entries(mockSources)) {
    const scan = scanSource(sourcePath);
    let patterns: string[] = [];
    if (scan.exists && scan.isFile) {
      patterns = scanFileForStripePatterns(sourcePath);
    } else if (scan.exists && !scan.isFile) {
      for (const file of scan.files) {
        const fp = path.join(sourcePath, file);
        patterns.push(...scanFileForStripePatterns(fp));
      }
      patterns = [...new Set(patterns)];
    }
    sourceResults[source] = { ...scan, patterns };
  }

  const auditLines: string[] = [
    '| Source | Status | Stripe Patterns Found |',
    '|---|---|---|',
  ];

  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? 'Found' : 'Missing';
    const patterns = result.patterns.length > 0 ? result.patterns.join(', ') : 'none';
    auditLines.push(`| ${source} | ${status} | ${patterns} |`);
  }

  // Readiness checks
  const readinessLines: string[] = [];
  const allPatterns = Object.values(sourceResults).flatMap(r => r.patterns);
  const hasStripeRef = allPatterns.includes('stripe-reference');
  const hasWebhook = allPatterns.includes('webhook-handling');
  const hasSignature = allPatterns.includes('signature-reference');
  const hasHmac = allPatterns.includes('hmac-reference');

  readinessLines.push(`- [${hasStripeRef ? 'x' : ' '}] Stripe references found in mock sources`);
  readinessLines.push(`- [${hasWebhook ? 'x' : ' '}] Webhook handling logic detected`);
  readinessLines.push(`- [${hasSignature ? 'x' : ' '}] Signature verification references found`);
  readinessLines.push(`- [${hasHmac ? 'x' : ' '}] HMAC signature computation detected`);
  readinessLines.push(`- [ ] Live Stripe signing secret configured (whsec_*)`);
  readinessLines.push(`- [ ] Stripe CLI installed for local testing`);
  readinessLines.push(`- [ ] Webhook endpoint URL registered in Stripe Dashboard`);

  const template = readTemplate('signature-audit-template.md');
  if (!template) {
    console.error('Error: Signature audit template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    AUDIT_ID: auditId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    AUDIT_TABLE: auditLines.join('\n'),
    READINESS_CHECKLIST: readinessLines.join('\n'),
    TOTAL_PATTERNS: String(allPatterns.length),
  });

  const safePath = getSafeWritePath(
    outputFolders.signatureAudits,
    `signature_audit_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Signature audit ${auditId}: ${allPatterns.length} patterns found across ${Object.keys(sourceResults).length} sources -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('AUDIT_SIGNATURES', msg);
  await announceCompletion(`Stripe webhook signature audit compiled: ${auditId}`, '10');
}

// 3. Mock Event Log Command
async function handleMockEventLog() {
  await announceIntent('Generating structured log of all mock Stripe events found in sentinel-os');
  console.log('Scanning sentinel-os for mock Stripe events...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const logId = generateRequestId();

  const eventEntries: { source: string; file: string; eventTypes: string[] }[] = [];

  for (const [source, sourcePath] of Object.entries(mockSources)) {
    const scan = scanSource(sourcePath);
    if (!scan.exists) continue;

    if (scan.isFile) {
      const patterns = scanFileForStripePatterns(sourcePath);
      const matchedTypes = supportedWebhookEventTypes.filter(et => {
        const prefix = et.split('.')[0];
        return patterns.some(p => p.toLowerCase().includes(prefix));
      });
      if (patterns.length > 0) {
        eventEntries.push({ source, file: path.basename(sourcePath), eventTypes: matchedTypes });
      }
    } else {
      for (const file of scan.files) {
        const fp = path.join(sourcePath, file);
        const patterns = scanFileForStripePatterns(fp);
        const matchedTypes = supportedWebhookEventTypes.filter(et => {
          const prefix = et.split('.')[0];
          return patterns.some(p => p.toLowerCase().includes(prefix));
        });
        if (patterns.length > 0) {
          eventEntries.push({ source, file, eventTypes: matchedTypes });
        }
      }
    }
  }

  const eventTableLines: string[] = [
    '| Source | File | Detected Event Types |',
    '|---|---|---|',
  ];

  for (const entry of eventEntries) {
    const types = entry.eventTypes.length > 0 ? entry.eventTypes.join(', ') : 'general stripe reference';
    eventTableLines.push(`| ${entry.source} | ${entry.file} | ${types} |`);
  }

  const coverageLines: string[] = [];
  for (const eventType of supportedWebhookEventTypes) {
    const found = eventEntries.some(e => e.eventTypes.includes(eventType));
    coverageLines.push(`- [${found ? 'x' : ' '}] ${eventType}`);
  }

  const template = readTemplate('mock-event-log-template.md');
  if (!template) {
    console.error('Error: Mock event log template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    LOG_ID: logId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    EVENT_TABLE: eventTableLines.join('\n'),
    TOTAL_ENTRIES: String(eventEntries.length),
    EVENT_TYPE_COVERAGE: coverageLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.mockEventLogs,
    `mock_event_log_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Mock event log ${logId}: ${eventEntries.length} entries across sentinel-os sources -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('MOCK_EVENT_LOG', msg);
  await announceCompletion(`Mock Stripe event log compiled: ${logId}`, '10');
}

// 4. Transition Plan Command
async function handleTransitionPlan() {
  await announceIntent('Compiling step-by-step transition plan from mock to live Stripe webhook verification');
  console.log('Compiling transition plan...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const planId = generateRequestId();

  // Scan current mock state
  const sourceStatus: string[] = [];
  for (const [source, sourcePath] of Object.entries(mockSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists ? `Found (${scan.isFile ? 'file' : scan.fileCount + ' files'})` : 'Not found';
    sourceStatus.push(`- **${source}:** ${status}`);
  }

  const prerequisiteLines: string[] = [
    '- [ ] Stripe account created and verified',
    '- [ ] Stripe API keys generated (test mode)',
    '- [ ] Webhook signing secret (whsec_*) obtained from Stripe Dashboard',
    '- [ ] Stripe CLI installed locally for webhook forwarding tests',
    '- [ ] sentinel-os SQL injection vulnerabilities fixed (mesh_layer.ts)',
    '- [ ] Authentication layer implemented for sentinel-os',
    '- [ ] HTTPS endpoint configured for webhook reception',
    '- [ ] Environment variables staged (STRIPE_WEBHOOK_SECRET, STRIPE_API_KEY)',
  ];

  const migrationSteps: string[] = [
    '### Step 1: Environment Setup',
    '- Configure STRIPE_WEBHOOK_SECRET in environment',
    '- Install `stripe` npm package as dependency',
    '- Verify Stripe CLI can forward events to local endpoint',
    '',
    '### Step 2: Signature Verification Implementation',
    '- Add `stripe.webhooks.constructEvent()` to settle route handler',
    '- Replace mock stripe_id generation with real Stripe event IDs',
    '- Add HMAC SHA-256 signature verification before processing',
    '- Add timestamp tolerance check (default: 300 seconds)',
    '',
    '### Step 3: Event Handler Migration',
    '- Map each supported event type to a handler function',
    '- Migrate mock settlement logic to real Stripe event payloads',
    '- Add idempotency key tracking to prevent duplicate processing',
    '',
    '### Step 4: Testing & Validation',
    '- Run Stripe CLI webhook forwarding in test mode',
    '- Verify signature verification rejects tampered payloads',
    '- Test each supported event type end-to-end',
    '- Validate error handling for invalid signatures',
    '',
    '### Step 5: Production Cutover',
    '- Register production webhook endpoint in Stripe Dashboard',
    '- Enable ALLOW_LIVE_STRIPE_API flag',
    '- Monitor webhook delivery success rate',
    '- Set up alerting for signature verification failures',
  ];

  const template = readTemplate('transition-plan-template.md');
  if (!template) {
    console.error('Error: Transition plan template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    PLAN_ID: planId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    SOURCE_STATUS: sourceStatus.join('\n'),
    PREREQUISITES: prerequisiteLines.join('\n'),
    MIGRATION_STEPS: migrationSteps.join('\n'),
    EVENT_TYPES: supportedWebhookEventTypes.map(e => `- ${e}`).join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.transitionPlans,
    `transition_plan_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Transition plan ${planId}: 5-step migration plan compiled -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('TRANSITION_PLAN', msg);
  await announceCompletion(`Stripe webhook transition plan compiled: ${planId}`, '10');
}

// 5. Verification Report Command
async function handleVerificationReport() {
  await announceIntent('Generating verification readiness report checking all prerequisites');
  console.log('Generating verification readiness report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  // Check prerequisites
  const checks: { name: string; status: boolean; detail: string }[] = [];

  // Check mock sources exist
  for (const [source, sourcePath] of Object.entries(mockSources)) {
    const scan = scanSource(sourcePath);
    checks.push({
      name: `Mock source: ${source}`,
      status: scan.exists,
      detail: scan.exists ? `Found (${scan.isFile ? 'file' : scan.fileCount + ' files'})` : 'Not found'
    });
  }

  // Check safety flags
  checks.push({
    name: 'ALLOW_LIVE_STRIPE_API = false',
    status: !ALLOW_LIVE_STRIPE_API,
    detail: ALLOW_LIVE_STRIPE_API ? 'WARNING: Live API enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_PAYMENT_PROCESSING = false',
    status: !ALLOW_PAYMENT_PROCESSING,
    detail: ALLOW_PAYMENT_PROCESSING ? 'WARNING: Payment processing enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'ALLOW_WEBHOOK_FORWARDING = false',
    status: !ALLOW_WEBHOOK_FORWARDING,
    detail: ALLOW_WEBHOOK_FORWARDING ? 'WARNING: Webhook forwarding enabled!' : 'Correctly disabled'
  });
  checks.push({
    name: 'REQUIRE_HUMAN_APPROVAL = true',
    status: REQUIRE_HUMAN_APPROVAL,
    detail: REQUIRE_HUMAN_APPROVAL ? 'Correctly enforced' : 'WARNING: Human approval not required!'
  });
  checks.push({
    name: 'REQUIRE_SIGNATURE_VERIFICATION = true',
    status: REQUIRE_SIGNATURE_VERIFICATION,
    detail: REQUIRE_SIGNATURE_VERIFICATION ? 'Correctly enforced' : 'WARNING: Signature verification not required!'
  });

  // Check for existing audit outputs
  const auditCount = countFiles(outputFolders.signatureAudits);
  checks.push({
    name: 'Signature audits completed',
    status: auditCount > 0,
    detail: auditCount > 0 ? `${auditCount} audit(s) found` : 'No audits found - run audit-signatures first'
  });

  const mockLogCount = countFiles(outputFolders.mockEventLogs);
  checks.push({
    name: 'Mock event logs generated',
    status: mockLogCount > 0,
    detail: mockLogCount > 0 ? `${mockLogCount} log(s) found` : 'No logs found - run mock-event-log first'
  });

  const checkTable: string[] = [
    '| Check | Status | Detail |',
    '|---|---|---|',
  ];

  let passCount = 0;
  for (const check of checks) {
    const statusStr = check.status ? 'PASS' : 'FAIL';
    if (check.status) passCount++;
    checkTable.push(`| ${check.name} | ${statusStr} | ${check.detail} |`);
  }

  const overallStatus = passCount === checks.length ? 'ALL CHECKS PASSED' : `${passCount}/${checks.length} PASSED`;

  const template = readTemplate('verification-report-template.md');
  if (!template) {
    console.error('Error: Verification report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CHECK_TABLE: checkTable.join('\n'),
    PASS_COUNT: String(passCount),
    TOTAL_CHECKS: String(checks.length),
    OVERALL_STATUS: overallStatus,
  });

  const safePath = getSafeWritePath(
    outputFolders.verificationReports,
    `verification_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Verification report ${reportId}: ${overallStatus} -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VERIFICATION_REPORT', msg);
  await announceCompletion(`Stripe webhook verification report compiled: ${reportId}`, '10');
}

// 6. Simulate Verify Command
async function handleSimulateVerify() {
  if (ALLOW_LIVE_STRIPE_API) {
    console.error('Safety gate: ALLOW_LIVE_STRIPE_API is enabled. Simulation uses test secrets only.');
    process.exit(1);
  }

  await announceIntent('Dry-running mock webhook payload through SHA-256 HMAC signature verification');
  console.log('Running simulated signature verification...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const simId = generateRequestId();

  // Generate a test signing secret (NOT a real Stripe secret)
  const testSecret = 'whsec_test_' + crypto.randomBytes(16).toString('hex');

  // Create a mock webhook payload
  const mockPayload = JSON.stringify({
    id: 'evt_test_' + crypto.randomBytes(8).toString('hex'),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_mock',
        payment_status: 'paid',
        amount_total: 0,
        currency: 'usd',
        metadata: { source: 'brilliantaire-os-simulation' }
      }
    }
  }, null, 2);

  // Simulate Stripe signature generation (v1 scheme)
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${mockPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', testSecret)
    .update(signedPayload)
    .digest('hex');

  const stripeSignatureHeader = `t=${timestamp},v1=${expectedSignature}`;

  // Verify the signature (simulated)
  const verifySignedPayload = `${timestamp}.${mockPayload}`;
  const computedSignature = crypto
    .createHmac('sha256', testSecret)
    .update(verifySignedPayload)
    .digest('hex');

  const signatureMatch = computedSignature === expectedSignature;

  // Test with tampered payload
  const tamperedPayload = mockPayload.replace('"paid"', '"unpaid"');
  const tamperedSignedPayload = `${timestamp}.${tamperedPayload}`;
  const tamperedSignature = crypto
    .createHmac('sha256', testSecret)
    .update(tamperedSignedPayload)
    .digest('hex');

  const tamperedMatch = tamperedSignature === expectedSignature;

  // Test with wrong secret
  const wrongSecret = 'whsec_test_wrong_' + crypto.randomBytes(8).toString('hex');
  const wrongSecretSignature = crypto
    .createHmac('sha256', wrongSecret)
    .update(signedPayload)
    .digest('hex');

  const wrongSecretMatch = wrongSecretSignature === expectedSignature;

  // Timestamp tolerance check
  const toleranceSeconds = 300;
  const eventAge = Math.floor(Date.now() / 1000) - timestamp;
  const withinTolerance = eventAge <= toleranceSeconds;

  const resultLines: string[] = [
    '| Test | Expected | Actual | Result |',
    '|---|---|---|---|',
    `| Valid signature | Match | ${signatureMatch ? 'Match' : 'Mismatch'} | ${signatureMatch ? 'PASS' : 'FAIL'} |`,
    `| Tampered payload | Reject | ${tamperedMatch ? 'Match (BAD)' : 'Rejected'} | ${!tamperedMatch ? 'PASS' : 'FAIL'} |`,
    `| Wrong signing secret | Reject | ${wrongSecretMatch ? 'Match (BAD)' : 'Rejected'} | ${!wrongSecretMatch ? 'PASS' : 'FAIL'} |`,
    `| Timestamp tolerance (${toleranceSeconds}s) | Within | ${withinTolerance ? 'Within' : 'Expired'} | ${withinTolerance ? 'PASS' : 'FAIL'} |`,
  ];

  const allPassed = signatureMatch && !tamperedMatch && !wrongSecretMatch && withinTolerance;

  const simulationDetail = [
    `- **Test Signing Secret:** ${testSecret.substring(0, 20)}...`,
    `- **Signature Header:** t=${timestamp},v1=${expectedSignature.substring(0, 20)}...`,
    `- **Payload Event Type:** checkout.session.completed`,
    `- **Timestamp:** ${timestamp} (${new Date(timestamp * 1000).toISOString()})`,
    `- **Tolerance Window:** ${toleranceSeconds} seconds`,
    `- **Event Age:** ${eventAge} seconds`,
    `- **Overall Result:** ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`,
  ];

  const output = [
    `# Stripe Webhook Signature Verification Simulation`,
    ``,
    `- **Simulation ID:** ${simId}`,
    `- **Date:** ${dateStr}`,
    `- **Generated:** ${new Date().toISOString()}`,
    `- **Mode:** DRY RUN (no live API calls)`,
    ``,
    `---`,
    ``,
    `## Simulation Parameters`,
    ``,
    simulationDetail.join('\n'),
    ``,
    `## Test Results`,
    ``,
    resultLines.join('\n'),
    ``,
    `## Mock Payload`,
    ``,
    '```json',
    mockPayload,
    '```',
    ``,
    `## Safety Confirmation`,
    ``,
    `- [x] Test signing secret generated locally (NOT a real Stripe secret)`,
    `- [x] No external API calls made`,
    `- [x] No webhook forwarding attempted`,
    `- [x] No payment processing occurred`,
    `- [x] All verification performed using Node.js crypto module only`,
    ``,
    `---`,
    ``,
    `*This simulation uses locally generated test secrets and mock payloads only.*`,
    `*No connection to Stripe API was made or attempted.*`,
  ].join('\n');

  const safePath = getSafeWritePath(
    outputFolders.signatureAudits,
    `signature_simulation_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, output);

  const msg = `Simulation ${simId}: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} -> ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('SIMULATE_VERIFY', msg);
  await announceCompletion(`Stripe signature verification simulation complete: ${simId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging Stripe webhook verification summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  // Scan mock sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number; files: string[]; isFile: boolean }> = {};
  for (const [source, sourcePath] of Object.entries(mockSources)) {
    sourceResults[source] = scanSource(sourcePath);
  }

  // Compute summary
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const auditCount = countFiles(outputFolders.signatureAudits);
  const mockLogCount = countFiles(outputFolders.mockEventLogs);
  const planCount = countFiles(outputFolders.transitionPlans);
  const reportCount = countFiles(outputFolders.verificationReports);

  const summaryLines: string[] = [
    `- **Mock Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Signature Audits:** ${auditCount}`,
    `- **Mock Event Logs:** ${mockLogCount}`,
    `- **Transition Plans:** ${planCount}`,
    `- **Verification Reports:** ${reportCount}`,
    `- **Supported Event Types:** ${supportedWebhookEventTypes.length}`,
  ];

  // Source states
  const stateLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? 'Found' : 'Missing';
    stateLines.push(`- **${source}:** ${status}`);
  }

  // Output inventory
  let inventoryStr = 'No verification artifacts generated yet.';
  const allOutputs: string[] = [];
  for (const [folderName, folderPath] of Object.entries(outputFolders)) {
    if (folderName === 'root' || folderName === 'logs') continue;
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
      for (const file of files) {
        allOutputs.push(`- \`${folderName}/${file}\``);
      }
    }
  }
  if (allOutputs.length > 0) {
    inventoryStr = allOutputs.join('\n');
  }

  // Next actions
  const nextActionLines: string[] = [
    '- [ ] Run signature audit to assess mock source readiness',
    '- [ ] Generate mock event log to catalog existing Stripe references',
    '- [ ] Review transition plan for mock-to-live migration steps',
    '- [ ] Complete verification report to check all prerequisites',
    '- [ ] Run signature simulation to validate HMAC verification logic',
    '- [ ] Fix sentinel-os SQL injection before enabling live webhooks',
    '- [ ] Implement authentication layer for webhook endpoint',
  ];

  const template = readTemplate('obsidian-export-template.md');
  if (!template) {
    console.error('Error: Obsidian export template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    VERIFICATION_SUMMARY: summaryLines.join('\n'),
    SOURCE_STATES: stateLines.join('\n'),
    OUTPUT_INVENTORY: inventoryStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `stripe_webhook_verification_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('Stripe webhook verification Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_LIVE_STRIPE_API) {
    console.error('Safety gate: ALLOW_LIVE_STRIPE_API is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_PAYMENT_PROCESSING) {
    console.error('Safety gate: ALLOW_PAYMENT_PROCESSING is enabled. This is not permitted.');
    process.exit(1);
  }

  if (ALLOW_WEBHOOK_FORWARDING) {
    console.error('Safety gate: ALLOW_WEBHOOK_FORWARDING is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run stripe-webhook-verification-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'audit-signatures':
      await handleAuditSignatures();
      break;
    case 'mock-event-log':
      await handleMockEventLog();
      break;
    case 'transition-plan':
      await handleTransitionPlan();
      break;
    case 'verification-report':
      await handleVerificationReport();
      break;
    case 'simulate-verify':
      await handleSimulateVerify();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run stripe-webhook-verification-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
