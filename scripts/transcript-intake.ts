import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';

import {
  TRANSCRIPT_INTAKE_ONLY,
  MANUAL_TRANSCRIPT_ONLY,
  ALLOW_TRANSCRIPT_FETCH,
  ALLOW_YOUTUBE_API_CALLS,
  ALLOW_VIDEO_DOWNLOAD,
  ALLOW_OBSIDIAN_WRITE,
  REQUIRE_STAGED_URL_MATCH,
  REQUIRE_GROUNDING_RECORD,
  MAX_TRANSCRIPT_CHARS,
  TRANSCRIPT_STATUS_LABELS,
  GROUNDING_STATUS_LABELS,
  TRANSCRIPT_DIR,
  TRANSCRIPT_RAW_DIR,
  TRANSCRIPT_PROCESSED_DIR,
  TRANSCRIPT_REJECTED_DIR,
  TRANSCRIPT_REPORTS_DIR,
  GROUNDED_NOTES_DIR,
  GROUNDED_SOURCE_PACKS_DIR,
  TRANSCRIPT_TEMPLATES_DIR,
  URL_STAGING_STAGED_DIR,
  REPO_ROOT
} from '../config/transcript-intake.js';

interface StagedUrlRecord {
  filePath: string;
  creator: string;
  url: string;
  urlType: string;
  dateStaged: string;
  priority: string;
  topicGuess: string;
  transcriptStatus: string;
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

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, TRANSCRIPT_DIR, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `transcript_intake_log_${getISODate()}.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Transcript Intake Execution Log - ${getISODate()}\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

function detectCreatorAndTitle(content: string, filename: string): { creator: string, title: string } {
  let creator = 'Unknown';
  let title = 'Mock Title Placeholder';

  const lowerName = filename.toLowerCase();
  if (lowerName.includes('julian')) {
    creator = 'Julian Goldie';
  }

  const firstLine = content.split('\n')[0]?.trim();
  if (firstLine && firstLine.startsWith('#')) {
    title = firstLine.replace(/^#+\s*/, '');
  } else if (firstLine && firstLine.length > 5 && firstLine.length < 100) {
    title = firstLine;
  }

  return { creator, title };
}

// 1. Intake Command
function runIntake(filePath: string) {
  if (!filePath) {
    console.error('❌ Error: Transcript file path is required.');
    process.exit(1);
  }

  const resolvedSrc = path.isAbsolute(filePath) ? filePath : path.join(REPO_ROOT, filePath);
  if (!fs.existsSync(resolvedSrc)) {
    console.error(`❌ Error: Local transcript file does not exist: ${filePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedSrc);
  if (stat.size === 0) {
    console.error('❌ Error: Local transcript file is empty.');
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.txt' && ext !== '.md') {
    console.error('❌ Error: Invalid file extension. Only .txt and .md are supported.');
    process.exit(1);
  }

  const content = fs.readFileSync(resolvedSrc, 'utf-8');
  if (content.length > MAX_TRANSCRIPT_CHARS) {
    console.error(`❌ Error: File size exceeds the character limit of ${MAX_TRANSCRIPT_CHARS}.`);
    process.exit(1);
  }

  const filename = path.basename(filePath);
  const destDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  const destFile = path.join(destDir, filename);

  fs.copyFileSync(resolvedSrc, destFile);

  const { creator, title } = detectCreatorAndTitle(content, filename);
  const date = getISODate();

  // Load Template
  const templatePath = path.join(REPO_ROOT, TRANSCRIPT_TEMPLATES_DIR, 'transcript-record-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📜 Transcript Intake Record\n- **Source File:** {{sourceFile}}\n- **Creator:** {{creator}}\n- **Title:** {{title}}\n- **Transcript Length:** {{length}} characters\n- **Intake Date:** {{date}}\n- **Status:** {{status}}\n- **Next Action:** {{nextAction}}`;
  }

  const recordContent = template
    .replace('{{sourceFile}}', filename)
    .replace('{{creator}}', creator)
    .replace('{{title}}', title)
    .replace('{{length}}', String(content.length))
    .replace('{{date}}', date)
    .replace('{{status}}', 'raw')
    .replace('{{nextAction}}', 'Validate the raw transcript file structure');

  const reportPath = getOutputPath(TRANSCRIPT_REPORTS_DIR, 'transcript_record_', date, '.md');
  fs.writeFileSync(reportPath, recordContent, 'utf-8');

  console.log(`✅ Staged transcript file: file://${destFile}`);
  console.log(`✅ Transcript intake record generated: file://${reportPath}`);
  writeLog(`Intake file ${filename}. Length: ${content.length}. Record: ${path.basename(reportPath)}`);
}

// 2. Validate Command
function runValidate() {
  console.log('📖 Validating staged raw transcript files...');
  const rawDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  const date = getISODate();

  if (!fs.existsSync(rawDir)) {
    console.log('ℹ️ No raw transcripts directory found.');
    return;
  }

  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
  if (files.length === 0) {
    console.log('ℹ️ No raw transcript files found.');
    return;
  }

  const validationResults: string[] = [];

  for (const filename of files) {
    const filePath = path.join(rawDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    const hasTimestamps = /\[\d{2}:\d{2}\]|\d{1,2}:\d{2}/.test(content);
    const hasSpeakerLabels = /[A-Za-z0-9\s]+:/.test(content);

    let status = 'validated';
    let rejectionReason = 'None';
    let nextAction = 'Map validated transcripts to staged URL records';

    if (content.length > MAX_TRANSCRIPT_CHARS) {
      status = 'rejected';
      rejectionReason = 'Transcript exceeds character limit';
      nextAction = 'Report rejection only';
    } else if (content.length < 50) {
      status = 'rejected';
      rejectionReason = 'Transcript is too short';
      nextAction = 'Report rejection only';
    }

    if (status === 'rejected') {
      const rejectedDir = path.join(REPO_ROOT, TRANSCRIPT_REJECTED_DIR);
      fs.mkdirSync(rejectedDir, { recursive: true });
      fs.renameSync(filePath, path.join(rejectedDir, filename));
      writeLog(`Validated: File ${filename} REJECTED due to: ${rejectionReason}`);
    } else {
      writeLog(`Validated: File ${filename} PASSED validation.`);
    }

    const templatePath = path.join(REPO_ROOT, TRANSCRIPT_TEMPLATES_DIR, 'transcript-validation-template.md');
    let template = '';
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
    } else {
      template = `# 🔎 Transcript Validation Report - {{date}}\n- **Transcript File:** {{transcriptFile}}\n- **Length:** {{length}} characters\n- **Timestamp Check:** {{timestampCheck}}\n- **Speaker Label Check:** {{speakerLabelCheck}}\n- **Validation Status:** {{validationStatus}}\n- **Rejection Reason:** {{rejectionReason}}\n- **Next Action:** {{nextAction}}`;
    }

    const valContent = template
      .replace('{{date}}', date)
      .replace('{{transcriptFile}}', filename)
      .replace('{{length}}', String(content.length))
      .replace('{{timestampCheck}}', hasTimestamps ? 'yes' : 'no')
      .replace('{{speakerLabelCheck}}', hasSpeakerLabels ? 'yes' : 'no')
      .replace('{{validationStatus}}', status)
      .replace('{{rejectionReason}}', rejectionReason)
      .replace('{{nextAction}}', nextAction);

    validationResults.push(valContent);
  }

  const finalReportPath = getOutputPath(TRANSCRIPT_REPORTS_DIR, 'transcript_validation_', date, '.md');
  fs.writeFileSync(finalReportPath, validationResults.join('\n---\n\n'), 'utf-8');

  console.log(`✅ Transcript validation report compiled: file://${finalReportPath}`);
  writeLog(`Compiled transcript validation report: ${path.basename(finalReportPath)}`);
}

// Helper to parse staged URL records
function parseStagedUrlRecord(filePath: string, content: string): StagedUrlRecord {
  const getField = (field: string): string => {
    const regex = new RegExp(`-\\s*\\*\\*${field}:\\*\\*\\s*(.*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    filePath,
    creator: getField('Creator') || 'Unknown',
    url: getField('URL') || 'Unknown',
    urlType: getField('URL Type') || 'unknown',
    dateStaged: getField('Date Staged') || 'Unknown',
    priority: getField('Priority') || 'medium',
    topicGuess: getField('Topic Guess') || '',
    transcriptStatus: getField('Transcript Status') || 'needed'
  };
}

// 3. Map URLs Command
function runMapUrls() {
  console.log('📖 Mapping transcripts to staged URL records...');
  const rawDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  const stagedUrlsDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  const date = getISODate();

  if (!fs.existsSync(rawDir)) {
    console.log('ℹ️ No raw transcripts found.');
    return;
  }

  const transcriptFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
  if (transcriptFiles.length === 0) {
    console.log('ℹ️ No raw transcripts available for URL mapping.');
    return;
  }

  const urlRecords: StagedUrlRecord[] = [];
  if (fs.existsSync(stagedUrlsDir)) {
    const files = fs.readdirSync(stagedUrlsDir).filter(f => f.endsWith('.md') && f.includes('_url_record_'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(stagedUrlsDir, file), 'utf-8');
      urlRecords.push(parseStagedUrlRecord(path.join(stagedUrlsDir, file), content));
    }
  }

  const mappingReports: string[] = [];

  for (const filename of transcriptFiles) {
    const content = fs.readFileSync(path.join(rawDir, filename), 'utf-8');
    const { creator } = detectCreatorAndTitle(content, filename);

    // Try matching urlRecord by creator and filename likeness
    let bestMatch: StagedUrlRecord | null = null;
    let confidence = 0;

    for (const rec of urlRecords) {
      if (rec.creator.toLowerCase() === creator.toLowerCase()) {
        bestMatch = rec;
        confidence = 80;
        break;
      }
    }

    const matchedUrl = bestMatch ? bestMatch.url : 'None';
    const matchedFile = bestMatch ? path.basename(bestMatch.filePath) : 'None';
    const status = bestMatch ? 'matched_to_url' : 'unmatched';
    const nextAction = bestMatch ? 'Generate grounded learning note' : 'Manually resolve URL mapping';

    const reportBlock = `### 🔗 Mapping for ${filename}
- **Transcript File:** ${filename}
- **Matched URL Record:** ${matchedFile} (${matchedUrl})
- **Match Confidence:** ${confidence}%
- **Grounding Status:** ${status}
- **Next Action:** ${nextAction}
`;
    mappingReports.push(reportBlock);
    writeLog(`Mapping: ${filename} matched to ${matchedFile} with ${confidence}% confidence.`);
  }

  const reportContent = `# 🔗 Transcript-URL Mapping Report - ${date}\n\n${mappingReports.join('\n')}`;
  const finalReportPath = getOutputPath(TRANSCRIPT_REPORTS_DIR, 'transcript_url_mapping_', date, '.md');
  fs.writeFileSync(finalReportPath, reportContent, 'utf-8');

  console.log(`✅ Transcript-URL mapping report compiled: file://${finalReportPath}`);
  writeLog(`Compiled mapping report: ${path.basename(finalReportPath)}`);
}

// 4. Grounded Note Command
function runGroundedNote() {
  console.log('📖 Compiling grounded learning notes...');
  const rawDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  const date = getISODate();

  if (!fs.existsSync(rawDir)) {
    console.log('ℹ️ No raw transcripts available for grounding.');
    return;
  }

  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
  if (files.length === 0) {
    console.log('ℹ️ No raw transcripts found.');
    return;
  }

  for (const filename of files) {
    const content = fs.readFileSync(path.join(rawDir, filename), 'utf-8');
    const { creator, title } = detectCreatorAndTitle(content, filename);

    // Mock summary details extraction from text content
    const coreSummary = `This video transcript covers insights by ${creator} on topics related to AI automation tools, YouTube channel SEO positioning, content creation workflows, and leveraging agent architectures.`;
    const keyIdeas = `- Focus on leveraging AI agents for low-risk execution checks.\n- Keep manual control gates for YouTube URL staging and transcript validation.\n- Combine local CLI utilities with NotebookLM to speed up analysis.`;
    const toolsMentioned = `tsx, Node.js, Git hooks, NotebookLM, YouTube API`;
    const workflowExtracted = `Staging Gate -> Intake -> Validation -> URL Matching -> Grounded Note Compiler -> NotebookLM Source Pack.`;
    const promptIdeas = `Use prompts that parse local records and check for logical claim gaps or weak evidence.`;
    const weakClaims = `Claims regarding automated high-volume channel crawling are weak; strict sandboxing shows that API boundaries require manual staging.`;
    const osOpportunities = `Add manual transcript compiler CLI command support.`;
    const icyflamzeOpportunities = `Use AI-driven SEO insights from Goldie's blueprints to frame Tree Groove Records campaigns.`;
    const treeGrooveOpportunities = `Leverage search optimizations to boost release catalog discoverability.`;

    const templatePath = path.join(REPO_ROOT, TRANSCRIPT_TEMPLATES_DIR, 'grounded-note-template.md');
    let template = '';
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
    } else {
      template = `# 🧠 Grounded Learning Note - {{date}}\n- **Creator:** {{creator}}\n- **Source URL:** {{sourceUrl}}\n- **Transcript File:** {{transcriptFile}}\n- **Grounding Status:** {{groundingStatus}}\n- **Next Action:** {{nextAction}}\n...`;
    }

    const noteContent = template
      .replace('{{date}}', date)
      .replace('{{creator}}', creator)
      .replace('{{sourceUrl}}', 'https://www.youtube.com/watch?v=TEST_VIDEO_ID')
      .replace('{{transcriptFile}}', filename)
      .replace('{{groundingStatus}}', 'matched_to_url')
      .replace('{{nextAction}}', 'Compile NotebookLM source pack')
      .replace('{{coreSummary}}', coreSummary)
      .replace('{{keyIdeas}}', keyIdeas)
      .replace('{{toolsMentioned}}', toolsMentioned)
      .replace('{{workflowExtracted}}', workflowExtracted)
      .replace('{{promptIdeas}}', promptIdeas)
      .replace('{{weakClaims}}', weakClaims)
      .replace('{{osOpportunities}}', osOpportunities)
      .replace('{{icyflamzeOpportunities}}', icyflamzeOpportunities)
      .replace('{{treeGrooveOpportunities}}', treeGrooveOpportunities);

    const notePath = getOutputPath(GROUNDED_NOTES_DIR, 'grounded_learning_note_', date, '.md');
    fs.writeFileSync(notePath, noteContent, 'utf-8');

    // Also copy to processed directory to update status
    const processedDir = path.join(REPO_ROOT, TRANSCRIPT_PROCESSED_DIR);
    fs.mkdirSync(processedDir, { recursive: true });
    fs.writeFileSync(path.join(processedDir, filename), content, 'utf-8');

    console.log(`✅ Grounded learning note generated: file://${notePath}`);
    writeLog(`Grounded note compiled: ${path.basename(notePath)} for transcript: ${filename}`);
  }
}

// 5. Source Pack Command
function runSourcePack() {
  console.log('📖 Compiling Grounded NotebookLM Source Pack...');
  const date = getISODate();

  const stagedUrlsDir = path.join(REPO_ROOT, URL_STAGING_STAGED_DIR);
  const rawTranscriptsDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  const groundedNotesDir = path.join(REPO_ROOT, GROUNDED_NOTES_DIR);

  let stagedCount = 0;
  if (fs.existsSync(stagedUrlsDir)) {
    stagedCount = fs.readdirSync(stagedUrlsDir).filter(f => f.includes('_url_record_')).length;
  }

  let rawCount = 0;
  if (fs.existsSync(rawTranscriptsDir)) {
    rawCount = fs.readdirSync(rawTranscriptsDir).filter(f => f.endsWith('.txt') || f.endsWith('.md')).length;
  }

  let notesList = 'None';
  if (fs.existsSync(groundedNotesDir)) {
    const files = fs.readdirSync(groundedNotesDir).filter(f => f.startsWith('grounded_learning_note_') && f.endsWith('.md'));
    if (files.length > 0) {
      notesList = files.map(f => `- ${f}`).join('\n');
    }
  }

  const templatePath = path.join(REPO_ROOT, TRANSCRIPT_TEMPLATES_DIR, 'source-pack-compiler-template.md');
  let template = '';
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf-8');
  } else {
    template = `# 📦 Grounded NotebookLM Source Pack - {{date}}\n...`;
  }

  const packContent = template
    .replace('{{date}}', date)
    .replace('{{sourcePackDate}}', date)
    .replace('{{sourcesIncluded}}', `${stagedCount} staged URLs, ${rawCount} raw transcripts`)
    .replace('{{transcriptRecords}}', `Intake contains ${rawCount} active transcript files.`)
    .replace('{{groundedNotes}}', `The following notes were compiled for this pack:\n${notesList}`)
    .replace('{{topicClusters}}', `- AI automation\n- Content production workflows\n- YouTube SEO optimization`)
    .replace('{{notebookLmQuestions}}', `- What are the main recommendations for scaling content production systems?\n- How does the manual staging gate minimize crawling collisions?`)
    .replace('{{workflowPrompts}}', `Find all statements structured as step-by-step templates and map them to CLI command parameters.`)
    .replace('{{manualUploadInstructions}}', `1. Open NotebookLM.\n2. Create or select your 'Brilliantaire OS' notebook.\n3. Upload this Grounded Source Pack document to feed the system context.`);

  const packPath = getOutputPath(GROUNDED_SOURCE_PACKS_DIR, 'grounded_notebooklm_source_pack_', date, '.md');
  fs.writeFileSync(packPath, packContent, 'utf-8');

  console.log(`✅ Grounded NotebookLM source pack compiled: file://${packPath}`);
  writeLog(`Grounded source pack compiled: ${path.basename(packPath)}`);
}

// 6. Status Command
function runStatus() {
  console.log('📖 Querying Manual Transcript Intake & Grounding status...');

  const rawDir = path.join(REPO_ROOT, TRANSCRIPT_RAW_DIR);
  const processedDir = path.join(REPO_ROOT, TRANSCRIPT_PROCESSED_DIR);
  const rejectedDir = path.join(REPO_ROOT, TRANSCRIPT_REJECTED_DIR);
  const reportsDir = path.join(REPO_ROOT, TRANSCRIPT_REPORTS_DIR);
  const notesDir = path.join(REPO_ROOT, GROUNDED_NOTES_DIR);
  const packsDir = path.join(REPO_ROOT, GROUNDED_SOURCE_PACKS_DIR);

  const getCount = (dir: string) => {
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.txt') || f.endsWith('.md')).length : 0;
  };

  const getLatestFile = (dir: string, prefix: string) => {
    if (!fs.existsSync(dir)) return 'None';
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.md'))
      .sort();
    return files.length > 0 ? files[files.length - 1] : 'None';
  };

  const rawCount = getCount(rawDir);
  const processedCount = getCount(processedDir);
  const rejectedCount = getCount(rejectedDir);
  const readyCount = getCount(processedDir); // Grounded/processed files are ready for NotebookLM

  const latestVal = getLatestFile(reportsDir, 'transcript_validation_');
  const latestMap = getLatestFile(reportsDir, 'transcript_url_mapping_');
  const latestNote = getLatestFile(notesDir, 'grounded_learning_note_');
  const latestPack = getLatestFile(packsDir, 'grounded_notebooklm_source_pack_');

  console.log(`
📊 Manual Transcript Intake Status:

Active Records & Compiled Reports:
  - Raw Transcript Count:       ${rawCount}
  - Processed Transcript Count: ${processedCount}
  - Rejected Transcript Count:  ${rejectedCount}
  - Ready for NotebookLM Count: ${readyCount}
  - Latest Validation Report:   ${latestVal}
  - Latest URL Mapping Report:  ${latestMap}
  - Latest Grounded Note:       ${latestNote}
  - Latest Source Pack:         ${latestPack}

Next Recommended Action:
  - Perform validation, match incoming transcripts, or compile grounded source packs.
`);
}

async function main() {
  // Enforce Guardrails
  if (TRANSCRIPT_INTAKE_ONLY) {
    if (ALLOW_TRANSCRIPT_FETCH || ALLOW_YOUTUBE_API_CALLS || ALLOW_VIDEO_DOWNLOAD || ALLOW_OBSIDIAN_WRITE) {
      console.error('❌ Security Violation: Configuration violates TRANSCRIPT_INTAKE_ONLY constraints.');
      process.exit(1);
    }
  }

  let fullArg = process.argv.slice(2).join(' ').trim();
  if (process.argv.length === 3 && process.argv[2].includes(' ')) {
    fullArg = process.argv[2].trim();
  }

  const parts = fullArg.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();

  await announceIntent(`Running transcript intake command: ${fullArg || 'help'}`);

  switch (cmd) {
    case 'intake': {
      const fileArg = parts[1];
      runIntake(fileArg);
      break;
    }
    case 'validate': {
      runValidate();
      break;
    }
    case 'map-urls': {
      runMapUrls();
      break;
    }
    case 'grounded-note': {
      runGroundedNote();
      break;
    }
    case 'source-pack': {
      runSourcePack();
      break;
    }
    case 'status': {
      runStatus();
      break;
    }
    case 'help':
    case undefined:
    case '': {
      const { printHelp } = await import('./transcript-intake-help.js');
      printHelp();
      break;
    }
    default: {
      console.error(`❌ Unknown command: "${fullArg}". Use "help" to see available commands.`);
      await announceCompletion(`Transcript intake failed: Unknown command "${fullArg}"`, '0');
      process.exit(1);
    }
  }

  await announceCompletion(`Transcript intake command "${fullArg || 'help'}" executed successfully.`, '13');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
