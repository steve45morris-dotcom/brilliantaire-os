// scripts/voice-safe-narration-approval-gate.ts
// Offline Voice-Safe Narration Approval Gate for Brilliantaire OS.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_TTS_AUDIO,
  ALLOW_EXTERNAL_API_CALLS,
  FAIL_CLOSED_ON_ERROR,
  inputFolders,
  outputFolders
} from '../config/voice-safe-narration-approval-gate.config.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string, forceOverwrite = false): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath) && !forceOverwrite) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    return path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const logsDir = outputFolders.logs;
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logsDir, `approval_gate_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest review queue JSON
function getLatestQueueFile(): string | null {
  const dir = inputFolders.reviewQueue;
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('grounded_narrator_review_queue'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

interface ReviewBlock {
  blockId: string;
  blockType: string;
  claimText: string;
  suggestedTone: string;
  priority: string;
  approvedForVoice?: boolean;
  approved_for_voice?: boolean;
  sourceNode: string;
}

interface QueueData {
  queueId: string;
  compiledAt: string;
  blocks: ReviewBlock[];
}

interface ApprovedBlock {
  block_id: string;
  source_file: string;
  node_id: string;
  approved_for_voice: true;
  citation_status: 'Grounded' | 'Weak' | 'Uncited';
  risk_level: 'Low' | 'Medium' | 'High';
  narrator_text: string;
  suggested_voice_tone: string;
  suggested_priority: string;
  approval_timestamp: string;
  approval_source: string;
}

interface RejectedBlock {
  block_id: string;
  source_file: string;
  node_id: string;
  approved_for_voice: boolean | 'missing';
  rejection_reason: string;
  risk_level: 'Low' | 'Medium' | 'High';
  citation_status: 'Grounded' | 'Weak' | 'Uncited';
  suggested_fix: string;
  review_required: true;
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('dry-run');
  const commandArg = args[0] || 'build';

  // Extract simulated test approvals (e.g. --test-approve narrator_block_3)
  const testApproveIdx = args.indexOf('--test-approve');
  const testApprovedIds: string[] = [];
  if (testApproveIdx !== -1 && args[testApproveIdx + 1]) {
    testApprovedIds.push(args[testApproveIdx + 1]);
  }

  console.log(`🛡️ Initializing Voice-Safe Narration Approval Gate [Command: ${commandArg}]`);
  if (isDryRun) {
    console.log(`⚠️ DRY RUN MODE: No files will be written.`);
  }

  const latestQueuePath = getLatestQueueFile();
  if (!latestQueuePath) {
    console.error(`❌ Error: No narrator review queue JSON file found under ${inputFolders.reviewQueue}`);
    if (FAIL_CLOSED_ON_ERROR) {
      process.exit(1);
    }
    return;
  }

  console.log(`📂 Loading latest review queue: ${path.basename(latestQueuePath)}`);
  const queueContent = fs.readFileSync(latestQueuePath, 'utf-8');
  let queueData: QueueData;
  try {
    queueData = JSON.parse(queueContent);
  } catch (e) {
    console.error(`❌ Error parsing review queue JSON metadata: ${(e as Error).message}`);
    process.exit(1);
  }

  // Load Templates
  const templateDir = outputFolders.templates;
  const loadTemplate = (name: string): string => {
    const p = path.join(templateDir, name);
    if (!fs.existsSync(p)) {
      console.warn(`[Warning] Template ${name} not found under ${templateDir}. Using generic fallback.`);
      return `### Generic Template ${name}\n`;
    }
    return fs.readFileSync(p, 'utf-8');
  };

  const manifestTpl = loadTemplate('voice-approval-manifest-template.md');
  const approvedBlockTpl = loadTemplate('voice-approved-block-template.md');
  const rejectedBlockTpl = loadTemplate('voice-rejected-block-template.md');
  const riskReviewTpl = loadTemplate('voice-risk-review-template.md');
  const summaryTpl = loadTemplate('voice-approval-summary-template.md');
  const nextActionsTpl = loadTemplate('voice-next-actions-template.md');

  const dateStr = getFormattedDate();
  const approvedBlocks: ApprovedBlock[] = [];
  const rejectedBlocks: RejectedBlock[] = [];

  const timestampStr = new Date().toISOString();

  for (const block of queueData.blocks) {
    const blockId = block.blockId;
    let isApproved = block.approvedForVoice === true || block.approved_for_voice === true;
    
    // Check if test-approved override is supplied
    if (testApprovedIds.includes(blockId)) {
      console.log(`💡 Simulating human approval override for block: ${blockId}`);
      isApproved = true;
    }

    const type = block.blockType;
    const isWeak = type === 'weak_claim';
    const isUncited = type === 'uncited_claim';

    let citationStatus: 'Grounded' | 'Weak' | 'Uncited' = 'Grounded';
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (isWeak) {
      citationStatus = 'Weak';
      riskLevel = 'High';
    } else if (isUncited) {
      citationStatus = 'Uncited';
      riskLevel = 'Medium';
    }

    const valStatus = block.approvedForVoice !== undefined ? String(block.approvedForVoice) : 'missing';

    // Gate rules
    if (!isApproved) {
      rejectedBlocks.push({
        block_id: blockId,
        source_file: path.basename(latestQueuePath),
        node_id: block.sourceNode,
        approved_for_voice: block.approvedForVoice !== undefined ? block.approvedForVoice : 'missing' as any,
        rejection_reason: 'Blocked: Manually review-required. approved_for_voice is false or missing.',
        risk_level: riskLevel,
        citation_status: citationStatus,
        suggested_fix: 'Open Obsidian dashboard [[notebooklm_obsidian_review_queue_2026-06-01]], audit references, and update approvedForVoice flag in JSON queue file.',
        review_required: true
      });
    } else if (isUncited) {
      rejectedBlocks.push({
        block_id: blockId,
        source_file: path.basename(latestQueuePath),
        node_id: block.sourceNode,
        approved_for_voice: true,
        rejection_reason: 'Blocked: Uncited claim node. Grounding in verified source content is missing.',
        risk_level: 'High',
        citation_status: 'Uncited',
        suggested_fix: 'Run citation mapper to find supporting excerpt or assign exact citation references.',
        review_required: true
      });
    } else if (isWeak) {
      rejectedBlocks.push({
        block_id: blockId,
        source_file: path.basename(latestQueuePath),
        node_id: block.sourceNode,
        approved_for_voice: true,
        rejection_reason: 'Blocked: Weak claim. Contains contradictions or missing evidence gaps.',
        risk_level: 'High',
        citation_status: 'Weak',
        suggested_fix: 'Resolve flagged weaknesses under [[notebooklm_obsidian_weak_claims_dashboard_2026-06-01]] before attempting approval.',
        review_required: true
      });
    } else {
      // Approved!
      approvedBlocks.push({
        block_id: blockId,
        source_file: path.basename(latestQueuePath),
        node_id: block.sourceNode,
        approved_for_voice: true,
        citation_status: 'Grounded',
        risk_level: 'Low',
        narrator_text: block.claimText,
        suggested_voice_tone: block.suggestedTone || 'Authoritative',
        suggested_priority: block.priority || 'Low',
        approval_timestamp: timestampStr,
        approval_source: testApprovedIds.includes(blockId) ? 'Simulator_Override_SignOff' : 'Manual_Operator_SignOff'
      });
    }
  }

  // Format outputs
  let approvedMarkdownStr = '';
  for (const b of approvedBlocks) {
    approvedMarkdownStr += approvedBlockTpl
      .replace(/{{BLOCK_ID}}/g, b.block_id)
      .replace(/{{NODE_ID}}/g, b.node_id)
      .replace(/{{CLAIM_TEXT}}/g, b.narrator_text)
      .replace(/{{VOICE_TONE}}/g, b.suggested_voice_tone)
      .replace(/{{VOICE_PRIORITY}}/g, b.suggested_priority)
      .replace(/{{CITATION_STATUS}}/g, b.citation_status)
      .replace(/{{RISK_LEVEL}}/g, b.risk_level)
      .replace(/{{TIMESTAMP}}/g, b.approval_timestamp)
      .replace(/{{APPROVAL_SOURCE}}/g, b.approval_source);
  }
  if (!approvedMarkdownStr) approvedMarkdownStr = '*No blocks approved for voice generation in this gate run.*\n';

  let rejectedMarkdownStr = '';
  let uncitedRisksStr = '';
  let weakRisksStr = '';
  let nextActionsListStr = '';

  for (const b of rejectedBlocks) {
    const renderedRejected = rejectedBlockTpl
      .replace(/{{BLOCK_ID}}/g, b.block_id)
      .replace(/{{NODE_ID}}/g, b.node_id)
      .replace(/{{CLAIM_TEXT}}/g, queueData.blocks.find(blk => blk.blockId === b.block_id)?.claimText || '')
      .replace(/{{REJECTION_REASON}}/g, b.rejection_reason)
      .replace(/{{SUGGESTED_FIX}}/g, b.suggested_fix)
      .replace(/{{RISK_LEVEL}}/g, b.risk_level)
      .replace(/{{CITATION_STATUS}}/g, b.citation_status);

    rejectedMarkdownStr += renderedRejected;

    // Filter by risk categories
    if (b.citation_status === 'Uncited') {
      uncitedRisksStr += renderedRejected;
    } else if (b.citation_status === 'Weak') {
      weakRisksStr += renderedRejected;
    }

    nextActionsListStr += `- [ ] Resolve block \`${b.block_id}\` (Node: \`${b.node_id}\`): ${b.rejection_reason} -> Fix: ${b.suggested_fix}\n`;
  }

  if (!rejectedMarkdownStr) rejectedMarkdownStr = '*No blocks rejected in this gate run.*\n';
  if (!uncitedRisksStr) uncitedRisksStr = '*No uncited risks flagged.*\n';
  if (!weakRisksStr) weakRisksStr = '*No weak claim risks flagged.*\n';
  if (!nextActionsListStr) nextActionsListStr = '*All narrator blocks are approved. No next actions required.*';

  // Apply template values
  const compiledManifest = manifestTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{APPROVED_COUNT}}/g, String(approvedBlocks.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedBlocks.length))
    .replace(/{{UNCITED_COUNT}}/g, String(rejectedBlocks.filter(b => b.citation_status === 'Uncited').length))
    .replace(/{{WEAK_COUNT}}/g, String(rejectedBlocks.filter(b => b.citation_status === 'Weak').length));

  const compiledRiskReview = riskReviewTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{UNCITED_RISKS}}/g, uncitedRisksStr)
    .replace(/{{WEAK_RISKS}}/g, weakRisksStr);

  const compiledSummary = summaryTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TOTAL_SCANNED}}/g, String(queueData.blocks.length))
    .replace(/{{APPROVED_COUNT}}/g, String(approvedBlocks.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedBlocks.length));

  const compiledNextActions = nextActionsTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{NEXT_ACTIONS_LIST}}/g, nextActionsListStr);

  // Write outputs function
  const writeOutputs = () => {
    const mdDir = outputFolders.markdown;
    const repDir = outputFolders.reports;
    const jDir = outputFolders.json;

    const manifestPath = getSafeWritePath(mdDir, `voice_safe_approval_manifest_${dateStr}`, '.md', true);
    const approvedPath = getSafeWritePath(mdDir, `voice_safe_approved_blocks_${dateStr}`, '.md', true);
    const rejectedPath = getSafeWritePath(mdDir, `voice_safe_rejected_blocks_${dateStr}`, '.md', true);
    const riskPath = getSafeWritePath(mdDir, `voice_safe_risk_review_${dateStr}`, '.md', true);
    const actionsPath = getSafeWritePath(mdDir, `voice_safe_next_actions_${dateStr}`, '.md', true);
    const summaryPath = getSafeWritePath(repDir, `voice_safe_approval_summary_${dateStr}`, '.md', true);
    const jsonPath = getSafeWritePath(jDir, `voice_safe_approval_manifest_${dateStr}`, '.json', true);

    fs.writeFileSync(manifestPath, compiledManifest);
    fs.writeFileSync(approvedPath, approvedMarkdownStr);
    fs.writeFileSync(rejectedPath, rejectedMarkdownStr);
    fs.writeFileSync(riskPath, compiledRiskReview);
    fs.writeFileSync(actionsPath, compiledNextActions);
    fs.writeFileSync(summaryPath, compiledSummary);

    // Save JSON manifest metadata
    const jsonOutput = {
      manifestId: `voice_manifest_${dateStr}`,
      gateRunTimestamp: timestampStr,
      sourceQueue: path.basename(latestQueuePath),
      counts: {
        totalScanned: queueData.blocks.length,
        approved: approvedBlocks.length,
        rejected: rejectedBlocks.length
      },
      approvedBlocks,
      rejectedBlocks
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));

    console.log(`✅ Voice Approval Gate manifests generated successfully.`);
    console.log(`📂 MD Outputs staged under: ${mdDir}`);
    console.log(`📂 JSON Manifest output staged at: ${jsonPath}`);
    console.log(`📝 Verification summary report saved: ${summaryPath}`);

    logEvent('Gate Scan Complete', `Approved: ${approvedBlocks.length}, Rejected: ${rejectedBlocks.length} out of ${queueData.blocks.length} blocks.`);
  };

  if (!isDryRun) {
    writeOutputs();
    await announcePhrase("No street collisions. Quorum verified.");
    await announceCompletion("Voice-safe narration approval gate completed successfully", "10");
  } else {
    console.log(`📋 Dry Run Verify: Staged ${approvedBlocks.length} approved blocks and ${rejectedBlocks.length} rejected blocks.`);
    logEvent('Dry Run Gate Scan', `Verified approval gate mappings successfully offline.`);
  }
}

run().catch(err => {
  console.error(`❌ Error executing approval gate: ${err.message}`);
  process.exit(1);
});
