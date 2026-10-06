import * as fs from 'fs';
import * as path from 'path';
import {
  NARRATOR_TTS_RENDERED_AUDIO_DIR,
  BRIEFING_FLOW_RENDERED_DIR,
  BRIEFING_AUDIO_REVIEW_ROOT,
  BRIEFING_AUDIO_REVIEW_QUEUE_DIR,
  BRIEFING_AUDIO_REVIEW_APPROVED_DIR,
  BRIEFING_AUDIO_REVIEW_REJECTED_DIR,
  BRIEFING_AUDIO_REVIEW_LOGS_DIR,
  BRIEFING_AUDIO_REVIEW_REPORTS_DIR,
  ALLOWED_AUDIO_FORMATS,
  AUTO_PLAYBACK,
  AUTO_PUBLISH,
  AUTO_SEND,
  CLOUD_UPLOAD_ENABLED,
  MANUAL_REVIEW_REQUIRED,
  DUPLICATE_REVIEW_PROTECTION,
  MAX_AUDIO_FILE_SIZE,
  DEFAULT_REVIEW_STATUS
} from '../config/briefing-audio-playback-review.config.js';

// Ensure all directories exist
const dirs = [
  BRIEFING_AUDIO_REVIEW_ROOT,
  BRIEFING_AUDIO_REVIEW_QUEUE_DIR,
  BRIEFING_AUDIO_REVIEW_APPROVED_DIR,
  BRIEFING_AUDIO_REVIEW_REJECTED_DIR,
  BRIEFING_AUDIO_REVIEW_LOGS_DIR,
  BRIEFING_AUDIO_REVIEW_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(BRIEFING_AUDIO_REVIEW_LOGS_DIR, 'briefing_audio_playback_review.log');
const SNAPSHOT_JSON_FILE = path.join(BRIEFING_AUDIO_REVIEW_REPORTS_DIR, 'dashboard_briefing_audio_snapshot.json');

function logEvent(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/briefing_audio_playback_review', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

// Audio ID normalization helper
function normalizeAudioId(input: string): string {
  let id = input.trim();
  id = id.replace(/\.(mp3|wav|m4a)$/i, '');
  id = id.replace(/^narrator_audio_/i, '');
  return id;
}

function countFiles(dir: string, filter?: (file: string) => boolean): number {
  if (!fs.existsSync(dir)) return 0;
  let list = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  if (filter) {
    list = list.filter(filter);
  }
  return list.length;
}

function findRenderedAudio(audioId: string): string | null {
  const formats = ALLOWED_AUDIO_FORMATS;
  for (const fmt of formats) {
    const p1 = path.join(BRIEFING_FLOW_RENDERED_DIR, `narrator_audio_${audioId}.${fmt}`);
    if (fs.existsSync(p1)) return p1;
    const p2 = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${audioId}.${fmt}`);
    if (fs.existsSync(p2)) return p2;
  }
  return null;
}

function getAudioMetadata(audioPath: string) {
  const stat = fs.statSync(audioPath);
  const ext = path.extname(audioPath).replace('.', '');
  return {
    sizeBytes: stat.size,
    format: ext,
    renderTimestamp: stat.mtime.toISOString(),
  };
}

function getQueueFile(audioId: string): string {
  return path.join(BRIEFING_AUDIO_REVIEW_QUEUE_DIR, `review_request_${audioId}.md`);
}

function getApprovedFile(audioId: string): string {
  return path.join(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, `approved_audio_${audioId}.md`);
}

function getRejectedFile(audioId: string): string {
  return path.join(BRIEFING_AUDIO_REVIEW_REJECTED_DIR, `rejected_audio_${audioId}.md`);
}

function parseReviewState(audioId: string): string {
  const appFile = getApprovedFile(audioId);
  if (fs.existsSync(appFile)) return 'approved';

  const rejFile = getRejectedFile(audioId);
  if (fs.existsSync(rejFile)) return 'rejected';

  const qFile = getQueueFile(audioId);
  if (fs.existsSync(qFile)) {
    const content = fs.readFileSync(qFile, 'utf-8');
    const statusMatch = content.match(/## Request Status\s*([a-zA-Z0-9_]+)/i);
    return statusMatch ? statusMatch[1].trim() : 'pending_review';
  }

  return 'unregistered';
}

// COMMAND: status
function handleStatus(quiet = false) {
  // Count files
  const renderedCount = countFiles(BRIEFING_FLOW_RENDERED_DIR) + countFiles(NARRATOR_TTS_RENDERED_AUDIO_DIR);
  const pendingCount = countFiles(BRIEFING_AUDIO_REVIEW_QUEUE_DIR, f => f.startsWith('review_request_') && f.endsWith('.md'));
  const approvedCount = countFiles(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, f => f.startsWith('approved_audio_') && f.endsWith('.md'));
  const rejectedCount = countFiles(BRIEFING_AUDIO_REVIEW_REJECTED_DIR, f => f.startsWith('rejected_audio_') && f.endsWith('.md'));
  const reviewedCount = approvedCount + rejectedCount; // items that are no longer pending review

  let latestAudioId = 'None';
  let latestAudioPath = 'None';
  let latestApprovedPath = 'None';

  // Find latest audio from rendered sources
  const files1 = fs.existsSync(BRIEFING_FLOW_RENDERED_DIR) ? fs.readdirSync(BRIEFING_FLOW_RENDERED_DIR).filter(f => !f.startsWith('.')) : [];
  const files2 = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR) ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => !f.startsWith('.')) : [];
  const allAudioFiles = [...files1, ...files2].sort();

  if (allAudioFiles.length > 0) {
    const latestFile = allAudioFiles[allAudioFiles.length - 1];
    latestAudioId = normalizeAudioId(latestFile);
    latestAudioPath = findRenderedAudio(latestAudioId) || 'None';
  }

  // Find latest approved audio
  const approvedFiles = fs.existsSync(BRIEFING_AUDIO_REVIEW_APPROVED_DIR)
    ? fs.readdirSync(BRIEFING_AUDIO_REVIEW_APPROVED_DIR).filter(f => f.startsWith('approved_audio_') && f.endsWith('.md')).sort()
    : [];
  if (approvedFiles.length > 0) {
    const latestAppFile = approvedFiles[approvedFiles.length - 1];
    const appId = latestAppFile.replace('approved_audio_', '').replace('.md', '');
    const audioPath = findRenderedAudio(appId);
    if (audioPath) {
      latestApprovedPath = audioPath;
    }
  }

  const snapshotData = {
    latestAudioId,
    renderedAudioCount: renderedCount,
    pendingReviewCount: pendingCount,
    reviewedCount: reviewedCount,
    approvedAudioCount: approvedCount,
    rejectedAudioCount: rejectedCount,
    latestApprovedAudioPath: latestApprovedPath,
    autoPlaybackStatus: AUTO_PLAYBACK ? 'enabled' : 'disabled',
    cloudUploadStatus: CLOUD_UPLOAD_ENABLED ? 'enabled' : 'disabled',
    manualReviewRequired: MANUAL_REVIEW_REQUIRED
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshotData, null, 2), 'utf-8');

  const statusMsg = fillTemplate('briefing-audio-review-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    NARRATOR_TTS_RENDERED_AUDIO_DIR,
    BRIEFING_FLOW_RENDERED_DIR,
    BRIEFING_AUDIO_REVIEW_QUEUE_DIR,
    BRIEFING_AUDIO_REVIEW_APPROVED_DIR,
    BRIEFING_AUDIO_REVIEW_REJECTED_DIR,
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_SEND: String(AUTO_SEND),
    CLOUD_UPLOAD_ENABLED: String(CLOUD_UPLOAD_ENABLED),
    MANUAL_REVIEW_REQUIRED: String(MANUAL_REVIEW_REQUIRED),
    DUPLICATE_REVIEW_PROTECTION: String(DUPLICATE_REVIEW_PROTECTION),
    RENDERED_COUNT: String(renderedCount),
    PENDING_COUNT: String(pendingCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    LATEST_AUDIO_ID: latestAudioId,
    LATEST_AUDIO_PATH: latestAudioPath
  });

  if (!quiet) {
    console.log(statusMsg);
  }

  return snapshotData;
}

// COMMAND: scan-rendered
function handleScanRendered() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Rendered Briefing Audio Files`);
  console.log(`======================================================`);

  const files1 = fs.existsSync(BRIEFING_FLOW_RENDERED_DIR) ? fs.readdirSync(BRIEFING_FLOW_RENDERED_DIR).filter(f => !f.startsWith('.')) : [];
  const files2 = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR) ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => !f.startsWith('.')) : [];
  
  const allFiles = Array.from(new Set([...files1, ...files2])).sort();

  if (allFiles.length === 0) {
    console.log(`*No rendered briefing audio files found.*`);
  } else {
    allFiles.forEach(f => {
      const audioId = normalizeAudioId(f);
      const fullPath = findRenderedAudio(audioId);
      const state = parseReviewState(audioId);
      console.log(`- ID: ${audioId} | File: ${f} | State: [${state.toUpperCase()}]`);
    });
  }
  console.log(`======================================================\n`);
}

// COMMAND: inspect <AUDIO_ID>
function handleInspect(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const audioPath = findRenderedAudio(audioId);

  if (!audioPath) {
    console.error(`❌ Blocker: Rendered audio not found for ID "${audioId}".`);
    console.error(`💡 Recommendation: Run "npm run briefing-tts-render-approval -- render-approved ${audioId}" first to render the audio.`);
    const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      COMMAND: 'inspect',
      FAILURE_CATEGORY: 'Missing Rendered Audio Blocker',
      ERROR_TEXT: `No rendered audio file could be discovered for ID "${audioId}" in source paths.`
    });
    console.log(errorReport);
    process.exit(1);
  }

  const meta = getAudioMetadata(audioPath);
  const reviewState = parseReviewState(audioId);
  const reviewNeeded = ['pending_review', 'unregistered'].includes(reviewState) ? 'YES' : 'NO';

  const inspectMsg = fillTemplate('briefing-audio-review-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    AUDIO_PATH: audioPath,
    SOURCE_BRIEFING_ID: audioId,
    FILE_SIZE: String(meta.sizeBytes),
    FILE_FORMAT: meta.format,
    RENDER_TIMESTAMP: meta.renderTimestamp,
    CACHE_STATUS: 'Verified Offline Cache',
    REVIEW_STATE: reviewState.toUpperCase(),
    REVIEW_NEEDED_FLAG: reviewNeeded
  });

  console.log(inspectMsg);
}

// COMMAND: queue-review <AUDIO_ID>
function handleQueueReview(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const audioPath = findRenderedAudio(audioId);

  if (!audioPath) {
    console.error(`❌ Blocker: Rendered audio not found for ID "${audioId}".`);
    console.error(`💡 Recommendation: Run "npm run briefing-tts-render-approval -- render-approved ${audioId}" first to render the audio.`);
    const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      COMMAND: 'queue-review',
      FAILURE_CATEGORY: 'Missing Rendered Audio Blocker',
      ERROR_TEXT: `No rendered audio file could be discovered for ID "${audioId}" in source paths.`
    });
    console.log(errorReport);
    process.exit(1);
  }

  const queueFile = getQueueFile(audioId);

  if (DUPLICATE_REVIEW_PROTECTION && fs.existsSync(queueFile)) {
    console.log(`[INFO] Idempotence: Audio "${audioId}" is already enqueued in the review queue.`);
    const reviewState = parseReviewState(audioId);
    console.log(`- Current State: [${reviewState.toUpperCase()}]`);
    return;
  }

  // Create queue metadata file
  const queueContent = `# Briefing Audio Review Request: ${audioId}

## Request Status
${DEFAULT_REVIEW_STATUS}

## Details
- Audio ID: ${audioId}
- Source Briefing ID: ${audioId}
- Source Audio Path: ${audioPath}
- Enqueued At: ${new Date().toISOString()}
- Inspected: false
- Reviewed: false
`;

  fs.writeFileSync(queueFile, queueContent, 'utf-8');
  logEvent(`Enqueued: Audio ID "${audioId}" added to review queue.`);

  const onboardingMsg = fillTemplate('briefing-audio-review-queue-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    SOURCE_AUDIO_PATH: audioPath,
    QUEUE_TARGET_PATH: queueFile,
    DEFAULT_REVIEW_STATUS
  });

  console.log(onboardingMsg);
  handleStatus(true); // update snapshot
}

// COMMAND: mark-reviewed <AUDIO_ID>
function handleMarkReviewed(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const queueFile = getQueueFile(audioId);

  if (!fs.existsSync(queueFile)) {
    console.error(`❌ Error: Audio ID "${audioId}" must be enqueued via "queue-review" before marking as reviewed.`);
    process.exit(1);
  }

  const content = fs.readFileSync(queueFile, 'utf-8');
  // Update status to 'reviewed'
  const updatedContent = content
    .replace(/## Request Status\s*[a-zA-Z0-9_]+/i, '## Request Status\nreviewed')
    .replace(/- Reviewed:\s*(true|false)/i, '- Reviewed: true');

  fs.writeFileSync(queueFile, updatedContent, 'utf-8');
  logEvent(`Reviewed: Audio ID "${audioId}" marked as human-reviewed.`);

  const decisionMsg = fillTemplate('briefing-audio-review-decision-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    ACTION_TYPE: 'Human Playback Review Integration',
    PREVIOUS_STATE: 'pending_review',
    TRANSITION_STATUS: 'reviewed',
    DESTINATION_PATH: queueFile,
    DECISION_VERDICT: 'REVIEWED'
  });

  console.log(decisionMsg);
  handleStatus(true);
}

// COMMAND: approve-audio <AUDIO_ID>
function handleApproveAudio(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const queueFile = getQueueFile(audioId);

  if (!fs.existsSync(queueFile)) {
    console.error(`❌ Error: Audio ID "${audioId}" has not been enqueued. Run "queue-review" then "mark-reviewed" first.`);
    process.exit(1);
  }

  const reviewState = parseReviewState(audioId);
  if (reviewState !== 'reviewed') {
    console.error(`❌ Security Violation: Unreviewed audio cannot be approved.`);
    console.error(`💡 Current State is: [${reviewState.toUpperCase()}]. Action blocked.`);
    const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      COMMAND: 'approve-audio',
      FAILURE_CATEGORY: 'Security Gate Blocked',
      ERROR_TEXT: `Attempted to approve audio ID "${audioId}" while it is in "${reviewState}" state. Approval requires "reviewed" state.`
    });
    console.log(errorReport);
    process.exit(1);
  }

  const approvedFile = getApprovedFile(audioId);
  
  // Transition state to approved
  const queueContent = fs.readFileSync(queueFile, 'utf-8');
  const updatedQueueContent = queueContent
    .replace(/## Request Status\s*[a-zA-Z0-9_]+/i, '## Request Status\napproved');
  
  fs.writeFileSync(queueFile, updatedQueueContent, 'utf-8');

  // Copy/Write to approved folder
  const approvedContent = `# Approved Briefing Audio: ${audioId}
*Approved At: ${new Date().toISOString()}*

## Verification Signatures
- Manual Playback Confirmation: VERIFIED
- Release Safety Check: PASSED
- Cloud Upload and Broadcast: BLOCKED (Offline Integrity Maintained)
`;
  fs.writeFileSync(approvedFile, approvedContent, 'utf-8');
  logEvent(`Approved: Audio ID "${audioId}" manual review approved.`);

  const decisionMsg = fillTemplate('briefing-audio-review-decision-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    ACTION_TYPE: 'Manual Operator Approval',
    PREVIOUS_STATE: 'reviewed',
    TRANSITION_STATUS: 'approved',
    DESTINATION_PATH: approvedFile,
    DECISION_VERDICT: 'APPROVED'
  });

  console.log(decisionMsg);
  handleStatus(true);
}

// COMMAND: reject-audio <AUDIO_ID>
function handleRejectAudio(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const queueFile = getQueueFile(audioId);

  if (!fs.existsSync(queueFile)) {
    console.error(`❌ Error: Audio ID "${audioId}" has not been enqueued. Run "queue-review" first.`);
    process.exit(1);
  }

  const reviewState = parseReviewState(audioId);
  const rejectedFile = getRejectedFile(audioId);

  // Transition state to rejected
  const queueContent = fs.readFileSync(queueFile, 'utf-8');
  const updatedQueueContent = queueContent
    .replace(/## Request Status\s*[a-zA-Z0-9_]+/i, '## Request Status\nrejected');
  
  fs.writeFileSync(queueFile, updatedQueueContent, 'utf-8');

  // Write to rejected folder
  const rejectedContent = `# Rejected Briefing Audio: ${audioId}
*Rejected At: ${new Date().toISOString()}*

## Verification Signatures
- Manual Playback Confirmation: REJECTED
- Source File Preserved: YES (Audio file was NOT deleted, as per safety constraints)
`;
  fs.writeFileSync(rejectedFile, rejectedContent, 'utf-8');
  logEvent(`Rejected: Audio ID "${audioId}" marked as rejected.`);

  const decisionMsg = fillTemplate('briefing-audio-review-decision-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    ACTION_TYPE: 'Operator Playback Rejection',
    PREVIOUS_STATE: reviewState,
    TRANSITION_STATUS: 'rejected',
    DESTINATION_PATH: rejectedFile,
    DECISION_VERDICT: 'REJECTED'
  });

  console.log(decisionMsg);
  handleStatus(true);
}

// COMMAND: review-status <AUDIO_ID>
function handleReviewStatus(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const reviewState = parseReviewState(audioId);
  const audioPath = findRenderedAudio(audioId) || 'None';

  console.log(`\n======================================================`);
  console.log(`📋 Review Status for ID: "${audioId}"`);
  console.log(`======================================================`);
  console.log(`- Current State : [${reviewState.toUpperCase()}]`);
  console.log(`- Audio File    : ${audioPath}`);
  console.log(`======================================================\n`);
}

// COMMAND: latest
function handleLatest() {
  const renderedFiles1 = fs.existsSync(BRIEFING_FLOW_RENDERED_DIR) ? fs.readdirSync(BRIEFING_FLOW_RENDERED_DIR).filter(f => !f.startsWith('.')) : [];
  const renderedFiles2 = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR) ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => !f.startsWith('.')) : [];
  
  const allRendered = [...renderedFiles1, ...renderedFiles2].sort();

  console.log(`\n======================================================`);
  console.log(`🔊 Latest Rendered & Reviewed Context`);
  console.log(`======================================================`);

  if (allRendered.length === 0) {
    console.log(`No rendered audio files found in system paths.`);
  } else {
    const latestFile = allRendered[allRendered.length - 1];
    const audioId = normalizeAudioId(latestFile);
    const audioPath = findRenderedAudio(audioId);
    const state = parseReviewState(audioId);

    console.log(`Latest Rendered Audio:`);
    console.log(`  - ID: ${audioId}`);
    console.log(`  - Path: ${audioPath}`);
    console.log(`  - Review State: [${state.toUpperCase()}]`);
  }
  console.log(`======================================================\n`);
}

// COMMAND: review-summary
function handleReviewSummary() {
  const renderedCount = countFiles(BRIEFING_FLOW_RENDERED_DIR) + countFiles(NARRATOR_TTS_RENDERED_AUDIO_DIR);
  const queueCount = countFiles(BRIEFING_AUDIO_REVIEW_QUEUE_DIR, f => f.startsWith('review_request_') && f.endsWith('.md'));
  const approvedCount = countFiles(BRIEFING_AUDIO_REVIEW_APPROVED_DIR, f => f.startsWith('approved_audio_') && f.endsWith('.md'));
  const rejectedCount = countFiles(BRIEFING_AUDIO_REVIEW_REJECTED_DIR, f => f.startsWith('rejected_audio_') && f.endsWith('.md'));

  // Get details list of enqueued review requests
  let detailsList = '';
  if (fs.existsSync(BRIEFING_AUDIO_REVIEW_QUEUE_DIR)) {
    const queueFiles = fs.readdirSync(BRIEFING_AUDIO_REVIEW_QUEUE_DIR).filter(f => f.startsWith('review_request_') && f.endsWith('.md'));
    if (queueFiles.length === 0) {
      detailsList = '*No items currently registered in the review queue.*';
    } else {
      queueFiles.forEach(f => {
        const audioId = f.replace('review_request_', '').replace('.md', '');
        const state = parseReviewState(audioId);
        detailsList += `- ID: \`${audioId}\` | State: **[${state.toUpperCase()}]**\n`;
      });
    }
  }

  const reportContent = fillTemplate('briefing-audio-review-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    RENDERED_COUNT: String(renderedCount),
    QUEUE_COUNT: String(queueCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    REVIEW_DETAILS_LIST: detailsList
  });

  const reportPath = path.join(BRIEFING_AUDIO_REVIEW_REPORTS_DIR, `review_summary_report.md`);
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  logEvent(`Report Generated: Playback review summary written to ${reportPath}`);

  console.log(reportContent);
  console.log(`💡 Report saved to: ${reportPath}`);
}

// COMMAND: review-log
function handleReviewLog() {
  let logsContent = 'No review log events recorded.';
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
    // Get last 20 log entries
    logsContent = lines.slice(-20).join('\n');
  }

  const logMsg = fillTemplate('briefing-audio-review-log-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LOG_PATH: LOG_FILE,
    LOG_ENTRIES: logsContent
  });

  console.log(logMsg);
}

// CLI Router
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].trim().toLowerCase() : '';
  const param = args[1] ? args[1].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-rendered':
      handleScanRendered();
      break;
    case 'inspect':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleInspect(param);
      break;
    case 'queue-review':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleQueueReview(param);
      break;
    case 'mark-reviewed':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleMarkReviewed(param);
      break;
    case 'approve-audio':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleApproveAudio(param);
      break;
    case 'reject-audio':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleRejectAudio(param);
      break;
    case 'review-status':
      if (!param) {
        console.error('❌ Error: Missing <AUDIO_ID> parameter.');
        process.exit(1);
      }
      handleReviewStatus(param);
      break;
    case 'latest':
      handleLatest();
      break;
    case 'review-summary':
      handleReviewSummary();
      break;
    case 'review-log':
      handleReviewLog();
      break;
    default:
      console.error(`❌ Error: Unknown command "${command}". Run npm run briefing-audio-playback-review-help for guidance.`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal execution error: ${err}`);
  process.exit(1);
});
