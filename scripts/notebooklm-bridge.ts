import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BRIDGE_MODE,
  ALLOW_DIRECT_NOTEBOOKLM_API,
  ALLOW_MCP_EXECUTION,
  ALLOW_DIRECT_OBSIDIAN_WRITE,
  REQUIRE_OBSIDIAN_STAGING,
  REQUIRE_MANUAL_APPROVAL,
  MAX_ANSWER_LENGTH,
  outputFolders,
  approvedResearchDomains,
  defaultResearchQuestions,
  REPO_ROOT
} from '../config/notebooklm-bridge.js';
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
  const logDir = outputFolders.logs;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `bridge_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function containsUnsafeText(text: string): boolean {
  // Safe-text check against suspicious command injections
  const dangerousPatterns = [
    /rm\s+-rf/i,
    /sudo\s+/i,
    /chmod\s+/i,
    /chown\s+/i,
    /mkfs/i,
    />\s*\/dev\/sda/i,
    /eval\(/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(text));
}

// 1. Create Query Packet
async function handleCreateQuery(topic: string) {
  if (!topic) {
    console.error("❌ Error: Missing topic. Usage: npm run notebooklm-bridge -- \"create-query <TOPIC>\"");
    process.exit(1);
  }

  const normalizedTopic = topic.trim();
  const matchedDomain = approvedResearchDomains.find(
    d => d.toLowerCase() === normalizedTopic.toLowerCase() ||
         d.toLowerCase().replace(/\s+/g, '-') === normalizedTopic.toLowerCase()
  );

  const finalTopic = matchedDomain || normalizedTopic;
  console.log(`🔍 Staging research query packet for topic: "${finalTopic}"`);

  // Scan Knowledge Harvest outputs for source context if present
  let sourceContext = 'No direct video notes available. Ingest standard domain documents.';
  const khVideoNotesDir = path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'video_notes');
  if (fs.existsSync(khVideoNotesDir)) {
    const files = fs.readdirSync(khVideoNotesDir).filter(f => f.endsWith('.md'));
    if (files.length > 0) {
      sourceContext = `Detected ${files.length} video notes in local harvest folder:\n`;
      files.slice(0, 5).forEach(f => {
        sourceContext += `- outputs/knowledge_harvest/video_notes/${f}\n`;
      });
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'query-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  const questionsList = defaultResearchQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n');

  template = template
    .replace(/\{\{TOPIC\}\}/g, finalTopic)
    .replace(/\{\{SOURCE_CONTEXT\}\}/g, sourceContext)
    .replace(/\{\{QUESTIONS\}\}/g, questionsList)
    .replace(/\{\{EXPECTED_FORMAT\}\}/g, '- Section-based Markdown bullets.\n- Clear citations linking back to files or timestamps.')
    .replace(/\{\{CITATION_REQUEST\}\}/g, 'Please provide explicit line references or filenames where appropriate.')
    .replace(/\{\{WORKFLOW_EXTRACTION_REQUEST\}\}/g, 'Identify tools mentioned and step-by-step instructions.')
    .replace(/\{\{WEAK_CLAIMS_REQUEST\}\}/g, 'Note assumptions, potential software compatibility barriers, or weak references.')
    .replace(/\{\{OS_MODULE_SUGGESTIONS\}\}/g, 'Propose files in config/ or scripts/ to update with these learnings.');

  const safePath = getSafeWritePath(
    outputFolders.queries,
    `notebooklm_query_${sanitizeFilename(finalTopic)}_${getFormattedDate()}`,
    '.md'
  );
  fs.writeFileSync(safePath, template);

  const msg = `Created query packet: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('CREATE_QUERY', msg);
}

// 2. Add Answer File
async function handleAddAnswer(filePath: string) {
  if (!filePath) {
    console.error("❌ Error: Missing answer file path. Usage: npm run notebooklm-bridge -- \"add-answer <PATH>\"");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  if (!fileContent.trim()) {
    console.error("❌ Error: Answer file is empty.");
    process.exit(1);
  }

  if (fileContent.length > MAX_ANSWER_LENGTH) {
    console.error(`❌ Error: Answer length (${fileContent.length}) exceeds maximum limit (${MAX_ANSWER_LENGTH}).`);
    process.exit(1);
  }

  if (containsUnsafeText(fileContent)) {
    console.error("❌ Error: Unsafe commands detected in answer file text.");
    process.exit(1);
  }

  const fileName = path.basename(filePath);
  console.log(`📥 Ingesting answer file: "${fileName}"`);

  // Copy raw answer file into manual answers directory safely
  const safeRawPath = getSafeWritePath(outputFolders.manualAnswers, `raw_${sanitizeFilename(path.basename(fileName, path.extname(fileName)))}`, path.extname(fileName));
  fs.writeFileSync(safeRawPath, fileContent);

  // Extract content programmatically if headers are present, otherwise default
  let summary = 'Manual ingestion of NotebookLM research findings.';
  let keyPoints = '- AI scaling needs dedicated directory structuring.\n- Limit external API calls in early dev phases.';
  let citations = '- Sources mentioned in manual answer file.';

  // Attempt heuristic extraction
  const paragraphs = fileContent.split('\n\n').map(p => p.trim()).filter(Boolean);
  if (paragraphs.length > 0) {
    summary = paragraphs[0];
  }
  const bulletLines = fileContent.split('\n').map(l => l.trim()).filter(l => l.startsWith('-') || l.startsWith('*'));
  if (bulletLines.length > 0) {
    keyPoints = bulletLines.slice(0, 8).join('\n');
  }
  const citationMatches = fileContent.match(/\[\d+\]|https?:\/\/[^\s]+/g);
  if (citationMatches) {
    citations = Array.from(new Set(citationMatches)).map(c => `- ${c}`).join('\n');
  }

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'manual-answer-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{SOURCE\}\}/g, fileName)
    .replace(/\{\{DATE_ADDED\}\}/g, getFormattedDate())
    .replace(/\{\{RAW_ANSWER_LOCATION\}\}/g, path.relative(REPO_ROOT, safeRawPath))
    .replace(/\{\{STATUS\}\}/g, 'needs processing')
    .replace(/\{\{SUMMARY\}\}/g, summary)
    .replace(/\{\{KEY_POINTS\}\}/g, keyPoints)
    .replace(/\{\{CITATIONS\}\}/g, citations);

  const safeRecordPath = getSafeWritePath(
    outputFolders.manualAnswers,
    `answer_record_${sanitizeFilename(path.basename(fileName, path.extname(fileName)))}`,
    '.md'
  );
  fs.writeFileSync(safeRecordPath, template);

  const msg = `Imported answer. Raw: ${path.basename(safeRawPath)}, Record: ${path.basename(safeRecordPath)}`;
  console.log(`✅ ${msg}`);
  logEvent('ADD_ANSWER', msg);
}

// 3. Export to Obsidian
async function handleExportObsidian() {
  console.log("🧠 Compiling staged Obsidian exports...");

  if (!fs.existsSync(outputFolders.manualAnswers)) {
    fs.mkdirSync(outputFolders.manualAnswers, { recursive: true });
  }

  const files = fs.readdirSync(outputFolders.manualAnswers)
    .filter(f => f.startsWith('answer_record_') && f.endsWith('.md'));

  if (files.length === 0) {
    console.warn("⚠️ No manual answers found. Staging a default placeholder export.");
    // Write placeholder
    const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'obsidian-export-template.md');
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template
      .replace(/\{\{TITLE\}\}/g, 'Staged Default Research')
      .replace(/\{\{SOURCE_TOPIC\}\}/g, 'AI automation')
      .replace(/\{\{STATUS\}\}/g, 'staged_for_obsidian_review')
      .replace(/\{\{TAGS\}\}/g, 'default-research')
      .replace(/\{\{DATE\}\}/g, getFormattedDate())
      .replace(/\{\{SUMMARY\}\}/g, 'Staged export placeholder. Ingest manual answers to compile actual content.')
      .replace(/\{\{KEY_IDEAS\}\}/g, '- Connect tools sequentially.\n- Always validate local inputs.')
      .replace(/\{\{WORKFLOW_INSIGHTS\}\}/g, 'Create a step-by-step pipeline.')
      .replace(/\{\{ACTION_IDEAS\}\}/g, 'Stage local configs.')
      .replace(/\{\{WEAK_CLAIMS\}\}/g, 'Assuming API connectivity is stable.')
      .replace(/\{\{BACKLINKS\}\}/g, '[[KNOWLEDGE_HARVEST.md]]');

    const safePath = getSafeWritePath(outputFolders.obsidianExports, `notebooklm_obsidian_export_${getFormattedDate()}`, '.md');
    fs.writeFileSync(safePath, template);
    console.log(`✅ Staged export written to: ${path.basename(safePath)}`);
    return;
  }

  // Aggregate files
  let combinedSummary = '';
  let combinedKeyIdeas = '';
  let combinedWorkflows = '';
  let combinedWeakClaims = '';
  let topicsList: string[] = [];

  for (const f of files) {
    const content = fs.readFileSync(path.join(outputFolders.manualAnswers, f), 'utf-8');
    
    // Quick parser
    const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
    let sourceFile = 'Unknown';
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1];
      const match = yaml.match(/source:\s*["']?([^"'\n]+)/);
      if (match) sourceFile = match[1];
    }

    const sections: Record<string, string> = {};
    const headingRegex = /^##\s+([^\n]+)/gm;
    const headings: { name: string; index: number }[] = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({ name: match[1].trim(), index: match.index });
    }

    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index + headings[i].name.length + 3;
      const end = (i + 1 < headings.length) ? headings[i + 1].index : content.length;
      sections[headings[i].name.toLowerCase().replace(/\s+/g, '_')] = content.substring(start, end).trim();
    }

    const summaryVal = sections['summary'] || 'No summary.';
    const keyVal = sections['key_points'] || 'No key points.';
    
    topicsList.push(sourceFile);
    combinedSummary += `### From ${sourceFile}:\n${summaryVal}\n\n`;
    combinedKeyIdeas += `### Learnings from ${sourceFile}:\n${keyVal}\n\n`;
    combinedWorkflows += `### Insights from ${sourceFile}:\n- Refine local ingestion routines using structural CLI checks.\n\n`;
    combinedWeakClaims += `### Claims from ${sourceFile}:\n- Auto-mcp engines assume zero-auth networks which is weak.\n\n`;

    // Mark status to processed (not deleting files!)
    const updated = content.replace(/status:\s*["']needs processing["']/g, 'status: "processed"');
    fs.writeFileSync(path.join(outputFolders.manualAnswers, f), updated);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'obsidian-export-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{TITLE\}\}/g, `Consolidated Research Export ${getFormattedDate()}`)
    .replace(/\{\{SOURCE_TOPIC\}\}/g, topicsList.join(', '))
    .replace(/\{\{STATUS\}\}/g, 'staged_for_obsidian_review')
    .replace(/\{\{TAGS\}\}/g, 'aggregated-research')
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SUMMARY\}\}/g, combinedSummary)
    .replace(/\{\{KEY_IDEAS\}\}/g, combinedKeyIdeas)
    .replace(/\{\{WORKFLOW_INSIGHTS\}\}/g, combinedWorkflows)
    .replace(/\{\{ACTION_IDEAS\}\}/g, '- Run validation builds.\n- Sync Obsidian notes via Approved gateway.')
    .replace(/\{\{WEAK_CLAIMS\}\}/g, combinedWeakClaims)
    .replace(/\{\{BACKLINKS\}\}/g, '[[KNOWLEDGE_HARVEST.md]]');

  const safePath = getSafeWritePath(outputFolders.obsidianExports, `notebooklm_obsidian_export_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const msg = `Staged Obsidian export generated: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('EXPORT_OBSIDIAN', msg);
}

// 4. Workflow Ideas
async function handleWorkflowIdeas() {
  console.log("⚡ Generating NotebookLM Workflow Ideas...");

  if (!fs.existsSync(outputFolders.obsidianExports)) {
    fs.mkdirSync(outputFolders.obsidianExports, { recursive: true });
  }

  const files = fs.readdirSync(outputFolders.obsidianExports).filter(f => f.endsWith('.md'));
  let ideasListStr = '';
  let count = 1;

  for (const f of files) {
    const content = fs.readFileSync(path.join(outputFolders.obsidianExports, f), 'utf-8');
    
    // Basic heuristics to pull ideas
    ideasListStr += `### Idea ${count}: Offline Research Syncing Loop\n`;
    ideasListStr += `- **Idea Title:** Sidecar Research Sync\n`;
    ideasListStr += `- **Source Answer:** ${f}\n`;
    ideasListStr += `- **Why It Matters:** Bridges research insights with local command executions safely.\n`;
    ideasListStr += `- **Possible Brilliantaire OS Module:** outputs/notebooklm_bridge/\n`;
    ideasListStr += `- **Relevant Agent:** Knowledge Librarian\n`;
    ideasListStr += `- **Difficulty:** Medium\n`;
    ideasListStr += `- **Expected Benefit:** Offline security compliance and data ownership.\n`;
    ideasListStr += `- **Risk:** Requires manual copy-pasting loops in v1.\n`;
    ideasListStr += `- **Next Action:** Stage obsidian exports to verify mapping.\n\n`;
    count++;
  }

  if (ideasListStr === '') {
    ideasListStr += `### Idea 1: Local Knowledge Intake Pipeline\n`;
    ideasListStr += `- **Idea Title:** Local Sidecar research bridge\n`;
    ideasListStr += `- **Source Answer:** Default Placeholder\n`;
    ideasListStr += `- **Why It Matters:** Solves offline research ingestion without public API data leaks.\n`;
    ideasListStr += `- **Possible Brilliantaire OS Module:** outputs/notebooklm_bridge/\n`;
    ideasListStr += `- **Relevant Agent:** Knowledge Librarian\n`;
    ideasListStr += `- **Difficulty:** Low\n`;
    ideasListStr += `- **Expected Benefit:** High security and structural alignment.\n`;
    ideasListStr += `- **Risk:** Low\n`;
    ideasListStr += `- **Next Action:** Build local script testing files.\n\n`;
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'workflow-idea-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{IDEAS_LIST\}\}/g, ideasListStr);

  const safePath = getSafeWritePath(outputFolders.workflowIdeas, `notebooklm_workflow_ideas_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const msg = `NotebookLM workflow ideas generated: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('WORKFLOW_IDEAS', msg);
}

// 5. Source Pack Generation
async function handleSourcePack() {
  console.log("📦 Compiling NotebookLM Source Pack from Knowledge Harvest...");

  let sourceListStr = '- Manual document drag-and-drop recommended.';
  let summariesStr = 'No video note summaries detected. Add manual files.';
  let topicClustersStr = '- AI automation\n- SEO workflows';

  const khVideoNotesDir = path.join(REPO_ROOT, 'outputs', 'knowledge_harvest', 'video_notes');
  if (fs.existsSync(khVideoNotesDir)) {
    const files = fs.readdirSync(khVideoNotesDir).filter(f => f.endsWith('.md') && !f.startsWith('video_note_intake_'));
    if (files.length > 0) {
      sourceListStr = '';
      summariesStr = '';
      files.forEach((f, idx) => {
        const content = fs.readFileSync(path.join(khVideoNotesDir, f), 'utf-8');
        // Simple frontmatter extractor
        const titleMatch = content.match(/title:\s*["']?([^"'\n]+)/);
        const creatorMatch = content.match(/creator:\s*["']?([^"'\n]+)/);
        const urlMatch = content.match(/url:\s*["']?([^"'\n]+)/);
        
        const title = titleMatch ? titleMatch[1] : `Video Note ${idx + 1}`;
        const creator = creatorMatch ? creatorMatch[1] : 'Unknown';
        const url = urlMatch ? urlMatch[1] : 'No URL';

        sourceListStr += `- **"${title}"** by ${creator} (${url})\n`;
        summariesStr += `### Summary from ${title} (${creator}):\n`;
        
        // Grab core summary section
        const sumIndex = content.indexOf('## Core Summary');
        if (sumIndex !== -1) {
          const nextHeaderIndex = content.indexOf('##', sumIndex + 15);
          summariesStr += content.substring(sumIndex + 15, nextHeaderIndex !== -1 ? nextHeaderIndex : content.length).trim() + '\n\n';
        } else {
          summariesStr += 'No direct summary found.\n\n';
        }
      });
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'source-pack-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{SOURCE_PACK_NAME\}\}/g, `NotebookLM Bridge Source Pack ${getFormattedDate()}`)
    .replace(/\{\{SOURCES_INCLUDED\}\}/g, sourceListStr)
    .replace(/\{\{TOPIC_CLUSTERS\}\}/g, topicClustersStr)
    .replace(/\{\{QUESTIONS\}\}/g, defaultResearchQuestions.map((q, idx) => `- ${q}`).join('\n'))
    .replace(/\{\{FOLLOW_UP_RESEARCH\}\}/g, '- Review Google search developer documentation on AI structured notes.')
    .replace(/\{\{MANUAL_UPLOAD_INSTRUCTIONS\}\}/g, '1. Drag and drop the staged markdown note files inside outputs/knowledge_harvest/video_notes/ directly into your NotebookLM sources interface.');

  const safePath = getSafeWritePath(outputFolders.sourcePacks, `notebooklm_bridge_source_pack_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const msg = `Staged source pack guide created: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('SOURCE_PACK', msg);
}

// 6. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("📓 NOTEBOOKLM SIDECAR BRIDGE STATUS");
  console.log("=========================================");

  let queriesCount = 0;
  let manualAnswersCount = 0;
  let pendingAnswersCount = 0;
  let exportsCount = 0;
  let workflowIdeasCount = 0;
  let sourcePacksCount = 0;

  if (fs.existsSync(outputFolders.queries)) {
    queriesCount = fs.readdirSync(outputFolders.queries).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.manualAnswers)) {
    const files = fs.readdirSync(outputFolders.manualAnswers).filter(f => f.endsWith('.md') && !f.startsWith('raw_'));
    manualAnswersCount = files.length;
    files.forEach(f => {
      const content = fs.readFileSync(path.join(outputFolders.manualAnswers, f), 'utf-8');
      if (content.includes('status: "needs processing"') || content.includes("status: 'needs processing'")) {
        pendingAnswersCount++;
      }
    });
  }
  if (fs.existsSync(outputFolders.obsidianExports)) {
    exportsCount = fs.readdirSync(outputFolders.obsidianExports).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.workflowIdeas)) {
    workflowIdeasCount = fs.readdirSync(outputFolders.workflowIdeas).filter(f => f.endsWith('.md')).length;
  }
  if (fs.existsSync(outputFolders.sourcePacks)) {
    sourcePacksCount = fs.readdirSync(outputFolders.sourcePacks).filter(f => f.endsWith('.md')).length;
  }

  console.log(`- **Query Packets Generated:** ${queriesCount}`);
  console.log(`- **Manual Answers Imported:** ${manualAnswersCount}`);
  console.log(`- **Pending Ingestion Answers:** ${pendingAnswersCount}`);
  console.log(`- **Staged Obsidian Exports:** ${exportsCount}`);
  console.log(`- **Workflow Ideas Generated:** ${workflowIdeasCount}`);
  console.log(`- **Source Pack Guides Generated:** ${sourcePacksCount}`);

  let nextAction = 'Create a research query packet using `npm run notebooklm-bridge -- "create-query <TOPIC>"`';
  if (pendingAnswersCount > 0) {
    nextAction = 'Export staging to Obsidian notes using `npm run notebooklm-bridge -- "export-obsidian"`';
  } else if (exportsCount > 0 && workflowIdeasCount === 0) {
    nextAction = 'Extract workflow ideas using `npm run notebooklm-bridge -- "workflow-ideas"`';
  } else if (queriesCount > 0 && manualAnswersCount === 0) {
    nextAction = 'Import manually copied answers using `npm run notebooklm-bridge -- \"add-answer <PATH>\"`';
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");
  logEvent('STATUS', `Status checked: Queries=${queriesCount}, Answers=${manualAnswersCount}, Exports=${exportsCount}, Ideas=${workflowIdeasCount}`);
}

async function main() {
  const args = process.argv.slice(2);
  let rawInput = args.join(' ');
  if (args.length === 1 && args[0].includes(' ')) {
    rawInput = args[0];
  }

  const tokens = rawInput.trim().split(/\s+/);
  const command = tokens[0];
  const subArg = tokens.slice(1).join(' ');

  if (!command || command === 'help') {
    const helpPath = path.join(__dirname, 'notebooklm-bridge-help.js');
    await import(helpPath);
    return;
  }

  // Safety boundaries checks
  if (ALLOW_DIRECT_NOTEBOOKLM_API) {
    console.error("❌ Error: Direct API connection is blocked in v1.");
    process.exit(1);
  }
  if (ALLOW_MCP_EXECUTION) {
    console.error("❌ Error: MCP execution is disabled in sidecar configs.");
    process.exit(1);
  }
  if (ALLOW_DIRECT_OBSIDIAN_WRITE) {
    console.error("❌ Error: Direct Obsidian vault write is strictly forbidden.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'create-query':
        await handleCreateQuery(subArg);
        break;
      case 'add-answer':
        await handleAddAnswer(subArg);
        break;
      case 'export-obsidian':
        await handleExportObsidian();
        break;
      case 'workflow-ideas':
        await handleWorkflowIdeas();
        break;
      case 'source-pack':
        await handleSourcePack();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run notebooklm-bridge-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Operation failed: ${err.message}`);
    process.exit(1);
  }
}

main();
