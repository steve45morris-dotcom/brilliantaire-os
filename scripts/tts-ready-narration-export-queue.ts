// scripts/tts-ready-narration-export-queue.ts
// Offline TTS-Ready Narration Export Queue compiler for Brilliantaire OS.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_TTS_AUDIO,
  ALLOW_EXTERNAL_API_CALLS,
  FAIL_CLOSED_ON_ERROR,
  MAX_SAFE_RISK_LEVEL,
  inputFolders,
  outputFolders
} from '../config/tts-ready-narration-export-queue.config.js';
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
  const logFile = path.join(logsDir, `export_queue_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest approval manifest JSON
function getLatestApprovalFile(): string | null {
  const dir = path.join(inputFolders.approvalGate, 'json');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('voice_safe_approval_manifest'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

// Check risk tier
function isRiskSafe(risk: string): boolean {
  const tiers = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const blockTier = tiers[risk as keyof typeof tiers] || 99;
  const maxTier = tiers[MAX_SAFE_RISK_LEVEL as keyof typeof tiers] || 2;
  return blockTier <= maxTier;
}

interface ApprovedBlockInput {
  block_id: string;
  source_file: string;
  node_id: string;
  approved_for_voice: boolean;
  citation_status: 'Grounded' | 'Weak' | 'Uncited';
  risk_level: 'Low' | 'Medium' | 'High';
  narrator_text: string;
  suggested_voice_tone: string;
  suggested_priority: string;
  approval_timestamp: string;
  approval_source: string;
}

interface ManifestData {
  manifestId: string;
  gateRunTimestamp: string;
  sourceQueue: string;
  counts: {
    totalScanned: number;
    approved: number;
    rejected: number;
  };
  approvedBlocks: ApprovedBlockInput[];
}

interface ExportedBlock {
  export_id: string;
  block_id: string;
  node_id: string;
  source_file: string;
  narrator_text: string;
  approved_for_voice: true;
  citation_status: 'Grounded' | 'Weak' | 'Uncited';
  risk_level: 'Low' | 'Medium' | 'High';
  suggested_voice_tone: string;
  suggested_priority: string;
  estimated_word_count: number;
  estimated_duration_seconds: number;
  export_status: 'staged_for_tts';
  tts_generated: false;
}

interface RejectedBlock {
  block_id: string;
  node_id: string;
  source_file: string;
  narrator_text?: string;
  risk_level: string;
  rejection_reason: string;
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('dry-run');
  const commandArg = args[0] || 'build';

  console.log(`🛡️ Initializing TTS-Ready Narration Export Queue [Command: ${commandArg}]`);
  if (isDryRun) {
    console.log(`⚠️ DRY RUN MODE: No files will be written.`);
  }

  const latestApprovalPath = getLatestApprovalFile();
  if (!latestApprovalPath) {
    console.error(`❌ Error: No voice-safe approval manifest JSON file found under ${path.join(inputFolders.approvalGate, 'json')}`);
    if (FAIL_CLOSED_ON_ERROR) {
      process.exit(1);
    }
    return;
  }

  console.log(`📂 Loading latest approval manifest: ${path.basename(latestApprovalPath)}`);
  const manifestContent = fs.readFileSync(latestApprovalPath, 'utf-8');
  let manifestData: ManifestData;
  try {
    manifestData = JSON.parse(manifestContent);
  } catch (e) {
    console.error(`❌ Error parsing approval manifest JSON metadata: ${(e as Error).message}`);
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

  const queueTpl = loadTemplate('tts-export-queue-template.md');
  const approvedBlockTpl = loadTemplate('tts-approved-script-block-template.md');
  const voiceMetaTpl = loadTemplate('tts-voice-metadata-template.md');
  const summaryTpl = loadTemplate('tts-export-summary-template.md');
  const nextActionsTpl = loadTemplate('tts-next-actions-template.md');

  const dateStr = getFormattedDate();
  const timestampStr = new Date().toISOString();

  const exportedBlocks: ExportedBlock[] = [];
  const rejectedBlocks: RejectedBlock[] = [];

  let exportCounter = 1;
  const importedBlocks = manifestData.approvedBlocks || [];

  for (const block of importedBlocks) {
    const blockId = block.block_id;
    const narratorText = block.narrator_text;
    const sourceFile = block.source_file;
    const approved = block.approved_for_voice === true;
    const risk = block.risk_level;

    // Export safety checks
    if (!approved) {
      rejectedBlocks.push({
        block_id: blockId,
        node_id: block.node_id,
        source_file: sourceFile || 'unknown',
        narrator_text: narratorText,
        risk_level: risk,
        rejection_reason: 'Blocked: Block not approved for voice in Phase 11Q approval gate.'
      });
      continue;
    }

    if (!narratorText || !narratorText.trim()) {
      rejectedBlocks.push({
        block_id: blockId,
        node_id: block.node_id,
        source_file: sourceFile || 'unknown',
        narrator_text: '',
        risk_level: risk,
        rejection_reason: 'Blocked: Narrator text is missing or blank.'
      });
      continue;
    }

    if (!sourceFile) {
      rejectedBlocks.push({
        block_id: blockId,
        node_id: block.node_id,
        source_file: 'missing',
        narrator_text: narratorText,
        risk_level: risk,
        rejection_reason: 'Blocked: Missing source file parameter.'
      });
      continue;
    }

    if (!isRiskSafe(risk)) {
      rejectedBlocks.push({
        block_id: blockId,
        node_id: block.node_id,
        source_file: sourceFile,
        narrator_text: narratorText,
        risk_level: risk,
        rejection_reason: `Blocked: Exceeds safe risk threshold (${risk} > ${MAX_SAFE_RISK_LEVEL}).`
      });
      continue;
    }

    // Passed export validations! Estimate metrics
    const wordCount = narratorText.trim().split(/\s+/).length;
    // Estimate: 140 WPM average rate (duration in seconds)
    const durationSeconds = Math.max(1, Math.round((wordCount / 140) * 60));

    exportedBlocks.push({
      export_id: `export_block_${exportCounter++}`,
      block_id: blockId,
      node_id: block.node_id || 'unknown',
      source_file: sourceFile,
      narrator_text: narratorText,
      approved_for_voice: true,
      citation_status: block.citation_status,
      risk_level: block.risk_level,
      suggested_voice_tone: block.suggested_voice_tone || 'Authoritative',
      suggested_priority: block.suggested_priority || 'Low',
      estimated_word_count: wordCount,
      estimated_duration_seconds: durationSeconds,
      export_status: 'staged_for_tts',
      tts_generated: false
    });
  }

  // Format script blocks and voice directions spec
  let scriptBlocksMarkdown = '';
  let voiceMetaMarkdown = '';

  for (const b of exportedBlocks) {
    scriptBlocksMarkdown += approvedBlockTpl
      .replace(/{{EXPORT_ID}}/g, b.export_id)
      .replace(/{{BLOCK_ID}}/g, b.block_id)
      .replace(/{{NODE_ID}}/g, b.node_id)
      .replace(/{{SOURCE_FILE}}/g, b.source_file)
      .replace(/{{SCRIPT_TEXT}}/g, b.narrator_text)
      .replace(/{{WORD_COUNT}}/g, String(b.estimated_word_count))
      .replace(/{{ESTIMATED_DURATION}}/g, String(b.estimated_duration_seconds));

    voiceMetaMarkdown += voiceMetaTpl
      .replace(/{{EXPORT_ID}}/g, b.export_id)
      .replace(/{{BLOCK_ID}}/g, b.block_id)
      .replace(/{{VOICE_TONE}}/g, b.suggested_voice_tone)
      .replace(/{{VOICE_PRIORITY}}/g, b.suggested_priority)
      .replace(/{{CITATION_STATUS}}/g, b.citation_status)
      .replace(/{{RISK_LEVEL}}/g, b.risk_level);
  }

  if (exportedBlocks.length === 0) {
    scriptBlocksMarkdown = '*No approved script blocks available in this export gate run.*\n';
    voiceMetaMarkdown = '*No voice metadata available. Export queue is empty.*\n';
  }

  // Generate next actions checklist
  let nextActionsListStr = '';
  for (const b of rejectedBlocks) {
    nextActionsListStr += `- [ ] Resolve block \`${b.block_id}\` (Node: \`${b.node_id}\`): ${b.rejection_reason}\n`;
  }
  if (!nextActionsListStr) nextActionsListStr = '*All imported approved blocks successfully exported. No actions needed.*';

  // Apply templates
  const compiledQueue = queueTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{IMPORTED_COUNT}}/g, String(importedBlocks.length))
    .replace(/{{EXPORTED_COUNT}}/g, String(exportedBlocks.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedBlocks.length));

  const compiledSummary = summaryTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{IMPORTED_COUNT}}/g, String(importedBlocks.length))
    .replace(/{{EXPORTED_COUNT}}/g, String(exportedBlocks.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedBlocks.length));

  const compiledNextActions = nextActionsTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{NEXT_ACTIONS_LIST}}/g, nextActionsListStr);

  const writeOutputs = () => {
    const mdDir = outputFolders.markdown;
    const repDir = outputFolders.reports;
    const jDir = outputFolders.json;

    const queuePath = getSafeWritePath(mdDir, `tts_ready_narration_export_queue_${dateStr}`, '.md', true);
    const scriptsPath = getSafeWritePath(mdDir, `tts_ready_script_blocks_${dateStr}`, '.md', true);
    const voicePath = getSafeWritePath(mdDir, `tts_ready_voice_metadata_${dateStr}`, '.md', true);
    const actionsPath = getSafeWritePath(mdDir, `tts_ready_next_actions_${dateStr}`, '.md', true);
    const summaryPath = getSafeWritePath(repDir, `tts_ready_export_summary_${dateStr}`, '.md', true);
    const jsonPath = getSafeWritePath(jDir, `tts_ready_narration_export_queue_${dateStr}`, '.json', true);

    fs.writeFileSync(queuePath, compiledQueue);
    fs.writeFileSync(scriptsPath, scriptBlocksMarkdown);
    fs.writeFileSync(voicePath, voiceMetaMarkdown);
    fs.writeFileSync(actionsPath, compiledNextActions);
    fs.writeFileSync(summaryPath, compiledSummary);

    // Write JSON Manifest Output
    const jsonOutput = {
      exportId: `tts_export_${dateStr}`,
      compiledAt: timestampStr,
      sourceManifest: path.basename(latestApprovalPath),
      counts: {
        imported: importedBlocks.length,
        exported: exportedBlocks.length,
        rejected: rejectedBlocks.length
      },
      exportedBlocks,
      rejectedBlocks
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));

    console.log(`✅ TTS-Ready Narration Export Queue generated successfully.`);
    console.log(`📂 MD Outputs staged under: ${mdDir}`);
    console.log(`📂 JSON Manifest output staged at: ${jsonPath}`);
    console.log(`📝 Export summary report saved: ${summaryPath}`);

    logEvent('Export Complete', `Imported: ${importedBlocks.length}, Exported: ${exportedBlocks.length}, Rejected: ${rejectedBlocks.length}.`);
  };

  if (!isDryRun) {
    writeOutputs();
    await announcePhrase("No street collisions. Quorum verified.");
    await announceCompletion("TTS-ready narration export queue completed successfully", "10");
  } else {
    console.log(`📋 Dry Run Verify: Checked ${importedBlocks.length} approved blocks. Staged ${exportedBlocks.length} for export, blocked ${rejectedBlocks.length}.`);
    logEvent('Dry Run Export Gate', `Checked export mappings successfully offline.`);
  }
}

run().catch(err => {
  console.error(`❌ Error compiling export queue: ${err.message}`);
  process.exit(1);
});
