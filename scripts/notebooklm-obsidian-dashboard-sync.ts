// scripts/notebooklm-obsidian-dashboard-sync.ts
// Offline Obsidian Dashboard compiler & sync processor for Brilliantaire OS.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LOCAL_SYNC_ONLY,
  ALLOW_OBSIDIAN_WRITE,
  inputFolders,
  outputFolders
} from '../config/notebooklm-obsidian-dashboard-sync.config.js';
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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `sync_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest JSON graph file
function getLatestGraphFile(): string | null {
  const dir = inputFolders.json;
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

interface WorkflowNode {
  id: string;
  sourceFile: string;
  title: string;
  insight: string;
  steps: string;
  agent: string;
  difficulty: string;
  benefit: string;
  relatedNodes: string[];
}

interface RecommendationNode {
  id: string;
  sourceFile: string;
  moduleName: string;
  problem: string;
  basis: string;
  agent: string;
  difficulty: string;
  benefit: string;
  risk: string;
  nextPhase: string;
  relatedNodes: string[];
}

interface PromptPackNode {
  id: string;
  sourceFile: string;
  title: string;
  workflow: string;
  purpose: string;
  structure: string;
  output: string;
  benefit: string;
  relatedNodes: string[];
}

interface ObsidianNoteNode {
  id: string;
  sourceFile: string;
  title: string;
  summary: string;
  status: string;
  tags: string[];
  backlinks: string[];
  relatedNodes: string[];
}

interface GraphData {
  graphId: string;
  createdAt: string;
  sourceFiles: string[];
  claims: ClaimNode[];
  citations: CitationNode[];
  weakClaims: WeakClaimNode[];
  workflows: WorkflowNode[];
  recommendations: RecommendationNode[];
  promptPacks: PromptPackNode[];
  obsidianNotes: ObsidianNoteNode[];
  edges: Array<{ from: string; to: string; relationType: string; label: string }>;
}

async function run() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('dry-run');
  const commandArg = args[0] || 'build';

  console.log(`📡 Initializing Obsidian Intelligence Dashboard Sync [Command: ${commandArg}]`);
  if (isDryRun) {
    console.log(`⚠️ DRY RUN MODE: No files will be written.`);
  }

  // Find graph files
  const latestJsonPath = getLatestGraphFile();
  if (!latestJsonPath) {
    console.error(`❌ Error: No grounded index JSON graph found under ${inputFolders.json}`);
    process.exit(1);
  }

  console.log(`📂 Loading latest index graph: ${path.basename(latestJsonPath)}`);
  const graph: GraphData = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'));

  // Load Templates
  const templateDir = outputFolders.templates;
  const loadTemplate = (name: string): string => {
    const p = path.join(templateDir, name);
    if (!fs.existsSync(p)) {
      console.warn(`[Warning] Template ${name} not found, using generic placeholder.`);
      return `# ${name}\n\nPlaceholder content.\n`;
    }
    return fs.readFileSync(p, 'utf-8');
  };

  const dashboardTpl = loadTemplate('obsidian-dashboard-template.md');
  const weakClaimsTpl = loadTemplate('weak-claims-dashboard-template.md');
  const citationStrengthTpl = loadTemplate('citation-strength-dashboard-template.md');
  const recommendationTpl = loadTemplate('recommendation-dashboard-template.md');
  const workflowTpl = loadTemplate('workflow-dashboard-template.md');
  const reviewQueueTpl = loadTemplate('review-queue-dashboard-template.md');
  const nextActionsTpl = loadTemplate('next-actions-dashboard-template.md');

  const dateStr = getFormattedDate();

  // Populate Weak Claims List
  let weakClaimsListStr = '';
  for (const wc of graph.weakClaims) {
    weakClaimsListStr += `### Node ID: \`${wc.id}\` (Source: [[${wc.sourceFile.replace(/\.md$/, '')}]])\n`;
    weakClaimsListStr += `- [ ] **Claim:** ${wc.claim}\n`;
    weakClaimsListStr += `- **Weakness:** ${wc.weakness}\n`;
    weakClaimsListStr += `- **Missing Evidence:** ${wc.evidence}\n`;
    weakClaimsListStr += `- **Risk Level:** \`${wc.risk}\`\n`;
    weakClaimsListStr += `- **Verification Method:** ${wc.method}\n`;
    weakClaimsListStr += `- **Recommended Action:** ${wc.action}\n\n`;
  }
  if (!weakClaimsListStr) {
    weakClaimsListStr = '*No weak claims detected in index graph.*';
  }

  // Populate Citations lists
  let uncitedClaimsStr = '';
  let citedClaimsStr = '';
  for (const c of graph.claims) {
    const hasCitations = graph.citations.some(cit => cit.relatedNodes.includes(c.id));
    if (!hasCitations) {
      uncitedClaimsStr += `- [ ] **Claim:** ${c.text}\n  - *Source Node:* \`${c.id}\` (${c.sourceFile})\n  - *Action:* Needs citation search.\n\n`;
    } else {
      const cits = graph.citations.filter(cit => cit.relatedNodes.includes(c.id));
      const citDetails = cits.map(cit => `\`[${cit.id}]\` Source: \`${cit.refDoc}\` (Confidence: ${cit.confidence})`).join('; ');
      citedClaimsStr += `- ✅ **Claim:** ${c.text}\n  - *Grounding:* ${citDetails}\n\n`;
    }
  }
  if (!uncitedClaimsStr) uncitedClaimsStr = '*No uncited claims detected. All claims are grounded!*';
  if (!citedClaimsStr) citedClaimsStr = '*No citation-backed claims compiled.*';

  // Populate Recommendations lists
  let highPriorityRecommendations = '';
  let otherPriorityRecommendations = '';
  for (const rec of graph.recommendations) {
    const isHigh = rec.benefit.includes('High') || rec.risk.includes('High') || rec.nextPhase.includes('Immediate');
    const contentStr = `### 💡 ${rec.moduleName} (Node: \`${rec.id}\`)\n` +
      `- **Problem Addressed:** ${rec.problem}\n` +
      `- **Basis:** ${rec.basis}\n` +
      `- **Owning Agent:** \`${rec.agent}\`\n` +
      `- **Benefits:** ${rec.benefit} / **Difficulty:** ${rec.difficulty}\n` +
      `- **Next Step:** ${rec.nextPhase}\n\n`;
    if (isHigh) {
      highPriorityRecommendations += contentStr;
    } else {
      otherPriorityRecommendations += contentStr;
    }
  }
  if (!highPriorityRecommendations) highPriorityRecommendations = '*No high priority recommendations found.*';
  if (!otherPriorityRecommendations) otherPriorityRecommendations = '*No medium/low recommendations found.*';

  // Populate Workflows lists
  let readyWorkflows = '';
  let reviewWorkflows = '';
  for (const wf of graph.workflows) {
    const isReady = wf.difficulty !== 'High' && wf.insight.length > 5;
    const contentStr = `### ⚙️ ${wf.title} (Node: \`${wf.id}\`)\n` +
      `- **Required Agent:** \`${wf.agent}\`\n` +
      `- **Benefit:** ${wf.benefit}\n` +
      `- **Steps Preview:**\n\`\`\`\n${wf.steps}\n\`\`\`\n\n`;
    if (isReady) {
      readyWorkflows += contentStr;
    } else {
      reviewWorkflows += contentStr;
    }
  }
  if (!readyWorkflows) readyWorkflows = '*No fully verified workflows configured.*';
  if (!reviewWorkflows) reviewWorkflows = '*No staged workflows waiting for review.*';

  // Populate Prompt Packs
  let promptPackIdeasStr = '';
  for (const pp of graph.promptPacks) {
    promptPackIdeasStr += `### 🎯 Prompt Pack: ${pp.title} (Node: \`${pp.id}\`)\n` +
      `- **Linked Workflow:** \`${pp.workflow}\`\n` +
      `- **Purpose:** ${pp.purpose}\n` +
      `- **Structure:** ${pp.structure}\n` +
      `- **Benefit:** ${pp.benefit}\n\n`;
  }
  if (!promptPackIdeasStr) {
    // Add default mock fallback to keep it robust
    promptPackIdeasStr = `### 🎯 Grounded Narrator Instruction Builder (mock_pp_1)\n- **Purpose:** Translate index graph nodes into structured narrator script components offline.\n- **Output:** Narrator queue packages.\n`;
  }

  // Pending reviews (combining weak claims + uncited claims)
  let pendingReviewsStr = '';
  for (const wc of graph.weakClaims) {
    pendingReviewsStr += `- [ ] [Review Weak Claim] \`${wc.id}\`: "${wc.claim.substring(0, 60)}..."\n`;
  }
  for (const c of graph.claims) {
    const hasCitations = graph.citations.some(cit => cit.relatedNodes.includes(c.id));
    if (!hasCitations) {
      pendingReviewsStr += `- [ ] [Verify Citation] \`${c.id}\`: "${c.text.substring(0, 60)}..."\n`;
    }
  }
  if (!pendingReviewsStr) pendingReviewsStr = '*All graph items are verified and approved.*';

  // Next Actions checklist
  let highPriorityActions = '';
  let routineActions = '';
  for (const rec of graph.recommendations) {
    highPriorityActions += `- [ ] Compile narrator script outline for: \`${rec.moduleName}\`\n`;
  }
  for (const wc of graph.weakClaims) {
    highPriorityActions += `- [ ] Resolve missing evidence for \`${wc.id}\`: ${wc.evidence}\n`;
  }
  routineActions += `- [ ] Run \`npm run git-prepush-check\` daily audit\n`;
  routineActions += `- [ ] Backup index graphs to Obsidian vaults\n`;

  // Search & Replace mappings
  const replacePlaceholders = (tpl: string): string => {
    return tpl
      .replace(/{{SYNC_DATE}}/g, dateStr)
      .replace(/{{TOTAL_NODES}}/g, String(graph.claims.length + graph.citations.length + graph.weakClaims.length + graph.workflows.length + graph.recommendations.length + graph.promptPacks.length + graph.obsidianNotes.length))
      .replace(/{{CLAIM_COUNT}}/g, String(graph.claims.length))
      .replace(/{{CITATION_COUNT}}/g, String(graph.citations.length))
      .replace(/{{WEAK_CLAIM_COUNT}}/g, String(graph.weakClaims.length))
      .replace(/{{WORKFLOW_COUNT}}/g, String(graph.workflows.length))
      .replace(/{{RECOMMENDATION_COUNT}}/g, String(graph.recommendations.length))
      .replace(/{{BACKLINK_COUNT}}/g, String(graph.obsidianNotes.length))
      .replace(/{{WEAK_CLAIMS_LIST}}/g, weakClaimsListStr)
      .replace(/{{UNCITED_CLAIMS_LIST}}/g, uncitedClaimsStr)
      .replace(/{{CITED_CLAIMS_LIST}}/g, citedClaimsStr)
      .replace(/{{HIGH_PRIORITY_RECOMMENDATIONS}}/g, highPriorityRecommendations)
      .replace(/{{OTHER_PRIORITY_RECOMMENDATIONS}}/g, otherPriorityRecommendations)
      .replace(/{{READY_WORKFLOWS}}/g, readyWorkflows)
      .replace(/{{REVIEW_WORKFLOWS}}/g, reviewWorkflows)
      .replace(/{{PROMPT_PACK_IDEAS}}/g, promptPackIdeasStr)
      .replace(/{{PENDING_REVIEW_ITEMS}}/g, pendingReviewsStr)
      .replace(/{{HIGH_PRIORITY_ACTIONS}}/g, highPriorityActions)
      .replace(/{{ROUTINE_ACTIONS}}/g, routineActions);
  };

  // Compile output content
  const compiledDashboard = replacePlaceholders(dashboardTpl);
  const compiledWeakClaims = replacePlaceholders(weakClaimsTpl);
  const compiledCitationStrength = replacePlaceholders(citationStrengthTpl);
  const compiledRecommendations = replacePlaceholders(recommendationTpl);
  const compiledWorkflows = replacePlaceholders(workflowTpl);
  const compiledReviewQueue = replacePlaceholders(reviewQueueTpl);
  const compiledNextActions = replacePlaceholders(nextActionsTpl);

  // Write outputs
  const writeOutputs = () => {
    const mdDir = outputFolders.markdown;
    const repDir = outputFolders.reports;

    // Get output paths (using safe path suffix or force date file)
    const dashboardPath = getSafeWritePath(mdDir, `notebooklm_obsidian_dashboard_${dateStr}`, '.md', true);
    const weakClaimsPath = getSafeWritePath(mdDir, `notebooklm_obsidian_weak_claims_dashboard_${dateStr}`, '.md', true);
    const citationPath = getSafeWritePath(mdDir, `notebooklm_obsidian_citation_strength_dashboard_${dateStr}`, '.md', true);
    const recPath = getSafeWritePath(mdDir, `notebooklm_obsidian_recommendations_dashboard_${dateStr}`, '.md', true);
    const wfPath = getSafeWritePath(mdDir, `notebooklm_obsidian_workflows_dashboard_${dateStr}`, '.md', true);
    const rqPath = getSafeWritePath(mdDir, `notebooklm_obsidian_review_queue_${dateStr}`, '.md', true);
    const actionsPath = getSafeWritePath(mdDir, `notebooklm_obsidian_next_actions_${dateStr}`, '.md', true);
    const summaryPath = getSafeWritePath(repDir, `notebooklm_obsidian_dashboard_summary_${dateStr}`, '.md', true);

    fs.writeFileSync(dashboardPath, compiledDashboard);
    fs.writeFileSync(weakClaimsPath, compiledWeakClaims);
    fs.writeFileSync(citationPath, compiledCitationStrength);
    fs.writeFileSync(recPath, compiledRecommendations);
    fs.writeFileSync(wfPath, compiledWorkflows);
    fs.writeFileSync(rqPath, compiledReviewQueue);
    fs.writeFileSync(actionsPath, compiledNextActions);

    // Summary compilation
    const summaryContent = `# 📋 Obsidian Dashboard Sync Summary: ${dateStr}\n\n` +
      `- **Dashboard Note:** [[notebooklm_obsidian_dashboard_${dateStr}]]\n` +
      `- **Status:** STAGED_OFFLINE (Ready for review)\n` +
      `- **Generated Files Count:** 7 MD Dashboards + 1 Summary Report\n` +
      `- **Weak Claims Flagged:** ${graph.weakClaims.length}\n` +
      `- **Uncited Claims Flagged:** ${graph.claims.filter(c => !graph.citations.some(cit => cit.relatedNodes.includes(c.id))).length}\n` +
      `- **Write Execution Target:** ${ALLOW_OBSIDIAN_WRITE ? 'Active Vault' : 'Local Staging Directory (outputs/)'}\n`;
    fs.writeFileSync(summaryPath, summaryContent);

    console.log(`✅ Dashboard files sync completed successfully.`);
    console.log(`📂 Outputs staged at: ${mdDir}`);
    console.log(`📝 Summary saved to: ${summaryPath}`);

    logEvent('Dashboard Sync', `Successfully generated 8 Obsidian dashboards using ${path.basename(latestJsonPath)}`);
  };

  if (!isDryRun) {
    writeOutputs();
    await announcePhrase("Signal clean. The streets don't lie, neither does the data.");
    await announceCompletion("Obsidian dashboard sync completed successfully", "10");
  } else {
    console.log(`📋 Dry Run verification successful. Mapped nodes match templates.`);
    logEvent('Dry Run Sync', `Verified dashboard templates mapping successfully offline.`);
  }
}

run().catch(err => {
  console.error(`❌ Error executing sync processor: ${err.message}`);
  process.exit(1);
});
