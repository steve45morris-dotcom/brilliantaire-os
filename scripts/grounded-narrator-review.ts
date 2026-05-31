import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  REVIEW_ONLY,
  ALLOW_TTS_GENERATION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_CITATION_OR_SOURCE,
  REQUIRE_MANUAL_REVIEW,
  MAX_BRIEF_LENGTH,
  inputFolders,
  outputFolders,
  candidateTypes,
  reviewStatuses,
  REPO_ROOT
} from '../config/grounded-narrator-review.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GraphNode {
  id: string;
  type: string;
  title: string;
  sourceFile: string;
  summary: string;
  confidence: string;
  tags: string[];
  reviewStatus: string;
}

interface GraphEdge {
  id: string;
  type: string;
  from: string;
  to: string;
  rationale: string;
  confidence: string;
}

interface Graph {
  graphId: string;
  createdAt: string;
  sourceFiles: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  safetyFlags: {
    localOnly: boolean;
    noExternalCalls: boolean;
    noVectorDbWrite: boolean;
    noObsidianWrite: boolean;
  };
}

interface ReviewCandidate {
  candidateId: string;
  candidateType: string;
  title: string;
  sourceNode: string;
  supportingEdge: string;
  citationOrSource: string;
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reviewStatus: string;
  narratorAngle: string;
  nextAction: string;
}

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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `narrator_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function getLatestGraphFile(): string | null {
  const dir = inputFolders.json;
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('grounded_intelligence_graph'))
    .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

function parseCandidates(graph: Graph): ReviewCandidate[] {
  const candidates: ReviewCandidate[] = [];

  for (const node of graph.nodes) {
    if (candidateTypes.includes(node.type) || node.type === 'citation' || node.type === 'risk') {
      // Map node.type to candidate type
      const cType = node.type === 'risk' ? 'risk_note' : node.type;

      // Filter connected edges
      const connectedEdges = graph.edges.filter(e => e.from === node.id || e.to === node.id);
      const edgeTypes = connectedEdges.map(e => e.type).join(', ') || 'none';
      const edgeRationales = connectedEdges.map(e => e.rationale).join('; ') || 'No rationale';

      // Find citations or source references
      let citationOrSource = 'Unspecified';
      if (node.sourceFile) {
        citationOrSource = node.sourceFile;
      }
      
      // If there is a connected citation node, pull its reference
      const citationEdge = connectedEdges.find(e => e.from.startsWith('citation') || e.to.startsWith('citation'));
      if (citationEdge) {
        const citationId = citationEdge.from.startsWith('citation') ? citationEdge.from : citationEdge.to;
        const citNode = graph.nodes.find(n => n.id === citationId);
        if (citNode) {
          citationOrSource = `${citNode.title} (${citationOrSource})`;
        }
      }

      // Default risk level assessment
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (node.type === 'weak_claim' || node.type === 'risk') {
        riskLevel = 'High';
      } else if (node.tags.includes('high_risk') || node.tags.includes('Medium')) {
        riskLevel = 'Medium';
      }

      // Staged review status
      let reviewStatus = 'needs_source_check';
      if (node.type === 'weak_claim' || node.type === 'risk') {
        reviewStatus = 'too_weak';
      } else if (citationOrSource !== 'Unspecified' && node.confidence === 'High') {
        reviewStatus = 'ready_for_narrator_review';
      }

      // Angles and actions
      let narratorAngle = `Staging ${cType} properties under offline review gates.`;
      if (cType === 'insight') {
        narratorAngle = `Highlighting architectural insight: "${node.title}".`;
      } else if (cType === 'workflow_card') {
        narratorAngle = `Detailing workflow capability: "${node.title}".`;
      } else if (cType === 'os_module_suggestion') {
        narratorAngle = `Reviewing modular system suggestion: "${node.title}".`;
      } else if (cType === 'weak_claim') {
        narratorAngle = `Flagging unsupported claim: "${node.title}" for verification.`;
      }

      const nextAction = riskLevel === 'High' 
        ? "Operator verification and claim hardening required."
        : "Standard narration candidate review checklist.";

      candidates.push({
        candidateId: node.id,
        candidateType: cType,
        title: node.title,
        sourceNode: node.sourceFile ? `node:${node.id} (${node.sourceFile})` : `node:${node.id}`,
        supportingEdge: `edges:[${edgeTypes}] (${edgeRationales})`,
        citationOrSource,
        summary: node.summary,
        riskLevel,
        reviewStatus,
        narratorAngle,
        nextAction
      });
    }
  }

  return candidates;
}

// 1. Queue command
async function handleQueue(): Promise<string> {
  console.log("🎙️ Compilation of Grounded Narrator Review Queue candidates...");
  await announceIntent("Reading grounded intelligence graph to prepare narration candidate card queue.");

  const latestGraphPath = getLatestGraphFile();
  if (!latestGraphPath) {
    throw new Error("No compiled grounded index graph JSON found. Run grounded-index build first.");
  }

  const graphContent = fs.readFileSync(latestGraphPath, 'utf-8');
  const graph: Graph = JSON.parse(graphContent);
  const candidates = parseCandidates(graph);

  const cardTemplatePath = path.join(REPO_ROOT, 'templates', 'grounded_narrator', 'narrator-review-card-template.md');
  if (!fs.existsSync(cardTemplatePath)) {
    throw new Error(`Review card template not found: ${cardTemplatePath}`);
  }
  const cardTemplate = fs.readFileSync(cardTemplatePath, 'utf-8');

  let queueContent = `# 🎙️ Grounded Narrator Review Queue: ${getFormattedDate()}\n\n`;
  queueContent += `- **Source Graph File:** ${path.basename(latestGraphPath)}\n`;
  queueContent += `- **Total Candidate Cards Staged:** ${candidates.length}\n\n`;
  queueContent += `---\n\n## Narration Candidate Cards\n\n`;

  for (const c of candidates) {
    queueContent += cardTemplate
      .replace(/\{\{CANDIDATE_ID\}\}/g, c.candidateId)
      .replace(/\{\{CANDIDATE_TYPE\}\}/g, c.candidateType)
      .replace(/\{\{TITLE\}\}/g, c.title)
      .replace(/\{\{SOURCE_NODE\}\}/g, c.sourceNode)
      .replace(/\{\{SUPPORTING_EDGE\}\}/g, c.supportingEdge)
      .replace(/\{\{CITATION_OR_SOURCE\}\}/g, c.citationOrSource)
      .replace(/\{\{SUMMARY\}\}/g, c.summary)
      .replace(/\{\{RISK_LEVEL\}\}/g, c.riskLevel)
      .replace(/\{\{REVIEW_STATUS\}\}/g, c.reviewStatus)
      .replace(/\{\{NARRATOR_ANGLE\}\}/g, c.narratorAngle)
      .replace(/\{\{NEXT_ACTION\}\}/g, c.nextAction) + '\n';
  }

  const outPath = getSafeWritePath(outputFolders.reviewQueue, `grounded_narrator_review_queue_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, queueContent);

  const detailMsg = `Narrator review queue compiled. Total candidates: ${candidates.length}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_QUEUE', detailMsg);

  await announceCompletion("Grounded Narrator review queue candidates staged successfully.");
  return outPath;
}

// 2. Brief command
async function handleBrief(): Promise<string> {
  console.log("🎙️ Compilation of Grounded Narrator Brief from safest candidates...");
  await announceIntent("Staging narrator-ready brief from safest citation-mapped candidates.");

  const latestGraphPath = getLatestGraphFile();
  if (!latestGraphPath) {
    throw new Error("No compiled grounded index graph JSON found. Run grounded-index build first.");
  }

  const graphContent = fs.readFileSync(latestGraphPath, 'utf-8');
  const graph: Graph = JSON.parse(graphContent);
  const candidates = parseCandidates(graph);

  const briefTemplatePath = path.join(REPO_ROOT, 'templates', 'grounded_narrator', 'narrator-brief-template.md');
  if (!fs.existsSync(briefTemplatePath)) {
    throw new Error(`Narrator brief template not found: ${briefTemplatePath}`);
  }
  const briefTemplate = fs.readFileSync(briefTemplatePath, 'utf-8');

  // Filter safest candidates
  const safeCandidates = candidates.filter(c => c.reviewStatus === 'ready_for_narrator_review' && c.riskLevel !== 'High');
  const weakClaims = candidates.filter(c => c.candidateType === 'weak_claim' || c.riskLevel === 'High');

  const selectedInsightsRows = safeCandidates
    .filter(c => ['insight', 'workflow_card', 'os_module_suggestion'].includes(c.candidateType))
    .map(c => `- **[${c.candidateType.toUpperCase()}] ${c.title}:** ${c.summary}`)
    .join('\n') || "- No safe insights compiled.";

  const citationNotesRows = safeCandidates
    .map(c => `- **${c.candidateId}** (${c.title}): Supported by ${c.citationOrSource}`)
    .join('\n') || "- No safe citations referenced.";

  const excludedWeakRows = weakClaims
    .map(c => `- **${c.candidateId}** (Excluded): Claim "${c.title}" flagged as high risk.`)
    .join('\n') || "- No weak claims excluded.";

  const bodyPointsRows = safeCandidates
    .slice(0, 5)
    .map((c, i) => `${i + 1}. **${c.title}**: The compiler staged "${c.summary}" with citation verified.`)
    .join('\n') || "1. System capability updates are compiled and verified offline.";

  let brief = briefTemplate
    .replace(/\{\{TITLE\}\}/g, `Narrator Brief ${getFormattedDate()}`)
    .replace(/\{\{PURPOSE\}\}/g, "Reviewing local system capability maps and architectural insights safely.")
    .replace(/\{\{SOURCE_GRAPH\}\}/g, graph.graphId)
    .replace(/\{\{STATUS\}\}/g, "staged_for_manual_review")
    .replace(/\{\{SELECTED_INSIGHTS\}\}/g, selectedInsightsRows)
    .replace(/\{\{CITATION_NOTES\}\}/g, citationNotesRows)
    .replace(/\{\{EXCLUDED_WEAK_CLAIMS\}\}/g, excludedWeakRows)
    .replace(/\{\{NARRATION_STRUCTURE\}\}/g, "1. Introduction -> 2. Verified Capabilities Highlights -> 3. Closing Safety Notes")
    .replace(/\{\{OPENING_LINE\}\}/g, `Welcome operator. Staging system briefing from grounded graph index ${graph.graphId}.`)
    .replace(/\{\{BODY_POINTS\}\}/g, bodyPointsRows)
    .replace(/\{\{CLOSING_LINE\}\}/g, "All narrated updates have been indexed, cited, and staged locally. Grounded Narrator offline. signing off.");

  if (brief.length > MAX_BRIEF_LENGTH) {
    brief = brief.substring(0, MAX_BRIEF_LENGTH) + "\n\n... [Brief truncated to satisfy MAX_BRIEF_LENGTH safety limit]";
  }

  const outPath = getSafeWritePath(outputFolders.briefs, `grounded_narrator_brief_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, brief);

  const detailMsg = `Narrator brief compiled safely. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_BRIEF', detailMsg);

  await announceCompletion("Grounded Narrator brief compiled successfully.");
  return outPath;
}

// 3. Reject-weak command
async function handleRejectWeak(): Promise<string> {
  console.log("🎙️ Compilation of Grounded Narrator rejection list...");
  await announceIntent("Compiling weak claims and high-risk nodes list.");

  const latestGraphPath = getLatestGraphFile();
  if (!latestGraphPath) {
    throw new Error("No compiled grounded index graph JSON found. Run grounded-index build first.");
  }

  const graphContent = fs.readFileSync(latestGraphPath, 'utf-8');
  const graph: Graph = JSON.parse(graphContent);
  const candidates = parseCandidates(graph);

  const rejectionTemplatePath = path.join(REPO_ROOT, 'templates', 'grounded_narrator', 'rejection-template.md');
  if (!fs.existsSync(rejectionTemplatePath)) {
    throw new Error(`Rejection template not found: ${rejectionTemplatePath}`);
  }
  const rejectionTemplate = fs.readFileSync(rejectionTemplatePath, 'utf-8');

  // Filter weak/high-risk claims
  const rejectedCandidates = candidates.filter(c => c.reviewStatus === 'too_weak' || c.riskLevel === 'High');

  let rejectContent = `# 🚫 Grounded Narrator Exclusions Checklist: ${getFormattedDate()}\n\n`;
  rejectContent += `- **Source Graph File:** ${path.basename(latestGraphPath)}\n`;
  rejectContent += `- **Total Excluded Nodes:** ${rejectedCandidates.length}\n\n`;
  rejectContent += `---\n\n## Excluded / Rejected Nodes\n\n`;

  for (const c of rejectedCandidates) {
    rejectContent += rejectionTemplate
      .replace(/\{\{CANDIDATE_ID\}\}/g, c.candidateId)
      .replace(/\{\{REJECTION_REASON\}\}/g, `Claim flagged as ${c.riskLevel} risk. Review status: ${c.reviewStatus}.`)
      .replace(/\{\{MISSING_EVIDENCE\}\}/g, c.summary)
      .replace(/\{\{RISK_LEVEL\}\}/g, c.riskLevel)
      .replace(/\{\{VERIFICATION_NEEDED\}\}/g, c.nextAction) + '\n';
  }

  const outPath = getSafeWritePath(outputFolders.rejected, `grounded_narrator_rejected_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, rejectContent);

  const detailMsg = `Rejection list compiled successfully. Excluded: ${rejectedCandidates.length}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('REJECT_WEAK', detailMsg);

  await announceCompletion("Rejection checklist compiled successfully.");
  return outPath;
}

// 4. Report command
async function handleReport(): Promise<string> {
  console.log("🎙️ Compilation of Grounded Narrator Queue report...");
  await announceIntent("Compiling queue audit metrics and safety report.");

  const latestGraphPath = getLatestGraphFile();
  if (!latestGraphPath) {
    throw new Error("No compiled grounded index graph JSON found. Run grounded-index build first.");
  }

  const graphContent = fs.readFileSync(latestGraphPath, 'utf-8');
  const graph: Graph = JSON.parse(graphContent);
  const candidates = parseCandidates(graph);

  const reportTemplatePath = path.join(REPO_ROOT, 'templates', 'grounded_narrator', 'narrator-queue-report-template.md');
  if (!fs.existsSync(reportTemplatePath)) {
    throw new Error(`Report template not found: ${reportTemplatePath}`);
  }
  const reportTemplate = fs.readFileSync(reportTemplatePath, 'utf-8');

  const ready = candidates.filter(c => c.reviewStatus === 'ready_for_narrator_review');
  const needsSource = candidates.filter(c => c.reviewStatus === 'needs_source_check');
  const rejected = candidates.filter(c => c.reviewStatus === 'too_weak' || c.reviewStatus === 'rejected');

  const safestTopicsRows = ready.map(c => `  - **${c.candidateId}** (${c.title}): Grounded in ${c.citationOrSource}`).join('\n') || "  - None ready.";
  const riskyTopicsRows = rejected.map(c => `  - **${c.candidateId}** (${c.title}): Risk Level: ${c.riskLevel}`).join('\n') || "  - None detected.";

  const report = reportTemplate
    .replace(/\{\{REPORT_DATE\}\}/g, getFormattedDate())
    .replace(/\{\{CANDIDATES_REVIEWED\}\}/g, String(candidates.length))
    .replace(/\{\{READY_CANDIDATES\}\}/g, String(ready.length))
    .replace(/\{\{NEEDS_SOURCE_CHECK\}\}/g, String(needsSource.length))
    .replace(/\{\{REJECTED_CANDIDATES\}\}/g, String(rejected.length))
    .replace(/\{\{SAFEST_NARRATION_TOPICS\}\}/g, safestTopicsRows)
    .replace(/\{\{RISKY_TOPICS\}\}/g, riskyTopicsRows)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Verify readiness of all safe candidates and review exclusions list manually.");

  const outPath = getSafeWritePath(outputFolders.root, `grounded_narrator_queue_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, report);

  const detailMsg = `Narrator queue report compiled. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_REPORT', detailMsg);

  await announceCompletion("Grounded Narrator Queue report compiled successfully.");
  return outPath;
}

// 5. Status command
function handleStatus() {
  console.log("=========================================");
  console.log("🎙️ GROUNDED NARRATOR REVIEW QUEUE STATUS");
  console.log("=========================================");

  const getLatestFileInDir = (dir: string, prefix: string, ext = '.md'): string => {
    if (!fs.existsSync(dir)) return "Folder missing";
    const files = fs.readdirSync(dir).filter(f => f.endsWith(ext) && f.startsWith(prefix)).sort();
    return files.length > 0 ? files[files.length - 1] : "None generated";
  };

  const latestGraphPath = getLatestGraphFile();
  const latestQueue = getLatestFileInDir(outputFolders.reviewQueue, 'grounded_narrator_review_queue');
  const latestBrief = getLatestFileInDir(outputFolders.briefs, 'grounded_narrator_brief');
  const latestRejected = getLatestFileInDir(outputFolders.rejected, 'grounded_narrator_rejected');
  const latestReport = getLatestFileInDir(outputFolders.root, 'grounded_narrator_queue_report');

  console.log(`Latest Grounded Graph:   ${latestGraphPath ? path.basename(latestGraphPath) : "None"}`);
  console.log(`Latest Review Queue:     ${latestQueue}`);
  console.log(`Latest Narrator Brief:   ${latestBrief}`);
  console.log(`Latest Rejected List:    ${latestRejected}`);
  console.log(`Latest Queue Report:     ${latestReport}`);

  // Fetch counts from latest review queue if available
  let readyCount = 0;
  let rejectedCount = 0;
  if (latestGraphPath) {
    try {
      const graph: Graph = JSON.parse(fs.readFileSync(latestGraphPath, 'utf-8'));
      const candidates = parseCandidates(graph);
      readyCount = candidates.filter(c => c.reviewStatus === 'ready_for_narrator_review').length;
      rejectedCount = candidates.filter(c => c.reviewStatus === 'too_weak' || c.reviewStatus === 'rejected').length;
    } catch (_) {}
  }

  console.log(`Ready Candidates:        ${readyCount}`);
  console.log(`Rejected Candidates:     ${rejectedCount}`);

  if (readyCount > 0) {
    console.log("Recommended Action:      Inspect 'grounded_narrator_brief' and sign-off candidates.");
  } else {
    console.log("Recommended Action:      Run 'npm run grounded-index -- build' to refresh grounded graph seed data.");
  }
  console.log("=========================================");
}

async function main() {
  const args = process.argv.slice(2);
  let command = args[0] ? args[0].toLowerCase().trim() : 'help';
  let subCommand = args[1] ? args[1].toLowerCase().trim() : '';

  if (command.includes(' ')) {
    const parts = command.split(/\s+/);
    command = parts[0];
    subCommand = parts[1] || '';
  }

  // Safety Gates Checks
  if (!REVIEW_ONLY) {
    console.error("❌ Safety Gate Triggered: Compiler is not in review-only mode.");
    process.exit(1);
  }

  if (ALLOW_TTS_GENERATION || ALLOW_EXTERNAL_API_CALLS || ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Safety Gate Triggered: Audio creation, API queries, or direct Obsidian writes are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run grounded-narrator-review-help' for detailed instructions.");
    } else if (command === 'queue') {
      await handleQueue();
    } else if (command === 'brief') {
      await handleBrief();
    } else if (command === 'reject-weak') {
      await handleRejectWeak();
    } else if (command === 'report') {
      await handleReport();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Narrator review compilation error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
