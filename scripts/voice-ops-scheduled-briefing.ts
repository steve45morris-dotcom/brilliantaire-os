import * as fs from 'fs';
import * as path from 'path';
import {
  BRIEFING_DAILY_REPORTS_DIR,
  BRIEFING_QUEUE_DIR,
  BRIEFING_APPROVED_DIR,
  BRIEFING_REJECTED_DIR,
  BRIEFING_TTS_REQUESTS_DIR,
  BRIEFING_REPORTS_DIR,
  BRIEFING_LOGS_DIR,
  TTS_QUEUE_REQUESTS_DIR,
  DEFAULT_SCHEDULE_LABEL,
  DEFAULT_BRIEFING_TIME,
  TIMEZONE,
  AUTO_RUN_SCHEDULED_JOBS,
  AUTO_RENDER_TTS,
  AUTO_SHARE,
  MANUAL_APPROVAL_REQUIRED,
  MAX_QUEUED_BRIEFINGS,
  DUPLICATE_BRIEFING_PROTECTION,
  READONLY_DASHBOARD_MODE
} from '../config/voice-ops-scheduled-briefing.config.js';

function ensureDirs() {
  fs.mkdirSync(BRIEFING_QUEUE_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_APPROVED_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_REJECTED_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_TTS_REQUESTS_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_REPORTS_DIR, { recursive: true });
  fs.mkdirSync(BRIEFING_LOGS_DIR, { recursive: true });
  fs.mkdirSync(TTS_QUEUE_REQUESTS_DIR, { recursive: true });
}

function logEvent(msg: string) {
  ensureDirs();
  const logFilePath = path.join(BRIEFING_LOGS_DIR, 'briefing_generation.log');
  fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/voice_ops_scheduled_briefing', `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

function getFormattedDate(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const countFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.json') || f.endsWith('.md')).length;
};

// ─── Status Command ───────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const reports = fs.existsSync(BRIEFING_DAILY_REPORTS_DIR) ? fs.readdirSync(BRIEFING_DAILY_REPORTS_DIR).filter(f => f.endsWith('.md')).sort() : [];
  const latestReport = reports.length > 0 ? path.join(BRIEFING_DAILY_REPORTS_DIR, reports[reports.length - 1]) : 'None';

  const pendingCount = countFiles(BRIEFING_QUEUE_DIR);
  const approvedCount = countFiles(BRIEFING_APPROVED_DIR);
  const rejectedCount = countFiles(BRIEFING_REJECTED_DIR);
  const ttsCount = countFiles(BRIEFING_TTS_REQUESTS_DIR);

  // Latest briefing item
  let latestBriefing = 'None';
  const allBriefingFiles = [
    ...fs.readdirSync(BRIEFING_QUEUE_DIR).map(f => ({ name: f, dir: BRIEFING_QUEUE_DIR })),
    ...fs.readdirSync(BRIEFING_APPROVED_DIR).map(f => ({ name: f, dir: BRIEFING_APPROVED_DIR })),
    ...fs.readdirSync(BRIEFING_REJECTED_DIR).map(f => ({ name: f, dir: BRIEFING_REJECTED_DIR }))
  ];
  if (allBriefingFiles.length > 0) {
    const sorted = allBriefingFiles.map(f => {
      const stats = fs.statSync(path.join(f.dir, f.name));
      return { name: f.name, mtime: stats.mtimeMs };
    }).sort((a, b) => b.mtime - a.mtime);
    latestBriefing = sorted[0].name.replace('.json', '');
  }

  const template = loadTemplate('voice-ops-briefing-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{REPORTS_DIR}}/g, BRIEFING_DAILY_REPORTS_DIR)
    .replace(/{{QUEUE_DIR}}/g, BRIEFING_QUEUE_DIR)
    .replace(/{{APPROVED_DIR}}/g, BRIEFING_APPROVED_DIR)
    .replace(/{{REJECTED_DIR}}/g, BRIEFING_REJECTED_DIR)
    .replace(/{{TTS_DIR}}/g, BRIEFING_TTS_REQUESTS_DIR)
    .replace(/{{AUTO_RUN}}/g, String(AUTO_RUN_SCHEDULED_JOBS))
    .replace(/{{AUTO_RENDER}}/g, String(AUTO_RENDER_TTS))
    .replace(/{{AUTO_SHARE}}/g, String(AUTO_SHARE))
    .replace(/{{MANUAL_APPROVAL}}/g, String(MANUAL_APPROVAL_REQUIRED))
    .replace(/{{DUPLICATE_PROTECTION}}/g, String(DUPLICATE_BRIEFING_PROTECTION))
    .replace(/{{MAX_JOBS}}/g, String(MAX_QUEUED_BRIEFINGS))
    .replace(/{{READONLY_DASHBOARD}}/g, String(READONLY_DASHBOARD_MODE))
    .replace(/{{PENDING_COUNT}}/g, String(pendingCount))
    .replace(/{{APPROVED_COUNT}}/g, String(approvedCount))
    .replace(/{{REJECTED_COUNT}}/g, String(rejectedCount))
    .replace(/{{TTS_COUNT}}/g, String(ttsCount))
    .replace(/{{LATEST_REPORT}}/g, latestReport)
    .replace(/{{LATEST_BRIEFING}}/g, latestBriefing);

  console.log(output);
}

// ─── Creation Engine ──────────────────────────────────────────────────────────
function createBriefing(reportPath: string) {
  ensureDirs();
  const filename = path.basename(reportPath);
  const dateMatch = filename.match(/voice_ops_daily_report_(\d{4}-\d{2}-\d{2})\.md/);
  if (!dateMatch) {
    console.error(`[ERR] Unable to parse date from report filename: ${filename}`);
    process.exit(1);
  }

  const targetDate = dateMatch[1];
  const briefingId = `briefing_${targetDate}`;

  // Check counts limit
  const pendingCount = countFiles(BRIEFING_QUEUE_DIR);
  if (pendingCount >= MAX_QUEUED_BRIEFINGS) {
    console.error(`[ERR] Staging capped: Pending briefings queue has reached the safety limit of ${MAX_QUEUED_BRIEFINGS} items.`);
    process.exit(1);
  }

  // Duplicate protection check
  if (DUPLICATE_BRIEFING_PROTECTION) {
    const exists =
      fs.existsSync(path.join(BRIEFING_QUEUE_DIR, `${briefingId}.json`)) ||
      fs.existsSync(path.join(BRIEFING_APPROVED_DIR, `${briefingId}.json`)) ||
      fs.existsSync(path.join(BRIEFING_REJECTED_DIR, `${briefingId}.json`));

    if (exists) {
      console.error(`[ERR] Staging blocked: Briefing ID "${briefingId}" already exists in queue/approved/rejected database.`);
      process.exit(1);
    }
  }

  const reportContent = fs.readFileSync(reportPath, 'utf-8');

  // Extraction RegEx Helpers
  const getMatch = (regex: RegExp, def = '0') => {
    const m = reportContent.match(regex);
    return m ? m[1].trim() : def;
  };

  const ttsStatus = getMatch(/\*\*Speech Synthesis \(TTS\) status\*\*:\s*`([^`]+)`/i, 'UNKNOWN');
  const asrStatus = getMatch(/\*\*Speech Ingestion \(ASR\) status\*\*:\s*`([^`]+)`/i, 'UNKNOWN');
  const totalSessions = parseInt(getMatch(/\*\*Total Recorded Sessions\*\*:\s*`(\d+)`/i, '0'), 10);
  const totalTranscripts = parseInt(getMatch(/\*\*Total generated Transcripts\*\*:\s*`(\d+)`/i, '0'), 10);
  const approvedPackets = parseInt(getMatch(/\*\*ASR Approved packets\*\*:\s*`(\d+)`/i, '0'), 10);
  const executedPackets = parseInt(getMatch(/\*\*Executed via Human Release\*\*:\s*`(\d+)`/i, '0'), 10);
  const blockedEvents = parseInt(getMatch(/\*\*Scanned blocked events\*\*:\s*`(\d+)`/i, '0'), 10);
  const riskLevel = getMatch(/\*\*Risk Assessment Level\*\*:\s*`([^`]+)`/i, 'Low');

  // Recommendation extraction
  let recommendation = 'No operational recommendation listed.';
  const recIndex = reportContent.indexOf('Daily operational recommendation**:');
  if (recIndex !== -1) {
    const recText = reportContent.substring(recIndex + 'Daily operational recommendation**:'.length).trim();
    const line = recText.split('\n')[0].trim().replace(/^`+|`+$/g, '').replace(/\.+$/, '');
    if (line) recommendation = line;
  }

  const safetyStatus = riskLevel === 'High' ? 'Critical Safety Alarms Active' : riskLevel === 'Medium' ? 'Minor Policy Interventions Registered' : 'Consistent / Verified';

  // Construct briefing script
  const summaryText = `Attention operator. Daily Voice Ops briefing for report date ${targetDate}. The local voice loop indicates ${totalSessions} sessions and ${totalTranscripts} transcripts processed. System health reports TTS as ${ttsStatus} and ASR as ${asrStatus}. A total of ${approvedPackets} packets were approved, and ${executedPackets} were executed through exact-name command routing. The auditor captured ${blockedEvents} blocked events. The system risk assessment level is ${riskLevel}, with safety status listed as: ${safetyStatus}. Recommendation: ${recommendation}. I build before burning.`;

  const template = loadTemplate('voice-ops-briefing-item-template');
  const output = template
    .replace(/{{BRIEFING_ID}}/g, briefingId)
    .replace(/{{REPORT_DATE}}/g, targetDate)
    .replace(/{{REPORT_PATH}}/g, reportPath)
    .replace(/{{RISK_LEVEL}}/g, riskLevel)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{STATUS}}/g, 'pending')
    .replace(/{{SCHEDULE_LABEL}}/g, DEFAULT_SCHEDULE_LABEL)
    .replace(/{{BRIEFING_TIME}}/g, DEFAULT_BRIEFING_TIME)
    .replace(/{{SUMMARY_TEXT}}/g, summaryText.replace(/"/g, '\\"'));

  const queueFilePath = path.join(BRIEFING_QUEUE_DIR, `${briefingId}.json`);
  fs.writeFileSync(queueFilePath, output, 'utf-8');

  console.log(`\n======================================================`);
  console.log(` Staged Daily Briefing Job enqueued`);
  console.log(`======================================================`);
  console.log(`Briefing ID: ${briefingId}`);
  console.log(`Target Date: ${targetDate}`);
  console.log(`Staged Path: ${queueFilePath}`);
  console.log(`Proposed Script: "${summaryText}"`);
  console.log(`======================================================`);
  console.log(`✅ Staging successful. Status: pending approval.\n`);

  logEvent(`CREATE | Briefing queue item ${briefingId} successfully created from report: ${filename}`);
}

function handleCreateDaily() {
  ensureDirs();
  const reports = fs.existsSync(BRIEFING_DAILY_REPORTS_DIR) ? fs.readdirSync(BRIEFING_DAILY_REPORTS_DIR).filter(f => f.endsWith('.md')).sort() : [];
  if (reports.length === 0) {
    console.error('[ERR] No Daily Voice Ops operating reports generated yet. Run generate command first.');
    process.exit(1);
  }
  const file = reports[reports.length - 1];
  createBriefing(path.join(BRIEFING_DAILY_REPORTS_DIR, file));
}

function handleCreateDate(targetDate: string) {
  ensureDirs();
  const reportPath = path.join(BRIEFING_DAILY_REPORTS_DIR, `voice_ops_daily_report_${targetDate}.md`);
  if (!fs.existsSync(reportPath)) {
    console.error(`[ERR] Daily Voice Ops report not found for target date: ${targetDate} (Expected at: ${reportPath})`);
    process.exit(1);
  }
  createBriefing(reportPath);
}

// ─── Staging Helpers ─────────────────────────────────────────────────────────
function findBriefingFile(briefingId: string): { path: string; status: string } | null {
  const qPath = path.join(BRIEFING_QUEUE_DIR, `${briefingId}.json`);
  if (fs.existsSync(qPath)) return { path: qPath, status: 'pending' };

  const aPath = path.join(BRIEFING_APPROVED_DIR, `${briefingId}.json`);
  if (fs.existsSync(aPath)) return { path: aPath, status: 'approved' };

  const rPath = path.join(BRIEFING_REJECTED_DIR, `${briefingId}.json`);
  if (fs.existsSync(rPath)) return { path: rPath, status: 'rejected' };

  return null;
}

// ─── Inspect Command ──────────────────────────────────────────────────────────
function handleInspect(briefingId: string) {
  const match = findBriefingFile(briefingId);
  if (!match) {
    console.error(`[ERR] Briefing ID "${briefingId}" not found in queue folders.`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(match.path, 'utf-8'));
  const ttsTpl = loadTemplate('voice-ops-briefing-tts-request-template');
  const ttsJson = ttsTpl
    .replace(/{{REQUEST_ID}}/g, `tts_req_${briefingId}`)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{TEXT}}/g, meta.summaryText.replace(/"/g, '\\"'));

  const inspectTpl = loadTemplate('voice-ops-briefing-inspect-template');
  const output = inspectTpl
    .replace(/{{BRIEFING_ID}}/g, meta.briefingId)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{REPORT_DATE}}/g, meta.reportDate)
    .replace(/{{REPORT_PATH}}/g, meta.reportPath)
    .replace(/{{RISK_LEVEL}}/g, meta.riskLevel)
    .replace(/{{CREATED_TIME}}/g, meta.createdTimestamp)
    .replace(/{{STATUS}}/g, meta.status)
    .replace(/{{SCHEDULE_LABEL}}/g, meta.scheduleLabel)
    .replace(/{{BRIEFING_TIME}}/g, meta.briefingTime)
    .replace(/{{SUMMARY_TEXT}}/g, meta.summaryText)
    .replace(/{{TTS_REQUEST_JSON}}/g, ttsJson);

  console.log(output);
}

// ─── Approve Command ──────────────────────────────────────────────────────────
function handleApprove(briefingId: string) {
  const match = findBriefingFile(briefingId);
  if (!match) {
    console.error(`[ERR] Briefing ID "${briefingId}" not found.`);
    process.exit(1);
  }

  if (match.status === 'approved') {
    console.log(`💡 Briefing "${briefingId}" is already approved.`);
    return;
  }
  if (match.status === 'rejected') {
    console.error(`[ERR] Cannot approve: Briefing is currently in rejected queue database. Move or recreate it first.`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(match.path, 'utf-8'));
  meta.status = 'approved';

  const destPath = path.join(BRIEFING_APPROVED_DIR, `${briefingId}.json`);
  fs.writeFileSync(destPath, JSON.stringify(meta, null, 2), 'utf-8');

  try {
    fs.unlinkSync(match.path);
  } catch (e) {}

  console.log(`✅ Success: Briefing ID "${briefingId}" transitioned to approved folder: ${destPath}`);
  logEvent(`APPROVE | Transitioned briefing ${briefingId} to approved state.`);
}

// ─── Reject Command ───────────────────────────────────────────────────────────
function handleReject(briefingId: string) {
  const match = findBriefingFile(briefingId);
  if (!match) {
    console.error(`[ERR] Briefing ID "${briefingId}" not found.`);
    process.exit(1);
  }

  if (match.status === 'rejected') {
    console.log(`💡 Briefing "${briefingId}" is already rejected.`);
    return;
  }
  if (match.status === 'approved') {
    console.error(`[ERR] Cannot reject: Briefing is currently in approved database folder.`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(match.path, 'utf-8'));
  meta.status = 'rejected';

  const destPath = path.join(BRIEFING_REJECTED_DIR, `${briefingId}.json`);
  fs.writeFileSync(destPath, JSON.stringify(meta, null, 2), 'utf-8');

  try {
    fs.unlinkSync(match.path);
  } catch (e) {}

  console.log(`✅ Success: Briefing ID "${briefingId}" transitioned to rejected folder: ${destPath}`);
  logEvent(`REJECT | Transitioned briefing ${briefingId} to rejected state.`);
}

// ─── Generate TTS Request ────────────────────────────────────────────────────
function handleGenerateTtsRequest(briefingId: string) {
  const match = findBriefingFile(briefingId);
  if (!match) {
    console.error(`[ERR] Briefing ID "${briefingId}" not found.`);
    process.exit(1);
  }

  if (match.status !== 'approved') {
    console.error(`[ERR] Staging blocked: Briefing must be APPROVED before enqueuing a TTS request. Current state is: ${match.status}.`);
    process.exit(1);
  }

  // Duplicate request check
  const requestFilePath = path.join(BRIEFING_TTS_REQUESTS_DIR, `tts_request_${briefingId}.md`);
  if (fs.existsSync(requestFilePath)) {
    console.log(`💡 TTS Render Request is already generated for approved briefing: ${requestFilePath}`);
    return;
  }

  const meta = JSON.parse(fs.readFileSync(match.path, 'utf-8'));

  // Load existing narrator TTS queue format template
  const ttsTplPath = path.resolve(process.cwd(), 'templates/narrator_tts_queue/render-request-template.md');
  if (!fs.existsSync(ttsTplPath)) {
    console.error(`[ERR] Narrator TTS render-request-template.md not found at: ${ttsTplPath}`);
    process.exit(1);
  }

  const reqId = `tts_req_${briefingId}`;
  const ttsContent = fs.readFileSync(ttsTplPath, 'utf-8')
    .replace(/{{REQUEST_ID}}/g, reqId)
    .replace(/{{SOURCE_VOICE_PACKET}}/g, `outputs/narrator/voice_ops_scheduled_briefing/approved/${briefingId}.json`)
    .replace(/{{SOURCE_VNP_QUEUE}}/g, 'none (scheduled_briefing)')
    .replace(/{{VOICE_PROFILE}}/g, 'oracle-neutral')
    .replace(/{{RENDER_FORMAT}}/g, 'mp3')
    .replace(/{{SAFETY_MODE}}/g, 'output_only')
    .replace(/{{EXTERNAL_TTS_ALLOWED}}/g, 'false')
    .replace(/{{AUDIO_PLAYBACK_ALLOWED}}/g, 'false')
    .replace(/{{STATUS}}/g, 'pending_manual_approval') // Stays pending for manual TTS render approval
    .replace(/{{TEXT_TO_RENDER}}/g, meta.summaryText);

  // Write to scheduled briefing tts requests copy directory
  fs.writeFileSync(requestFilePath, ttsContent, 'utf-8');

  // Write to official TTS rendering queue requests directory
  const officialTtsPath = path.join(TTS_QUEUE_REQUESTS_DIR, `tts_render_request_briefing_${meta.reportDate}.md`);
  fs.writeFileSync(officialTtsPath, ttsContent, 'utf-8');

  console.log(`[OK] TTS Render Request enqueued: ${officialTtsPath} (ID: ${reqId})`);
  console.log(`✅ Success. Generated render request payload file enqueued.`);
  logEvent(`TTS_REQUEST | Generated TTS render request packet for briefing ${briefingId}.`);
}

// ─── List Queue Command ───────────────────────────────────────────────────────
function handleListQueue() {
  ensureDirs();
  const pending = fs.readdirSync(BRIEFING_QUEUE_DIR).filter(f => f.endsWith('.json'));
  const approved = fs.readdirSync(BRIEFING_APPROVED_DIR).filter(f => f.endsWith('.json'));
  const rejected = fs.readdirSync(BRIEFING_REJECTED_DIR).filter(f => f.endsWith('.json'));

  console.log('\n======================================================');
  console.log('📂 Local Scheduled Briefings Queue Matrix');
  console.log('======================================================');

  console.log('\n⚡ [PENDING QUEUE]');
  if (pending.length === 0) console.log('  *No pending briefings staged.*');
  pending.forEach(f => {
    const meta = JSON.parse(fs.readFileSync(path.join(BRIEFING_QUEUE_DIR, f), 'utf-8'));
    console.log(`  - ID: ${meta.briefingId} | Date: ${meta.reportDate} | Risk: ${meta.riskLevel}`);
  });

  console.log('\n✅ [APPROVED LIST]');
  if (approved.length === 0) console.log('  *No approved briefings staged.*');
  approved.forEach(f => {
    const meta = JSON.parse(fs.readFileSync(path.join(BRIEFING_APPROVED_DIR, f), 'utf-8'));
    const ttsEnqueued = fs.existsSync(path.join(BRIEFING_TTS_REQUESTS_DIR, `tts_request_${meta.briefingId}.md`));
    console.log(`  - ID: ${meta.briefingId} | Date: ${meta.reportDate} | Status: approved ${ttsEnqueued ? '[TTS ENQUEUED]' : '[TTS PENDING]'}`);
  });

  console.log('\n❌ [REJECTED LIST]');
  if (rejected.length === 0) console.log('  *No rejected briefings staged.*');
  rejected.forEach(f => {
    const meta = JSON.parse(fs.readFileSync(path.join(BRIEFING_REJECTED_DIR, f), 'utf-8'));
    console.log(`  - ID: ${meta.briefingId} | Date: ${meta.reportDate}`);
  });

  console.log('======================================================\n');
}

// ─── Queue Summary Command ───────────────────────────────────────────────────
function handleQueueSummary() {
  ensureDirs();
  const pending = fs.readdirSync(BRIEFING_QUEUE_DIR).filter(f => f.endsWith('.json'));
  const approved = fs.readdirSync(BRIEFING_APPROVED_DIR).filter(f => f.endsWith('.json'));
  const rejected = fs.readdirSync(BRIEFING_REJECTED_DIR).filter(f => f.endsWith('.json'));
  const ttsCount = countFiles(BRIEFING_TTS_REQUESTS_DIR);

  let detailsStr = '';
  const addDetails = (list: string[], dir: string, label: string) => {
    list.forEach(f => {
      const meta = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      detailsStr += `- ID: \`${meta.briefingId}\` | Date: \`${meta.reportDate}\` | Status: \`${label}\` | Class: \`${meta.scheduleLabel}\`\n`;
    });
  };

  addDetails(pending, BRIEFING_QUEUE_DIR, 'pending');
  addDetails(approved, BRIEFING_APPROVED_DIR, 'approved');
  addDetails(rejected, BRIEFING_REJECTED_DIR, 'rejected');

  if (!detailsStr) detailsStr = '*No briefing queue items logged.*\n';

  const template = loadTemplate('voice-ops-briefing-queue-summary-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PENDING_COUNT}}/g, String(pending.length))
    .replace(/{{APPROVED_COUNT}}/g, String(approved.length))
    .replace(/{{REJECTED_COUNT}}/g, String(rejected.length))
    .replace(/{{TTS_COUNT}}/g, String(ttsCount))
    .replace(/{{QUEUE_TRACKING_DETAILS}}/g, detailsStr);

  const reportPath = path.join(BRIEFING_REPORTS_DIR, 'voice_ops_briefing_queue_summary.md');
  fs.writeFileSync(reportPath, output, 'utf-8');

  console.log(`\n======================================================`);
  console.log(`📄 Scheduled Briefing Queue Summary Report Generated`);
  console.log(`======================================================`);
  console.log(output);
  console.log(`======================================================`);
  console.log(`✅ Saved queue summary report file to: ${reportPath}\n`);

  logEvent(`REPORT | Compiled briefing queue summary report.`);
  
  // Export status snapshot updates
  handleExportSnapshot();
}

// ─── Export Snapshot ─────────────────────────────────────────────────────────
function handleExportSnapshot() {
  ensureDirs();
  const pending = countFiles(BRIEFING_QUEUE_DIR);
  const approved = countFiles(BRIEFING_APPROVED_DIR);
  const rejected = countFiles(BRIEFING_REJECTED_DIR);
  const ttsCount = countFiles(BRIEFING_TTS_REQUESTS_DIR);

  // Find latest source daily report path
  const reports = fs.existsSync(BRIEFING_DAILY_REPORTS_DIR) ? fs.readdirSync(BRIEFING_DAILY_REPORTS_DIR).filter(f => f.endsWith('.md')).sort() : [];
  const latestReport = reports.length > 0 ? path.join(BRIEFING_DAILY_REPORTS_DIR, reports[reports.length - 1]) : 'None';

  // Latest briefing item ID
  let latestBriefingId = 'None';
  const allFiles = [
    ...fs.readdirSync(BRIEFING_QUEUE_DIR).map(f => ({ name: f, dir: BRIEFING_QUEUE_DIR })),
    ...fs.readdirSync(BRIEFING_APPROVED_DIR).map(f => ({ name: f, dir: BRIEFING_APPROVED_DIR })),
    ...fs.readdirSync(BRIEFING_REJECTED_DIR).map(f => ({ name: f, dir: BRIEFING_REJECTED_DIR }))
  ];
  if (allFiles.length > 0) {
    const sorted = allFiles.map(f => {
      const stats = fs.statSync(path.join(f.dir, f.name));
      return { name: f.name, mtime: stats.mtimeMs };
    }).sort((a, b) => b.mtime - a.mtime);
    latestBriefingId = sorted[0].name.replace('.json', '');
  }

  const output = JSON.stringify({
    latestBriefingId,
    pendingBriefings: pending,
    approvedBriefings: approved,
    rejectedBriefings: rejected,
    ttsRequestCount: ttsCount,
    latestSourceReportPath: latestReport,
    duplicateBriefingProtection: DUPLICATE_BRIEFING_PROTECTION,
    autoRun: AUTO_RUN_SCHEDULED_JOBS,
    manualApprovalRequired: MANUAL_APPROVAL_REQUIRED
  }, null, 2);

  const snapshotPath = path.join(process.cwd(), 'outputs/narrator/voice_ops_scheduled_briefing/reports/dashboard_briefing_snapshot.json');
  fs.writeFileSync(snapshotPath, output, 'utf-8');

  // Copy to public public assets
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'voice-ops-briefing-snapshot.json'), output, 'utf-8');
  }

  logEvent(`SNAPSHOT | Exported dashboard briefing telemetry snapshot.`);
}

// ─── Latest Command ──────────────────────────────────────────────────────────
function handleLatest() {
  ensureDirs();
  const allBriefingFiles = [
    ...fs.readdirSync(BRIEFING_QUEUE_DIR).map(f => ({ name: f, dir: BRIEFING_QUEUE_DIR, status: 'pending' })),
    ...fs.readdirSync(BRIEFING_APPROVED_DIR).map(f => ({ name: f, dir: BRIEFING_APPROVED_DIR, status: 'approved' })),
    ...fs.readdirSync(BRIEFING_REJECTED_DIR).map(f => ({ name: f, dir: BRIEFING_REJECTED_DIR, status: 'rejected' }))
  ];
  if (allBriefingFiles.length === 0) {
    console.log('No briefings created yet. Run create-daily command first.');
    return;
  }

  const sorted = allBriefingFiles.map(f => {
    const stats = fs.statSync(path.join(f.dir, f.name));
    return { name: f.name, dir: f.dir, status: f.status, mtime: stats.mtimeMs };
  }).sort((a, b) => b.mtime - a.mtime);

  const file = sorted[0];
  const itemPath = path.join(file.dir, file.name);
  console.log(`\n======================================================`);
  console.log(`🔎 Latest briefing queue file (${file.status}): ${itemPath}`);
  console.log(`======================================================`);
  console.log(fs.readFileSync(itemPath, 'utf-8'));
}

// ─── Briefing Log Command ────────────────────────────────────────────────────
function handleBriefingLog() {
  ensureDirs();
  const logFilePath = path.join(BRIEFING_LOGS_DIR, 'briefing_generation.log');
  let logLines = 'No compilation records logged.';
  if (fs.existsSync(logFilePath)) {
    logLines = fs.readFileSync(logFilePath, 'utf-8');
  }
  const template = loadTemplate('voice-ops-briefing-log-template');
  const output = template.replace(/{{LOG_LINES}}/g, logLines.trim());
  console.log(output);
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let target = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      target = tokens.slice(1).join(' ');
    } else {
      command = args[0].toLowerCase();
      target = args[1] || '';
    }
  }

  const validCommands = [
    'help',
    'status',
    'create-daily',
    'create-date',
    'list-queue',
    'inspect',
    'approve',
    'reject',
    'generate-tts-request',
    'queue-summary',
    'latest',
    'briefing-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run voice-ops-scheduled-briefing-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run voice-ops-scheduled-briefing-help" to see options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'create-daily') {
    handleCreateDaily();
  } else if (command === 'create-date') {
    if (!target) {
      console.error('[ERR] Please specify a YYYY-MM-DD target date.');
      process.exit(1);
    }
    handleCreateDate(target);
  } else if (command === 'list-queue') {
    handleListQueue();
  } else if (command === 'inspect') {
    if (!target) {
      console.error('[ERR] Please specify a Briefing ID.');
      process.exit(1);
    }
    handleInspect(target);
  } else if (command === 'approve') {
    if (!target) {
      console.error('[ERR] Please specify a Briefing ID.');
      process.exit(1);
    }
    handleApprove(target);
  } else if (command === 'reject') {
    if (!target) {
      console.error('[ERR] Please specify a Briefing ID.');
      process.exit(1);
    }
    handleReject(target);
  } else if (command === 'generate-tts-request') {
    if (!target) {
      console.error('[ERR] Please specify a Briefing ID.');
      process.exit(1);
    }
    handleGenerateTtsRequest(target);
  } else if (command === 'queue-summary') {
    handleQueueSummary();
  } else if (command === 'latest') {
    handleLatest();
  } else if (command === 'briefing-log') {
    handleBriefingLog();
  }
}

main();
