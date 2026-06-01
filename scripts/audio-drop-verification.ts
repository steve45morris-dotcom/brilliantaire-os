import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AUDIO_DROP_VERIFICATION_ONLY,
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_UPLOAD,
  ALLOW_AUDIO_DELETION,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_AUDIO_DROP,
  REQUIRE_SESSION_METADATA,
  REQUIRE_QUARANTINE_FOR_UNSUPPORTED,
  inputFolders,
  outputFolders,
  ALLOWED_AUDIO_EXTENSIONS,
  MAX_AUDIO_SIZE_BYTES,
  RECOMMENDED_NAMING_PATTERN,
  REPO_ROOT
} from '../config/audio-drop-verification.js';
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
  const logFile = path.join(outputFolders.logs, `audio_verification_log_${dateStr}.md`);
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

// 1. inventory command
async function handleInventory(): Promise<string> {
  console.log("Scanning audio drop directory...");
  await announceIntent("Scanning audio drop folder for inventory collection.");

  if (!fs.existsSync(inputFolders.recordings)) {
    fs.mkdirSync(inputFolders.recordings, { recursive: true });
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'audio_drop_verification', 'audio-inventory-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Inventory template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const files = fs.readdirSync(inputFolders.recordings).filter(f => !f.startsWith('.'));
  let allowedCount = 0;
  let unsupportedCount = 0;
  let oversizedCount = 0;
  let fileRows = '';
  const sizeMap = new Map<number, string[]>();

  for (const file of files) {
    const filePath = path.join(inputFolders.recordings, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const isAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const isOversized = stats.size > MAX_AUDIO_SIZE_BYTES;

    let status = 'Valid';
    if (!isAllowed) {
      status = 'Unsupported Format';
      unsupportedCount++;
    } else if (isOversized) {
      status = 'Oversized';
      oversizedCount++;
    } else {
      allowedCount++;
    }

    fileRows += `| ${file} | ${stats.size} | ${ext} | ${status} |\n`;

    if (!sizeMap.has(stats.size)) {
      sizeMap.set(stats.size, []);
    }
    sizeMap.get(stats.size)!.push(file);
  }

  if (files.length === 0) {
    fileRows = '| *No files found* | 0 | - | - |\n';
  }

  // Find duplicates by size
  const duplicateList: string[] = [];
  for (const [size, filenames] of sizeMap.entries()) {
    if (filenames.length > 1) {
      duplicateList.push(`${filenames.join(' vs ')} (${size} bytes)`);
    }
  }

  const dateStr = getFormattedDate();
  const nextAction = allowedCount > 0 
    ? "Proceed to match-sessions command to map valid audio to active metadata records." 
    : "Drop valid audio files (.wav, .mp3, .m4a) under 100MB into voice_sessions/manual_recordings/.";

  const content = template
    .replace(/\{\{SCAN_DATE\}\}/g, dateStr)
    .replace(/\{\{RECORDINGS_PATH\}\}/g, inputFolders.recordings)
    .replace(/\{\{TOTAL_FILES\}\}/g, String(files.length))
    .replace(/\{\{ALLOWED_FILES_COUNT\}\}/g, String(allowedCount))
    .replace(/\{\{UNSUPPORTED_FILES_COUNT\}\}/g, String(unsupportedCount))
    .replace(/\{\{OVERSIZED_FILES_COUNT\}\}/g, String(oversizedCount))
    .replace(/\{\{FILE_ROWS\}\}/g, fileRows.trim())
    .replace(/\{\{DUPLICATE_COUNT\}\}/g, String(duplicateList.length))
    .replace(/\{\{DUPLICATE_DETAILS\}\}/g, duplicateList.length > 0 ? duplicateList.join(', ') : 'None detected')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.inventory, 'audio_drop_inventory_' + dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `Audio drop inventory compiled. Found ${files.length} total files (${allowedCount} allowed). Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_INVENTORY', detailMsg);

  await announceCompletion("Audio drop inventory compiled successfully.");
  return outPath;
}

// 2. match-sessions command
async function handleMatchSessions(): Promise<string> {
  console.log("Matching audio files to session metadata...");
  await announceIntent("Matching dropped audio files against session metadata records.");

  if (!fs.existsSync(inputFolders.metadata)) {
    fs.mkdirSync(inputFolders.metadata, { recursive: true });
  }
  if (!fs.existsSync(inputFolders.recordings)) {
    fs.mkdirSync(inputFolders.recordings, { recursive: true });
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'audio_drop_verification', 'audio-session-match-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Session match template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const audioFiles = fs.readdirSync(inputFolders.recordings).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  });

  const metadataFiles = fs.readdirSync(inputFolders.metadata).filter(f => f.endsWith('.json'));
  const metadataRecords: { file: string; id: string; type: string }[] = [];

  for (const mFile of metadataFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(inputFolders.metadata, mFile), 'utf-8'));
      metadataRecords.push({
        file: mFile,
        id: content.id || content.sessionId || path.basename(mFile, '.json'),
        type: content.sessionType || content.type || ''
      });
    } catch (err) {
      metadataRecords.push({
        file: mFile,
        id: path.basename(mFile, '.json'),
        type: ''
      });
    }
  }

  let matchRows = '';
  const matchedMetadata = new Set<string>();
  const unmatchedAudio: string[] = [];

  for (const aFile of audioFiles) {
    let bestMatch: typeof metadataRecords[0] | null = null;
    let confidence = 'NONE';

    // Simple heuristic: matching filename segment
    for (const record of metadataRecords) {
      if (aFile.includes(record.id)) {
        bestMatch = record;
        confidence = 'HIGH';
        break;
      }
    }

    if (!bestMatch) {
      for (const record of metadataRecords) {
        if (record.type && aFile.toLowerCase().includes(record.type.toLowerCase())) {
          bestMatch = record;
          confidence = 'MEDIUM';
        }
      }
    }

    if (bestMatch) {
      matchedMetadata.add(bestMatch.file);
      matchRows += `| ${aFile} | ${bestMatch.file} | ${confidence} | Matched |\n`;
    } else {
      unmatchedAudio.push(aFile);
      matchRows += `| ${aFile} | None | NONE | Unmatched |\n`;
    }
  }

  if (audioFiles.length === 0) {
    matchRows = '| *No valid audio files found* | - | - | - |\n';
  }

  const orphanSessions = metadataRecords.filter(r => !matchedMetadata.has(r.file)).map(r => r.file);

  const dateStr = getFormattedDate();
  const nextAction = unmatchedAudio.length > 0 || orphanSessions.length > 0
    ? "Review unmatched audio files or orphan metadata files to align names."
    : "Proceed to quarantine-check command to filter unsupported dropped payloads.";

  const content = template
    .replace(/\{\{SCAN_DATE\}\}/g, dateStr)
    .replace(/\{\{MATCH_ROWS\}\}/g, matchRows.trim())
    .replace(/\{\{UNMATCHED_AUDIO_COUNT\}\}/g, String(unmatchedAudio.length))
    .replace(/\{\{UNMATCHED_AUDIO_LIST\}\}/g, unmatchedAudio.length > 0 ? unmatchedAudio.join(', ') : 'None')
    .replace(/\{\{ORPHAN_SESSIONS_COUNT\}\}/g, String(orphanSessions.length))
    .replace(/\{\{ORPHAN_SESSIONS_LIST\}\}/g, orphanSessions.length > 0 ? orphanSessions.join(', ') : 'None')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'audio_session_match_report_' + dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `Session matching compiled. Checked ${audioFiles.length} files. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_SESSION_MATCH', detailMsg);

  await announceCompletion("Audio session matching compiled successfully.");
  return outPath;
}

// 3. quarantine-check command
async function handleQuarantineCheck(): Promise<string> {
  console.log("Analyzing audio drop folder for quarantine candidates...");
  await announceIntent("Inspecting and quarantining unsafe or unsupported dropped assets.");

  if (!fs.existsSync(inputFolders.recordings)) {
    fs.mkdirSync(inputFolders.recordings, { recursive: true });
  }
  if (!fs.existsSync(outputFolders.quarantine)) {
    fs.mkdirSync(outputFolders.quarantine, { recursive: true });
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'audio_drop_verification', 'audio-quarantine-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Quarantine template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const files = fs.readdirSync(inputFolders.recordings).filter(f => !f.startsWith('.'));
  const unsupportedFiles: string[] = [];
  const oversizedFiles: string[] = [];
  let copiedCount = 0;

  for (const file of files) {
    const filePath = path.join(inputFolders.recordings, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const isAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const isOversized = stats.size > MAX_AUDIO_SIZE_BYTES;

    if (!isAllowed) {
      unsupportedFiles.push(file);
      if (REQUIRE_QUARANTINE_FOR_UNSUPPORTED) {
        fs.copyFileSync(filePath, path.join(outputFolders.quarantine, file));
        copiedCount++;
      }
    } else if (isOversized) {
      oversizedFiles.push(file);
      if (REQUIRE_QUARANTINE_FOR_UNSUPPORTED) {
        fs.copyFileSync(filePath, path.join(outputFolders.quarantine, file));
        copiedCount++;
      }
    }
  }

  const dateStr = getFormattedDate();
  const originalsPreserved = ALLOW_AUDIO_DELETION ? "No" : "Yes";
  const nextAction = copiedCount > 0
    ? "Review isolated files in outputs/audio_drop_verification/quarantine/ and clean manual directories."
    : "Quarantine check completed. No suspicious files staged.";

  const content = template
    .replace(/\{\{SCAN_DATE\}\}/g, dateStr)
    .replace(/\{\{QUARANTINE_PATH\}\}/g, outputFolders.quarantine)
    .replace(/\{\{UNSUPPORTED_COUNT\}\}/g, String(unsupportedFiles.length))
    .replace(/\{\{UNSUPPORTED_LIST\}\}/g, unsupportedFiles.length > 0 ? unsupportedFiles.join(', ') : 'None')
    .replace(/\{\{OVERSIZED_COUNT\}\}/g, String(oversizedFiles.length))
    .replace(/\{\{OVERSIZED_LIST\}\}/g, oversizedFiles.length > 0 ? oversizedFiles.join(', ') : 'None')
    .replace(/\{\{QUARANTINE_COPY_PATH\}\}/g, copiedCount > 0 ? outputFolders.quarantine : 'None')
    .replace(/\{\{ORIGINALS_PRESERVED\}\}/g, originalsPreserved)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'audio_quarantine_report_' + dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `Quarantine check complete. Flagged: ${unsupportedFiles.length} unsupported, ${oversizedFiles.length} oversized. Copied ${copiedCount} files. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_QUARANTINE', detailMsg);

  await announceCompletion("Audio quarantine verification check completed successfully.");
  return outPath;
}

// 4. cleanup-report command
async function handleCleanupReport(): Promise<string> {
  console.log("Compiling final audio drop cleanup report...");
  await announceIntent("Compiling comprehensive audio drop cleanup report.");

  const dateStr = getFormattedDate();
  const latestInv = getLatestFileInDir(outputFolders.inventory, 'audio_drop_inventory');
  const latestMatch = getLatestFileInDir(outputFolders.reports, 'audio_session_match_report');
  const latestQuarantine = getLatestFileInDir(outputFolders.reports, 'audio_quarantine_report');

  if (!fs.existsSync(inputFolders.staging)) {
    fs.mkdirSync(inputFolders.staging, { recursive: true });
  }
  const stagedRecords = fs.readdirSync(inputFolders.staging).filter(f => f.endsWith('.md') || f.endsWith('.json'));

  const templatePath = path.join(REPO_ROOT, 'templates', 'audio_drop_verification', 'audio-cleanup-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Cleanup template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Perform a live assessment
  const files = fs.existsSync(inputFolders.recordings) ? fs.readdirSync(inputFolders.recordings).filter(f => !f.startsWith('.')) : [];
  let validAudioCount = 0;
  let renameCount = 0;
  let duplicateCount = 0;
  let unsupportedCount = 0;
  let unmatchedSessionsCount = 0;
  const validAudioList: string[] = [];
  const renameList: string[] = [];

  const sizeMap = new Map<number, string>();

  // Get session metadata ids
  const metadataFiles = fs.existsSync(inputFolders.metadata) ? fs.readdirSync(inputFolders.metadata).filter(f => f.endsWith('.json')) : [];
  const sessionIds: string[] = [];
  for (const m of metadataFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(inputFolders.metadata, m), 'utf-8'));
      if (content.id) sessionIds.push(content.id);
    } catch(e){}
  }

  for (const file of files) {
    const filePath = path.join(inputFolders.recordings, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const isAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const isOversized = stats.size > MAX_AUDIO_SIZE_BYTES;

    if (!isAllowed || isOversized) {
      unsupportedCount++;
      continue;
    }

    // Check naming convention: voice_session_<session-type>_<YYYY-MM-DD>.<ext>
    const nameMatch = /^voice_session_[a-zA-Z0-9_\-]+_\d{4}-\d{2}-\d{2}\.[a-zA-Z0-9]+$/.test(file);
    if (!nameMatch) {
      renameCount++;
      renameList.push(`- **${file}**: Needs formatting to match \`${RECOMMENDED_NAMING_PATTERN}\``);
    } else {
      validAudioCount++;
      validAudioList.push(`- **${file}** (${stats.size} bytes)`);
    }

    if (sizeMap.has(stats.size)) {
      duplicateCount++;
    } else {
      sizeMap.set(stats.size, file);
    }
  }

  unmatchedSessionsCount = Math.max(0, metadataFiles.length - (files.length - unsupportedCount - renameCount));

  let recommendations = '';
  if (unsupportedCount > 0) {
    recommendations += `- Remove the ${unsupportedCount} unsupported or oversized file(s) from manual drops.\n`;
  }
  if (renameCount > 0) {
    recommendations += `- Rename ${renameCount} file(s) to match standard formatting.\n`;
  }
  if (duplicateCount > 0) {
    recommendations += `- Resolve duplicate size matches found in local directory.\n`;
  }
  if (recommendations === '') {
    recommendations = '- No manual file operations or renames required. System is fully clean.';
  }

  const stagedAudioFound = validAudioCount > 0 ? 'Yes' : 'No';
  const asrReadinessStatus = validAudioCount > 0 && unsupportedCount === 0 && renameCount === 0
    ? 'READY'
    : 'BLOCKED';

  const nextAction = asrReadinessStatus === 'READY'
    ? 'All manual audio drops verified and clean. Eligible for future ASR pipeline staging.'
    : 'Apply recommendations to resolve naming and format blockers.';

  const content = template
    .replace(/\{\{SCAN_DATE\}\}/g, dateStr)
    .replace(/\{\{VALID_AUDIO_COUNT\}\}/g, String(validAudioCount))
    .replace(/\{\{RENAME_COUNT\}\}/g, String(renameCount))
    .replace(/\{\{DUPLICATE_COUNT\}\}/g, String(duplicateCount))
    .replace(/\{\{UNSUPPORTED_COUNT\}\}/g, String(unsupportedCount))
    .replace(/\{\{UNMATCHED_SESSIONS_COUNT\}\}/g, String(unmatchedSessionsCount))
    .replace(/\{\{STAGED_RECORDS_COUNT\}\}/g, String(stagedRecords.length))
    .replace(/\{\{VALID_AUDIO_LIST\}\}/g, validAudioList.length > 0 ? validAudioList.join('\n') : '*None found*')
    .replace(/\{\{RENAME_LIST\}\}/g, renameList.length > 0 ? renameList.join('\n') : '*None found*')
    .replace(/\{\{CLEANUP_RECOMMENDATIONS\}\}/g, recommendations.trim())
    .replace(/\{\{STAGED_AUDIO_FOUND\}\}/g, stagedAudioFound)
    .replace(/\{\{ASR_READINESS_STATUS\}\}/g, asrReadinessStatus)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'audio_cleanup_report_' + dateStr, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `Audio cleanup report compiled. Valid candidates: ${validAudioCount}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_CLEANUP_REPORT', detailMsg);

  await announceCompletion("Audio drop cleanup report compiled successfully.");
  return outPath;
}

// 5. status command
function handleStatus() {
  console.log("=========================================");
  console.log("OFFLINE AUDIO DROP VERIFICATION SWITCH STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const inventory = getLatestFile(outputFolders.inventory, 'audio_drop_inventory');
  const match = getLatestFile(outputFolders.reports, 'audio_session_match_report');
  const quarantine = getLatestFile(outputFolders.reports, 'audio_quarantine_report');
  const cleanup = getLatestFile(outputFolders.reports, 'audio_cleanup_report');

  const files = fs.existsSync(inputFolders.recordings) ? fs.readdirSync(inputFolders.recordings).filter(f => !f.startsWith('.')) : [];
  let allowedCount = 0;
  let unsupportedCount = 0;
  let oversizedCount = 0;
  let renameCount = 0;

  for (const file of files) {
    const filePath = path.join(inputFolders.recordings, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const isAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
    const isOversized = stats.size > MAX_AUDIO_SIZE_BYTES;

    if (!isAllowed) {
      unsupportedCount++;
    } else if (isOversized) {
      oversizedCount++;
    } else {
      allowedCount++;
      const nameMatch = /^voice_session_[a-zA-Z0-9_\-]+_\d{4}-\d{2}-\d{2}\.[a-zA-Z0-9]+$/.test(file);
      if (!nameMatch) renameCount++;
    }
  }

  const validAudioFound = allowedCount > renameCount ? 'Yes' : 'No';
  const quarantineNeeded = (unsupportedCount > 0 || oversizedCount > 0) ? 'Yes' : 'No';
  const asrReadinessImpact = (unsupportedCount === 0 && renameCount === 0 && allowedCount > 0) ? 'READY' : 'BLOCKED';

  console.log(`Latest Inventory:          ${inventory}`);
  console.log(`Latest Session Match:      ${match}`);
  console.log(`Latest Quarantine Report:  ${quarantine}`);
  console.log(`Latest Cleanup Report:     ${cleanup}`);
  console.log(`Valid Audio Found:         ${validAudioFound}`);
  console.log(`Session Match:             ${allowedCount > 0 ? 'Yes' : 'No'}`);
  console.log(`Quarantine Needed:         ${quarantineNeeded}`);
  console.log(`ASR Readiness Impact:      ${asrReadinessImpact}`);
  if (asrReadinessImpact === 'READY') {
    console.log("\nRecommended Action:        All audio checks passed. Staged files are eligible for transcription pipelines.");
  } else {
    console.log("\nRecommended Action:        Resolve naming conventions, remove unsupported files, and rerun status checks.");
  }
  console.log("=========================================");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase().trim() : 'help';

  // Safety Boundary Guard Checks
  if (!AUDIO_DROP_VERIFICATION_ONLY) {
    console.error("❌ Safety Gate Triggered: Audio Drop Verification only flag is disabled.");
    process.exit(1);
  }

  if (ALLOW_ASR_EXECUTION || ALLOW_AUDIO_UPLOAD || ALLOW_AUDIO_DELETION || ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety Gate Triggered: Transcription, uploads, or deletions are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run audio-drop-verification-help' for detailed instructions.");
    } else if (command === 'inventory') {
      await handleInventory();
    } else if (command === 'match-sessions') {
      await handleMatchSessions();
    } else if (command === 'quarantine-check') {
      await handleQuarantineCheck();
    } else if (command === 'cleanup-report') {
      await handleCleanupReport();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Audio drop verification error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
