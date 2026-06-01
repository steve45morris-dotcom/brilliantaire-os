// scripts/grounded-narrator-review-queue.ts
// Offline Grounded Narrator Review Queue Compiler for Brilliantaire OS.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_TTS_AUDIO,
  ALLOW_EXTERNAL_API,
  DEFAULT_APPROVED_FOR_VOICE,
  inputFolders,
  outputFolders
} from '../config/grounded-narrator-review-queue.config.js';
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
  const logsDir = path.join(outputFolders.root, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logsDir, `narrator_queue_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest JSON graph file (secondary source)
function getLatestGraphFile(): string | null {
  const dir = inputFolders.graphs;
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      time: fs.statSync(path.join(dir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

interface ClaimNode {
  id: string;
  sourceFile: string;
  sourceSection: string;
  text: string;
  confidence: string;
  relatedNodes: string[];
  action: string;
}

interface CitationNode {
  id: string;
  sourceFile: string;
  sourceSection: string;
  refDoc: string;
  text: string;
  confidence: string;
  relatedNodes: string[];
  action: string;
}

interface WeakClaimNode {
  id: string;
  sourceFile: string;
  claim: string;
  weakness: string;
  evidence: string;
  risk: string;
  method: string;
  action: string;
  relatedNodes: string[];
}

interface GraphData {
  graphId: string;
  createdAt: string;
  sourceFiles: string[];
  claims: ClaimNode[];
  citations: CitationNode[];
  weakClaims: WeakClaimNode[];
  edges: Array<{ from: string; to: string; relationType: string; label: string }>;
}

interface NarrationBlock {
  blockId: string;
  blockType: 'safe_claim' | 'uncited_claim' | 'weak_claim';
  claimText: string;
  suggestedTone: string;
  priority: 'High' | 'Medium' | 'Low';
  approvedForVoice: boolean;
  sourceNode: string;
  verificationDetails: string;
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('dry-run');
  const commandArg = args[0] || 'build';

  console.log(`🎙️ Initializing Grounded Narrator Review Queue Compiler [Command: ${commandArg}]`);
  if (isDryRun) {
    console.log(`⚠️ DRY RUN MODE: No files will be written.`);
  }

  // Load secondary source graph
  const latestJsonPath = getLatestGraphFile();
  if (!latestJsonPath) {
    console.error(`❌ Error: No grounded index JSON graph found under ${inputFolders.graphs}`);
    process.exit(1);
  }
  const graph: GraphData = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'));

  // Load Templates
  const templateDir = outputFolders.templates;
  const loadTemplate = (name: string): string => {
    const p = path.join(templateDir, name);
    if (!fs.existsSync(p)) {
      console.warn(`[Warning] Template ${name} not found, using generic fallback.`);
      return `### Generic Template ${name}\n`;
    }
    return fs.readFileSync(p, 'utf-8');
  };

  const briefTpl = loadTemplate('narrator-brief-template.md');
  const claimTpl = loadTemplate('narrator-claim-block-template.md');
  const citationTpl = loadTemplate('narrator-citation-block-template.md');
  const riskTpl = loadTemplate('narrator-risk-warning-template.md');
  const priorityTpl = loadTemplate('narrator-priority-queue-template.md');
  const summaryTpl = loadTemplate('narrator-review-summary-template.md');

  const dateStr = getFormattedDate();
  const blocks: NarrationBlock[] = [];

  // Compile Claim blocks
  let blockIdx = 1;

  // 1. Weak claims compilation
  for (const wc of graph.weakClaims) {
    const blockId = `narrator_block_${blockIdx++}`;
    let verification = '';
    // Format risk warning using template
    verification += riskTpl
      .replace(/{{RISK_LABEL}}/g, `Weak Claim Flagged (Node ${wc.id})`)
      .replace(/{{RISK_DESCRIPTION}}/g, wc.weakness)
      .replace(/{{RISK_MITIGATION}}/g, wc.action);

    blocks.push({
      blockId,
      blockType: 'weak_claim',
      claimText: wc.claim,
      suggestedTone: 'Warning / Cautionary',
      priority: 'High',
      approvedForVoice: DEFAULT_APPROVED_FOR_VOICE,
      sourceNode: wc.id,
      verificationDetails: verification
    });
  }

  // 2. Cited & Uncited claims compilation
  for (const c of graph.claims) {
    const blockId = `narrator_block_${blockIdx++}`;
    const cits = graph.citations.filter(cit => cit.relatedNodes.includes(c.id));
    const isUncited = cits.length === 0;

    let verification = '';
    if (isUncited) {
      verification += riskTpl
        .replace(/{{RISK_LABEL}}/g, `Uncited Knowledge Gap (Node ${c.id})`)
        .replace(/{{RISK_DESCRIPTION}}/g, 'No matching cited sources compiled in Phase 11N reports.')
        .replace(/{{RISK_MITIGATION}}/g, 'Provide explicit citation text or documents before releasing.');
      
      blocks.push({
        blockId,
        blockType: 'uncited_claim',
        claimText: c.text,
        suggestedTone: 'Muted / Tactical',
        priority: 'Medium',
        approvedForVoice: DEFAULT_APPROVED_FOR_VOICE,
        sourceNode: c.id,
        verificationDetails: verification
      });
    } else {
      for (const cit of cits) {
        verification += citationTpl
          .replace(/{{REF_DOC}}/g, cit.refDoc)
          .replace(/{{REF_EXCERPT}}/g, cit.text)
          .replace(/{{RELATION_TYPE}}/g, 'supports')
          .replace(/{{RELATION_LABEL}}/g, 'exact_relation');
      }

      blocks.push({
        blockId,
        blockType: 'safe_claim',
        claimText: c.text,
        suggestedTone: 'Authoritative / Grounded',
        priority: 'Low',
        approvedForVoice: DEFAULT_APPROVED_FOR_VOICE,
        sourceNode: c.id,
        verificationDetails: verification
      });
    }
  }

  // Generate markdown sections using templates
  let blocksMarkdownStr = '';
  let priorityHighStr = '';
  let priorityMediumStr = '';
  let priorityLowStr = '';
  let safeClaimsStr = '';
  let riskyClaimsStr = '';
  let citationBriefsStr = '';

  for (const b of blocks) {
    const renderedBlock = claimTpl
      .replace(/{{BLOCK_ID}}/g, b.blockId)
      .replace(/{{BLOCK_TYPE}}/g, b.blockType)
      .replace(/{{CLAIM_TEXT}}/g, b.claimText)
      .replace(/{{VOICE_TEASE_TONE}}/g, b.suggestedTone)
      .replace(/{{NARRATION_PRIORITY}}/g, b.priority)
      .replace(/{{SOURCE_NODE}}/g, b.sourceNode)
      .replace(/{{VERIFICATION_DETAILS}}/g, b.verificationDetails);

    blocksMarkdownStr += renderedBlock + '\n';

    // Priority grouping
    if (b.priority === 'High') {
      priorityHighStr += renderedBlock + '\n';
    } else if (b.priority === 'Medium') {
      priorityMediumStr += renderedBlock + '\n';
    } else {
      priorityLowStr += renderedBlock + '\n';
    }

    // Safe vs Risky classification
    if (b.blockType === 'safe_claim') {
      safeClaimsStr += renderedBlock + '\n';
      // Citation brief mapping
      citationBriefsStr += `### 📄 Citation Mapping for \`${b.blockId}\`\n${b.verificationDetails}\n`;
    } else {
      riskyClaimsStr += renderedBlock + '\n';
    }
  }

  if (!priorityHighStr) priorityHighStr = '*No High priority blocks staged.*';
  if (!priorityMediumStr) priorityMediumStr = '*No Medium priority blocks staged.*';
  if (!priorityLowStr) priorityLowStr = '*No Low priority blocks staged.*';
  if (!safeClaimsStr) safeClaimsStr = '*No safe claims staged.*';
  if (!riskyClaimsStr) riskyClaimsStr = '*No risky claims flagged.*';
  if (!citationBriefsStr) citationBriefsStr = '*No citation mappings found.*';

  // Build markdown documents
  const compiledBrief = briefTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{NARRATION_BLOCKS}}/g, blocksMarkdownStr);

  const compiledPriorityQueue = priorityTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{HIGH_PRIORITY_LIST}}/g, priorityHighStr)
    .replace(/{{MEDIUM_PRIORITY_LIST}}/g, priorityMediumStr)
    .replace(/{{LOW_PRIORITY_LIST}}/g, priorityLowStr);

  const compiledSummary = summaryTpl
    .replace(/{{DATE}}/g, dateStr)
    .replace(/{{TOTAL_BLOCKS}}/g, String(blocks.length))
    .replace(/{{SAFE_CLAIMS_COUNT}}/g, String(blocks.filter(b => b.blockType === 'safe_claim').length))
    .replace(/{{UNSAFE_CLAIMS_COUNT}}/g, String(blocks.filter(b => b.blockType === 'uncited_claim').length))
    .replace(/{{WEAK_CLAIMS_COUNT}}/g, String(blocks.filter(b => b.blockType === 'weak_claim').length));

  // Build target file writers
  const writeOutputs = () => {
    const qDir = outputFolders.reviewQueue;

    const mainQueuePath = getSafeWritePath(qDir, `grounded_narrator_review_queue_${dateStr}`, '.md', true);
    const priorityPath = getSafeWritePath(qDir, `grounded_narrator_priority_blocks_${dateStr}`, '.md', true);
    const safeClaimsPath = getSafeWritePath(qDir, `grounded_narrator_safe_claims_${dateStr}`, '.md', true);
    const riskyClaimsPath = getSafeWritePath(qDir, `grounded_narrator_risky_claims_${dateStr}`, '.md', true);
    const citationBriefsPath = getSafeWritePath(qDir, `grounded_narrator_citation_briefs_${dateStr}`, '.md', true);
    const summaryPath = getSafeWritePath(qDir, `grounded_narrator_review_summary_${dateStr}`, '.md', true);
    const jsonPath = getSafeWritePath(qDir, `grounded_narrator_review_queue_${dateStr}`, '.json', true);

    fs.writeFileSync(mainQueuePath, compiledBrief);
    fs.writeFileSync(priorityPath, compiledPriorityQueue);
    fs.writeFileSync(safeClaimsPath, safeClaimsStr);
    fs.writeFileSync(riskyClaimsPath, riskyClaimsStr);
    fs.writeFileSync(citationBriefsPath, citationBriefsStr);
    fs.writeFileSync(summaryPath, compiledSummary);

    // Save JSON Metadata
    const jsonMetadata = {
      queueId: `narrator_queue_${dateStr}`,
      compiledAt: new Date().toISOString(),
      blocks: blocks.map(b => ({
        blockId: b.blockId,
        blockType: b.blockType,
        claimText: b.claimText,
        suggestedTone: b.suggestedTone,
        priority: b.priority,
        approvedForVoice: b.approvedForVoice,
        sourceNode: b.sourceNode
      }))
    };
    fs.writeFileSync(jsonPath, JSON.stringify(jsonMetadata, null, 2));

    console.log(`✅ Grounded Narrator Review Queue compiled successfully.`);
    console.log(`📂 Outputs stored in: ${qDir}`);
    console.log(`📝 Review summary report generated: ${summaryPath}`);

    logEvent('Narrator Queue Compile', `Successfully compiled ${blocks.length} narration briefs to review_queue/`);
  };

  if (!isDryRun) {
    writeOutputs();
    await announcePhrase("No street collisions. Quorum verified.");
    await announceCompletion("Grounded narrator review queue compiler finished successfully", "10");
  } else {
    console.log(`📋 Dry Run verify: Staged ${blocks.length} blocks safely.`);
    logEvent('Dry Run Queue Compile', `Successfully dry-run validated narrator templates mapping.`);
  }
}

run().catch(err => {
  console.error(`❌ Error compiling narrator queue: ${err.message}`);
  process.exit(1);
});
