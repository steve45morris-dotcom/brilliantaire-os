import * as fs from 'fs';
import * as path from 'path';
import {
  NARRATOR_TTS_RENDERED_AUDIO_DIR,
  BRIEFING_TTS_RENDERED_DIR,
  REVIEW_FLOW_ROOT,
  REVIEW_QUEUE_DIR,
  REVIEW_APPROVED_DIR,
  REVIEW_REJECTED_DIR,
  REVIEW_LOGS_DIR,
  REVIEW_REPORTS_DIR,
  ALLOWED_AUDIO_FORMATS,
  MAX_AUDIO_FILE_SIZE,
  DEFAULT_REVIEW_STATUS,
  AUTO_PLAYBACK,
  AUTO_PUBLISH,
  AUTO_SEND,
  CLOUD_UPLOAD_ENABLED,
  MANUAL_REVIEW_REQUIRED,
  DUPLICATE_REVIEW_PROTECTION
} from '../config/briefing-audio-playback-review.config.js';

// Setup directories
const dirs = [
  REVIEW_FLOW_ROOT,
  REVIEW_QUEUE_DIR,
  REVIEW_APPROVED_DIR,
  REVIEW_REJECTED_DIR,
  REVIEW_LOGS_DIR,
  REVIEW_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(REVIEW_LOGS_DIR, 'briefing_audio_playback_review.log');
const SNAPSHOT_JSON_FILE = path.join(REVIEW_REPORTS_DIR, 'dashboard_briefing_audio_snapshot.json');

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

function normalizeAudioId(id: string): string {
  let norm = id.replace(/^narrator_audio_/, '');
  norm = norm.replace(/\.(mp3|wav|m4a)$/i, '');
  return norm;
}

function countFiles(dir: string, extension?: string): number {
  if (!fs.existsSync(dir)) return 0;
  let list = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  if (extension) {
    list = list.filter(f => f.endsWith(extension));
  }
  return list.length;
}

function findSourceAudioFile(audioId: string): string | null {
  for (const format of ALLOWED_AUDIO_FORMATS) {
    const p1 = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, `narrator_audio_${audioId}.${format}`);
    if (fs.existsSync(p1)) return p1;
    const p2 = path.join(BRIEFING_TTS_RENDERED_DIR, `narrator_audio_${audioId}.${format}`);
    if (fs.existsSync(p2)) return p2;
  }
  return null;
}

// Core Handlers

function handleStatus(quiet: boolean = false) {
  const renderedCount = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)
    ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => f.includes('briefing_') && !f.startsWith('.')).length
    : 0;

  const pendingCount = countFiles(REVIEW_QUEUE_DIR, '.json');
  const approvedCount = countFiles(REVIEW_APPROVED_DIR, '.json');
  const rejectedCount = countFiles(REVIEW_REJECTED_DIR, '.json');

  // Count reviewed status items
  let reviewedCount = 0;
  if (fs.existsSync(REVIEW_QUEUE_DIR)) {
    fs.readdirSync(REVIEW_QUEUE_DIR)
      .filter(f => f.endsWith('.json'))
      .forEach(f => {
        try {
          const meta = JSON.parse(fs.readFileSync(path.join(REVIEW_QUEUE_DIR, f), 'utf-8'));
          if (meta.status === 'reviewed') reviewedCount++;
        } catch (e) {}
      });
  }

  let latestAudioId = 'None';
  let latestApprovedPath = 'None';

  // Find latest audio from source
  const sourceFiles = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)
    ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => f.includes('briefing_') && !f.startsWith('.')).sort()
    : [];
  if (sourceFiles.length > 0) {
    latestAudioId = normalizeAudioId(sourceFiles[sourceFiles.length - 1]);
  }

  // Find latest approved audio path
  const approvedJsonFiles = fs.existsSync(REVIEW_APPROVED_DIR)
    ? fs.readdirSync(REVIEW_APPROVED_DIR).filter(f => f.endsWith('.json')).sort()
    : [];
  if (approvedJsonFiles.length > 0) {
    try {
      const latestMeta = JSON.parse(fs.readFileSync(path.join(REVIEW_APPROVED_DIR, approvedJsonFiles[approvedJsonFiles.length - 1]), 'utf-8'));
      latestApprovedPath = latestMeta.audioPath || 'None';
    } catch (e) {}
  }

  const snapshot = {
    latestAudioId,
    renderedBriefingAudioCount: renderedCount,
    pendingReviewCount: pendingCount - reviewedCount,
    reviewedCount,
    approvedAudioCount: approvedCount,
    rejectedAudioCount: rejectedCount,
    latestApprovedAudioPath: latestApprovedPath,
    autoPlaybackStatus: AUTO_PLAYBACK ? 'enabled' : 'disabled',
    cloudUploadStatus: CLOUD_UPLOAD_ENABLED ? 'enabled' : 'disabled',
    manualReviewRequired: MANUAL_REVIEW_REQUIRED
  };
  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  const statusMsg = fillTemplate('briefing-audio-review-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    NARRATOR_TTS_RENDERED_AUDIO_DIR,
    BRIEFING_TTS_RENDERED_DIR,
    REVIEW_QUEUE_DIR,
    REVIEW_APPROVED_DIR,
    AUTO_PLAYBACK: String(AUTO_PLAYBACK),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    AUTO_SEND: String(AUTO_SEND),
    CLOUD_UPLOAD_ENABLED: String(CLOUD_UPLOAD_ENABLED),
    MANUAL_REVIEW_REQUIRED: String(MANUAL_REVIEW_REQUIRED),
    DUPLICATE_REVIEW_PROTECTION: String(DUPLICATE_REVIEW_PROTECTION),
    MAX_FILE_SIZE: String(MAX_AUDIO_FILE_SIZE),
    RENDERED_COUNT: String(renderedCount),
    PENDING_COUNT: String(pendingCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    LATEST_AUDIO_ID: latestAudioId,
    LATEST_APPROVED_PATH: latestApprovedPath
  });

  if (!quiet) {
    console.log(statusMsg);
  }
  return snapshot;
}

function handleScanRendered() {
  console.log(`\n======================================================`);
  console.log(`📡 Scanning Rendered Briefing Audio Files`);
  console.log(`======================================================`);
  
  if (!fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)) {
    console.log(`*Rendered audio source directory does not exist: ${NARRATOR_TTS_RENDERED_AUDIO_DIR}*`);
    console.log(`======================================================\n`);
    return;
  }

  const files = fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)
    .filter(f => f.includes('briefing_') && ALLOWED_AUDIO_FORMATS.some(ext => f.endsWith(`.${ext}`)) && !f.startsWith('.'));

  if (files.length === 0) {
    console.log(`*No rendered briefing audio files discovered.*`);
    console.log(`💡 Recommendation: Run 'briefing-tts-render-approval render-approved' first.`);
  } else {
    files.forEach(f => {
      const audioId = normalizeAudioId(f);
      const fullPath = path.join(NARRATOR_TTS_RENDERED_AUDIO_DIR, f);
      const stat = fs.statSync(fullPath);
      console.log(`- ID: ${audioId} | File: ${f} | Size: ${stat.size} bytes`);
    });
  }
  console.log(`======================================================\n`);
}

function handleInspect(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  if (!audioId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed audio ID "${rawAudioId}". Must start with "briefing_".`);
    process.exit(1);
  }

  const audioPath = findSourceAudioFile(audioId);
  if (!audioPath) {
    console.error(`❌ Error: Rendered audio file for ID "${audioId}" not found.`);
    console.log(`💡 Run "npm run briefing-tts-render-approval -- render-approved ${audioId}" to generate.`);
    process.exit(1);
  }

  const stat = fs.statSync(audioPath);
  const ext = path.extname(audioPath).replace('.', '');

  // Determine current review status
  let reviewStatus = 'unsubmitted';
  let cacheStatus = 'clean';

  const qJson = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);
  const aJson = path.join(REVIEW_APPROVED_DIR, `${audioId}.json`);
  const rJson = path.join(REVIEW_REJECTED_DIR, `${audioId}.json`);

  if (fs.existsSync(aJson)) {
    reviewStatus = 'approved';
    cacheStatus = 'cached';
  } else if (fs.existsSync(rJson)) {
    reviewStatus = 'rejected';
  } else if (fs.existsSync(qJson)) {
    try {
      const meta = JSON.parse(fs.readFileSync(qJson, 'utf-8'));
      reviewStatus = meta.status || 'pending_review';
    } catch (e) {}
  }

  const output = fillTemplate('briefing-audio-review-inspect-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    AUDIO_PATH: audioPath,
    SOURCE_BRIEFING_ID: audioId,
    FILE_SIZE: String(stat.size),
    FORMAT: ext,
    RENDER_TIMESTAMP: stat.mtime.toISOString(),
    REVIEW_STATUS: reviewStatus.toUpperCase(),
    CACHE_STATUS: cacheStatus.toUpperCase()
  });

  console.log(output);
}

function handleQueueReview(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  if (!audioId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed audio ID "${rawAudioId}".`);
    process.exit(1);
  }

  const audioPath = findSourceAudioFile(audioId);
  if (!audioPath) {
    const errorMsg = `Rendered audio file for ID "${audioId}" does not exist. Discovery failed.`;
    console.error(`❌ Blocked: ${errorMsg}`);
    
    const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      COMMAND: 'queue-review',
      FAILURE_CATEGORY: 'Missing Rendered Audio Blocker',
      ERROR_TEXT: errorMsg
    });
    fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `error_queue_${audioId}.md`), errorReport, 'utf-8');
    process.exit(1);
  }

  const stat = fs.statSync(audioPath);
  if (stat.size > MAX_AUDIO_FILE_SIZE) {
    const errorMsg = `Audio file size (${stat.size} bytes) exceeds limit of ${MAX_AUDIO_FILE_SIZE} bytes.`;
    console.error(`❌ Blocked: ${errorMsg}`);
    process.exit(1);
  }

  const ext = path.extname(audioPath).replace('.', '');
  const qMetaFile = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);
  const qAudioFile = path.join(REVIEW_QUEUE_DIR, `narrator_audio_${audioId}.${ext}`);

  // Duplicate protection check
  if (DUPLICATE_REVIEW_PROTECTION && fs.existsSync(qMetaFile)) {
    console.log(`[INFO] Duplicate protection: Audio "${audioId}" is already queued for review.`);
    return;
  }

  const metadata = {
    audioId,
    audioPath: qAudioFile,
    sourceBriefingId: audioId,
    fileSize: stat.size,
    format: ext,
    createdTimestamp: new Date().toISOString(),
    status: DEFAULT_REVIEW_STATUS
  };

  // Write local files
  fs.writeFileSync(qMetaFile, JSON.stringify(metadata, null, 2), 'utf-8');
  fs.copyFileSync(audioPath, qAudioFile);

  const report = fillTemplate('briefing-audio-review-queue-template.md', {
    TIMESTAMP: new Date().toISOString(),
    AUDIO_ID: audioId,
    QUEUE_PATH: qMetaFile,
    SOURCE_PATH: audioPath
  });

  fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `queue_${audioId}.md`), report, 'utf-8');
  logEvent(`Queued: Briefing audio ${audioId} staged for human playback review.`);

  console.log(report);
}

function handleMarkReviewed(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const qMetaFile = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);

  if (!fs.existsSync(qMetaFile)) {
    const errorMsg = `Review queue metadata not found for ID "${audioId}". Please queue-review first.`;
    console.error(`❌ Blocked: ${errorMsg}`);
    
    const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      COMMAND: 'mark-reviewed',
      FAILURE_CATEGORY: 'Order of Operations Violation',
      ERROR_TEXT: errorMsg
    });
    fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `error_reviewed_${audioId}.md`), errorReport, 'utf-8');
    process.exit(1);
  }

  try {
    const meta = JSON.parse(fs.readFileSync(qMetaFile, 'utf-8'));
    meta.status = 'reviewed';
    fs.writeFileSync(qMetaFile, JSON.stringify(meta, null, 2), 'utf-8');

    const report = fillTemplate('briefing-audio-review-decision-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      VERDICT_STATUS: 'REVIEWED',
      VERDICT_PATH: qMetaFile
    });

    fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `mark_reviewed_${audioId}.md`), report, 'utf-8');
    logEvent(`Reviewed: Briefing audio ${audioId} marked as human-reviewed.`);

    console.log(report);
  } catch (e) {
    console.error(`❌ Error parsing review queue file: ${(e as Error).message}`);
    process.exit(1);
  }
}

function handleApproveAudio(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const qMetaFile = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);

  if (!fs.existsSync(qMetaFile)) {
    const errorMsg = `No queued review record found for ID "${audioId}". Please queue-review first.`;
    console.error(`❌ Blocked: ${errorMsg}`);
    process.exit(1);
  }

  try {
    const meta = JSON.parse(fs.readFileSync(qMetaFile, 'utf-8'));
    
    // Prerequisite: status must be 'reviewed'
    if (meta.status !== 'reviewed') {
      const errorMsg = `Audio "${audioId}" cannot be approved. It has not been marked as human-reviewed. Current status: ${meta.status}`;
      console.error(`❌ Blocked: ${errorMsg}`);
      
      const errorReport = fillTemplate('briefing-audio-review-error-template.md', {
        TIMESTAMP: new Date().toISOString(),
        AUDIO_ID: audioId,
        COMMAND: 'approve-audio',
        FAILURE_CATEGORY: 'Gate Prerequisite Violation',
        ERROR_TEXT: errorMsg
      });
      fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `error_approve_${audioId}.md`), errorReport, 'utf-8');
      process.exit(1);
    }

    meta.status = 'approved';
    const ext = meta.format || 'mp3';
    const aMetaFile = path.join(REVIEW_APPROVED_DIR, `${audioId}.json`);
    const aAudioFile = path.join(REVIEW_APPROVED_DIR, `narrator_audio_${audioId}.${ext}`);

    // Copy queue audio to approved
    const qAudioFile = path.join(REVIEW_QUEUE_DIR, `narrator_audio_${audioId}.${ext}`);
    if (fs.existsSync(qAudioFile)) {
      fs.copyFileSync(qAudioFile, aAudioFile);
    }
    
    fs.writeFileSync(aMetaFile, JSON.stringify(meta, null, 2), 'utf-8');

    // Clean up queue file references
    fs.unlinkSync(qMetaFile);
    if (fs.existsSync(qAudioFile)) {
      fs.unlinkSync(qAudioFile);
    }

    const report = fillTemplate('briefing-audio-review-decision-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      VERDICT_STATUS: 'APPROVED',
      VERDICT_PATH: aMetaFile
    });

    fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `approve_${audioId}.md`), report, 'utf-8');
    logEvent(`Approved: Briefing audio ${audioId} authorized for release/use.`);

    console.log(report);
  } catch (e) {
    console.error(`❌ Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

function handleRejectAudio(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  const qMetaFile = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);

  if (!fs.existsSync(qMetaFile)) {
    const errorMsg = `No queued review record found for ID "${audioId}".`;
    console.error(`❌ Blocked: ${errorMsg}`);
    process.exit(1);
  }

  try {
    const meta = JSON.parse(fs.readFileSync(qMetaFile, 'utf-8'));
    meta.status = 'rejected';
    const ext = meta.format || 'mp3';
    const rMetaFile = path.join(REVIEW_REJECTED_DIR, `${audioId}.json`);
    const rAudioFile = path.join(REVIEW_REJECTED_DIR, `narrator_audio_${audioId}.${ext}`);

    // Move queue audio to rejected
    const qAudioFile = path.join(REVIEW_QUEUE_DIR, `narrator_audio_${audioId}.${ext}`);
    if (fs.existsSync(qAudioFile)) {
      fs.copyFileSync(qAudioFile, rAudioFile);
    }
    
    fs.writeFileSync(rMetaFile, JSON.stringify(meta, null, 2), 'utf-8');

    // Clean up queue file references
    fs.unlinkSync(qMetaFile);
    if (fs.existsSync(qAudioFile)) {
      fs.unlinkSync(qAudioFile);
    }

    const report = fillTemplate('briefing-audio-review-decision-template.md', {
      TIMESTAMP: new Date().toISOString(),
      AUDIO_ID: audioId,
      VERDICT_STATUS: 'REJECTED',
      VERDICT_PATH: rMetaFile
    });

    fs.writeFileSync(path.join(REVIEW_REPORTS_DIR, `reject_${audioId}.md`), report, 'utf-8');
    logEvent(`Rejected: Briefing audio ${audioId} was rejected by operator.`);

    console.log(report);
  } catch (e) {
    console.error(`❌ Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

function handleReviewStatus(rawAudioId: string) {
  const audioId = normalizeAudioId(rawAudioId);
  if (!audioId.startsWith('briefing_')) {
    console.error(`❌ Error: Malformed audio ID "${rawAudioId}".`);
    process.exit(1);
  }

  let status = 'unsubmitted';
  const qJson = path.join(REVIEW_QUEUE_DIR, `${audioId}.json`);
  const aJson = path.join(REVIEW_APPROVED_DIR, `${audioId}.json`);
  const rJson = path.join(REVIEW_REJECTED_DIR, `${audioId}.json`);

  if (fs.existsSync(aJson)) {
    status = 'approved';
  } else if (fs.existsSync(rJson)) {
    status = 'rejected';
  } else if (fs.existsSync(qJson)) {
    try {
      const meta = JSON.parse(fs.readFileSync(qJson, 'utf-8'));
      status = meta.status || 'pending_review';
    } catch (e) {}
  }

  console.log(`======================================================`);
  console.log(`🔎 Playback Review State Tracker [${audioId}]`);
  console.log(`======================================================`);
  console.log(`- Audio ID: ${audioId}`);
  console.log(`- Review State: ${status.toUpperCase()}`);
  console.log(`======================================================`);
}

function handleLatest() {
  const sourceFiles = fs.existsSync(NARRATOR_TTS_RENDERED_AUDIO_DIR)
    ? fs.readdirSync(NARRATOR_TTS_RENDERED_AUDIO_DIR).filter(f => f.includes('briefing_') && !f.startsWith('.')).sort()
    : [];
  if (sourceFiles.length === 0) {
    console.log(`*No rendered briefing audio files found.*`);
    return;
  }
  const audioId = normalizeAudioId(sourceFiles[sourceFiles.length - 1]);
  console.log(`\n🆕 Latest Rendered Audio Item:`);
  handleReviewStatus(audioId);
}

function handleReviewSummary() {
  const pendingCount = countFiles(REVIEW_QUEUE_DIR, '.json');
  const approvedCount = countFiles(REVIEW_APPROVED_DIR, '.json');
  const rejectedCount = countFiles(REVIEW_REJECTED_DIR, '.json');

  let trackingText = '';
  // List files in queue
  if (fs.existsSync(REVIEW_QUEUE_DIR)) {
    fs.readdirSync(REVIEW_QUEUE_DIR).filter(f => f.endsWith('.json')).forEach(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(REVIEW_QUEUE_DIR, f), 'utf-8'));
        trackingText += `- ID: \`${meta.audioId}\` | State: \`${meta.status.toUpperCase()}\` \n`;
      } catch (e) {}
    });
  }
  // List files in approved
  if (fs.existsSync(REVIEW_APPROVED_DIR)) {
    fs.readdirSync(REVIEW_APPROVED_DIR).filter(f => f.endsWith('.json')).forEach(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(REVIEW_APPROVED_DIR, f), 'utf-8'));
        trackingText += `- ID: \`${meta.audioId}\` | State: \`APPROVED\` \n`;
      } catch (e) {}
    });
  }
  // List files in rejected
  if (fs.existsSync(REVIEW_REJECTED_DIR)) {
    fs.readdirSync(REVIEW_REJECTED_DIR).filter(f => f.endsWith('.json')).forEach(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(REVIEW_REJECTED_DIR, f), 'utf-8'));
        trackingText += `- ID: \`${meta.audioId}\` | State: \`REJECTED\` \n`;
      } catch (e) {}
    });
  }

  if (!trackingText) {
    trackingText = '*No review tracking records found.*';
  }

  const summary = fillTemplate('briefing-audio-review-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    PENDING_COUNT: String(pendingCount),
    APPROVED_COUNT: String(approvedCount),
    REJECTED_COUNT: String(rejectedCount),
    QUEUE_TRACKING_DETAILS: trackingText
  });

  const summaryPath = path.join(REVIEW_REPORTS_DIR, 'briefing_audio_review_summary.md');
  fs.writeFileSync(summaryPath, summary, 'utf-8');
  console.log(`✅ Playback review summary generated at: ${summaryPath}`);
  console.log(summary);
}

function handleReviewLog() {
  if (fs.existsSync(LOG_FILE)) {
    const logs = fs.readFileSync(LOG_FILE, 'utf-8');
    const output = fillTemplate('briefing-audio-review-log-template.md', {
      TIMESTAMP: new Date().toISOString(),
      LOG_EVENTS: logs
    });
    console.log(output);
  } else {
    console.log(`*No log events recorded yet.*`);
  }
}

// CLI Router
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let arg = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      arg = tokens[1] || '';
    } else {
      command = args[0].toLowerCase();
      arg = args[1] || '';
    }
  }

  const validCommands = [
    'help',
    'status',
    'scan-rendered',
    'inspect',
    'queue-review',
    'mark-reviewed',
    'approve-audio',
    'reject-audio',
    'review-status',
    'latest',
    'review-summary',
    'review-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run briefing-audio-playback-review-help" for options.`);
    process.exit(1);
  }

  switch (command) {
    case 'help':
      console.log('Run "npm run briefing-audio-playback-review-help" to see options.');
      break;
    case 'status':
      handleStatus();
      break;
    case 'scan-rendered':
      handleScanRendered();
      break;
    case 'inspect':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleInspect(arg);
      break;
    case 'queue-review':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleQueueReview(arg);
      break;
    case 'mark-reviewed':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleMarkReviewed(arg);
      break;
    case 'approve-audio':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleApproveAudio(arg);
      break;
    case 'reject-audio':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleRejectAudio(arg);
      break;
    case 'review-status':
      if (!arg) {
        console.error('[ERR] Please specify an AUDIO_ID.');
        process.exit(1);
      }
      handleReviewStatus(arg);
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
  }
}

main();
