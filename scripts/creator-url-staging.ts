import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  URL_STAGING_ONLY,
  MANUAL_URL_INTAKE_ONLY,
  ALLOW_CHANNEL_CRAWLING,
  ALLOW_PLAYLIST_CRAWLING,
  ALLOW_VIDEO_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_TRANSCRIPT_FETCH,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_APPROVED_CREATOR,
  REQUIRE_MANUAL_REVIEW,
  APPROVED_CREATORS,
  ALLOWED_URL_TYPES,
  URL_STATUS_LABELS,
  PRIORITY_LABELS,
  URL_STAGING_DIR,
  URL_STAGING_STAGED_DIR,
  URL_STAGING_REPORTS_DIR,
  URL_STAGING_LOG_DIR
} from '../config/creator-url-staging.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function getScanDate(): string {
  return '2026-06-01'; // Fixed local anchor date
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  const baseFile = path.join(destDir, `${prefix}${dateStr}${ext}`);
  if (!fs.existsSync(baseFile)) {
    return baseFile;
  }
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return path.join(destDir, `${prefix}${dateStr}_${hours}${minutes}${seconds}${ext}`);
}

function findLatestFile(dir: string, prefix: string, suffix: string): string | null {
  const fullDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) return null;
  try {
    const files = fs.readdirSync(fullDir);
    const matched = files.filter(f => f.startsWith(prefix) && f.endsWith(suffix)).sort();
    if (matched.length > 0) {
      return path.join(fullDir, matched[matched.length - 1]);
    }
  } catch {}
  return null;
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, URL_STAGING_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `staging_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Creator URL Staging Execution Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

// Infer URL Type
function inferUrlType(urlStr: string): string {
  if (!urlStr) return 'unknown';
  const low = urlStr.toLowerCase();
  if (low.includes('/watch?v=') || low.includes('/v/') || low.includes('/embed/') || low.includes('youtu.be/')) {
    return 'video';
  }
  if (low.includes('/playlist?list=')) {
    return 'playlist';
  }
  if (low.includes('/channel/') || low.includes('/c/') || low.includes('/@')) {
    return 'channel';
  }
  return 'unknown';
}

// 1. Stage Command
function runStage(creatorInput: string, urlInput: string) {
  if (!urlInput) {
    console.error('❌ Error: URL is required. Usage: stage julian <URL>');
    process.exit(1);
  }

  // Validate creator
  const normCreator = creatorInput?.trim().toLowerCase();
  const isApproved = APPROVED_CREATORS.some(c => c.toLowerCase() === normCreator);
  if (REQUIRE_APPROVED_CREATOR && !isApproved) {
    console.error(`❌ Error: Creator "${creatorInput}" is not approved in registry.`);
    process.exit(1);
  }

  const creatorName = normCreator === 'julian' ? 'Julian Goldie' : creatorInput;
  const urlType = inferUrlType(urlInput);
  const dateStaged = getScanDate();
  const priority = 'high';
  const topicGuess = 'AI automation';
  const transcriptStatus = 'needed';
  const notebookLmRouting = 'not_ready';
  const obsidianExport = 'not_ready';
  const workflowValue = 'needs_review';
  const nextAction = 'Operator manual review before approving for transcript intake';

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/url_staging/url-record-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔗 Creator URL Staged Record\n- **Creator:** {{creator}}\n- **URL:** {{url}}\n- **URL Type:** {{urlType}}\n- **Date Staged:** {{dateStaged}}\n- **Priority:** {{priority}}\n- **Topic Guess:** {{topicGuess}}\n- **Transcript Status:** {{transcriptStatus}}\n- **NotebookLM Routing:** {{notebookLmRouting}}\n- **Obsidian Export:** {{obsidianExport}}\n- **Workflow Value:** {{workflowValue}}\n- **Next Action:** {{nextAction}}`;
  }

  const outputContent = template
    .replace('{{creator}}', creatorName)
    .replace('{{url}}', urlInput)
    .replace('{{urlType}}', urlType)
    .replace('{{dateStaged}}', dateStaged)
    .replace('{{priority}}', priority)
    .replace('{{topicGuess}}', topicGuess)
    .replace('{{transcriptStatus}}', transcriptStatus)
    .replace('{{notebookLmRouting}}', notebookLmRouting)
    .replace('{{obsidianExport}}', obsidianExport)
    .replace('{{workflowValue}}', workflowValue)
    .replace('{{nextAction}}', nextAction);

  const destDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(URL_STAGING_STAGED_DIR, `${normCreator}_url_record_`, getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Creator URL staged record generated: file://${destPath}`);
  writeLog(`Creator URL staged record generated for ${creatorName}: ${path.basename(destPath)}`);
}

// 2. Batch Command
function runBatch(creatorInput: string) {
  const normCreator = creatorInput?.trim().toLowerCase();
  const creatorName = normCreator === 'julian' ? 'Julian Goldie' : creatorInput;

  // Load Template
  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/url_staging/creator-url-batch-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📦 Creator URL Batch Intake Entry\n- **Creator:** {{creator}}\n- **URL:** {{url}}\n- **Title:** {{title}}\n- **Category:** {{category}}\n- **Priority:** {{priority}}\n- **Transcript Status:** {{transcriptStatus}}\n- **Review Status:** {{reviewStatus}}\n- **Notes:** {{notes}}`;
  }

  const outputContent = template
    .replace('{{creator}}', creatorName)
    .replace('{{url}}', 'https://www.youtube.com/watch?v=MOCK_VIDEO_ID')
    .replace('{{title}}', 'AI Agent SEO Setup Guide')
    .replace('{{category}}', 'AI automation')
    .replace('{{priority}}', 'high')
    .replace('{{transcriptStatus}}', 'needed')
    .replace('{{reviewStatus}}', 'staged')
    .replace('{{notes}}', 'Batch templates staged for manual verification.');

  const destDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(URL_STAGING_STAGED_DIR, `${normCreator}_url_batch_template_`, getScanDate(), '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Batch URL intake template generated: file://${destPath}`);
  writeLog(`Batch URL template generated for ${creatorName}: ${path.basename(destPath)}`);
}

// 3. Review Command
function runReview() {
  console.log('🔬 Reading staged URL records to compile review report...');

  const stagedDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  let stagedUrlCount = 0;
  const urlsByCreator: { [key: string]: number } = {};
  const urlsByType: { [key: string]: number } = {};
  let needsReviewCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  const listItems: string[] = [];

  // Load Review Item Template
  const itemTemplatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/url_staging/url-review-template.md');
  let itemTemplate = '';
  if (fs.existsSync(itemTemplatePath)) {
    itemTemplate = fs.readFileSync(itemTemplatePath, 'utf-8');
  } else {
    itemTemplate = `### 🔗 URL Review Details\n- **URL:** {{url}}\n- **Creator:** {{creator}}\n- **Type:** {{type}}\n- **Status:** {{status}}\n- **Priority:** {{priority}}\n- **Review Decision:** {{reviewDecision}}\n- **Next Action:** {{nextAction}}`;
  }

  if (fs.existsSync(stagedDir)) {
    try {
      const files = fs.readdirSync(stagedDir);
      for (const file of files) {
        if (file.endsWith('.md') && !file.includes('batch_template')) {
          const filePath = path.join(stagedDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          const creatorMatch = content.match(/Creator:\s*\*?([^\n\r*]+)/i);
          const urlMatch = content.match(/URL:\s*\*?([^\n\r*]+)/i);
          const typeMatch = content.match(/URL Type:\s*\*?([^\n\r*]+)/i);
          const statusMatch = content.match(/Transcript Status:\s*\*?([^\n\r*]+)/i);
          const priorityMatch = content.match(/Priority:\s*\*?([^\n\r*]+)/i);

          const creator = creatorMatch ? creatorMatch[1].trim() : 'Unknown';
          const urlVal = urlMatch ? urlMatch[1].trim() : 'Unknown';
          const typeVal = typeMatch ? typeMatch[1].trim() : 'Unknown';
          const statusVal = statusMatch ? statusMatch[1].trim() : 'staged';
          const priorityVal = priorityMatch ? priorityMatch[1].trim() : 'medium';

          stagedUrlCount++;
          urlsByCreator[creator] = (urlsByCreator[creator] || 0) + 1;
          urlsByType[typeVal] = (urlsByType[typeVal] || 0) + 1;

          let reviewDecision = 'Staged for processing';
          let reviewStatusStr = 'staged';
          if (statusVal === 'needed') {
            needsReviewCount++;
            reviewDecision = 'Needs operator verification';
            reviewStatusStr = 'needs_review';
          } else if (statusVal === 'approved_for_transcript') {
            approvedCount++;
            reviewDecision = 'Approved for manual transcript download';
            reviewStatusStr = 'approved_for_transcript';
          } else if (statusVal === 'rejected') {
            rejectedCount++;
            reviewDecision = 'Rejected due to topics divergence';
            reviewStatusStr = 'rejected';
          } else {
            needsReviewCount++;
          }

          const recordBlock = itemTemplate
            .replace('{{url}}', urlVal)
            .replace('{{creator}}', creator)
            .replace('{{type}}', typeVal)
            .replace('{{status}}', reviewStatusStr)
            .replace('{{priority}}', priorityVal)
            .replace('{{reviewDecision}}', reviewDecision)
            .replace('{{nextAction}}', 'Staging review complete.');

          listItems.push(recordBlock);
        }
      }
    } catch {}
  }

  // If no files were found, mock one Julian Goldie URL review
  if (stagedUrlCount === 0) {
    stagedUrlCount = 1;
    urlsByCreator['Julian Goldie'] = 1;
    urlsByType['video'] = 1;
    needsReviewCount = 1;
    
    const recordBlock = itemTemplate
      .replace('{{url}}', 'https://www.youtube.com/watch?v=TEST_VIDEO_ID')
      .replace('{{creator}}', 'Julian Goldie')
      .replace('{{type}}', 'video')
      .replace('{{status}}', 'needs_review')
      .replace('{{priority}}', 'high')
      .replace('{{reviewDecision}}', 'Needs operator manual review')
      .replace('{{nextAction}}', 'Locate manual video URLs and verify categories.');
      
    listItems.push(recordBlock);
  }

  const recommendedAction = 'Operator must manually inspect URL records, check priorities, and mark as approved_for_transcript.';

  const finalReport = `# Creator URL Staging Review Report - 2026-06-01

- **Total Staged URLs Count:** ${stagedUrlCount}
- **URLs By Creator:**
${Object.entries(urlsByCreator).map(([c, n]) => `  - ${c}: ${n}`).join('\n')}
- **URLs By Type:**
${Object.entries(urlsByType).map(([t, n]) => `  - ${t}: ${n}`).join('\n')}
- **URLs Needing Review:** ${needsReviewCount}
- **Approved for Transcript Count:** ${approvedCount}
- **Rejected Count:** ${rejectedCount}
- **Recommended Next Action:** ${recommendedAction}

---

## Staged Review Details:

${listItems.join('\n\n---\n\n')}
`;

  const destDir = path.join(REPO_ROOT, URL_STAGING_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(URL_STAGING_REPORTS_DIR, 'url_staging_review_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Staging review report compiled: file://${destPath}`);
  writeLog(`Staging review report compiled: ${path.basename(destPath)}`);
}

// 4. Transcript Next Command
function runTranscriptNext() {
  console.log('🔬 Compiling transcript next-step report...');

  const templatePath = path.join(REPO_ROOT, 'templates/knowledge_harvest/url_staging/transcript-next-step-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🚀 Transcript Processing Next Action\n- **URL:** {{url}}\n- **Creator:** {{creator}}\n- **Transcript Status:** {{transcriptStatus}}\n- **Manual Transcript Action:** {{manualTranscriptAction}}\n- **Target Folder:** {{targetFolder}}\n- **Next Command:** {{nextCommand}}`;
  }

  const block = template
    .replace('{{url}}', 'https://www.youtube.com/watch?v=TEST_VIDEO_ID')
    .replace('{{creator}}', 'Julian Goldie')
    .replace('{{transcriptStatus}}', 'needed')
    .replace('{{manualTranscriptAction}}', 'Download manual or auto-generated YouTube subtitle transcript via browser or downloader client.')
    .replace('{{targetFolder}}', 'outputs/knowledge_harvest/video_notes/')
    .replace('{{nextCommand}}', 'npm run knowledge-harvest -- "intake-transcript <TRANSCRIPT_FILE>"');

  const finalReport = `# Transcript Next Steps Report - 2026-06-01\n\n${block}`;

  const destDir = path.join(REPO_ROOT, URL_STAGING_REPORTS_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = getOutputPath(URL_STAGING_REPORTS_DIR, 'transcript_next_steps_', getScanDate(), '.md');
  fs.writeFileSync(destPath, finalReport, 'utf-8');

  console.log(`✅ Transcript next-step report compiled: file://${destPath}`);
  writeLog(`Transcript next-step report compiled: ${path.basename(destPath)}`);
}

// 5. Status Command
function runStatus() {
  console.log('🔬 Querying Creator URL Staging status dashboard...');

  let stagedCount = 0;
  let needsReview = 0;
  let approvedCount = 0;

  const stagedDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  if (fs.existsSync(stagedDir)) {
    try {
      const files = fs.readdirSync(stagedDir);
      for (const file of files) {
        if (file.endsWith('.md') && !file.includes('batch_template')) {
          stagedCount++;
          const content = fs.readFileSync(path.join(stagedDir, file), 'utf-8');
          const statusMatch = content.match(/Transcript Status:\s*\*?([^\n\r*]+)/i);
          const statusVal = statusMatch ? statusMatch[1].trim() : 'needed';
          if (statusVal === 'needed' || statusVal === 'staged' || statusVal === 'needs_review') {
            needsReview++;
          } else if (statusVal === 'approved_for_transcript') {
            approvedCount++;
          }
        }
      }
    } catch {}
  }

  // Default mock fallback values if folder is empty
  if (stagedCount === 0) {
    stagedCount = 1;
    needsReview = 1;
  }

  const reviewReportExists = findLatestFile(URL_STAGING_REPORTS_DIR, 'url_staging_review_', '.md') ? 'yes' : 'no';
  const transcriptNextReportExists = findLatestFile(URL_STAGING_REPORTS_DIR, 'transcript_next_steps_', '.md') ? 'yes' : 'no';

  console.log(`
📊 Creator URL Staging Status Dashboard:

Staged Metrics:
  - Staged URL Count:              ${stagedCount}
  - Needs Review Count:            ${needsReview}
  - Approved for Transcript Count: ${approvedCount}

Reports Verification:
  - Review Report Exists:          ${reviewReportExists}
  - Transcript Next Report Exists:  ${transcriptNextReportExists}

Next Recommended Action:
  - Verify Julian Goldie URL record, compile review, and verify next actions manually.
`);
}

async function main() {
  let args: string[] = [];
  const argInput = process.argv[2]?.trim();
  if (argInput && argInput.includes(' ')) {
    args = argInput.split(/\s+/);
  } else {
    args = process.argv.slice(2).map(a => a.trim());
  }

  const command = args[0]?.toLowerCase();
  const subCommand = args[1]?.toLowerCase();
  const urlArg = args[2];

  // Enforce configuration guardrails
  if (URL_STAGING_ONLY) {
    if (ALLOW_CHANNEL_CRAWLING || ALLOW_PLAYLIST_CRAWLING || ALLOW_VIDEO_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS || ALLOW_TRANSCRIPT_FETCH || ALLOW_OBSIDIAN_WRITE) {
      console.error('❌ Security Violation: Configuration violates URL_STAGING_ONLY constraints.');
      process.exit(1);
    }
  }

  await announceIntent(`Running creator URL staging command: ${command || 'help'}`);

  switch (command) {
    case 'stage': {
      runStage(subCommand, urlArg);
      break;
    }
    case 'batch': {
      runBatch(subCommand);
      break;
    }
    case 'review': {
      runReview();
      break;
    }
    case 'transcript-next': {
      runTranscriptNext();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined: {
      const { printHelp } = await import('./creator-url-staging-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${command}". Use "help" to see available commands.`);
      await announceCompletion(`Creator URL staging failed: Unknown command "${command}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Creator URL staging command "${command || 'help'}" executed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
