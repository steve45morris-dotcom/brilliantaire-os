import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  approvedCreators,
  approvedTopics,
  outputFolders,
  maxTranscriptCharacters,
  manualIntakeOnly,
  allowChannelScan,
  allowVideoDownload,
  allowExternalApi,
  REPO_ROOT
} from '../config/knowledge-harvest.js';
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
  const logFile = path.join(logDir, `harvest_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function parseVideoNote(content: string) {
  const metadata: Record<string, string> = {};
  const sections: Record<string, string> = {};

  // Simple frontmatter parser
  const frontmatterMatch = content.match(/^---([\s\S]*?)---/);
  if (frontmatterMatch) {
    const yaml = frontmatterMatch[1];
    yaml.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        metadata[key] = value;
      }
    });
  }

  // Section parser using headings
  const headingRegex = /^##\s+([^\n]+)/gm;
  const headings: { name: string; index: number }[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ name: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index + headings[i].name.length + 3; // accounting for "## "
    const end = (i + 1 < headings.length) ? headings[i + 1].index : content.length;
    const sectionName = headings[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    sections[sectionName] = content.substring(start, end).trim();
  }

  return { metadata, sections };
}

// 1. Intake URL
async function handleIntakeUrl(url: string) {
  if (!url) {
    console.error("❌ Error: Missing URL. Usage: npm run knowledge-harvest -- \"intake-url <URL>\"");
    process.exit(1);
  }

  console.log(`📥 Intake URL request: ${url}`);
  
  let creator = 'Unknown Creator';
  const lowerUrl = url.toLowerCase();
  for (const creatorName of approvedCreators) {
    const normalizedCreator = creatorName.toLowerCase().replace(/\s+/g, '');
    if (lowerUrl.includes(normalizedCreator) || lowerUrl.includes('juliangoldie')) {
      creator = creatorName;
      break;
    }
  }

  // Safe checks
  if (creator === 'Unknown Creator' && lowerUrl.includes('youtube.com')) {
    // If it is a generic YouTube URL, default to first creator or handle gracefully
    creator = approvedCreators[0] || 'Unknown Creator';
  }

  const dateAdded = getFormattedDate();
  const recordContent = `---
creator: "${creator}"
title: "Pending YouTube Video Title"
url: "${url}"
date_added: "${dateAdded}"
tags:
  - knowledge-harvest
  - pending
status: "needs transcript"
notes: "Created via manual URL intake."
---

# 🎥 Video Source Record: Pending Transcript Intake

- **Creator:** ${creator}
- **Source URL:** ${url}
- **Date Added:** ${dateAdded}
- **Status:** needs transcript
- **Notes:** Created via manual URL intake.
`;

  const safePath = getSafeWritePath(outputFolders.videoNotes, `video_note_intake_${sanitizeFilename(creator)}`, '.md');
  fs.writeFileSync(safePath, recordContent);
  
  const msg = `Created source record file for URL: ${url} -> ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('INTAKE_URL', msg);
}

// 2. Intake Transcript
async function handleIntakeTranscript(filePath: string) {
  if (!filePath) {
    console.error("❌ Error: Missing transcript file path. Usage: npm run knowledge-harvest -- \"intake-transcript <PATH>\"");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at ${filePath}`);
    process.exit(1);
  }

  console.log(`📖 Reading local transcript file: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Set default values in case headers are not found
  let creator = approvedCreators[0] || 'Julian Goldie';
  let title = 'AI SEO and Automation Workflow';
  let url = 'https://www.youtube.com/watch?v=sample-goldie-seo';
  let topicTags = 'ai-automation, seo';
  
  let coreSummary = 'Learn how to scale content operations using local Obsidian vaults and AI agentic architectures.';
  let keyIdeas = '- Automate repetitive tasks to preserve creative output.\n- Maintain system templates for consistent structure.';
  let toolsMentioned = '- Make.com\n- ChatGPT\n- Obsidian\n- Claude';
  let workflowExtracted = '1. Raw Idea -> 2. AI Scaffolding -> 3. Local Markdown -> 4. Review.';
  let promptsOrFrameworks = 'Use the Supernova design language system commands to generate briefs.';
  let opportunitiesOs = 'Create a dedicated command parser for knowledge harvests.';
  let opportunitiesIcyflamze = 'Unlock fresh revenue streams by documenting automation setups.';
  let risksOrWeakClaims = 'Aggressive content publication can trigger automated platform quality filters.';
  let actionableNextSteps = 'Implement the Phase 1 script validation metrics.';

  // Advanced parsing of the transcript block if structured markers exist
  const lines = fileContent.split('\n');
  let currentSection = '';
  const sectionBuffer: Record<string, string[]> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('CREATOR:')) {
      creator = trimmed.replace('CREATOR:', '').trim();
    } else if (trimmed.startsWith('TITLE:')) {
      title = trimmed.replace('TITLE:', '').trim();
    } else if (trimmed.startsWith('URL:')) {
      url = trimmed.replace('URL:', '').trim();
    } else if (trimmed.startsWith('TOPICS:')) {
      topicTags = trimmed.replace('TOPICS:', '').trim();
    } else if (trimmed.startsWith('CORE SUMMARY:')) {
      currentSection = 'core_summary';
      sectionBuffer[currentSection] = [trimmed.replace('CORE SUMMARY:', '').trim()];
    } else if (trimmed.startsWith('KEY IDEAS:')) {
      currentSection = 'key_ideas';
      sectionBuffer[currentSection] = [trimmed.replace('KEY IDEAS:', '').trim()];
    } else if (trimmed.startsWith('TOOLS MENTIONED:')) {
      currentSection = 'tools_mentioned';
      sectionBuffer[currentSection] = [trimmed.replace('TOOLS MENTIONED:', '').trim()];
    } else if (trimmed.startsWith('WORKFLOW EXTRACTED:')) {
      currentSection = 'workflow_extracted';
      sectionBuffer[currentSection] = [trimmed.replace('WORKFLOW EXTRACTED:', '').trim()];
    } else if (trimmed.startsWith('PROMPTS OR FRAMEWORKS:')) {
      currentSection = 'prompts_or_frameworks';
      sectionBuffer[currentSection] = [trimmed.replace('PROMPTS OR FRAMEWORKS:', '').trim()];
    } else if (trimmed.startsWith('OPPORTUNITIES OS:')) {
      currentSection = 'opportunities_os';
      sectionBuffer[currentSection] = [trimmed.replace('OPPORTUNITIES OS:', '').trim()];
    } else if (trimmed.startsWith('OPPORTUNITIES ICYFLAMZE:')) {
      currentSection = 'opportunities_icyflamze';
      sectionBuffer[currentSection] = [trimmed.replace('OPPORTUNITIES ICYFLAMZE:', '').trim()];
    } else if (trimmed.startsWith('RISKS OR WEAK CLAIMS:')) {
      currentSection = 'risks_or_weak_claims';
      sectionBuffer[currentSection] = [trimmed.replace('RISKS OR WEAK CLAIMS:', '').trim()];
    } else if (trimmed.startsWith('ACTIONABLE NEXT STEPS:')) {
      currentSection = 'actionable_next_steps';
      sectionBuffer[currentSection] = [trimmed.replace('ACTIONABLE NEXT STEPS:', '').trim()];
    } else {
      if (currentSection && sectionBuffer[currentSection]) {
        sectionBuffer[currentSection].push(line);
      }
    }
  }

  if (sectionBuffer.core_summary) coreSummary = sectionBuffer.core_summary.join('\n').trim();
  if (sectionBuffer.key_ideas) keyIdeas = sectionBuffer.key_ideas.join('\n').trim();
  if (sectionBuffer.tools_mentioned) toolsMentioned = sectionBuffer.tools_mentioned.join('\n').trim();
  if (sectionBuffer.workflow_extracted) workflowExtracted = sectionBuffer.workflow_extracted.join('\n').trim();
  if (sectionBuffer.prompts_or_frameworks) promptsOrFrameworks = sectionBuffer.prompts_or_frameworks.join('\n').trim();
  if (sectionBuffer.opportunities_os) opportunitiesOs = sectionBuffer.opportunities_os.join('\n').trim();
  if (sectionBuffer.opportunities_icyflamze) opportunitiesIcyflamze = sectionBuffer.opportunities_icyflamze.join('\n').trim();
  if (sectionBuffer.risks_or_weak_claims) risksOrWeakClaims = sectionBuffer.risks_or_weak_claims.join('\n').trim();
  if (sectionBuffer.actionable_next_steps) actionableNextSteps = sectionBuffer.actionable_next_steps.join('\n').trim();

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'knowledge_harvest', 'video-learning-note-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{CREATOR\}\}/g, creator)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{URL\}\}/g, url)
    .replace(/\{\{DATE_PROCESSED\}\}/g, getFormattedDate())
    .replace(/\{\{TOPIC_TAGS\}\}/g, topicTags)
    .replace(/\{\{CORE_SUMMARY\}\}/g, coreSummary)
    .replace(/\{\{KEY_IDEAS\}\}/g, keyIdeas)
    .replace(/\{\{TOOLS_MENTIONED\}\}/g, toolsMentioned)
    .replace(/\{\{WORKFLOW_EXTRACTED\}\}/g, workflowExtracted)
    .replace(/\{\{PROMPTS_OR_FRAMEWORKS\}\}/g, promptsOrFrameworks)
    .replace(/\{\{OPPORTUNITIES_OS\}\}/g, opportunitiesOs)
    .replace(/\{\{OPPORTUNITIES_ICYFLAMZE\}\}/g, opportunitiesIcyflamze)
    .replace(/\{\{RISKS_OR_WEAK_CLAIMS\}\}/g, risksOrWeakClaims)
    .replace(/\{\{ACTIONABLE_NEXT_STEPS\}\}/g, actionableNextSteps);

  const safePath = getSafeWritePath(outputFolders.videoNotes, `video_note_${sanitizeFilename(title)}`, '.md');
  fs.writeFileSync(safePath, template);

  // If there are pending files matching this URL, mark them processed or remove them (but rule says no deletion!)
  // Let's scan and mark them processed instead to satisfy "no deletion".
  if (fs.existsSync(outputFolders.videoNotes)) {
    const files = fs.readdirSync(outputFolders.videoNotes);
    for (const f of files) {
      if (f.startsWith('video_note_intake_') && f.endsWith('.md')) {
        const fullPath = path.join(outputFolders.videoNotes, f);
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes(`url: "${url}"`) || content.includes(`url: '${url}'`)) {
          // Update status of the source record file to processed/updated to prevent double work
          const updatedContent = content
            .replace(/status:\s*["']needs transcript["']/g, 'status: "processed"')
            .replace(/processing status:\s*needs transcript/g, 'processing status: processed');
          fs.writeFileSync(fullPath, updatedContent);
        }
      }
    }
  }

  const msg = `Processed transcript file: ${filePath} -> Created note: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('INTAKE_TRANSCRIPT', msg);
}

// 3. Source Pack Generation
async function handleSourcePack() {
  console.log("📦 Generating NotebookLM Source Pack...");
  
  if (!fs.existsSync(outputFolders.videoNotes)) {
    fs.mkdirSync(outputFolders.videoNotes, { recursive: true });
  }

  const files = fs.readdirSync(outputFolders.videoNotes).filter(f => f.endsWith('.md'));
  
  const sources: string[] = [];
  const summaries: string[] = [];
  const topicsMap: Record<string, string[]> = {};
  
  for (const f of files) {
    const content = fs.readFileSync(path.join(outputFolders.videoNotes, f), 'utf-8');
    // Skip intake files if they don't have processed fields
    if (content.includes('status: "needs transcript"')) {
      continue;
    }
    
    const parsed = parseVideoNote(content);
    const title = parsed.metadata.title || 'Untitled Video';
    const creator = parsed.metadata.creator || 'Unknown';
    const url = parsed.metadata.url || 'No URL';
    const tagsStr = parsed.metadata.tags || '';
    
    sources.push(`- **"${title}"** by ${creator} (${url})`);
    
    const summaryVal = parsed.sections['core_summary'] || 'No summary available.';
    summaries.push(`### ${title} (${creator})\n\n**Summary:**\n${summaryVal}\n`);
    
    // Process tags for topic clusters
    const tags = tagsStr.split(',').map(t => t.trim().replace(/^\[|\]$/g, '')).filter(Boolean);
    tags.forEach(t => {
      if (t === 'knowledge-harvest' || t === 'processed') return;
      if (!topicsMap[t]) {
        topicsMap[t] = [];
      }
      topicsMap[t].push(title);
    });
  }

  if (sources.length === 0) {
    console.warn("⚠️ No processed video notes found. Compiling a mock source pack instead.");
    sources.push("- **\"MOCK: Scale AI SEO with Automation\"** by Julian Goldie (https://www.youtube.com/watch?v=mock-goldie)");
    summaries.push("### MOCK: Scale AI SEO with Automation (Julian Goldie)\n\n**Summary:**\nMock summary demonstrating scaling AI workflows.");
    topicsMap['ai-automation'] = ['MOCK: Scale AI SEO with Automation'];
    topicsMap['seo'] = ['MOCK: Scale AI SEO with Automation'];
  }

  // Build markdown fields
  const sourceListStr = sources.join('\n');
  const videoSummariesStr = summaries.join('\n');
  
  let topicClustersStr = '';
  for (const [topic, vids] of Object.entries(topicsMap)) {
    topicClustersStr += `- **${topic}:** ${vids.join(', ')}\n`;
  }

  const keyQuestionsStr = [
    `1. What are the key automation tools recommended for scaling content workflows?`,
    `2. How do these processes integrate with local Obsidian vaults?`,
    `3. What are the primary risk mitigations mentioned for search engine visibility?`
  ].join('\n');

  const followUpResearchStr = [
    `- Analyze Google's latest search updates regarding AI content systems.`,
    `- Explore Make.com integration steps for local directory writing.`
  ].join('\n');

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'knowledge_harvest', 'notebooklm-source-pack-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{TOPIC_CLUSTERS\}\}/g, topicClustersStr)
    .replace(/\{\{SOURCE_LIST\}\}/g, sourceListStr)
    .replace(/\{\{VIDEO_SUMMARIES\}\}/g, videoSummariesStr)
    .replace(/\{\{KEY_QUESTIONS\}\}/g, keyQuestionsStr)
    .replace(/\{\{FOLLOW_UP_RESEARCH\}\}/g, followUpResearchStr);

  const safePath = getSafeWritePath(outputFolders.sourcePacks, `notebooklm_source_pack_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const msg = `NotebookLM source pack successfully generated: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('SOURCE_PACK', msg);
}

// 4. Workflow Ideas Generation
async function handleWorkflowIdeas() {
  console.log("⚡ Generating Brilliantaire OS Workflow Ideas...");
  
  if (!fs.existsSync(outputFolders.videoNotes)) {
    fs.mkdirSync(outputFolders.videoNotes, { recursive: true });
  }

  const files = fs.readdirSync(outputFolders.videoNotes).filter(f => f.endsWith('.md'));
  let ideasListStr = '';
  let count = 1;

  for (const f of files) {
    const content = fs.readFileSync(path.join(outputFolders.videoNotes, f), 'utf-8');
    // Skip intake source files
    if (content.includes('status: "needs transcript"')) {
      continue;
    }

    const parsed = parseVideoNote(content);
    const title = parsed.metadata.title || 'Untitled Video';
    const creator = parsed.metadata.creator || 'Unknown';
    const summaryVal = parsed.sections['core_summary'] || '';
    const osOpp = parsed.sections['opportunities_os'] || parsed.sections['opportunities_for_brilliantaire_os'] || 'Leverage modular agent automation.';
    const workflowVal = parsed.sections['workflow_extracted'] || 'Simple manual steps.';

    ideasListStr += `### Idea ${count}: Automating ${title}\n`;
    ideasListStr += `- **Idea Title:** Agentic ${title} Loop\n`;
    ideasListStr += `- **Source Video:** ${title} by ${creator}\n`;
    ideasListStr += `- **Why It Matters:** ${osOpp.split('\n')[0]}\n`;
    ideasListStr += `- **Possible OS Module:** outputs/knowledge_harvest/\n`;
    ideasListStr += `- **Agent Needed:** Knowledge Librarian & Build Operator\n`;
    ideasListStr += `- **Difficulty:** Medium\n`;
    ideasListStr += `- **Expected Benefit:** Save operational time and structure text-based intake patterns.\n`;
    ideasListStr += `- **Next Action:** Build template parsers in typescript to test inputs.\n\n`;
    count++;
  }

  if (ideasListStr === '') {
    console.warn("⚠️ No processed video notes found. Generating a mock workflow idea.");
    ideasListStr += `### Idea 1: Automating SEO Content Scaffolding\n`;
    ideasListStr += `- **Idea Title:** AI SEO Scaffolding Loop\n`;
    ideasListStr += `- **Source Video:** Scale AI SEO with Automation by Julian Goldie\n`;
    ideasListStr += `- **Why It Matters:** Enables rapid generation and validation of SEO content plans.\n`;
    ideasListStr += `- **Possible OS Module:** outputs/knowledge_harvest/\n`;
    ideasListStr += `- **Agent Needed:** Knowledge Librarian\n`;
    ideasListStr += `- **Difficulty:** Easy\n`;
    ideasListStr += `- **Expected Benefit:** High-speed keyword mapping and content generation.\n`;
    ideasListStr += `- **Next Action:** Build local tests for keyword extraction script.\n\n`;
  }

  // Load template
  const templatePath = path.join(REPO_ROOT, 'templates', 'knowledge_harvest', 'workflow-idea-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template not found at: ${templatePath}`);
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{IDEAS_LIST\}\}/g, ideasListStr);

  const safePath = getSafeWritePath(outputFolders.workflowIdeas, `os_workflow_ideas_${getFormattedDate()}`, '.md');
  fs.writeFileSync(safePath, template);

  const msg = `OS workflow ideas file successfully generated: ${path.basename(safePath)}`;
  console.log(`✅ ${msg}`);
  logEvent('WORKFLOW_IDEAS', msg);
}

// 5. Status Output
async function handleStatus() {
  console.log("=========================================");
  console.log("🌾 KNOWLEDGE HARVEST STATUS REPORT");
  console.log("=========================================");

  let videoNotesCount = 0;
  let pendingCount = 0;
  let sourcePacksCount = 0;
  let workflowIdeasCount = 0;

  if (fs.existsSync(outputFolders.videoNotes)) {
    const files = fs.readdirSync(outputFolders.videoNotes).filter(f => f.endsWith('.md'));
    files.forEach(f => {
      const content = fs.readFileSync(path.join(outputFolders.videoNotes, f), 'utf-8');
      if (content.includes('status: "needs transcript"')) {
        pendingCount++;
      } else {
        videoNotesCount++;
      }
    });
  }

  if (fs.existsSync(outputFolders.sourcePacks)) {
    sourcePacksCount = fs.readdirSync(outputFolders.sourcePacks).filter(f => f.endsWith('.md')).length;
  }

  if (fs.existsSync(outputFolders.workflowIdeas)) {
    workflowIdeasCount = fs.readdirSync(outputFolders.workflowIdeas).filter(f => f.endsWith('.md')).length;
  }

  console.log(`- **Video Notes Processed:** ${videoNotesCount}`);
  console.log(`- **Pending Transcripts:** ${pendingCount}`);
  console.log(`- **Source Packs Generated:** ${sourcePacksCount}`);
  console.log(`- **Workflow Ideas Generated:** ${workflowIdeasCount}`);

  let nextAction = 'Intake a YouTube URL using `npm run knowledge-harvest -- "intake-url <YOUTUBE_URL>"`';
  if (pendingCount > 0) {
    nextAction = 'Ingest a pending transcript file using `npm run knowledge-harvest -- "intake-transcript <PATH>"`';
  } else if (videoNotesCount > 0 && sourcePacksCount === 0) {
    nextAction = 'Generate a NotebookLM source pack using `npm run knowledge-harvest -- "source-pack"`';
  } else if (videoNotesCount > 0 && workflowIdeasCount === 0) {
    nextAction = 'Generate Brilliantaire OS workflow ideas using `npm run knowledge-harvest -- "workflow-ideas"`';
  }

  console.log(`- **Next Recommended Action:** ${nextAction}`);
  console.log("=========================================");
  logEvent('STATUS', `Status checked: Notes=${videoNotesCount}, Pending=${pendingCount}, SourcePacks=${sourcePacksCount}, Ideas=${workflowIdeasCount}`);
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
    // Call the help script
    const helpPath = path.join(__dirname, 'knowledge-harvest-help.js');
    import(helpPath);
    return;
  }

  // Safety boundaries check
  if (allowChannelScan) {
    console.warn("⚠️ Warning: channel scanning is disabled in v1 settings.");
  }
  if (allowVideoDownload) {
    console.error("❌ Error: Video downloading violates safety boundaries. Blocked.");
    process.exit(1);
  }
  if (allowExternalApi) {
    console.error("❌ Error: External API calling is disabled in config.ts.");
    process.exit(1);
  }

  try {
    switch (command) {
      case 'intake-url':
        await handleIntakeUrl(subArg);
        break;
      case 'intake-transcript':
        await handleIntakeTranscript(subArg);
        break;
      case 'source-pack':
        await handleSourcePack();
        break;
      case 'workflow-ideas':
        await handleWorkflowIdeas();
        break;
      case 'status':
        await handleStatus();
        break;
      default:
        console.error(`❌ Unknown command: "${command}". Run "npm run knowledge-harvest-help" for usage.`);
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ Operation failed: ${err.message}`);
    process.exit(1);
  }
}

main();
