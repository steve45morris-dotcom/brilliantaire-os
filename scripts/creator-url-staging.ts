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
  URL_STAGING_LOG_DIR,
  URL_STAGING_TEMPLATES_DIR,
  REPO_ROOT
} from '../config/creator-url-staging.js';

interface StagedUrlRecord {
  filePath: string;
  creator: string;
  url: string;
  urlType: string;
  dateStaged: string;
  priority: string;
  transcriptStatus: string;
  notebookLmRouting: string;
  obsidianExport: string;
  workflowValue: string;
  nextAction: string;
  reviewDecision: string;
}

function getISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOutputPath(dir: string, prefix: string, dateStr: string, ext: string): string {
  const destDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  fs.mkdirSync(destDir, { recursive: true });
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

function inferUrlType(url: string): string {
  if (!url) return 'unknown';
  if (url.includes('watch?v=') || url.includes('youtu.be/') || url.includes('/shorts/') || url.includes('/v/')) {
    return 'video';
  }
  if (url.includes('playlist?list=') || url.includes('/playlist')) {
    return 'playlist';
  }
  if (url.includes('/channel/') || url.includes('/c/') || url.includes('/user/') || url.includes('@')) {
    return 'channel';
  }
  return 'unknown';
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, URL_STAGING_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `url_staging_log_${getISODate()}.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Creator URL Staging Execution Log - ${getISODate()}\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

function parseStagedUrlRecord(filePath: string, content: string): StagedUrlRecord {
  const getField = (field: string): string => {
    const regex = new RegExp(`-\\s*\\*\\*${field}:\\*\\*\\s*(.*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const creator = getField('Creator');
  const url = getField('URL');
  const urlType = getField('URL Type');
  const dateStaged = getField('Date Staged');
  const priority = getField('Priority');
  const transcriptStatus = getField('Transcript Status');
  const notebookLmRouting = getField('NotebookLM Routing');
  const obsidianExport = getField('Obsidian Export');
  const workflowValue = getField('Workflow Value');
  const nextAction = getField('Next Action');

  let reviewDecision = 'needs_review';
  if (transcriptStatus === 'needed') {
    reviewDecision = 'needs_review';
  } else if (transcriptStatus === 'available') {
    reviewDecision = 'approved_for_transcript';
  } else if (transcriptStatus === 'rejected') {
    reviewDecision = 'rejected';
  } else if (transcriptStatus === 'processed') {
    reviewDecision = 'processed';
  }

  return {
    filePath,
    creator: creator || 'Unknown',
    url: url || 'Unknown',
    urlType: urlType || 'unknown',
    dateStaged: dateStaged || 'Unknown',
    priority: priority || 'medium',
    transcriptStatus: transcriptStatus || 'needed',
    notebookLmRouting: notebookLmRouting || 'not_ready',
    obsidianExport: obsidianExport || 'not_ready',
    workflowValue: workflowValue || 'needs_review',
    nextAction: nextAction || 'None',
    reviewDecision
  };
}

// 1. Stage URL
function runStage(creatorArg: string, url: string) {
  if (!url) {
    console.error('❌ Error: URL is required for stage command.');
    process.exit(1);
  }

  const creatorLower = creatorArg.toLowerCase();
  const matchedCreator = APPROVED_CREATORS.find(c => c.toLowerCase() === creatorLower);
  if (!matchedCreator) {
    console.error(`❌ Error: Creator "${creatorArg}" is not an approved creator.`);
    process.exit(1);
  }

  const creatorName = matchedCreator === 'julian' ? 'Julian Goldie' : matchedCreator;
  const urlType = inferUrlType(url);
  const date = getISODate();

  console.log(`📖 Staging URL for ${creatorName}: ${url} (Inferred type: ${urlType})...`);

  // Load Template
  const templatePath = path.join(REPO_ROOT, URL_STAGING_TEMPLATES_DIR, 'url-record-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔗 Creator URL Stage Record\n- **Creator:** {{creator}}\n- **URL:** {{url}}\n- **URL Type:** {{urlType}}\n- **Date Staged:** {{dateStaged}}\n- **Priority:** {{priority}}\n- **Topic Guess:** {{topicGuess}}\n- **Transcript Status:** {{transcriptStatus}}\n- **NotebookLM Routing:** {{notebookLmRouting}}\n- **Obsidian Export:** {{obsidianExport}}\n- **Workflow Value:** {{workflowValue}}\n- **Next Action:** {{nextAction}}`;
  }

  const outputContent = template
    .replace('{{creator}}', creatorName)
    .replace('{{url}}', url)
    .replace('{{urlType}}', urlType)
    .replace('{{dateStaged}}', date)
    .replace('{{priority}}', 'high')
    .replace('{{topicGuess}}', 'AI automation')
    .replace('{{transcriptStatus}}', 'needed')
    .replace('{{notebookLmRouting}}', 'not_ready')
    .replace('{{obsidianExport}}', 'not_ready')
    .replace('{{workflowValue}}', 'needs_review')
    .replace('{{nextAction}}', 'Perform manual transcript intake');

  const destPath = getOutputPath(URL_STAGING_STAGED_DIR, `${creatorLower}_url_record_`, date, '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Staged creator URL record generated: file://${destPath}`);
  writeLog(`Staged creator URL record generated: ${path.basename(destPath)}`);
}

// 2. Batch Staging
function runBatch(creatorArg: string) {
  const creatorLower = creatorArg.toLowerCase();
  const matchedCreator = APPROVED_CREATORS.find(c => c.toLowerCase() === creatorLower);
  if (!matchedCreator) {
    console.error(`❌ Error: Creator "${creatorArg}" is not an approved creator.`);
    process.exit(1);
  }

  const creatorName = matchedCreator === 'julian' ? 'Julian Goldie' : matchedCreator;
  const date = getISODate();

  console.log(`📖 Generating manual batch template for ${creatorName}...`);

  const templatePath = path.join(REPO_ROOT, URL_STAGING_TEMPLATES_DIR, 'creator-url-batch-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📦 Creator URL Batch Staging Template\n- **Creator:** {{creator}}\n- **Batch Date:** {{date}}\n| URL | Title | Category | Priority | Transcript Status | Review Status | Notes |\n|---|---|---|---|---|---|---|\n| {{url}} | [Title Placeholder] | [Category Category] | {{priority}} | {{transcriptStatus}} | {{reviewStatus}} | [Notes] |`;
  }

  const outputContent = template
    .replace('{{creator}}', creatorName)
    .replace('{{date}}', date)
    .replace('{{url}}', 'https://www.youtube.com/watch?v=TEST_VIDEO_ID')
    .replace('{{priority}}', 'high')
    .replace('{{transcriptStatus}}', 'needed')
    .replace('{{reviewStatus}}', 'staged');

  const destPath = getOutputPath(URL_STAGING_STAGED_DIR, `${creatorLower}_url_batch_template_`, date, '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Staged creator batch template generated: file://${destPath}`);
  writeLog(`Staged creator batch template generated: ${path.basename(destPath)}`);
}

// 3. Review Report
function runReview() {
  console.log('📖 Generating URL staging review report...');

  const stagedDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  const records: StagedUrlRecord[] = [];

  if (fs.existsSync(stagedDir)) {
    const files = fs.readdirSync(stagedDir);
    for (const file of files) {
      if (file.endsWith('.md') && file.includes('_url_record_')) {
        const filePath = path.join(stagedDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        records.push(parseStagedUrlRecord(filePath, content));
      }
    }
  }

  const totalStaged = records.length;

  const creatorsMap: Record<string, number> = {};
  const typesMap: Record<string, number> = {};
  let needingReviewCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  records.forEach(r => {
    creatorsMap[r.creator] = (creatorsMap[r.creator] || 0) + 1;
    typesMap[r.urlType] = (typesMap[r.urlType] || 0) + 1;
    if (r.reviewDecision === 'needs_review') needingReviewCount++;
    else if (r.reviewDecision === 'approved_for_transcript') approvedCount++;
    else if (r.reviewDecision === 'rejected') rejectedCount++;
  });

  const urlsByCreator = Object.entries(creatorsMap).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None';
  const urlsByType = Object.entries(typesMap).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None';

  let reviewRows = '';
  if (records.length > 0) {
    reviewRows = records.map(r => {
      return `| ${r.url} | ${r.creator} | ${r.urlType} | ${r.transcriptStatus} | ${r.priority} | ${r.reviewDecision} | ${r.nextAction} |`;
    }).join('\n');
  } else {
    reviewRows = '| No staged URLs found | - | - | - | - | - | - |';
  }

  const templatePath = path.join(REPO_ROOT, URL_STAGING_TEMPLATES_DIR, 'url-review-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 🔎 Creator URL Review Report - {{date}}\n## 📊 Summary\n- **Total Staged URLs:** {{totalStaged}}\n- **URLs by Creator:** {{urlsByCreator}}\n- **URLs by Type:** {{urlsByType}}\n## 📋 Staged URL Inventory\n| URL | Creator | Type | Status | Priority | Review Decision | Next Action |\n|---|---|---|---|---|---|---|\n{{reviewRows}}\n## 🛠️ Recommended Next Action\n- {{nextAction}}`;
  }

  const date = getISODate();
  const outputContent = template
    .replace('{{date}}', date)
    .replace('{{totalStaged}}', String(totalStaged))
    .replace('{{urlsByCreator}}', urlsByCreator)
    .replace('{{urlsByType}}', urlsByType)
    .replace('{{reviewRows}}', reviewRows)
    .replace('{{nextAction}}', 'Review staging report & approve for transcript.');

  const destPath = getOutputPath(URL_STAGING_REPORTS_DIR, 'url_staging_review_', date, '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Staged URL review report generated: file://${destPath}`);
  writeLog(`Staged URL review report generated: ${path.basename(destPath)}`);
}

// 4. Transcript Next Steps
function runTranscriptNext() {
  console.log('📖 Generating transcript next steps report...');

  const stagedDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  const records: StagedUrlRecord[] = [];

  if (fs.existsSync(stagedDir)) {
    const files = fs.readdirSync(stagedDir);
    for (const file of files) {
      if (file.endsWith('.md') && file.includes('_url_record_')) {
        const filePath = path.join(stagedDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        records.push(parseStagedUrlRecord(filePath, content));
      }
    }
  }

  const readyRecords = records.filter(r => r.transcriptStatus !== 'processed');

  let nextStepRows = '';
  if (readyRecords.length > 0) {
    nextStepRows = readyRecords.map(r => {
      const action = `Download manual transcript for ${r.urlType}`;
      const targetFolder = `outputs/knowledge_harvest/transcripts/`;
      const sanitizedCreator = r.creator.toLowerCase().replace(/\s+/g, '_');
      const nextCommand = `npm run knowledge-harvest -- "intake-transcript ${sanitizedCreator}_transcript.txt"`;
      return `| ${r.url} | ${r.creator} | ${r.transcriptStatus} | ${action} | ${targetFolder} | \`${nextCommand}\` |`;
    }).join('\n');
  } else {
    nextStepRows = '| No URLs ready for transcript processing | - | - | - | - | - |';
  }

  const templatePath = path.join(REPO_ROOT, URL_STAGING_TEMPLATES_DIR, 'transcript-next-step-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📜 Transcript Processing Next Steps - {{date}}\n| URL | Creator | Transcript Status | Manual Transcript Action | Target Folder | Next Command |\n|---|---|---|---|---|---|\n{{nextStepRows}}`;
  }

  const date = getISODate();
  const outputContent = template
    .replace('{{date}}', date)
    .replace('{{nextStepRows}}', nextStepRows);

  const destPath = getOutputPath(URL_STAGING_REPORTS_DIR, 'transcript_next_steps_', date, '.md');
  fs.writeFileSync(destPath, outputContent, 'utf-8');

  console.log(`✅ Transcript next steps report generated: file://${destPath}`);
  writeLog(`Transcript next steps report generated: ${path.basename(destPath)}`);
}

// 5. Status
function runStatus() {
  console.log('📖 Querying Creator YouTube URL staging status...');

  const stagedDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  const reportsDir = path.join(REPO_ROOT, URL_STAGING_REPORTS_DIR);

  let stagedCount = 0;
  let approvedCount = 0;
  let needsReviewCount = 0;

  if (fs.existsSync(stagedDir)) {
    const files = fs.readdirSync(stagedDir);
    for (const file of files) {
      if (file.endsWith('.md') && file.includes('_url_record_')) {
        stagedCount++;
        const filePath = path.join(stagedDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseStagedUrlRecord(filePath, content);
        if (parsed.reviewDecision === 'approved_for_transcript') {
          approvedCount++;
        } else if (parsed.reviewDecision === 'needs_review') {
          needsReviewCount++;
        }
      }
    }
  }

  const reviewReportExists = fs.existsSync(reportsDir) && fs.readdirSync(reportsDir).some(f => f.startsWith('url_staging_review_') && f.endsWith('.md'));
  const nextStepsReportExists = fs.existsSync(reportsDir) && fs.readdirSync(reportsDir).some(f => f.startsWith('transcript_next_steps_') && f.endsWith('.md'));

  console.log(`
📊 Creator YouTube URL Staging Status:

Active Records & Reports:
  - Staged URL Count:           ${stagedCount}
  - Review Report Exists:       ${reviewReportExists ? 'yes' : 'no'}
  - Transcript Report Exists:   ${nextStepsReportExists ? 'yes' : 'no'}
  - Approved for Transcript:    ${approvedCount}
  - Needs Review Count:         ${needsReviewCount}

Next Recommended Action:
  - Perform manual URL review or generate transcript next-step directives.
`);
}

async function main() {
  // Enforce Guardrails
  if (URL_STAGING_ONLY) {
    if (ALLOW_CHANNEL_CRAWLING || ALLOW_PLAYLIST_CRAWLING || ALLOW_VIDEO_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS || ALLOW_TRANSCRIPT_FETCH || ALLOW_OBSIDIAN_WRITE) {
      console.error('❌ Security Violation: Configuration violates URL_STAGING_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running creator URL staging command: ${fullArg || 'help'}`);

  switch (cmd) {
    case 'stage': {
      const creator = parts[1];
      const url = parts[2];
      runStage(creator, url);
      break;
    }
    case 'batch': {
      const creator = parts[1];
      runBatch(creator);
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
    case undefined:
    case '': {
      const { printHelp } = await import('./creator-url-staging-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Creator URL staging failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Creator URL staging command "${fullArg || 'help'}" executed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
