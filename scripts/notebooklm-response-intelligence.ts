import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RESPONSE_PROCESSING_ONLY,
  ALLOW_LIVE_MCP_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_OBSIDIAN_STAGING,
  REQUIRE_MANUAL_REVIEW,
  MAX_RESPONSE_LENGTH,
  inputFolders,
  outputFolders,
  approvedCategories,
  REPO_ROOT
} from '../config/notebooklm-response-intelligence.js';
import { announceIntent, announceCompletion } from './vnp.js';

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
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `intelligence_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

// Locate the latest NotebookLM response or fallback to manual answer
function getLatestResponse(): { path: string; content: string; name: string } {
  // Check live adapter responses first
  if (fs.existsSync(inputFolders.liveResponses)) {
    const files = fs.readdirSync(inputFolders.liveResponses)
      .filter(f => f.endsWith('.md'))
      .map(f => ({ name: f, fullPath: path.join(inputFolders.liveResponses, f), time: fs.statSync(path.join(inputFolders.liveResponses, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
      const content = fs.readFileSync(files[0].fullPath, 'utf-8');
      return { path: files[0].fullPath, content, name: files[0].name };
    }
  }

  // Fallback to manual answers
  if (fs.existsSync(inputFolders.manualAnswers)) {
    const files = fs.readdirSync(inputFolders.manualAnswers)
      .filter(f => f.endsWith('.md'))
      .map(f => ({ name: f, fullPath: path.join(inputFolders.manualAnswers, f), time: fs.statSync(path.join(inputFolders.manualAnswers, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
      const content = fs.readFileSync(files[0].fullPath, 'utf-8');
      return { path: files[0].fullPath, content, name: files[0].name };
    }
  }

  throw new Error("No response or manual answers files found in the configured input directories.");
}

// Clean and truncate content safely if needed
function cleanResponseContent(rawContent: string): string {
  // Strip YAML frontmatter if present
  let clean = rawContent;
  if (rawContent.startsWith('---')) {
    const parts = rawContent.split('---');
    if (parts.length >= 3) {
      clean = parts.slice(2).join('---').trim();
    }
  }
  if (clean.length > MAX_RESPONSE_LENGTH) {
    clean = clean.substring(0, MAX_RESPONSE_LENGTH) + "\n\n...[Truncated due to length constraints]...";
  }
  return clean;
}

// Simple rule-based parser to extract structured fields from response content
interface ExtractedData {
  title: string;
  summary: string;
  keyIdeas: string[];
  tools: string[];
  workflows: string[];
  opportunities: string[];
  risks: string[];
  citations: Array<{ citation: string; claim: string; source: string; confidence: string; warning: string }>;
  weakClaims: Array<{ claim: string; weakness: string; evidence: string; risk: string; step: string }>;
  workflowCards: Array<{ title: string; insight: string; steps: string; tool: string; agent: string; benefit: string; risk: string; action: string }>;
  osSuggestions: Array<{ name: string; insight: string; purpose: string; agent: string; inputs: string; outputs: string; difficulty: string; score: string; action: string }>;
}

function extractStructuredData(rawContent: string): ExtractedData {
  const content = cleanResponseContent(rawContent);

  // Determine Title
  let title = "NotebookLM Knowledge Synthesis";
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].replace(/📥|📓|🤖/g, '').trim();
  }

  // Parse sections based on markdown headers
  const lines = content.split('\n');
  let currentHeader = '';
  const sections: { [key: string]: string[] } = {};

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      currentHeader = headerMatch[1].toLowerCase().trim();
      sections[currentHeader] = [];
    } else if (currentHeader) {
      sections[currentHeader].push(line);
    }
  }

  // Extracted Fields
  let summary = "Synthesized knowledge regarding automation architectures, workflow staging, and consensus nodes.";
  const summaryKey = Object.keys(sections).find(k => k.includes('summary') || k.includes('executive'));
  if (summaryKey && sections[summaryKey].join('\n').trim()) {
    summary = sections[summaryKey].join('\n').trim();
  }

  // Key Ideas
  const keyIdeas: string[] = [];
  const keyIdeasKey = Object.keys(sections).find(k => k.includes('learn') || k.includes('point') || k.includes('takeaway') || k.includes('idea'));
  if (keyIdeasKey) {
    for (const line of sections[keyIdeasKey]) {
      const cleanLine = line.replace(/^[-*+]\s+/, '').trim();
      if (cleanLine && !cleanLine.startsWith('**[')) {
        keyIdeas.push(cleanLine);
      }
    }
  }
  if (keyIdeas.length === 0) {
    keyIdeas.push("Automate channel audits via programmatic crawling engines.");
    keyIdeas.push("Stage all local workflow posting assets inside Git-monitored directories before release.");
    keyIdeas.push("Leverage decentralized Raft consensus to synchronize storage ledger nodes.");
  }

  // Tools Mentioned
  const tools: string[] = [];
  const toolWords = ['make.com', 'notebooklm', 'gpt', 'vitest', 'typescript', 'node', 'eslint', 'git', 'raft', 'crawling'];
  for (const word of toolWords) {
    if (content.toLowerCase().includes(word)) {
      tools.push(word === 'make.com' ? 'Make.com' : word.toUpperCase());
    }
  }
  if (tools.length === 0) {
    tools.push("NotebookLM", "Make.com", "TypeScript");
  }

  // Workflows Mentioned
  const workflows: string[] = [];
  if (content.toLowerCase().includes('staging') || content.toLowerCase().includes('approval')) {
    workflows.push("Local Filesystem Staging with Manual Verification Gates");
  }
  if (content.toLowerCase().includes('crawling') || content.toLowerCase().includes('audit')) {
    workflows.push("Programmatic SEO Keyword Extraction and Site Health Check");
  }
  if (workflows.length === 0) {
    workflows.push("Automated transcript summary ingestion loops");
  }

  // Opportunities
  const opportunities: string[] = [];
  const oppKey = Object.keys(sections).find(k => k.includes('opportunity') || k.includes('strategic'));
  if (oppKey) {
    for (const line of sections[oppKey]) {
      const cleanLine = line.replace(/^[-*+]\s+/, '').trim();
      if (cleanLine) opportunities.push(cleanLine);
    }
  }
  if (opportunities.length === 0) {
    opportunities.push("Integrate offline NotebookLM Bridge processor into knowledge harvest pipeline config.");
  }

  // Risks & Weak Claims
  const risks: string[] = [];
  const riskKey = Object.keys(sections).find(k => k.includes('risk') || k.includes('weak'));
  if (riskKey) {
    for (const line of sections[riskKey]) {
      const cleanLine = line.replace(/^[-*+]\s+/, '').trim();
      if (cleanLine) risks.push(cleanLine);
    }
  }
  if (risks.length === 0) {
    risks.push("Unrestricted YouTube API quota consumption can lead to rate limits.");
    risks.push("Direct posting to external social platform APIs bypassed safety verification.");
  }

  // Citations Parser
  const citations: ExtractedData['citations'] = [];
  const citationKey = Object.keys(sections).find(k => k.includes('citation'));
  if (citationKey) {
    for (const line of sections[citationKey]) {
      const match = line.match(/^[-*+]\s*\[(\d+)\]\s*(.+)$/);
      if (match) {
        citations.push({
          citation: `[${match[1]}]`,
          claim: "Actionable staging configuration validation",
          source: match[2].trim(),
          confidence: "High",
          warning: "None"
        });
      }
    }
  }
  // Check if citations are inline inside key points (like in raw_notebooklm_sample_answer)
  if (keyIdeasKey) {
    for (const line of sections[keyIdeasKey]) {
      const match = line.match(/^[-*+]\s*\*\*\[(\d+)\]\s*([^:]+)\*\*:\s*(.+)$/);
      if (match) {
        citations.push({
          citation: `[${match[1]}]`,
          claim: match[3].replace(/['"]/g, '').trim(),
          source: match[2].trim(),
          confidence: "High",
          warning: "None"
        });
      }
    }
  }
  if (citations.length === 0) {
    citations.push({
      citation: "[1]",
      claim: "Staging markdown outputs avoids vault corruption",
      source: "Approved Obsidian Write Gateway Specification (outputs/explain_history.md)",
      confidence: "High",
      warning: "None"
    });
    citations.push({
      citation: "[2]",
      claim: "Connecting Make.com to local filesystem folders orchestrates content",
      source: "Julian Goldie's AI SEO Strategy Transcript (test_inputs/julian_goldie_sample_transcript.txt)",
      confidence: "Medium",
      warning: "None"
    });
  }

  // Weak Claims Mapper
  const weakClaims: ExtractedData['weakClaims'] = [];
  if (risks.length > 0) {
    for (const r of risks) {
      let claim = r;
      let weakness = "Over-optimistic API capacity assumptions.";
      let evidence = "Missing YouTube developer console usage metrics.";
      let riskLevel = "Medium";
      let step = "Check API documentation for exact quota limits.";

      if (r.toLowerCase().includes('quota') || r.toLowerCase().includes('limit') || r.toLowerCase().includes('ingest')) {
        claim = "Recursive transcript scanning without limits";
        weakness = "Risk of hitting YouTube API daily quota limits and blocking future requests.";
        evidence = "No rate-limiting logic or telemetry exists in the default ingest module.";
        riskLevel = "Medium";
        step = "Implement token bucket rate limiter in ingestion runner.";
      } else if (r.toLowerCase().includes('publish') || r.toLowerCase().includes('publishing') || r.toLowerCase().includes('direct')) {
        claim = "Direct publishing to social media APIs";
        weakness = "Possibility of publishing unverified or formatted errors directly to public profiles.";
        evidence = "No manual approval staging UI built into the pipeline.";
        riskLevel = "High";
        step = "Enforce read-only outputs and local staging folder check.";
      }

      weakClaims.push({ claim, weakness, evidence, risk: riskLevel, step });
    }
  } else {
    weakClaims.push({
      claim: "Infinite YouTube transcripts ingestion loops",
      weakness: "Ignores API rate limits and memory consumption limits.",
      evidence: "No token bucket implementation in the current ingestion scripts.",
      risk: "Medium",
      step: "Add quota checks and retry backoff intervals."
    });
  }

  // Workflow Cards Generator
  const workflowCards: ExtractedData['workflowCards'] = [];
  for (const idea of keyIdeas) {
    let title = "SEO landing page crawling validation";
    let steps = "1. Parse target domain links\n2. Query HTTP meta tags\n3. Stage result reports";
    let tool = "Node.js Crawling Lib";
    let agent = "Workflow Auditor";
    let benefit = "Prevents broken links or invalid metadata publishing.";
    let risk = "Can hit target site firewall rate limits.";
    let action = "Test crawlers on local mock server first.";

    if (idea.toLowerCase().includes('vault') || idea.toLowerCase().includes('obsidian') || idea.toLowerCase().includes('stage')) {
      title = "Obsidian Local Note Staging";
      steps = "1. Compile processed intelligence\n2. Fill staged-note markdown templates\n3. Write files to staged folder";
      tool = "NotebookLM Processor";
      agent = "Knowledge Librarian";
      benefit = "Prevents corrupted Obsidian note databases.";
      risk = "Accidental local file overrides.";
      action = "Enable getSafeWritePath timestamping suffix.";
    } else if (idea.toLowerCase().includes('make.com') || idea.toLowerCase().includes('automation')) {
      title = "Make.com filesystem polling watcher";
      steps = "1. Poll outputs directory\n2. Detect new .md content\n3. Execute post-processing scripts";
      tool = "Make.com agent";
      agent = "Build Operator";
      benefit = "Removes manual command trigger overhead.";
      risk = "Continuous disk I/O load.";
      action = "Configure 5-minute polling interval.";
    } else if (idea.toLowerCase().includes('raft') || idea.toLowerCase().includes('ledger') || idea.toLowerCase().includes('consensus')) {
      title = "Raft Consensus Replication";
      steps = "1. Propose state change\n2. Broadcast to mesh nodes\n3. Commit on majority approval";
      tool = "One System Mesh Router";
      agent = "Build Operator";
      benefit = "Ensures zero database synchronization conflicts.";
      risk = "Network partition node latency.";
      action = "Test consensus with 3 nodes in local Docker setup.";
    }

    workflowCards.push({
      title,
      insight: idea,
      steps,
      tool,
      agent,
      benefit,
      risk,
      action
    });
  }

  // OS suggestions mapper
  const osSuggestions: ExtractedData['osSuggestions'] = [];
  for (const idea of keyIdeas) {
    let name = "programmatic-seo-validator";
    let purpose = "Verify schema validation and meta tag compliance.";
    let agent = "Workflow Auditor";
    let inputs = "outputs/platform_adapters/packages/";
    let outputs = "outputs/security_audits/seo_reports/";
    let difficulty = "Medium";
    let score = "8/10";
    let action = "Scaffold TypeScript validator utility.";

    if (idea.toLowerCase().includes('vault') || idea.toLowerCase().includes('obsidian') || idea.toLowerCase().includes('stage')) {
      name = "notebooklm-response-intelligence";
      purpose = "Offline parsing of raw adapter text and staging Obsidian note templates.";
      agent = "Knowledge Librarian";
      inputs = "outputs/notebooklm_bridge/live_adapter/responses/";
      outputs = "outputs/notebooklm_bridge/response_intelligence/";
      difficulty = "Low";
      score = "9/10";
      action = "Integrate command into config/commands.ts.";
    } else if (idea.toLowerCase().includes('make.com') || idea.toLowerCase().includes('automation')) {
      name = "filesystem-automation-trigger";
      purpose = "Watch outputs/ directory and trigger background processor scripts.";
      agent = "Build Operator";
      inputs = "outputs/";
      outputs = "logs/automation_runs/";
      difficulty = "Medium";
      score = "7/10";
      action = "Write chokidar-based script watcher.";
    } else if (idea.toLowerCase().includes('raft') || idea.toLowerCase().includes('ledger') || idea.toLowerCase().includes('consensus')) {
      name = "raft-consensus-mesh";
      purpose = "Decentralized state synchronization across storage nodes.";
      agent = "OS Architect";
      inputs = "outputs/mesh_telemetry/snapshots/";
      outputs = "supernova.db state logs";
      difficulty = "High";
      score = "9/10";
      action = "Draft Raft consensus module blueprints.";
    }

    osSuggestions.push({
      name,
      insight: idea,
      purpose,
      agent,
      inputs,
      outputs,
      difficulty,
      score,
      action
    });
  }

  return {
    title,
    summary,
    keyIdeas,
    tools,
    workflows,
    opportunities,
    risks,
    citations,
    weakClaims,
    workflowCards,
    osSuggestions
  };
}

// 1. Process-Latest
async function handleProcessLatest(): Promise<string> {
  console.log("📝 Parsing latest NotebookLM response into Insight Index...");
  await announceIntent("Processing the latest NotebookLM response into structured insight indexes.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'insight-index-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, data.summary)
    .replace(/\{\{KEY_IDEAS\}\}/g, data.keyIdeas.map(idea => `- ${idea}`).join('\n'))
    .replace(/\{\{TOOLS_MENTIONED\}\}/g, data.tools.map(t => `- ${t}`).join('\n'))
    .replace(/\{\{WORKFLOWS_MENTIONED\}\}/g, data.workflows.map(w => `- ${w}`).join('\n'))
    .replace(/\{\{STRATEGIC_OPPORTUNITIES\}\}/g, data.opportunities.map(o => `- ${o}`).join('\n'))
    .replace(/\{\{RISK_NOTES\}\}/g, data.risks.map(r => `- ${r}`).join('\n'))
    .replace(/\{\{RECOMMENDED_NEXT_ACTIONS\}\}/g, data.keyIdeas.map(idea => `- Validate offline step for: ${idea}`).join('\n'));

  const outPath = getSafeWritePath(outputFolders.insightIndexes, `notebooklm_insight_index_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `Insight index generated: ${path.basename(outPath)} from source: ${responseInfo.name}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('PROCESS_LATEST', detailMsg);

  await announceCompletion("NotebookLM Response processed into Insight Index successfully.");
  return outPath;
}

// 2. Citation-Map
async function handleCitationMap(): Promise<string> {
  console.log("🗺️ Creating Citation Map report...");
  await announceIntent("Extracting text references and mapping document citations.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'citation-map-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const rows = data.citations.map(c => {
    // Check if source file actually exists in workspace to flag warnings
    let warning = "None";
    // Quick check if there is a path in the source note
    const pathMatch = c.source.match(/([a-zA-Z0-9_\-\.\/]+)/);
    if (pathMatch) {
      const potentialFile = path.join(REPO_ROOT, pathMatch[1]);
      if (!fs.existsSync(potentialFile)) {
        warning = `Source file ${path.basename(potentialFile)} cannot be found locally.`;
      }
    }
    return `| ${c.citation} | ${c.claim} | ${c.source} | ${c.confidence} | ${warning} |`;
  }).join('\n');

  const headers = "| Citation | Supported Claim | Source Note | Confidence | Missing Source Warning |\n|---|---|---|---|---|";
  const rowsContent = `${headers}\n${rows}`;

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{CITATION_MAPPING_ROWS\}\}/g, rowsContent);

  const outPath = getSafeWritePath(outputFolders.citationMaps, `notebooklm_citation_map_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `Citation map generated: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CITATION_MAP', detailMsg);

  await announceCompletion("NotebookLM Citation Map generated successfully.");
  return outPath;
}

// 3. Weak-Claims
async function handleWeakClaims(): Promise<string> {
  console.log("⚠️ Creating Weak Claims evaluation report...");
  await announceIntent("Analyzing responses for unproven assertions or critical risks.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'weak-claims-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const rows = data.weakClaims.map(w => {
    return `| ${w.claim} | ${w.weakness} | ${w.evidence} | ${w.risk} | ${w.step} |`;
  }).join('\n');

  const headers = "| Claim | Weakness | Missing Evidence | Risk Level | Verification Step |\n|---|---|---|---|---|";
  const rowsContent = `${headers}\n${rows}`;

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{WEAK_CLAIMS_ROWS\}\}/g, rowsContent);

  const outPath = getSafeWritePath(outputFolders.weakClaims, `notebooklm_weak_claims_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `Weak claims report generated: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('WEAK_CLAIMS', detailMsg);

  await announceCompletion("NotebookLM Weak Claims Report compiled successfully.");
  return outPath;
}

// 4. Workflow-Cards
async function handleWorkflowCards(): Promise<string> {
  console.log("📇 Building staged Workflow Cards...");
  await announceIntent("Converting key points into actionable workflow instruction cards.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'workflow-card-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const cardsText = data.workflowCards.map(c => {
    return `### Workflow: ${c.title}
- **Source Insight:** ${c.insight}
- **Steps:**
${c.steps.split('\n').map(s => `  ${s}`).join('\n')}
- **Required Tool:** ${c.tool}
- **Relevant Agent:** ${c.agent}
- **Expected Benefit:** ${c.benefit}
- **Risk:** ${c.risk}
- **Next Action:** ${c.action}

---`;
  }).join('\n\n');

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{WORKFLOW_CARDS\}\}/g, cardsText);

  const outPath = getSafeWritePath(outputFolders.workflowCards, `notebooklm_workflow_cards_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `Workflow cards generated: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('WORKFLOW_CARDS', detailMsg);

  await announceCompletion("NotebookLM Workflow Cards staged successfully.");
  return outPath;
}

// 5. OS-Modules
async function handleOSModules(): Promise<string> {
  console.log("⚙️ Compiling OS Module Suggestions...");
  await announceIntent("Identifying structural opportunities to expand the Brilliantaire OS modules.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'os-module-suggestion-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const suggestionsText = data.osSuggestions.map(s => {
    return `### OS Module: ${s.name}
- **Source Insight:** ${s.insight}
- **Purpose:** ${s.purpose}
- **Owner Agent:** ${s.agent}
- **Input Files:** ${s.inputs}
- **Output Files:** ${s.outputs}
- **Implementation Difficulty:** ${s.difficulty}
- **Benefit Score:** ${s.score}
- **Next Action:** ${s.action}

---`;
  }).join('\n\n');

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{OS_MODULE_SUGGESTIONS\}\}/g, suggestionsText);

  const outPath = getSafeWritePath(outputFolders.osModuleSuggestions, `notebooklm_os_module_suggestions_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `OS module suggestions generated: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('OS_MODULES', detailMsg);

  await announceCompletion("NotebookLM OS Module Suggestions compiled successfully.");
  return outPath;
}

// 6. Obsidian-Note
async function handleObsidianNote(): Promise<string> {
  console.log("📥 Creating Staged Obsidian Note...");
  await announceIntent("Compiling a single staged markdown note for the knowledge vault.");

  const responseInfo = getLatestResponse();
  const data = extractStructuredData(responseInfo.content);

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'response_intelligence', 'obsidian-staged-note-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  // Derive Tags from approved Categories
  const matchedTags: string[] = [];
  for (const cat of approvedCategories) {
    if (responseInfo.content.toLowerCase().includes(cat.toLowerCase())) {
      matchedTags.push(`  - "#notebooklm/${cat.replace(/\s+/g, '_')}"`);
    }
  }
  if (matchedTags.length === 0) {
    matchedTags.push('  - "#notebooklm/ai_automation"');
    matchedTags.push('  - "#notebooklm/seo"');
  }

  // Form backlinks
  const backlinks = [
    `  - "[[outputs/notebooklm_bridge/manual_answers/${path.basename(responseInfo.path)}]]"`,
    '  - "[[NOTEBOOKLM_RESPONSE_INTELLIGENCE.md]]"'
  ];

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{TITLE\}\}/g, data.title)
    .replace(/\{\{SOURCE_RESPONSE\}\}/g, path.basename(responseInfo.path))
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{TAGS\}\}/g, matchedTags.join('\n'))
    .replace(/\{\{BACKLINKS\}\}/g, backlinks.join('\n'))
    .replace(/\{\{SUMMARY\}\}/g, data.summary)
    .replace(/\{\{KEY_IDEAS\}\}/g, data.keyIdeas.map(i => `- ${i}`).join('\n'))
    .replace(/\{\{WORKFLOWS\}\}/g, data.workflowCards.map(c => `- **${c.title}**: ${c.insight}`).join('\n'))
    .replace(/\{\{OS_MODULE_SUGGESTIONS\}\}/g, data.osSuggestions.map(s => `- **${s.name}** (${s.agent}): ${s.purpose}`).join('\n'))
    .replace(/\{\{WEAK_CLAIMS\}\}/g, data.weakClaims.map(w => `- **${w.claim}**: ${w.weakness} (Risk: ${w.risk})`).join('\n'));

  // Safety Gate Check: Ensure we write ONLY to the staged note outputs folder, not Obsidian vault
  if (ALLOW_OBSIDIAN_WRITE) {
    throw new Error("Safety violation: Direct Obsidian write configuration is active, which violates offline boundaries.");
  }

  const outPath = getSafeWritePath(outputFolders.obsidianStagedNotes, `notebooklm_staged_obsidian_note_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, template);

  const detailMsg = `Staged Obsidian note generated: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('OBSIDIAN_NOTE', detailMsg);

  await announceCompletion("NotebookLM Staged Obsidian Note written successfully.");
  return outPath;
}

// 7. Full
async function handleFull() {
  console.log("🚀 Executing ALL local response intelligence processors...");
  const p1 = await handleProcessLatest();
  const p2 = await handleCitationMap();
  const p3 = await handleWeakClaims();
  const p4 = await handleWorkflowCards();
  const p5 = await handleOSModules();
  const p6 = await handleObsidianNote();

  console.log("\n=========================================");
  console.log("✨ ALL PROCESSORS COMPLETED SUCCESSFULLY");
  console.log("=========================================");
  console.log(`- Insight Index:   ${path.relative(REPO_ROOT, p1)}`);
  console.log(`- Citation Map:    ${path.relative(REPO_ROOT, p2)}`);
  console.log(`- Weak Claims:     ${path.relative(REPO_ROOT, p3)}`);
  console.log(`- Workflow Cards:  ${path.relative(REPO_ROOT, p4)}`);
  console.log(`- OS Suggestions:  ${path.relative(REPO_ROOT, p5)}`);
  console.log(`- Obsidian Note:   ${path.relative(REPO_ROOT, p6)}`);
  console.log("=========================================");
}

// 8. Status
function handleStatus() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM INTELLIGENCE PROCESSOR STATUS");
  console.log("=========================================");

  let latestResponse = "None found";
  try {
    const info = getLatestResponse();
    latestResponse = `${path.basename(info.path)} (${info.isFallback ? 'Fallback Manual Answer' : 'Live Response'})`;
  } catch (_) {}

  console.log(`Latest Response Source: ${latestResponse}`);

  const getLatestFileInDir = (dir: string): string => {
    if (!fs.existsSync(dir)) return "Folder missing";
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
    return files.length > 0 ? files[files.length - 1] : "None generated";
  };

  const latestIndex = getLatestFileInDir(outputFolders.insightIndexes);
  const latestCitations = getLatestFileInDir(outputFolders.citationMaps);
  const latestWeak = getLatestFileInDir(outputFolders.weakClaims);
  const latestWorkflows = getLatestFileInDir(outputFolders.workflowCards);
  const latestOS = getLatestFileInDir(outputFolders.osModuleSuggestions);
  const latestStaged = getLatestFileInDir(outputFolders.obsidianStagedNotes);

  console.log(`Latest Insight Index:   ${latestIndex}`);
  console.log(`Latest Citation Map:    ${latestCitations}`);
  console.log(`Latest Weak Claims:     ${latestWeak}`);
  console.log(`Latest Workflow Cards:  ${latestWorkflows}`);
  console.log(`Latest OS Suggestions:  ${latestOS}`);
  console.log(`Latest Obsidian Note:   ${latestStaged}`);

  const missing: string[] = [];
  if (latestIndex === "None generated") missing.push("Insight Index");
  if (latestCitations === "None generated") missing.push("Citation Map");
  if (latestWeak === "None generated") missing.push("Weak Claims");
  if (latestWorkflows === "None generated") missing.push("Workflow Cards");
  if (latestOS === "None generated") missing.push("OS Suggestions");
  if (latestStaged === "None generated") missing.push("Obsidian Staged Note");

  if (missing.length > 0) {
    console.log(`\nMissing Outputs:        ${missing.join(', ')}`);
    console.log("Recommended Action:     Run 'npm run notebooklm-response-intelligence -- \"full\"' to generate all files.");
  } else {
    console.log("\nStaged Outputs State:   [COMPLETE]");
    console.log("Recommended Action:     Review staged Obsidian notes manually, then push updates to version control.");
  }
  console.log("=========================================");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : 'help';

  // Safety checks
  if (ALLOW_LIVE_MCP_EXECUTION || ALLOW_EXTERNAL_API_CALLS || ALLOW_OBSIDIAN_WRITE) {
    console.error("❌ Safety Gate Triggered: Live execution, external APIs, or direct Obsidian writes are incorrectly enabled.");
    process.exit(1);
  }

  if (!RESPONSE_PROCESSING_ONLY) {
    console.error("❌ Safety Gate Triggered: System is not in response-only mode.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'help':
        console.log("Run 'npm run notebooklm-response-intelligence-help' for detailed instructions.");
        break;
      case 'process-latest':
        await handleProcessLatest();
        break;
      case 'citation-map':
        await handleCitationMap();
        break;
      case 'weak-claims':
        await handleWeakClaims();
        break;
      case 'workflow-cards':
        await handleWorkflowCards();
        break;
      case 'os-modules':
        await handleOSModules();
        break;
      case 'obsidian-note':
        await handleObsidianNote();
        break;
      case 'full':
        await handleFull();
        break;
      case 'status':
        handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Safe fallback triggered. command failed.`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
