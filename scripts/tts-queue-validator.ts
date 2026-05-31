import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  VALIDATION_ONLY,
  ALLOW_TTS_GENERATION,
  ALLOW_AUDIO_FILE_CREATION,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_REVIEW,
  REQUIRE_QUEUE_PACKET,
  REQUIRE_VOICE_DIRECTION,
  REQUIRE_SCRIPT_FILES,
  MAX_SHORT_SCRIPT_WORDS,
  MAX_MEDIUM_SCRIPT_WORDS,
  MAX_LONG_SCRIPT_WORDS,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/tts-queue-validator.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScanResults {
  shortScriptPath: string | null;
  mediumScriptPath: string | null;
  longScriptPath: string | null;
  queuePacketPath: string | null;
  voiceDirectionPath: string | null;

  shortScriptWords: number;
  mediumScriptWords: number;
  longScriptWords: number;

  hasUnsafeChars: boolean;
  unsafeCharDetails: string[];
  hasExternalUrls: boolean;
  urlDetails: string[];
  hasEmptySections: boolean;
  emptySectionDetails: string[];

  sourceBriefReferenced: boolean;
  manualReviewRequiredField: boolean;
  audioGenerationStatusNotStarted: boolean;
  noCompletedAudioFiles: boolean;
  statusFieldsPresent: boolean;

  blockers: string[];
  readinessScore: number;
  finalStatus: string;
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
  const logFile = path.join(outputFolders.logs, `tts_validation_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function getLatestFileInDir(dir: string, prefix: string, ext = '.md'): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(ext) && f.startsWith(prefix))
    .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function extractSpokenContent(text: string): string {
  // Try to grab only content below ## 🎬 Narrative Script
  const marker = '## 🎬 Narrative Script';
  const idx = text.indexOf(marker);
  if (idx !== -1) {
    return text.substring(idx + marker.length);
  }
  return text;
}

function runScans(): ScanResults {
  const shortScriptPath = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_short_script');
  const mediumScriptPath = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_medium_script');
  const longScriptPath = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_long_script');
  const queuePacketPath = getLatestFileInDir(inputFolders.queuePackets, 'grounded_tts_queue_packet');
  const voiceDirectionPath = getLatestFileInDir(inputFolders.voiceDirections, 'grounded_tts_voice_direction');

  let shortScriptWords = 0;
  let mediumScriptWords = 0;
  let longScriptWords = 0;

  let hasUnsafeChars = false;
  const unsafeCharDetails: string[] = [];
  let hasExternalUrls = false;
  const urlDetails: string[] = [];
  let hasEmptySections = false;
  const emptySectionDetails: string[] = [];

  let sourceBriefReferenced = true;
  let manualReviewRequiredField = true;
  let audioGenerationStatusNotStarted = true;
  let noCompletedAudioFiles = true;
  let statusFieldsPresent = true;

  const blockers: string[] = [];

  const filesToCheck = [
    { name: 'Short Script', path: shortScriptPath },
    { name: 'Medium Script', path: mediumScriptPath },
    { name: 'Long Script', path: longScriptPath },
    { name: 'Queue Packet', path: queuePacketPath },
    { name: 'Voice Direction', path: voiceDirectionPath }
  ];

  // Helper function to scan contents
  const scanContent = (fileName: string, filePath: string) => {
    const text = fs.readFileSync(filePath, 'utf-8');

    // Unsafe command injections scan
    const unsafeRegex = /[;&|`]|\$\(/;
    if (unsafeRegex.test(text)) {
      hasUnsafeChars = true;
      unsafeCharDetails.push(`${fileName}: Contains potential command injection character.`);
    }

    // External URLs scan
    if (text.includes('http://') || text.includes('https://')) {
      hasExternalUrls = true;
      urlDetails.push(`${fileName}: Contains external URL links.`);
    }

    // Empty template placeholders scan
    if (text.includes('{{') || text.includes('}}')) {
      hasEmptySections = true;
      emptySectionDetails.push(`${fileName}: Contains uncompiled template brackets '{{' or '}}'.`);
    }

    // Metadata checks
    if (fileName.includes('Script') && !text.includes('Source Brief:**')) {
      sourceBriefReferenced = false;
    }

    if (fileName.includes('Script') && !text.includes('Status:** staged_for_voice_review')) {
      statusFieldsPresent = false;
    }

    if (fileName === 'Queue Packet') {
      if (!text.includes('Manual Review Required:** true')) {
        manualReviewRequiredField = false;
      }
      if (!text.includes('Audio Generation Status:** not_started')) {
        audioGenerationStatusNotStarted = false;
      }
      if (text.toLowerCase().includes('completed') && (text.includes('.wav') || text.includes('.mp3'))) {
        noCompletedAudioFiles = false;
      }
    }
  };

  // Perform scans for existing files
  for (const f of filesToCheck) {
    if (f.path) {
      scanContent(f.name, f.path);
    }
  }

  // Calculate words limit for scripts
  if (shortScriptPath) {
    const text = fs.readFileSync(shortScriptPath, 'utf-8');
    shortScriptWords = countWords(extractSpokenContent(text));
  }
  if (mediumScriptPath) {
    const text = fs.readFileSync(mediumScriptPath, 'utf-8');
    mediumScriptWords = countWords(extractSpokenContent(text));
  }
  if (longScriptPath) {
    const text = fs.readFileSync(longScriptPath, 'utf-8');
    longScriptWords = countWords(extractSpokenContent(text));
  }

  // Gather blockers
  if (REQUIRE_SCRIPT_FILES) {
    if (!shortScriptPath) blockers.push("Missing short script file.");
    if (!mediumScriptPath) blockers.push("Missing medium script file.");
    if (!longScriptPath) blockers.push("Missing long script file.");
  }
  if (REQUIRE_QUEUE_PACKET && !queuePacketPath) {
    blockers.push("Missing queue packet file.");
  }
  if (REQUIRE_VOICE_DIRECTION && !voiceDirectionPath) {
    blockers.push("Missing voice direction file.");
  }

  if (shortScriptWords > MAX_SHORT_SCRIPT_WORDS) {
    blockers.push(`Short script exceeds word limit (${shortScriptWords}/${MAX_SHORT_SCRIPT_WORDS}).`);
  }
  if (mediumScriptWords > MAX_MEDIUM_SCRIPT_WORDS) {
    blockers.push(`Medium script exceeds word limit (${mediumScriptWords}/${MAX_MEDIUM_SCRIPT_WORDS}).`);
  }
  if (longScriptWords > MAX_LONG_SCRIPT_WORDS) {
    blockers.push(`Long script exceeds word limit (${longScriptWords}/${MAX_LONG_SCRIPT_WORDS}).`);
  }

  if (hasUnsafeChars) {
    blockers.push("Command injection vulnerability detected.");
  }
  if (hasEmptySections) {
    blockers.push("Uncompiled template placeholders detected.");
  }
  if (!sourceBriefReferenced) {
    blockers.push("Source brief metadata reference is missing in scripts.");
  }
  if (!manualReviewRequiredField) {
    blockers.push("Queue packet is missing manual review required field.");
  }
  if (!audioGenerationStatusNotStarted) {
    blockers.push("Queue packet audio generation status is not 'not_started'.");
  }
  if (!noCompletedAudioFiles) {
    blockers.push("Queue packet conflicts: Audio files are already marked completed.");
  }

  // Calculate readiness score
  let score = 100;
  if (!shortScriptPath) score -= 10;
  if (!mediumScriptPath) score -= 10;
  if (!longScriptPath) score -= 10;
  if (!queuePacketPath) score -= 10;
  if (!voiceDirectionPath) score -= 10;

  if (shortScriptWords > MAX_SHORT_SCRIPT_WORDS) score -= 10;
  if (mediumScriptWords > MAX_MEDIUM_SCRIPT_WORDS) score -= 10;
  if (longScriptWords > MAX_LONG_SCRIPT_WORDS) score -= 10;

  if (hasUnsafeChars) score -= 15;
  if (hasEmptySections) score -= 10;
  if (!sourceBriefReferenced || !manualReviewRequiredField || !audioGenerationStatusNotStarted) score -= 10;

  const readinessScore = Math.max(0, score);

  let finalStatus = 'ready_for_manual_audio_synthesis';
  if (blockers.length > 0) {
    if (hasUnsafeChars) {
      finalStatus = 'blocked';
    } else if (hasEmptySections || blockers.some(b => b.includes('Missing'))) {
      finalStatus = 'needs_revision';
    } else {
      finalStatus = 'needs_light_cleanup';
    }
  }

  return {
    shortScriptPath,
    mediumScriptPath,
    longScriptPath,
    queuePacketPath,
    voiceDirectionPath,
    shortScriptWords,
    mediumScriptWords,
    longScriptWords,
    hasUnsafeChars,
    unsafeCharDetails,
    hasExternalUrls,
    urlDetails,
    hasEmptySections,
    emptySectionDetails,
    sourceBriefReferenced,
    manualReviewRequiredField,
    audioGenerationStatusNotStarted,
    noCompletedAudioFiles,
    statusFieldsPresent,
    blockers,
    readinessScore,
    finalStatus
  };
}

// 1. validate command
async function handleValidate(): Promise<string> {
  console.log("🔬 Running full syntax, limits, and integrity validation scans...");
  await announceIntent("Validating TTS queue script packet readiness.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_validation', 'tts-validation-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Validation report template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const filesCheckedText = [
    scan.shortScriptPath ? `- **Short Script:** ${path.basename(scan.shortScriptPath)}` : null,
    scan.mediumScriptPath ? `- **Medium Script:** ${path.basename(scan.mediumScriptPath)}` : null,
    scan.longScriptPath ? `- **Long Script:** ${path.basename(scan.longScriptPath)}` : null,
    scan.queuePacketPath ? `- **Queue Packet:** ${path.basename(scan.queuePacketPath)}` : null,
    scan.voiceDirectionPath ? `- **Voice Direction:** ${path.basename(scan.voiceDirectionPath)}` : null
  ].filter(f => f !== null).join('\n') || "- No files checked.";

  const missingFiles: string[] = [];
  if (!scan.shortScriptPath) missingFiles.push("Short Script");
  if (!scan.mediumScriptPath) missingFiles.push("Medium Script");
  if (!scan.longScriptPath) missingFiles.push("Long Script");
  if (!scan.queuePacketPath) missingFiles.push("Queue Packet");
  if (!scan.voiceDirectionPath) missingFiles.push("Voice Direction");
  const missingFilesText = missingFiles.length > 0 ? missingFiles.map(f => `- ${f}`).join('\n') : "- None";

  const wordCountsText = [
    `- **Short script word count:** ${scan.shortScriptWords} (limit: ${MAX_SHORT_SCRIPT_WORDS})`,
    `- **Medium script word count:** ${scan.mediumScriptWords} (limit: ${MAX_MEDIUM_SCRIPT_WORDS})`,
    `- **Long script word count:** ${scan.longScriptWords} (limit: ${MAX_LONG_SCRIPT_WORDS})`
  ].join('\n');

  const blockersText = scan.blockers.length > 0 ? scan.blockers.map(b => `- ${b}`).join('\n') : "- None";

  const nextAction = scan.blockers.length > 0
    ? "Fix outstanding validation blockers before pushing to audio generation."
    : "Review scripts and trigger Piper voice synthesis.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{READINESS_SCORE\}\}/g, String(scan.readinessScore))
    .replace(/\{\{FINAL_STATUS\}\}/g, scan.finalStatus)
    .replace(/\{\{FILES_CHECKED\}\}/g, filesCheckedText)
    .replace(/\{\{MISSING_FILES\}\}/g, missingFilesText)
    .replace(/\{\{WORD_COUNTS\}\}/g, wordCountsText)
    .replace(/\{\{QUEUE_PACKET_STATUS\}\}/g, scan.queuePacketPath ? 'present' : 'missing')
    .replace(/\{\{VOICE_DIRECTION_STATUS\}\}/g, scan.voiceDirectionPath ? 'present' : 'missing')
    .replace(/\{\{MANUAL_REVIEW_STATUS\}\}/g, scan.manualReviewRequiredField ? 'valid' : 'missing_review_field')
    .replace(/\{\{AUDIO_GENERATION_ELIGIBILITY\}\}/g, scan.blockers.length === 0 ? 'eligible' : 'ineligible')
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, `tts_validation_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS validation report compiled. Score: ${scan.readinessScore}%. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('VALIDATE_QUEUE', detailMsg);

  await announceCompletion("TTS queue validation report compiled successfully.");
  return outPath;
}

// 2. checklist command
async function handleChecklist(): Promise<string> {
  console.log("🔬 Compiling structured requirement eligibility checklists...");
  await announceIntent("Compiling TTS eligibility checklist.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_validation', 'tts-eligibility-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Eligibility checklist template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SHORT_SCRIPT_STATUS\}\}/g, scan.shortScriptPath ? 'PASSED' : 'FAILED')
    .replace(/\{\{SHORT_SCRIPT_EVIDENCE\}\}/g, scan.shortScriptPath ? `Words count: ${scan.shortScriptWords}` : 'File missing')
    .replace(/\{\{SHORT_SCRIPT_BLOCKER\}\}/g, scan.shortScriptPath ? 'No' : 'Yes')
    .replace(/\{\{SHORT_SCRIPT_ACTION\}\}/g, scan.shortScriptPath ? 'None' : 'Compile short script')

    .replace(/\{\{MEDIUM_SCRIPT_STATUS\}\}/g, scan.mediumScriptPath ? 'PASSED' : 'FAILED')
    .replace(/\{\{MEDIUM_SCRIPT_EVIDENCE\}\}/g, scan.mediumScriptPath ? `Words count: ${scan.mediumScriptWords}` : 'File missing')
    .replace(/\{\{MEDIUM_SCRIPT_BLOCKER\}\}/g, scan.mediumScriptPath ? 'No' : 'Yes')
    .replace(/\{\{MEDIUM_SCRIPT_ACTION\}\}/g, scan.mediumScriptPath ? 'None' : 'Compile medium script')

    .replace(/\{\{LONG_SCRIPT_STATUS\}\}/g, scan.longScriptPath ? 'PASSED' : 'FAILED')
    .replace(/\{\{LONG_SCRIPT_EVIDENCE\}\}/g, scan.longScriptPath ? `Words count: ${scan.longScriptWords}` : 'File missing')
    .replace(/\{\{LONG_SCRIPT_BLOCKER\}\}/g, scan.longScriptPath ? 'No' : 'Yes')
    .replace(/\{\{LONG_SCRIPT_ACTION\}\}/g, scan.longScriptPath ? 'None' : 'Compile long script')

    .replace(/\{\{QUEUE_PACKET_STATUS\}\}/g, scan.queuePacketPath ? 'PASSED' : 'FAILED')
    .replace(/\{\{QUEUE_PACKET_EVIDENCE\}\}/g, scan.queuePacketPath ? 'Queue metadata mapping present' : 'File missing')
    .replace(/\{\{QUEUE_PACKET_BLOCKER\}\}/g, scan.queuePacketPath ? 'No' : 'Yes')
    .replace(/\{\{QUEUE_PACKET_ACTION\}\}/g, scan.queuePacketPath ? 'None' : 'Compile queue packet')

    .replace(/\{\{VOICE_DIRECTION_STATUS\}\}/g, scan.voiceDirectionPath ? 'PASSED' : 'FAILED')
    .replace(/\{\{VOICE_DIRECTION_EVIDENCE\}\}/g, scan.voiceDirectionPath ? 'Voice settings found' : 'File missing')
    .replace(/\{\{VOICE_DIRECTION_BLOCKER\}\}/g, scan.voiceDirectionPath ? 'No' : 'Yes')
    .replace(/\{\{VOICE_DIRECTION_ACTION\}\}/g, scan.voiceDirectionPath ? 'None' : 'Compile voice direction spec')

    .replace(/\{\{WORD_LIMIT_STATUS\}\}/g, (scan.shortScriptWords <= MAX_SHORT_SCRIPT_WORDS && scan.mediumScriptWords <= MAX_MEDIUM_SCRIPT_WORDS && scan.longScriptWords <= MAX_LONG_SCRIPT_WORDS) ? 'PASSED' : 'FAILED')
    .replace(/\{\{WORD_LIMIT_EVIDENCE\}\}/g, `Word counts: short=${scan.shortScriptWords}, medium=${scan.mediumScriptWords}, long=${scan.longScriptWords}`)
    .replace(/\{\{WORD_LIMIT_BLOCKER\}\}/g, (scan.shortScriptWords <= MAX_SHORT_SCRIPT_WORDS && scan.mediumScriptWords <= MAX_MEDIUM_SCRIPT_WORDS && scan.longScriptWords <= MAX_LONG_SCRIPT_WORDS) ? 'No' : 'Yes')
    .replace(/\{\{WORD_LIMIT_ACTION\}\}/g, 'None')

    .replace(/\{\{SAFE_CHARS_STATUS\}\}/g, !scan.hasUnsafeChars ? 'PASSED' : 'WARNING')
    .replace(/\{\{SAFE_CHARS_EVIDENCE\}\}/g, !scan.hasUnsafeChars ? 'No command shell characters found' : scan.unsafeCharDetails.join('; '))
    .replace(/\{\{SAFE_CHARS_BLOCKER\}\}/g, !scan.hasUnsafeChars ? 'No' : 'Yes')
    .replace(/\{\{SAFE_CHARS_ACTION\}\}/g, !scan.hasUnsafeChars ? 'None' : 'Sanitize script files of injection characters')

    .replace(/\{\{SAFE_URLS_STATUS\}\}/g, !scan.hasExternalUrls ? 'PASSED' : 'WARNING')
    .replace(/\{\{SAFE_URLS_EVIDENCE\}\}/g, !scan.hasExternalUrls ? 'No http/https links found' : scan.urlDetails.join('; '))
    .replace(/\{\{SAFE_URLS_BLOCKER\}\}/g, 'No')
    .replace(/\{\{SAFE_URLS_ACTION\}\}/g, 'None')

    .replace(/\{\{READY_FOR_TTS\}\}/g, scan.blockers.length === 0 ? 'Yes' : 'No')
    .replace(/\{\{BLOCKERS_COUNT\}\}/g, String(scan.blockers.length));

  const outPath = getSafeWritePath(outputFolders.checklists, `tts_eligibility_checklist_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS eligibility checklist compiled successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_CHECKLIST', detailMsg);

  await announceCompletion("TTS eligibility checklist compiled successfully.");
  return outPath;
}

// 3. risk-report command
async function handleRiskReport(): Promise<string> {
  console.log("🔬 Compiling security and risk analysis report...");
  await announceIntent("Compiling TTS risk report.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_validation', 'tts-risk-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Risk report template not found: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SAFE_CHARS_FILE\}\}/g, scan.hasUnsafeChars ? 'Grounded scripts' : 'None')
    .replace(/\{\{SAFE_CHARS_FINDING\}\}/g, scan.hasUnsafeChars ? scan.unsafeCharDetails.join('; ') : 'No shell execution characters detected')
    .replace(/\{\{SAFE_CHARS_SEVERITY\}\}/g, scan.hasUnsafeChars ? 'High' : 'Low')
    .replace(/\{\{SAFE_CHARS_FIX\}\}/g, scan.hasUnsafeChars ? 'Strip characters ; & | and $()' : 'None required')

    .replace(/\{\{SAFE_URLS_FILE\}\}/g, scan.hasExternalUrls ? 'Scripts / Briefs' : 'None')
    .replace(/\{\{SAFE_URLS_FINDING\}\}/g, scan.hasExternalUrls ? scan.urlDetails.join('; ') : 'No external URLs detected')
    .replace(/\{\{SAFE_URLS_SEVERITY\}\}/g, scan.hasExternalUrls ? 'Medium' : 'Low')
    .replace(/\{\{SAFE_URLS_FIX\}\}/g, scan.hasExternalUrls ? 'Verify offline containment' : 'None required')

    .replace(/\{\{EMPTY_SECTIONS_FILE\}\}/g, scan.hasEmptySections ? 'Staged outputs' : 'None')
    .replace(/\{\{EMPTY_SECTIONS_FINDING\}\}/g, scan.hasEmptySections ? scan.emptySectionDetails.join('; ') : 'No uncompiled placeholders found')
    .replace(/\{\{EMPTY_SECTIONS_SEVERITY\}\}/g, scan.hasEmptySections ? 'High' : 'Low')
    .replace(/\{\{EMPTY_SECTIONS_FIX\}\}/g, scan.hasEmptySections ? 'Verify templates variables compilation' : 'None required')

    .replace(/\{\{SOURCE_BRIEF_FILE\}\}/g, !scan.sourceBriefReferenced ? 'Grounded scripts' : 'None')
    .replace(/\{\{SOURCE_BRIEF_FINDING\}\}/g, !scan.sourceBriefReferenced ? 'Missing source brief metadata mapping' : 'Source reference verified')
    .replace(/\{\{SOURCE_BRIEF_SEVERITY\}\}/g, !scan.sourceBriefReferenced ? 'High' : 'Low')
    .replace(/\{\{SOURCE_BRIEF_FIX\}\}/g, !scan.sourceBriefReferenced ? 'Ensure brief metadata block is generated' : 'None required')

    .replace(/\{\{STATUS_CONFLICTS_FILE\}\}/g, (!scan.noCompletedAudioFiles || !scan.audioGenerationStatusNotStarted) ? 'Queue Packet' : 'None')
    .replace(/\{\{STATUS_CONFLICTS_FINDING\}\}/g, (!scan.noCompletedAudioFiles || !scan.audioGenerationStatusNotStarted) ? 'Completed audio files detected or status conflicts' : 'Execution status is consistent')
    .replace(/\{\{STATUS_CONFLICTS_SEVERITY\}\}/g, (!scan.noCompletedAudioFiles || !scan.audioGenerationStatusNotStarted) ? 'High' : 'Low')
    .replace(/\{\{STATUS_CONFLICTS_FIX\}\}/g, (!scan.noCompletedAudioFiles || !scan.audioGenerationStatusNotStarted) ? 'Reset audio generation status to not_started' : 'None required');

  const outPath = getSafeWritePath(outputFolders.reports, `tts_risk_report_${getFormattedDate()}`, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS risk report compiled successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_RISK_REPORT', detailMsg);

  await announceCompletion("TTS risk report compiled successfully.");
  return outPath;
}

// 4. status command
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE TTS QUEUE VALIDATOR STATUS");
  console.log("=========================================");

  const getLatestFileInDir = (dir: string, prefix: string, ext = '.md'): string => {
    if (!fs.existsSync(dir)) return "Folder missing";
    const files = fs.readdirSync(dir).filter(f => f.endsWith(ext) && f.startsWith(prefix)).sort();
    return files.length > 0 ? files[files.length - 1] : "None generated";
  };

  const shortScript = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_short_script');
  const mediumScript = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_medium_script');
  const longScript = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_long_script');
  const queuePacket = getLatestFileInDir(inputFolders.queuePackets, 'grounded_tts_queue_packet');
  const voiceDirection = getLatestFileInDir(inputFolders.voiceDirections, 'grounded_tts_voice_direction');

  const valReport = getLatestFileInDir(outputFolders.reports, 'tts_validation_report');
  const checklist = getLatestFileInDir(outputFolders.checklists, 'tts_eligibility_checklist');
  const riskReport = getLatestFileInDir(outputFolders.reports, 'tts_risk_report');

  const scan = runScans();

  console.log(`Latest Short Script:     ${shortScript}`);
  console.log(`Latest Medium Script:    ${mediumScript}`);
  console.log(`Latest Long Script:      ${longScript}`);
  console.log(`Latest Queue Packet:     ${queuePacket}`);
  console.log(`Latest Voice Direction:  ${voiceDirection}`);
  console.log(`Latest Validation:       ${valReport}`);
  console.log(`Latest Checklist:        ${checklist}`);
  console.log(`Latest Risk Report:      ${riskReport}`);
  console.log(`Readiness Score:         ${scan.readinessScore}%`);
  console.log(`Active Blockers:         ${scan.blockers.length}`);

  if (scan.blockers.length > 0) {
    console.log("Recommended Action:      Inspect risk report and sanitize script contents.");
  } else {
    console.log("Recommended Action:      Sign-off validator checklist and stage for audio rendering.");
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
  if (!VALIDATION_ONLY) {
    console.error("❌ Safety Gate Triggered: Validator is not in validation-only mode.");
    process.exit(1);
  }

  if (ALLOW_TTS_GENERATION || ALLOW_AUDIO_FILE_CREATION || ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety Gate Triggered: Audio rendering or external connections are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-queue-validator-help' for detailed instructions.");
    } else if (command === 'validate') {
      await handleValidate();
    } else if (command === 'checklist') {
      await handleChecklist();
    } else if (command === 'risk-report') {
      await handleRiskReport();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS queue validator execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
