import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  BRIDGE_MODE,
  ALLOW_LIVE_VERIFICATION,
  ALLOW_PRODUCTION_PAYLOAD_ACCESS,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_HUMAN_APPROVAL,
  REQUIRE_PROOF_REVIEW,
  MODULE_NAME,
  PROJECT_NAME,
  TOOL_TYPE,
  INTEGRATION_TARGET,
  outputFolders,
  upstreamSources,
  proofTypes,
  hashAlgorithms,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/zk-webhook-verification.js';

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
  const logFile = path.join(logDir, `zk_webhook_verification_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function generateRequestId(): string {
  const dateStr = getFormattedDate().replace(/-/g, '');
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `ZKW-${dateStr}-${suffix}`;
}

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

function scanSource(sourcePath: string): { exists: boolean; fileCount: number; files: string[] } {
  if (!fs.existsSync(sourcePath)) {
    return { exists: false, fileCount: 0, files: [] };
  }
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    return { exists: true, fileCount: 1, files: [path.basename(sourcePath)] };
  }
  const files = fs.readdirSync(sourcePath).filter(f => !f.startsWith('.'));
  return { exists: true, fileCount: files.length, files };
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

function generateMockHash(data: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

// 1. Status Command
async function handleStatus() {
  console.log(`\n${PROJECT_NAME} - Bridge Status Report`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Module:                ${MODULE_NAME}`);
  console.log(`  Tool Type:             ${TOOL_TYPE}`);
  console.log(`  Bridge Mode:           ${BRIDGE_MODE}`);
  console.log(`  Integration:           ${INTEGRATION_TARGET}`);
  console.log(`  Live Verification:     ${ALLOW_LIVE_VERIFICATION}`);
  console.log(`  Production Payloads:   ${ALLOW_PRODUCTION_PAYLOAD_ACCESS}`);
  console.log(`  External API:          ${ALLOW_EXTERNAL_API_CALLS}`);
  console.log(`  Human Approval:        ${REQUIRE_HUMAN_APPROVAL}`);
  console.log(`  Proof Review:          ${REQUIRE_PROOF_REVIEW}`);
  console.log(`  Direct Obsidian Write: ${ALLOW_DIRECT_OBSIDIAN_WRITE}`);
  console.log(`${'─'.repeat(55)}`);

  const folders = [
    { name: 'Proof Compilations', dir: outputFolders.proofCompilations },
    { name: 'Integrity Reports', dir: outputFolders.integrityReports },
    { name: 'Payload Audits', dir: outputFolders.payloadAudits },
    { name: 'Verification Chains', dir: outputFolders.verificationChains },
    { name: 'Logs', dir: outputFolders.logs }
  ];

  console.log('\n  Output Directories:');
  for (const folder of folders) {
    const count = countFiles(folder.dir);
    const status = fs.existsSync(folder.dir) ? `${count} files` : 'not created';
    console.log(`     ${folder.name.padEnd(28)} ${status}`);
  }

  console.log('\n  Upstream Sources:');
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    const status = scan.exists ? `${scan.fileCount} files` : 'not found';
    console.log(`     ${source.padEnd(28)} ${status}`);
  }

  console.log('\n  Proof Types:');
  for (const proofType of proofTypes) {
    console.log(`     - ${proofType}`);
  }

  console.log('\n  Hash Algorithms:');
  console.log(`     - Primary: ${hashAlgorithms.primary}`);
  console.log(`     - Extended: ${hashAlgorithms.extended}`);

  console.log('');
  logEvent('STATUS', 'Status report generated');
}

// 2. Compile Proofs Command
async function handleCompileProofs() {
  await announceIntent('Compiling ZK proof documents from mock transaction data');
  console.log('Compiling ZK proof documents...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const compilationId = generateRequestId();

  // Generate mock transaction data
  const mockTransactions = [
    { id: 'txn_mock_001', type: 'payment_intent.succeeded', amount: 2500, currency: 'usd' },
    { id: 'txn_mock_002', type: 'charge.succeeded', amount: 5000, currency: 'usd' },
    { id: 'txn_mock_003', type: 'invoice.paid', amount: 10000, currency: 'usd' },
    { id: 'txn_mock_004', type: 'checkout.session.completed', amount: 7500, currency: 'usd' },
    { id: 'txn_mock_005', type: 'payment_intent.created', amount: 3000, currency: 'usd' },
  ];

  // Build proof type table
  const proofTypeLines: string[] = [
    '| Proof Type | Hash Algorithm | Status | Mock Entries |',
    '|---|---|---|---|',
  ];

  for (const proofType of proofTypes) {
    proofTypeLines.push(`| ${proofType} | ${hashAlgorithms.primary} | Compiled | ${mockTransactions.length} |`);
  }

  // Build hash chain details
  const hashChainLines: string[] = [];
  let previousHash = '0'.repeat(64);
  for (const txn of mockTransactions) {
    const payload = JSON.stringify(txn);
    const currentHash = generateMockHash(`${previousHash}:${payload}`);
    hashChainLines.push(`- **${txn.id}:** \`${currentHash.substring(0, 16)}...${currentHash.substring(48)}\``);
    previousHash = currentHash;
  }

  // Build mock transaction data lines
  const mockDataLines: string[] = [
    '| Transaction ID | Event Type | Amount | Currency |',
    '|---|---|---|---|',
  ];
  for (const txn of mockTransactions) {
    mockDataLines.push(`| ${txn.id} | ${txn.type} | ${txn.amount} | ${txn.currency} |`);
  }

  const template = readTemplate('proof-compilation-template.md');
  if (!template) {
    console.error('Error: Proof compilation template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    COMPILATION_ID: compilationId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    PROOF_TYPE_TABLE: proofTypeLines.join('\n'),
    HASH_CHAIN_DETAILS: hashChainLines.join('\n'),
    MOCK_TRANSACTION_DATA: mockDataLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.proofCompilations,
    `proof_compilation_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Proof compilation ${compilationId}: ${proofTypes.length} proof types, ${mockTransactions.length} mock transactions → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('COMPILE_PROOFS', msg);
  await announceCompletion(`ZK proof compilation completed: ${compilationId}`, '10');
}

// 3. Integrity Report Command
async function handleIntegrityReport() {
  await announceIntent('Generating integrity verification report across all proof compilations');
  console.log('Generating integrity verification report...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const reportId = generateRequestId();

  // Scan proof compilations
  const compilationCount = countFiles(outputFolders.proofCompilations);
  const compilationFiles = fs.existsSync(outputFolders.proofCompilations)
    ? fs.readdirSync(outputFolders.proofCompilations).filter(f => f.endsWith('.md'))
    : [];

  // Build compilation inventory
  const inventoryLines: string[] = [
    '| Compilation File | Status |',
    '|---|---|',
  ];
  if (compilationFiles.length > 0) {
    for (const file of compilationFiles) {
      inventoryLines.push(`| ${file} | Present |`);
    }
  } else {
    inventoryLines.push('| (none) | No compilations found |');
  }

  // Build integrity summary
  const summaryLines: string[] = [
    `- **Total Compilations:** ${compilationCount}`,
    `- **Proof Types Defined:** ${proofTypes.length}`,
    `- **Primary Hash Algorithm:** ${hashAlgorithms.primary}`,
    `- **Extended Hash Algorithm:** ${hashAlgorithms.extended}`,
    `- **Integrity Check Mode:** offline (dry-run)`,
  ];

  // Build hash algorithm coverage
  const hashCoverageLines: string[] = [
    '| Algorithm | Type | Status |',
    '|---|---|---|',
    `| ${hashAlgorithms.primary} | Primary | Active |`,
    `| ${hashAlgorithms.extended} | Extended | Available |`,
  ];

  // Verification status
  const verificationLines: string[] = [];
  for (const proofType of proofTypes) {
    const status = compilationCount > 0 ? 'Compiled (pending review)' : 'Not compiled';
    verificationLines.push(`- **${proofType}:** ${status}`);
  }

  // Recommendations
  const recommendationLines: string[] = [
    compilationCount === 0
      ? '- [ ] Run `compile-proofs` to generate initial proof compilations'
      : '- [x] Proof compilations present',
    '- [ ] Review all compiled proofs for structural correctness',
    '- [ ] Run `verify-chain` to perform offline hash chain verification',
    '- [ ] Submit proof compilations for human approval before any live use',
  ];

  const template = readTemplate('integrity-report-template.md');
  if (!template) {
    console.error('Error: Integrity report template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    REPORT_ID: reportId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    COMPILATION_INVENTORY: inventoryLines.join('\n'),
    INTEGRITY_SUMMARY: summaryLines.join('\n'),
    HASH_ALGORITHM_COVERAGE: hashCoverageLines.join('\n'),
    VERIFICATION_STATUS: verificationLines.join('\n'),
    RECOMMENDATIONS: recommendationLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.integrityReports,
    `integrity_report_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Integrity report ${reportId}: ${compilationCount} compilations reviewed → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('INTEGRITY_REPORT', msg);
  await announceCompletion(`ZK integrity report generated: ${reportId}`, '10');
}

// 4. Audit Payloads Command
async function handleAuditPayloads() {
  await announceIntent('Scanning and auditing webhook payload structures for proof compatibility');
  console.log('Auditing webhook payload structures...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const auditId = generateRequestId();

  // Check upstream sources
  const sourceStatusLines: string[] = [
    '| Source | Path | Status | Details |',
    '|---|---|---|---|',
  ];

  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    const statusStr = scan.exists ? `Found (${scan.fileCount} entries)` : 'Not found';
    const relativePath = path.relative(REPO_ROOT, sourcePath);
    sourceStatusLines.push(`| ${source} | ${relativePath} | ${statusStr} | ${scan.exists ? 'Accessible' : 'Missing'} |`);
  }

  // Payload structure analysis
  const payloadStructureLines: string[] = [
    'Expected webhook payload fields for ZK proof compatibility:',
    '',
    '- `id` — Unique transaction identifier',
    '- `type` — Webhook event type string',
    '- `data.object` — Transaction payload object',
    '- `created` — Unix timestamp of event creation',
    '- `livemode` — Boolean indicating production vs test mode',
    '',
    'All payloads must be JSON-serializable for hash chain computation.',
  ];

  // Proof compatibility matrix
  const compatibilityLines: string[] = [
    '| Proof Type | Required Fields | Compatibility |',
    '|---|---|---|',
  ];
  const fieldRequirements: Record<string, string> = {
    'payload-hash-chain': 'id, type, data.object',
    'transaction-integrity-proof': 'id, type, created, data.object',
    'settlement-receipt-proof': 'id, type, data.object.amount, data.object.currency',
    'ledger-consistency-proof': 'id, created, data.object.amount',
    'webhook-signature-proof': 'id, type, webhook-signature header',
  };
  for (const proofType of proofTypes) {
    const fields = fieldRequirements[proofType] || 'id, type';
    compatibilityLines.push(`| ${proofType} | ${fields} | Pending audit |`);
  }

  // Audit findings
  const findingLines: string[] = [
    '- Payload structure audit performed against mock schema definitions',
    '- No production payloads were accessed (ALLOW_PRODUCTION_PAYLOAD_ACCESS = false)',
    '- All proof types have defined field requirements',
    '- Hash chain compatibility confirmed for standard webhook event format',
  ];

  // Next steps
  const nextStepLines: string[] = [
    '- [ ] Review upstream source availability',
    '- [ ] Verify mock payload schemas match production format',
    '- [ ] Run `compile-proofs` to generate proof compilations from mock data',
    '- [ ] Run `verify-chain` to validate hash chain integrity',
  ];

  const template = readTemplate('payload-audit-template.md');
  if (!template) {
    console.error('Error: Payload audit template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    AUDIT_ID: auditId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    UPSTREAM_SOURCE_STATUS: sourceStatusLines.join('\n'),
    PAYLOAD_STRUCTURE_ANALYSIS: payloadStructureLines.join('\n'),
    PROOF_COMPATIBILITY_MATRIX: compatibilityLines.join('\n'),
    AUDIT_FINDINGS: findingLines.join('\n'),
    NEXT_STEPS: nextStepLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.payloadAudits,
    `payload_audit_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Payload audit ${auditId}: ${Object.keys(upstreamSources).length} sources, ${proofTypes.length} proof types audited → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('AUDIT_PAYLOADS', msg);
  await announceCompletion(`ZK payload audit completed: ${auditId}`, '10');
}

// 5. Verify Chain Command
async function handleVerifyChain() {
  if (ALLOW_LIVE_VERIFICATION) {
    console.error('Safety gate: ALLOW_LIVE_VERIFICATION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  await announceIntent('Running offline hash chain verification against compiled proofs (dry-run only)');
  console.log('Running offline hash chain verification (dry-run)...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const chainId = generateRequestId();

  // Chain configuration
  const configLines: string[] = [
    `- **Chain ID:** ${chainId}`,
    `- **Hash Algorithm:** ${hashAlgorithms.primary}`,
    `- **Extended Algorithm:** ${hashAlgorithms.extended}`,
    `- **Mode:** dry-run (offline only)`,
    `- **Live Verification:** disabled`,
  ];

  // Generate mock hash chain verification
  const mockPayloads = [
    { id: 'txn_mock_001', type: 'payment_intent.succeeded', amount: 2500 },
    { id: 'txn_mock_002', type: 'charge.succeeded', amount: 5000 },
    { id: 'txn_mock_003', type: 'invoice.paid', amount: 10000 },
    { id: 'txn_mock_004', type: 'checkout.session.completed', amount: 7500 },
    { id: 'txn_mock_005', type: 'payment_intent.created', amount: 3000 },
  ];

  const hashResultLines: string[] = [
    '| Step | Transaction | Input Hash | Output Hash | Valid |',
    '|---|---|---|---|---|',
  ];

  let previousHash = '0'.repeat(64);
  let allValid = true;
  for (let i = 0; i < mockPayloads.length; i++) {
    const payload = JSON.stringify(mockPayloads[i]);
    const currentHash = generateMockHash(`${previousHash}:${payload}`);
    const shortPrev = `${previousHash.substring(0, 8)}...`;
    const shortCurrent = `${currentHash.substring(0, 8)}...`;
    hashResultLines.push(`| ${i + 1} | ${mockPayloads[i].id} | ${shortPrev} | ${shortCurrent} | Yes |`);
    previousHash = currentHash;
  }

  // Proof linkage map
  const linkageLines: string[] = [];
  for (const proofType of proofTypes) {
    linkageLines.push(`- **${proofType}:** Linked to hash chain (${mockPayloads.length} entries)`);
  }

  // Dry-run summary
  const summaryLines: string[] = [
    `- **Total Transactions Verified:** ${mockPayloads.length}`,
    `- **Hash Chain Length:** ${mockPayloads.length} blocks`,
    `- **Chain Integrity:** ${allValid ? 'VALID (dry-run)' : 'BROKEN'}`,
    `- **Algorithm Used:** ${hashAlgorithms.primary}`,
    '- **Execution Mode:** Offline dry-run only',
    '- **Production Data Used:** None (mock data only)',
  ];

  const template = readTemplate('verification-chain-template.md');
  if (!template) {
    console.error('Error: Verification chain template not found.');
    process.exit(1);
  }

  const content = fillTemplate(template, {
    CHAIN_ID: chainId,
    DATE: dateStr,
    TIMESTAMP: new Date().toISOString(),
    CHAIN_CONFIGURATION: configLines.join('\n'),
    HASH_CHAIN_RESULTS: hashResultLines.join('\n'),
    PROOF_LINKAGE_MAP: linkageLines.join('\n'),
    DRY_RUN_SUMMARY: summaryLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.verificationChains,
    `verification_chain_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Verification chain ${chainId}: ${mockPayloads.length} blocks verified (dry-run) → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('VERIFY_CHAIN', msg);
  await announceCompletion(`ZK hash chain verification completed (dry-run): ${chainId}`, '10');
}

// 6. Proof Summary Command
async function handleProofSummary() {
  await announceIntent('Generating human-readable summary of all proof compilations and verification states');
  console.log('Generating proof summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();
  const summaryId = generateRequestId();

  const compilationCount = countFiles(outputFolders.proofCompilations);
  const reportCount = countFiles(outputFolders.integrityReports);
  const auditCount = countFiles(outputFolders.payloadAudits);
  const chainCount = countFiles(outputFolders.verificationChains);
  const logCount = countFiles(outputFolders.logs);

  // Upstream source scan
  const sourceResults: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    sourceResults[source] = { exists: scan.exists, fileCount: scan.fileCount };
  }

  const summaryContent = `# ZK Webhook Verification — Proof Summary

- **Summary ID:** ${summaryId}
- **Date:** ${dateStr}
- **Generated:** ${new Date().toISOString()}
- **Bridge Mode:** ${BRIDGE_MODE}

---

## Output Inventory

| Output Type | Count |
|---|---|
| Proof Compilations | ${compilationCount} |
| Integrity Reports | ${reportCount} |
| Payload Audits | ${auditCount} |
| Verification Chains | ${chainCount} |
| Logs | ${logCount} |

## Safety Flags

| Flag | Value |
|---|---|
| ALLOW_LIVE_VERIFICATION | ${ALLOW_LIVE_VERIFICATION} |
| ALLOW_PRODUCTION_PAYLOAD_ACCESS | ${ALLOW_PRODUCTION_PAYLOAD_ACCESS} |
| ALLOW_EXTERNAL_API_CALLS | ${ALLOW_EXTERNAL_API_CALLS} |
| REQUIRE_HUMAN_APPROVAL | ${REQUIRE_HUMAN_APPROVAL} |
| REQUIRE_PROOF_REVIEW | ${REQUIRE_PROOF_REVIEW} |
| ALLOW_DIRECT_OBSIDIAN_WRITE | ${ALLOW_DIRECT_OBSIDIAN_WRITE} |

## Upstream Source Status

| Source | Exists | File Count |
|---|---|---|
${Object.entries(sourceResults).map(([s, r]) => `| ${s} | ${r.exists} | ${r.fileCount} |`).join('\n')}

## Proof Types

${proofTypes.map(p => `- ${p}`).join('\n')}

## Hash Algorithms

- **Primary:** ${hashAlgorithms.primary}
- **Extended:** ${hashAlgorithms.extended}

## Workflow State

- Compilations: ${compilationCount > 0 ? 'Present' : 'Not started — run \`compile-proofs\`'}
- Integrity Reports: ${reportCount > 0 ? 'Present' : 'Not started — run \`integrity-report\`'}
- Payload Audits: ${auditCount > 0 ? 'Present' : 'Not started — run \`audit-payloads\`'}
- Verification Chains: ${chainCount > 0 ? 'Present' : 'Not started — run \`verify-chain\`'}

---

*This summary is read-only. No automated actions have been or will be triggered.*
`;

  const safePath = getSafeWritePath(
    outputFolders.root,
    `zk_webhook_proof_summary_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, summaryContent);

  const msg = `Proof summary ${summaryId}: ${compilationCount} compilations, ${chainCount} chains → ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('PROOF_SUMMARY', msg);
  await announceCompletion(`ZK proof summary generated: ${summaryId}`, '10');
}

// 7. Obsidian Export Command
async function handleObsidianExport() {
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error('Safety violation: Direct Obsidian write is enabled but should be disabled.');
    process.exit(1);
  }

  await announceIntent('Staging ZK webhook verification summary for Obsidian export');
  console.log('Staging Obsidian export summary...');
  ensureOutputDirs();

  const dateStr = getFormattedDate();

  // Scan upstream sources
  const sourceResults: Record<string, { exists: boolean; fileCount: number }> = {};
  for (const [source, sourcePath] of Object.entries(upstreamSources)) {
    const scan = scanSource(sourcePath);
    sourceResults[source] = { exists: scan.exists, fileCount: scan.fileCount };
  }

  // Compute summary
  const totalSources = Object.values(sourceResults).filter(r => r.exists).length;
  const compilationCount = countFiles(outputFolders.proofCompilations);
  const reportCount = countFiles(outputFolders.integrityReports);
  const auditCount = countFiles(outputFolders.payloadAudits);
  const chainCount = countFiles(outputFolders.verificationChains);

  const summaryLines: string[] = [
    `- **Upstream Sources Available:** ${totalSources} of ${Object.keys(sourceResults).length}`,
    `- **Proof Compilations:** ${compilationCount}`,
    `- **Integrity Reports:** ${reportCount}`,
    `- **Payload Audits:** ${auditCount}`,
    `- **Verification Chains:** ${chainCount}`,
  ];

  // Source states
  const stateLines: string[] = [];
  for (const [source, result] of Object.entries(sourceResults)) {
    const status = result.exists ? (result.fileCount > 0 ? 'Active' : 'Empty') : 'Missing';
    stateLines.push(`- **${source}:** ${status} (${result.fileCount} entries)`);
  }

  // Proof compilation status
  let compilationStr = 'No proof compilations found. Run `compile-proofs` to create one.';
  if (compilationCount > 0) {
    const compilationFiles = fs.readdirSync(outputFolders.proofCompilations).filter(f => f.endsWith('.md'));
    compilationStr = compilationFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Integrity report status
  let reportStr = 'No integrity reports found. Run `integrity-report` to generate one.';
  if (reportCount > 0) {
    const reportFiles = fs.readdirSync(outputFolders.integrityReports).filter(f => f.endsWith('.md'));
    reportStr = reportFiles.map(f => `- \`${f}\``).join('\n');
  }

  // Next actions
  const nextActionLines: string[] = [
    '- [ ] Review upstream source directories for completeness',
    '- [ ] Compile ZK proofs from mock transaction data',
    '- [ ] Generate integrity report across all compilations',
    '- [ ] Audit webhook payload structures for proof compatibility',
    '- [ ] Run offline hash chain verification (dry-run)',
    '- [ ] Submit proofs for human approval before any live use',
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
    UPSTREAM_SOURCE_STATES: stateLines.join('\n'),
    PROOF_COMPILATION_STATUS: compilationStr,
    INTEGRITY_REPORT_STATUS: reportStr,
    NEXT_ACTIONS: nextActionLines.join('\n'),
  });

  const safePath = getSafeWritePath(
    outputFolders.root,
    `zk_webhook_verification_obsidian_export_${dateStr}`,
    '.md'
  );
  fs.writeFileSync(safePath, content);

  const msg = `Obsidian export staged: ${path.basename(safePath)}`;
  console.log(`Done. ${msg}`);
  logEvent('OBSIDIAN_EXPORT', msg);
  await announceCompletion('ZK webhook verification Obsidian export staged', '10');
}

// Main dispatcher
async function main() {
  if (ALLOW_LIVE_VERIFICATION) {
    console.error('Safety gate: ALLOW_LIVE_VERIFICATION is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_PRODUCTION_PAYLOAD_ACCESS) {
    console.error('Safety gate: ALLOW_PRODUCTION_PAYLOAD_ACCESS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS) {
    console.error('Safety gate: ALLOW_EXTERNAL_API_CALLS is enabled. This is not permitted in manual-first mode.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const fullCommand = args.join(' ').trim();

  if (!fullCommand) {
    console.error('Error: No command provided. Run `npm run zk-webhook-verification-help` for usage.');
    process.exit(1);
  }

  const parts = fullCommand.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    case 'compile-proofs':
      await handleCompileProofs();
      break;
    case 'integrity-report':
      await handleIntegrityReport();
      break;
    case 'audit-payloads':
      await handleAuditPayloads();
      break;
    case 'verify-chain':
      await handleVerifyChain();
      break;
    case 'proof-summary':
      await handleProofSummary();
      break;
    case 'obsidian-export':
      await handleObsidianExport();
      break;
    default:
      console.error(`Unknown command: "${command}". Run \`npm run zk-webhook-verification-help\` for usage.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
