import * as fs from 'fs';
import * as path from 'path';
import {
  REPORT_SESSIONS_RECORDINGS_DIR,
  REPORT_SESSIONS_METADATA_DIR,
  REPORT_ASR_INPUT_DIR,
  REPORT_ASR_TRANSCRIPTS_DIR,
  REPORT_ASR_STAGED_DIR,
  REPORT_ASR_APPROVED_DIR,
  REPORT_ASR_REJECTED_DIR,
  REPORT_BRIDGE_READY_DIR,
  REPORT_BRIDGE_EXECUTED_DIR,
  REPORT_BRIDGE_REJECTED_DIR,
  REPORT_BRIDGE_LOGS_DIR,
  REPORT_AUDIT_TIMELINES_DIR,
  REPORT_AUDIT_INDEX_DIR,
  REPORT_DASHBOARD_TELEMETRY_DIR,
  REPORT_OUTPUT_DIR,
  REPORT_SNAPSHOT_DIR,
  REPORT_LOGS_DIR,
  DEFAULT_REPORT_PERIOD,
  TIMEZONE,
  INCLUDE_RAW_TRANSCRIPT_PREVIEWS,
  INCLUDE_COMMAND_PREVIEWS,
  INCLUDE_SAFETY_EVENTS,
  INCLUDE_BLOCKED_EVENTS,
  INCLUDE_RECOMMENDATIONS,
  READONLY_MODE,
  AUTO_EXECUTE
} from '../config/narrator-voice-ops-daily-report.config.js';

import { performScan, AuditEvent, LifecycleTimeline } from './narrator-voice-lifecycle-audit.js';

function ensureDirs() {
  fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_SNAPSHOT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_LOGS_DIR, { recursive: true });
}

function logEvent(msg: string) {
  ensureDirs();
  const logFilePath = path.join(REPORT_LOGS_DIR, 'report_generation.log');
  fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/narrator_voice_ops_daily_report', `${name}.md`);
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

// ─── Status Command ───────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const files = fs.readdirSync(REPORT_OUTPUT_DIR).filter(f => f.endsWith('.md')).sort();
  const lastReportPath = files.length > 0 ? path.join(REPORT_OUTPUT_DIR, files[files.length - 1]) : 'None';
  const lastReportDate = files.length > 0 ? files[files.length - 1].replace('voice_ops_daily_report_', '').replace('.md', '') : 'None';

  const template = loadTemplate('voice-ops-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{REPORT_OUTPUT_DIR}}/g, REPORT_OUTPUT_DIR)
    .replace(/{{REPORT_SNAPSHOT_DIR}}/g, REPORT_SNAPSHOT_DIR)
    .replace(/{{REPORT_LOGS_DIR}}/g, REPORT_LOGS_DIR)
    .replace(/{{TIMEZONE}}/g, TIMEZONE)
    .replace(/{{PREVIEWS_ENABLED}}/g, String(INCLUDE_RAW_TRANSCRIPT_PREVIEWS && INCLUDE_COMMAND_PREVIEWS))
    .replace(/{{REDACT_OPTIONS}}/g, 'false')
    .replace(/{{READONLY_MODE}}/g, String(READONLY_MODE))
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE))
    .replace(/{{REPORTS_COUNT}}/g, String(files.length))
    .replace(/{{LAST_REPORT_PATH}}/g, lastReportPath)
    .replace(/{{LAST_REPORT_DATE}}/g, lastReportDate);

  console.log(output);
}

// Helper to safe-read files count
const countFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.wav')).length;
};

// ─── Generate Daily Report ───────────────────────────────────────────────────
interface DailyStats {
  date: string;
  totalSessions: number;
  stagedAsrSessions: number;
  rejectedSessions: number;
  archivedSessions: number;
  latestSessionId: string;
  totalTranscripts: number;
  stagedPackets: number;
  approvedPackets: number;
  rejectedPackets: number;
  latestTranscriptId: string;
  readyPackets: number;
  executedPackets: number;
  bridgeRejectedPackets: number;
  latestExecutedRoute: string;
  latestBridgeLog: string;
  latestLifecycleId: string;
  latestLifecycleState: string;
  blockedCount: number;
  safetyCount: number;
  timelineReportPath: string;
  fuzzyBlocksStr: string;
  injectionBlocksStr: string;
  duplicateBlocksStr: string;
  rejectedPacketsListStr: string;
  riskLevel: string;
  safetyStatus: string;
}

function compileStats(targetDate: string): DailyStats {
  const { events, timelines } = performScan();

  // Filter events by target date YYYY-MM-DD
  const dayEvents = events.filter(e => e.timestamp.startsWith(targetDate));

  // Find timelines with events on target date
  const dayTimelines = Object.values(timelines).filter(t =>
    t.events.some(e => e.timestamp.startsWith(targetDate))
  );

  const totalSessions = dayTimelines.length;
  const stagedAsrSessions = dayTimelines.filter(t => t.events.some(e => e.type === 'asr_dispatched' && e.timestamp.startsWith(targetDate))).length;
  const rejectedSessions = dayTimelines.filter(t => t.events.some(e => e.type === 'rec_rejected' && e.timestamp.startsWith(targetDate))).length;
  const archivedSessions = dayTimelines.filter(t => t.currentState === 'archived').length;
  const latestSessionId = dayTimelines.length > 0 ? dayTimelines[dayTimelines.length - 1].sessionId : 'None';

  const totalTranscripts = dayTimelines.filter(t => t.transcriptExists && t.events.some(e => e.type === 'transcription_created' && e.timestamp.startsWith(targetDate))).length;
  const stagedPackets = dayTimelines.filter(t => t.stagedExists && t.events.some(e => e.type === 'command_staged' && e.timestamp.startsWith(targetDate))).length;
  const approvedPackets = dayTimelines.filter(t => t.approvedExists && t.events.some(e => e.type === 'asr_approved' && e.timestamp.startsWith(targetDate))).length;
  const rejectedPackets = dayTimelines.filter(t => t.events.some(e => e.type === 'asr_rejected' && e.timestamp.startsWith(targetDate))).length;
  const latestTranscriptId = totalTranscripts > 0 ? dayTimelines.filter(t => t.transcriptExists)[0].sessionId : 'None';

  const readyPackets = dayTimelines.filter(t => t.events.some(e => e.type === 'bridge_prepared' && e.timestamp.startsWith(targetDate))).length;
  const executedPackets = dayTimelines.filter(t => t.executedExists && t.events.some(e => e.type === 'bridge_executed' && e.timestamp.startsWith(targetDate))).length;
  const bridgeRejectedPackets = dayTimelines.filter(t => t.events.some(e => e.type === 'bridge_rejected' && e.timestamp.startsWith(targetDate))).length;

  let latestExecutedRoute = 'None';
  const executedEvent = dayEvents.find(e => e.type === 'command_executed' || e.type === 'bridge_executed');
  if (executedEvent && executedEvent.details) {
    const routeMatch = executedEvent.description.match(/completed:\s*"([^"]+)"/);
    if (routeMatch) latestExecutedRoute = routeMatch[1];
  }

  let latestBridgeLog = 'None';
  if (fs.existsSync(REPORT_BRIDGE_LOGS_DIR) && executedEvent) {
    const logFiles = fs.readdirSync(REPORT_BRIDGE_LOGS_DIR).filter(f => f.includes(executedEvent.sessionId)).sort();
    if (logFiles.length > 0) {
      latestBridgeLog = path.join(REPORT_BRIDGE_LOGS_DIR, logFiles[logFiles.length - 1]);
    }
  }

  const latestLifecycleId = dayTimelines.length > 0 ? dayTimelines[dayTimelines.length - 1].sessionId : 'None';
  const latestLifecycleState = dayTimelines.length > 0 ? dayTimelines[dayTimelines.length - 1].currentState : 'None';
  const timelineReportPath = latestLifecycleId !== 'None' ? path.join(REPORT_AUDIT_TIMELINES_DIR, `voice_command_lifecycle_report_${latestLifecycleId}.md`) : 'None';

  const blockedCount = dayEvents.filter(e => e.status === 'BLOCKED').length;
  const safetyCount = dayEvents.filter(e => e.type === 'fuzzy_command_blocked' || e.type === 'injection_blocked' || e.type === 'duplicate_blocked').length;

  const buildBlockedLines = (typeFilter: string) => {
    let s = '';
    dayEvents.filter(e => e.type === typeFilter).forEach(e => {
      s += `- [${e.timestamp}] Command attempt: "${e.description.replace('Safety Blocked: Command ', '').replace(' rejected. Reason:', '')}" | Source: ${e.source}\n`;
    });
    return s || '*No safety incidents recorded.*\n';
  };

  const fuzzyBlocksStr = buildBlockedLines('fuzzy_command_blocked');
  const injectionBlocksStr = buildBlockedLines('injection_blocked');
  const duplicateBlocksStr = buildBlockedLines('duplicate_blocked');

  let rejectedPacketsListStr = '';
  dayEvents.filter(e => e.type === 'asr_rejected' || e.type === 'bridge_rejected').forEach(e => {
    rejectedPacketsListStr += `- [${e.timestamp}] ID: \`${e.sessionId}\` | Message: ${e.description}\n`;
  });
  if (!rejectedPacketsListStr) rejectedPacketsListStr = '*No rejected packets recorded.*\n';

  // Risk Scoring Algorithm
  let riskLevel = 'Low';
  let safetyStatus = 'Consistent / Verified';

  const fuzzyCount = dayEvents.filter(e => e.type === 'fuzzy_command_blocked').length;
  const injectCount = dayEvents.filter(e => e.type === 'injection_blocked').length;
  const doubleCount = dayEvents.filter(e => e.type === 'duplicate_blocked').length;

  if (injectCount > 0 || fuzzyCount > 5) {
    riskLevel = 'High';
    safetyStatus = 'Critical Safety Alarms Active';
  } else if (fuzzyCount > 0 || doubleCount > 0 || rejectedPackets > 0) {
    riskLevel = 'Medium';
    safetyStatus = 'Minor Policy Interventions Registered';
  }

  return {
    date: targetDate,
    totalSessions,
    stagedAsrSessions,
    rejectedSessions,
    archivedSessions,
    latestSessionId,
    totalTranscripts,
    stagedPackets,
    approvedPackets,
    rejectedPackets,
    latestTranscriptId,
    readyPackets,
    executedPackets,
    bridgeRejectedPackets,
    latestExecutedRoute,
    latestBridgeLog,
    latestLifecycleId,
    latestLifecycleState,
    blockedCount,
    safetyCount,
    timelineReportPath,
    fuzzyBlocksStr,
    injectionBlocksStr,
    duplicateBlocksStr,
    rejectedPacketsListStr,
    riskLevel,
    safetyStatus
  };
}

function handleGenerate(targetDate: string) {
  ensureDirs();
  const stats = compileStats(targetDate);

  const ttsAvailable = fs.existsSync(path.join(process.cwd(), 'bin/piper')) ? 'AVAILABLE' : 'UNAVAILABLE';
  const asrAvailable = fs.existsSync(path.join(process.cwd(), 'bin/whisper')) ? 'AVAILABLE' : 'UNAVAILABLE';
  const recorderStatus = fs.existsSync(path.join(process.cwd(), 'scripts/narrator-voice-session-recorder.ts')) ? 'ACTIVE' : 'INACTIVE';
  const bridgeStatus = fs.existsSync(path.join(process.cwd(), 'scripts/narrator-voice-bridge.ts')) ? 'ACTIVE' : 'INACTIVE';
  const auditStatus = fs.existsSync(path.join(process.cwd(), 'scripts/narrator-voice-lifecycle-audit.ts')) ? 'ACTIVE' : 'INACTIVE';
  const dashboardStatus = fs.existsSync(path.join(process.cwd(), 'dashboard/src/components/VoiceLoopDashboardPanel.tsx')) ? 'ACTIVE' : 'INACTIVE';

  let nextPhase = 'Phase N5K: Voice Ops Scheduled Briefing Queue';
  let smallestRepair = 'None';
  let recommendation = 'Loop status is consistent. Maintain read-only exact-name approvals workflow.';

  if (stats.riskLevel === 'High') {
    nextPhase = 'Phase N5H.1: Command Staging Validation Repair';
    smallestRepair = 'Audit command router exact-name string matching configurations and tighten sanitization gates.';
    recommendation = 'Immediate suspension of Voice Bridge execution permissions recommended. Review command logs for payload patterns.';
  } else if (stats.riskLevel === 'Medium') {
    recommendation = 'Maintain exact-name approvals. Clear rejected packets folder to optimize queue caching indexes.';
  }

  const template = loadTemplate('voice-ops-daily-report-template');
  const output = template
    .replace(/{{REPORT_DATE}}/g, stats.date)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{PROJECT_ROOT}}/g, process.cwd())
    .replace(/{{REPORT_ID}}/g, `voice_ops_report_${stats.date}`)
    .replace(/{{TTS_STATUS}}/g, ttsAvailable)
    .replace(/{{ASR_STATUS}}/g, asrAvailable)
    .replace(/{{REC_STATUS}}/g, recorderStatus)
    .replace(/{{BRIDGE_STATUS}}/g, bridgeStatus)
    .replace(/{{AUDIT_STATUS}}/g, auditStatus)
    .replace(/{{DASHBOARD_STATUS}}/g, dashboardStatus)
    .replace(/{{TOTAL_SESSIONS}}/g, String(stats.totalSessions))
    .replace(/{{STAGED_ASR_SESSIONS}}/g, String(stats.stagedAsrSessions))
    .replace(/{{REJECTED_SESSIONS}}/g, String(stats.rejectedSessions))
    .replace(/{{ARCHIVED_SESSIONS}}/g, String(stats.archivedSessions))
    .replace(/{{LATEST_SESSION_ID}}/g, stats.latestSessionId)
    .replace(/{{TOTAL_TRANSCRIPTS}}/g, String(stats.totalTranscripts))
    .replace(/{{STAGED_PACKETS}}/g, String(stats.stagedPackets))
    .replace(/{{APPROVED_PACKETS}}/g, String(stats.approvedPackets))
    .replace(/{{REJECTED_PACKETS}}/g, String(stats.rejectedPackets))
    .replace(/{{LATEST_TRANSCRIPT_ID}}/g, stats.latestTranscriptId)
    .replace(/{{BRIDGE_READY_PACKETS}}/g, String(stats.readyPackets))
    .replace(/{{BRIDGE_EXECUTED_PACKETS}}/g, String(stats.executedPackets))
    .replace(/{{BRIDGE_REJECTED_PACKETS}}/g, String(stats.bridgeRejectedPackets))
    .replace(/{{LATEST_EXECUTED_ROUTE}}/g, stats.latestExecutedRoute)
    .replace(/{{LATEST_BRIDGE_LOG}}/g, stats.latestBridgeLog)
    .replace(/{{LATEST_LIFECYCLE_ID}}/g, stats.latestLifecycleId)
    .replace(/{{LATEST_LIFECYCLE_STATE}}/g, stats.latestLifecycleState)
    .replace(/{{BLOCKED_EVENT_COUNT}}/g, String(stats.blockedCount))
    .replace(/{{SAFETY_EVENT_COUNT}}/g, String(stats.safetyCount))
    .replace(/{{TIMELINE_REPORT_PATH}}/g, stats.timelineReportPath)
    .replace(/{{FUZZY_BLOCKS}}/g, stats.fuzzyBlocksStr)
    .replace(/{{INJECTION_BLOCKS}}/g, stats.injectionBlocksStr)
    .replace(/{{DUPLICATE_BLOCKS}}/g, stats.duplicateBlocksStr)
    .replace(/{{REJECTED_PACKETS_LIST}}/g, stats.rejectedPacketsListStr)
    .replace(/{{NEXT_RECOMMENDED_PHASE}}/g, nextPhase)
    .replace(/{{SMALLEST_REPAIR}}/g, smallestRepair)
    .replace(/{{RISK_LEVEL}}/g, stats.riskLevel)
    .replace(/{{OPERATIONAL_RECOMMENDATION}}/g, recommendation);

  const reportFilePath = path.join(REPORT_OUTPUT_DIR, `voice_ops_daily_report_${stats.date}.md`);
  fs.writeFileSync(reportFilePath, output, 'utf-8');
  console.log(`\n======================================================`);
  console.log(`📄 Voice Ops Daily Operating Report Generated`);
  console.log(`======================================================`);
  console.log(output);
  console.log(`======================================================`);
  console.log(`✅ Saved daily operating report file to: ${reportFilePath}\n`);

  logEvent(`GENERATE | Compiled operating report for YYYY-MM-DD: ${stats.date}`);
  
  // Auto export dashboard snapshot
  handleExportSnapshot(stats);
}

// ─── Export Dashboard Snapshot ────────────────────────────────────────────────
function handleExportSnapshot(stats?: DailyStats) {
  ensureDirs();
  const targetStats = stats || compileStats(getFormattedDate());

  const template = loadTemplate('voice-ops-dashboard-snapshot-template');
  const reportPath = path.join(REPORT_OUTPUT_DIR, `voice_ops_daily_report_${targetStats.date}.md`);

  const output = template
    .replace(/"{{REPORT_DATE}}"/g, `"${targetStats.date}"`)
    .replace(/"{{REPORT_PATH}}"/g, `"${reportPath}"`)
    .replace(/"{{RISK_LEVEL}}"/g, `"${targetStats.riskLevel}"`)
    .replace(/{{TOTAL_SESSIONS}}/g, String(targetStats.totalSessions))
    .replace(/{{TOTAL_TRANSCRIPTS}}/g, String(targetStats.totalTranscripts))
    .replace(/{{APPROVED_PACKETS}}/g, String(targetStats.approvedPackets))
    .replace(/{{EXECUTED_PACKETS}}/g, String(targetStats.executedPackets))
    .replace(/{{BLOCKED_EVENTS}}/g, String(targetStats.blockedCount))
    .replace(/"{{SAFETY_STATUS}}"/g, `"${targetStats.safetyStatus}"`)
    .replace(/"{{NEXT_RECOMMENDED_PHASE}}"/g, `"Phase N5K: Voice Ops Scheduled Briefing Queue"`);

  const snapshotFilePath = path.join(REPORT_SNAPSHOT_DIR, 'dashboard_snapshot.json');
  fs.writeFileSync(snapshotFilePath, output, 'utf-8');

  // Also write to dashboard public assets directory if exists
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'voice-ops-snapshot.json'), output, 'utf-8');
  }

  console.log(`✅ Exported JSON telemetry snapshot file to: ${snapshotFilePath}`);
  logEvent(`EXPORT_SNAPSHOT | Exported dashboard JSON telemetry snapshot.`);
}

// ─── Latest Report Command ────────────────────────────────────────────────────
function handleLatest() {
  ensureDirs();
  const files = fs.readdirSync(REPORT_OUTPUT_DIR).filter(f => f.endsWith('.md')).sort();
  if (files.length === 0) {
    console.log('No daily voice ops reports generated yet. Run generate command first.');
    return;
  }
  const file = files[files.length - 1];
  const reportPath = path.join(REPORT_OUTPUT_DIR, file);
  console.log(`\n======================================================`);
  console.log(`🔎 Latest compiled report file: ${reportPath}`);
  console.log(`======================================================`);
  console.log(fs.readFileSync(reportPath, 'utf-8'));
}

// ─── List Reports Command ─────────────────────────────────────────────────────
function handleListReports() {
  ensureDirs();
  const files = fs.readdirSync(REPORT_OUTPUT_DIR).filter(f => f.endsWith('.md')).sort();
  console.log('\n=========================================');
  console.log('📂 Local Daily Reports Archive');
  console.log('=========================================');
  if (files.length === 0) {
    console.log('No report markdown logs registered.');
  } else {
    files.forEach(f => console.log(`  - ${f}`));
  }
  console.log('=========================================\n');
}

// ─── Safety Summary Command ──────────────────────────────────────────────────
function handleSafetySummary(targetDate: string) {
  const stats = compileStats(targetDate);
  const template = loadTemplate('voice-ops-safety-summary-template');

  let detailsStr = '';
  if (stats.blockedCount > 0) {
    detailsStr += `### Fuzzy Command Rejections Log:\n${stats.fuzzyBlocksStr}\n`;
    detailsStr += `### Injection Interventions:\n${stats.injectionBlocksStr}\n`;
    detailsStr += `### Duplicate Dispatch Blocks:\n${stats.duplicateBlocksStr}\n`;
  } else {
    detailsStr = '*No security interventions logged for this date period.*\n';
  }

  const output = template
    .replace(/{{REPORT_DATE}}/g, stats.date)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{FUZZY_BLOCKED_COUNT}}/g, String(stats.fuzzyBlocksStr.split('\n').filter(Boolean).length))
    .replace(/{{INJECTION_BLOCKED_COUNT}}/g, String(stats.injectionBlocksStr.split('\n').filter(Boolean).length))
    .replace(/{{DUPLICATE_BLOCKED_COUNT}}/g, String(stats.duplicateBlocksStr.split('\n').filter(Boolean).length))
    .replace(/{{REJECTED_PACKET_COUNT}}/g, String(stats.rejectedPackets))
    .replace(/{{SAFETY_STATUS}}/g, stats.safetyStatus)
    .replace(/{{SAFETY_INTERVENTIONS_DETAILS}}/g, detailsStr);

  console.log(output);
}

// ─── Command Summary Command ──────────────────────────────────────────────────
function handleCommandSummary(targetDate: string) {
  const stats = compileStats(targetDate);
  const template = loadTemplate('voice-ops-command-summary-template');

  const output = template
    .replace(/{{REPORT_DATE}}/g, stats.date)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{STAGED_COUNT}}/g, String(stats.stagedPackets))
    .replace(/{{APPROVED_COUNT}}/g, String(stats.approvedPackets))
    .replace(/{{PREPARED_COUNT}}/g, String(stats.readyPackets))
    .replace(/{{EXECUTED_COUNT}}/g, String(stats.executedPackets))
    .replace(/{{REJECTED_COUNT}}/g, String(stats.rejectedPackets))
    .replace(/{{BLOCKED_COUNT}}/g, String(stats.blockedCount))
    .replace(/{{EXECUTED_COMMANDS_LIST}}/g, stats.latestExecutedRoute !== 'None' ? `- \`${stats.latestExecutedRoute}\`` : '*No executed commands logged.*')
    .replace(/{{STAGED_COMMANDS_LIST}}/g, stats.latestTranscriptId !== 'None' ? `- Staged Command Packet ID: \`${stats.latestTranscriptId}\`` : '*No staged commands logged.*');

  console.log(output);
}

// ─── Session Summary Command ──────────────────────────────────────────────────
function handleSessionSummary(targetDate: string) {
  const stats = compileStats(targetDate);
  const template = loadTemplate('voice-ops-session-summary-template');

  let listDetails = `Latest Active Session ID: \`${stats.latestSessionId}\` (Current Pipeline Status: \`${stats.latestLifecycleState}\`)`;
  if (stats.totalSessions === 0) {
    listDetails = '*No voice session recording metadata registered for this date.*';
  }

  const output = template
    .replace(/{{REPORT_DATE}}/g, stats.date)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{RECORDED_COUNT}}/g, String(stats.totalSessions))
    .replace(/{{DISPATCHED_COUNT}}/g, String(stats.stagedAsrSessions))
    .replace(/{{TRANSCRIBED_COUNT}}/g, String(stats.totalTranscripts))
    .replace(/{{ARCHIVED_COUNT}}/g, String(stats.archivedSessions))
    .replace(/{{REJECTED_COUNT}}/g, String(stats.rejectedSessions))
    .replace(/{{SESSIONS_LIST_DETAILS}}/g, listDetails);

  console.log(output);
}

// ─── Print Generator Logs Command ─────────────────────────────────────────────
function handleReportLog() {
  ensureDirs();
  const logFilePath = path.join(REPORT_LOGS_DIR, 'report_generation.log');
  let logLines = 'No compilation records logged.';
  if (fs.existsSync(logFilePath)) {
    logLines = fs.readFileSync(logFilePath, 'utf-8');
  }
  console.log('\n=========================================');
  console.log('🧾 Report Generator Log Stream');
  console.log('=========================================');
  console.log(logLines);
  console.log('=========================================\n');
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
    'generate',
    'generate-date',
    'latest',
    'list-reports',
    'safety-summary',
    'command-summary',
    'session-summary',
    'export-dashboard-snapshot',
    'report-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-voice-ops-daily-report-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-ops-daily-report-help" to see options.');
    return;
  }

  const today = getFormattedDate();

  if (command === 'status') {
    handleStatus();
  } else if (command === 'generate') {
    handleGenerate(today);
  } else if (command === 'generate-date') {
    if (!target) {
      console.error('[ERR] Please specify a YYYY-MM-DD target date.');
      process.exit(1);
    }
    handleGenerate(target);
  } else if (command === 'latest') {
    handleLatest();
  } else if (command === 'list-reports') {
    handleListReports();
  } else if (command === 'safety-summary') {
    handleSafetySummary(target || today);
  } else if (command === 'command-summary') {
    handleCommandSummary(target || today);
  } else if (command === 'session-summary') {
    handleSessionSummary(target || today);
  } else if (command === 'export-dashboard-snapshot') {
    handleExportSnapshot();
  } else if (command === 'report-log') {
    handleReportLog();
  }
}

main();
