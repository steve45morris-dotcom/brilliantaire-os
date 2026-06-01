import * as fs from 'fs';
import * as path from 'path';
import {
  AUDIT_SESSIONS_METADATA_DIR,
  AUDIT_SESSIONS_RECORDINGS_DIR,
  AUDIT_ASR_INPUT_DIR,
  AUDIT_ASR_TRANSCRIPTS_DIR,
  AUDIT_ASR_STAGED_DIR,
  AUDIT_ASR_APPROVED_DIR,
  AUDIT_ASR_REJECTED_DIR,
  AUDIT_BRIDGE_READY_DIR,
  AUDIT_BRIDGE_EXECUTED_DIR,
  AUDIT_BRIDGE_REJECTED_DIR,
  AUDIT_BRIDGE_LOGS_DIR,
  AUDIT_ORCH_LOGS_DIR,
  AUDIT_DASHBOARD_LOGS_DIR,
  AUDIT_OUTPUT_INDEX_DIR,
  AUDIT_REPORT_DIR,
  AUDIT_LOGS_DIR,
  MAX_EVENTS_PER_REPORT,
  INCLUDE_RAW_TRANSCRIPT_PREVIEW,
  REDACT_SENSITIVE_PATHS,
  AUTO_EXECUTE,
  READONLY_MODE_DEFAULT
} from '../config/narrator-voice-lifecycle-audit.config.js';

export interface AuditEvent {
  timestamp: string;
  type: string;
  sessionId: string;
  description: string;
  source: string;
  status: string;
  details?: string;
}

export interface LifecycleTimeline {
  sessionId: string;
  events: AuditEvent[];
  currentState: string;
  audioExists: boolean;
  transcriptExists: boolean;
  stagedExists: boolean;
  approvedExists: boolean;
  executedExists: boolean;
}

function ensureDirs() {
  fs.mkdirSync(AUDIT_OUTPUT_INDEX_DIR, { recursive: true });
  fs.mkdirSync(AUDIT_REPORT_DIR, { recursive: true });
  fs.mkdirSync(AUDIT_LOGS_DIR, { recursive: true });
}

function logEvent(msg: string) {
  ensureDirs();
  const logFilePath = path.join(AUDIT_LOGS_DIR, 'lifecycle_audit.log');
  fs.appendFileSync(logFilePath, `[${new Date().toISOString()}] ${msg}\n`, 'utf-8');
}

const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date = new Date(), includeSeconds = false): string {
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return includeSeconds ? `${base}${pad(now.getSeconds())}` : base;
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/narrator_voice_lifecycle_audit', `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

// Helper to safe-stat file times
function getFileTime(filePath: string): string {
  if (fs.existsSync(filePath)) {
    try {
      return fs.statSync(filePath).birthtime.toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
}

// ─── Scan All Pipeline Folders & Build Cache Indexes ──────────────────────────
export function performScan(): { events: AuditEvent[]; timelines: Record<string, LifecycleTimeline> } {
  ensureDirs();
  const events: AuditEvent[] = [];
  const timelines: Record<string, LifecycleTimeline> = {};

  const getTimelineObj = (id: string): LifecycleTimeline => {
    if (!timelines[id]) {
      timelines[id] = {
        sessionId: id,
        events: [],
        currentState: 'Initialized',
        audioExists: false,
        transcriptExists: false,
        stagedExists: false,
        approvedExists: false,
        executedExists: false
      };
    }
    return timelines[id];
  };

  // 1. Scan metadata folder (.json files)
  if (fs.existsSync(AUDIT_SESSIONS_METADATA_DIR)) {
    fs.readdirSync(AUDIT_SESSIONS_METADATA_DIR)
      .filter(f => f.endsWith('.json'))
      .forEach(file => {
        const id = file.replace('.json', '');
        const filePath = path.join(AUDIT_SESSIONS_METADATA_DIR, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const t = getTimelineObj(id);
          t.currentState = content.status || 'Recorded';
          
          const time = content.recordedAt || getFileTime(filePath);
          t.events.push({
            timestamp: time,
            type: 'metadata_written',
            sessionId: id,
            description: `Session metadata file registered with status [${content.status}].`,
            source: 'metadata',
            status: 'SUCCESS'
          });
        } catch (err) {}
      });
  }

  // 2. Scan recordings WAV
  if (fs.existsSync(AUDIT_SESSIONS_RECORDINGS_DIR)) {
    fs.readdirSync(AUDIT_SESSIONS_RECORDINGS_DIR)
      .filter(f => f.endsWith('.wav'))
      .forEach(file => {
        const id = file.replace('.wav', '');
        const filePath = path.join(AUDIT_SESSIONS_RECORDINGS_DIR, file);
        const t = getTimelineObj(id);
        t.audioExists = true;
        t.events.push({
          timestamp: getFileTime(filePath),
          type: 'recording_created',
          sessionId: id,
          description: `Voice session audio WAV recording created.`,
          source: 'recordings',
          status: 'SUCCESS'
        });
      });
  }

  // 3. Scan ASR inputs
  if (fs.existsSync(AUDIT_ASR_INPUT_DIR)) {
    fs.readdirSync(AUDIT_ASR_INPUT_DIR)
      .filter(f => f.endsWith('.wav'))
      .forEach(file => {
        const id = file.replace('.wav', '');
        const filePath = path.join(AUDIT_ASR_INPUT_DIR, file);
        const t = getTimelineObj(id);
        t.events.push({
          timestamp: getFileTime(filePath),
          type: 'asr_dispatched',
          sessionId: id,
          description: `WAV file staged in ASR input folder (Dispatch stage completed).`,
          source: 'asr_inputs',
          status: 'SUCCESS'
        });
      });
  }

  // 4. Scan ASR transcripts
  if (fs.existsSync(AUDIT_ASR_TRANSCRIPTS_DIR)) {
    fs.readdirSync(AUDIT_ASR_TRANSCRIPTS_DIR)
      .filter(f => f.endsWith('.md'))
      .forEach(file => {
        const match = file.match(/asr_transcript_(.+)\.md/);
        if (match) {
          const id = match[1];
          const filePath = path.join(AUDIT_ASR_TRANSCRIPTS_DIR, file);
          const t = getTimelineObj(id);
          t.transcriptExists = true;

          let textPreview = '';
          if (INCLUDE_RAW_TRANSCRIPT_PREVIEW) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const textMatch = fileContent.match(/```text\s*([\s\S]*?)\s*```/i);
              if (textMatch) textPreview = textMatch[1].trim();
            } catch (e) {}
          }

          t.events.push({
            timestamp: getFileTime(filePath),
            type: 'transcription_created',
            sessionId: id,
            description: `Offline Whisper transcription file generated.`,
            source: 'transcripts',
            status: 'SUCCESS',
            details: textPreview ? `Raw text: "${textPreview}"` : undefined
          });
        }
      });
  }

  // 5. Scan staged commands
  if (fs.existsSync(AUDIT_ASR_STAGED_DIR)) {
    fs.readdirSync(AUDIT_ASR_STAGED_DIR)
      .filter(f => f.endsWith('.md'))
      .forEach(file => {
        const match = file.match(/asr_command_packet_(.+)\.md/);
        if (match) {
          const id = match[1];
          const filePath = path.join(AUDIT_ASR_STAGED_DIR, file);
          const t = getTimelineObj(id);
          t.stagedExists = true;

          let commandPayload = '';
          try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const routeMatch = fileContent.match(/- Proposed Command Route:\s*`([^`]+)`/i);
            if (routeMatch) commandPayload = routeMatch[1].trim();
          } catch (e) {}

          t.events.push({
            timestamp: getFileTime(filePath),
            type: 'command_staged',
            sessionId: id,
            description: `Command packet staged as a VNP packet.`,
            source: 'staged_commands',
            status: 'SUCCESS',
            details: commandPayload ? `Proposed route: "${commandPayload}"` : undefined
          });
        }
      });
  }

  // 6. Scan approvals and rejections
  const scanStatusDir = (dir: string, type: 'asr_approved' | 'asr_rejected') => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir)
        .filter(f => f.endsWith('.md'))
        .forEach(file => {
          const match = file.match(/asr_command_packet_(.+)\.md/);
          if (match) {
            const id = match[1];
            const filePath = path.join(dir, file);
            const t = getTimelineObj(id);
            if (type === 'asr_approved') t.approvedExists = true;
            t.events.push({
              timestamp: getFileTime(filePath),
              type,
              sessionId: id,
              description: `Operator ${type === 'asr_approved' ? 'Approved' : 'Rejected'} staged command packet.`,
              source: type,
              status: 'SUCCESS'
            });
          }
        });
    }
  };
  scanStatusDir(AUDIT_ASR_APPROVED_DIR, 'asr_approved');
  scanStatusDir(AUDIT_ASR_REJECTED_DIR, 'asr_rejected');

  // 7. Scan bridge states
  const scanBridgeDir = (dir: string, type: 'bridge_prepared' | 'bridge_executed' | 'bridge_rejected') => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir)
        .filter(f => f.endsWith('.md'))
        .forEach(file => {
          const match = file.match(/asr_command_packet_(.+)\.md/);
          if (match) {
            const id = match[1];
            const filePath = path.join(dir, file);
            const t = getTimelineObj(id);
            if (type === 'bridge_executed') t.executedExists = true;
            t.events.push({
              timestamp: getFileTime(filePath),
              type,
              sessionId: id,
              description: `Voice Command Approval Bridge transition: [${type.toUpperCase()}].`,
              source: 'voice_bridge',
              status: 'SUCCESS'
            });
          }
        });
    }
  };
  scanBridgeDir(AUDIT_BRIDGE_READY_DIR, 'bridge_prepared');
  scanBridgeDir(AUDIT_BRIDGE_EXECUTED_DIR, 'bridge_executed');
  scanBridgeDir(AUDIT_BRIDGE_REJECTED_DIR, 'bridge_rejected');

  // 8. Parse logs to extract exact timestamps & details
  // A. recorder.log
  const recorderLogPath = path.join(AUDIT_SESSIONS_RECORDINGS_DIR, '../logs/voice_recorder.log');
  if (fs.existsSync(recorderLogPath)) {
    try {
      const logs = fs.readFileSync(recorderLogPath, 'utf-8').split('\n');
      logs.forEach(line => {
        const startStopMatch = line.match(/^\[([^\]]+)\]\s+(RECORDING_START|RECORDING_STOP)\s+\|\s+ID:\s*([^\s|]+)\s+\|\s+Status:\s*(\w+)/);
        if (startStopMatch) {
          const time = startStopMatch[1];
          const action = startStopMatch[2];
          const id = startStopMatch[3];
          const status = startStopMatch[4];
          const t = getTimelineObj(id);
          t.events.push({
            timestamp: time,
            type: action.toLowerCase(),
            sessionId: id,
            description: `Voice recorder logged event [${action}].`,
            source: 'voice_recorder.log',
            status
          });
        }
      });
    } catch (e) {}
  }

  // B. orchestrator.log
  const orchestratorLogPath = path.join(AUDIT_ORCH_LOGS_DIR, 'orchestrator.log');
  if (fs.existsSync(orchestratorLogPath)) {
    try {
      const logs = fs.readFileSync(orchestratorLogPath, 'utf-8').split('\n');
      logs.forEach(line => {
        const orchMatch = line.match(/^\[([^\]]+)\]\s+([A-Z_]+)\s+\|\s+ID:\s*([^\s|]+)\s+\|\s+Success:\s*(\w+)/);
        if (orchMatch) {
          const time = orchMatch[1];
          const type = orchMatch[2].toLowerCase();
          const id = orchMatch[3];
          const success = orchMatch[4];
          const t = getTimelineObj(id);
          t.events.push({
            timestamp: time,
            type: `orch_${type}`,
            sessionId: id,
            description: `Voice ASR Orchestrator logged event: [${type.toUpperCase()}].`,
            source: 'orchestrator.log',
            status: success === 'true' ? 'SUCCESS' : 'FAILURE'
          });
        }
        
        // Match transcribers logs
        const transMatch = line.match(/^\[([^\]]+)\]\s+(TRANSCRIBE_SESSION|STAGE_TRANSCRIPT|APPROVE_SESSION_COMMAND|REJECT_SESSION_COMMAND)\s+\|\s+ID:\s*([^\s|]+)\s+\|\s+Outcomes:\s*(\w+)/);
        if (transMatch) {
          const time = transMatch[1];
          const type = transMatch[2].toLowerCase();
          const id = transMatch[3];
          const outcome = transMatch[4];
          const t = getTimelineObj(id);
          t.events.push({
            timestamp: time,
            type: `orch_${type}`,
            sessionId: id,
            description: `Voice ASR Orchestrator delegated workflow [${type.toUpperCase()}] output is: ${outcome}`,
            source: 'orchestrator.log',
            status: outcome
          });
        }
      });
    } catch (e) {}
  }

  // C. Parse command_logs for executions, blocks and fuzzy interventions
  const cmdLogDir = path.join(process.cwd(), 'outputs/command_logs');
  if (fs.existsSync(cmdLogDir)) {
    const cmdFiles = fs.readdirSync(cmdLogDir).filter(f => f.startsWith('command_log_') && f.endsWith('.md'));
    cmdFiles.forEach(file => {
      try {
        const fileContent = fs.readFileSync(path.join(cmdLogDir, file), 'utf-8');
        const sections = fileContent.split('## [');
        sections.forEach(sec => {
          if (!sec.trim()) return;
          const timeMatch = sec.match(/^([^\]]+)\]\s+Command Attempt:\s*"([^"]+)"/);
          if (timeMatch) {
            const time = timeMatch[1];
            const rawCmd = timeMatch[2];
            const matchedCmdMatch = sec.match(/-\s+\*\*Matched Command:\*\*\s+`([^`]+)`/);
            const matchedCmd = matchedCmdMatch ? matchedCmdMatch[1] : 'None';
            const aliasUsedMatch = sec.match(/-\s+\*\*Alias Used:\*\*\s+`([^`]+)`/);
            const aliasUsed = aliasUsedMatch ? aliasUsedMatch[1] === 'true' : false;
            const statusMatch = sec.match(/-\s+\*\*Result Status:\*\*\s+`([^`]+)`/);
            const status = statusMatch ? statusMatch[1] : 'Unknown';
            const exitCodeMatch = sec.match(/-\s+\*\*Exit Code:\*\*\s+`([^`]+)`/);
            const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1]) : 0;

            // Check if command input references a known session ID
            let sessionId = 'None';
            for (const key of Object.keys(timelines)) {
              if (rawCmd.includes(key)) {
                sessionId = key;
                break;
              }
            }

            let type = 'command_attempt';
            let isAnomaly = false;

            if (status.includes('Blocked:') || status.includes('Error:') || exitCode !== 0) {
              isAnomaly = true;
              if (status.includes('Alias Used for Exact Name')) {
                type = 'fuzzy_command_blocked';
              } else if (status.includes('Missing Confirmation Flag')) {
                type = 'confirmation_blocked';
              } else {
                type = 'execution_blocked';
              }
            } else if (exitCode === 0) {
              type = 'command_executed';
            }

            const ev: AuditEvent = {
              timestamp: time,
              type,
              sessionId,
              description: isAnomaly
                ? `Safety Blocked: Command "${rawCmd}" rejected. Reason: ${status}`
                : `Command execution completed: "${rawCmd}"`,
              source: `command_log_${file.replace('command_log_', '').replace('.md', '')}`,
              status: isAnomaly ? 'BLOCKED' : 'SUCCESS',
              details: `Matched Command: "${matchedCmd}" | Exit Code: ${exitCode}`
            };

            events.push(ev);
            if (sessionId !== 'None') {
              const t = getTimelineObj(sessionId);
              t.events.push(ev);
            }
          }
        });
      } catch (e) {}
    });
  }

  // Push all mapped timeline events to the global events array
  Object.values(timelines).forEach(t => {
    // Deduplicate and sort timeline events chronologically
    t.events = t.events.filter((val, index, self) =>
      self.findIndex(v => v.timestamp === val.timestamp && v.type === val.type) === index
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Also push to master events index if they weren't collected from files
    t.events.forEach(ev => {
      const alreadyLogged = events.some(e => e.timestamp === ev.timestamp && e.type === ev.type && e.sessionId === ev.sessionId);
      if (!alreadyLogged) {
        events.push(ev);
      }
    });
  });

  // Sort master events chronologically
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Save index outputs
  fs.writeFileSync(path.join(AUDIT_OUTPUT_INDEX_DIR, 'events_index.json'), JSON.stringify(events, null, 2), 'utf-8');
  Object.keys(timelines).forEach(key => {
    fs.writeFileSync(path.join(AUDIT_OUTPUT_INDEX_DIR, `timeline_${key}.json`), JSON.stringify(timelines[key], null, 2), 'utf-8');
  });

  return { events, timelines };
}

// ─── Status Command ───────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const { events, timelines } = performScan();
  const keys = Object.keys(timelines);
  const latestId = keys.length > 0 ? keys[keys.length - 1] : 'None';

  const anomaliesCount = events.filter(e => e.status === 'BLOCKED' || e.type.includes('blocked')).length;
  const executionCount = events.filter(e => e.type === 'command_executed' || e.type === 'bridge_executed').length;
  const blockedCount = events.filter(e => e.status === 'BLOCKED').length;

  const template = loadTemplate('voice-lifecycle-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{SESSIONS_METADATA_DIR}}/g, AUDIT_SESSIONS_METADATA_DIR)
    .replace(/{{SESSIONS_RECORDINGS_DIR}}/g, AUDIT_SESSIONS_RECORDINGS_DIR)
    .replace(/{{ASR_INPUT_DIR}}/g, AUDIT_ASR_INPUT_DIR)
    .replace(/{{ASR_TRANSCRIPTS_DIR}}/g, AUDIT_ASR_TRANSCRIPTS_DIR)
    .replace(/{{ASR_STAGED_DIR}}/g, AUDIT_ASR_STAGED_DIR)
    .replace(/{{ASR_APPROVED_DIR}}/g, AUDIT_ASR_APPROVED_DIR)
    .replace(/{{ASR_REJECTED_DIR}}/g, AUDIT_ASR_REJECTED_DIR)
    .replace(/{{BRIDGE_READY_DIR}}/g, AUDIT_BRIDGE_READY_DIR)
    .replace(/{{BRIDGE_EXECUTED_DIR}}/g, AUDIT_BRIDGE_EXECUTED_DIR)
    .replace(/{{BRIDGE_REJECTED_DIR}}/g, AUDIT_BRIDGE_REJECTED_DIR)
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE))
    .replace(/{{READONLY_MODE}}/g, String(READONLY_MODE_DEFAULT))
    .replace(/{{REDACT_PATHS}}/g, String(REDACT_SENSITIVE_PATHS))
    .replace(/{{INCLUDE_TRANSCRIPTS}}/g, String(INCLUDE_RAW_TRANSCRIPT_PREVIEW))
    .replace(/{{TOTAL_EVENTS}}/g, String(events.length))
    .replace(/{{TRACKED_SESSIONS}}/g, String(keys.length))
    .replace(/{{SAFETY_ANOMALIES}}/g, String(anomaliesCount))
    .replace(/{{BRIDGE_EXECUTIONS}}/g, String(executionCount))
    .replace(/{{BLOCKED_COMMANDS}}/g, String(blockedCount))
    .replace(/{{LATEST_LIFECYCLE_ID}}/g, latestId);

  console.log(output);
}

// ─── Scan Events Command ──────────────────────────────────────────────────────
function handleScanEvents() {
  performScan();
  console.log('✅ Pipeline scanned successfully. Saved index caches to outputs/narrator/voice_lifecycle_audit/index/.');
  logEvent('SCAN_EVENTS | System scanned pipeline files and updated cached index files.');
}

// ─── Chronological Timeline Command ──────────────────────────────────────────
function handleTimeline(targetId: string, writeReport = false): string {
  ensureDirs();
  const { timelines } = performScan();
  const t = timelines[targetId];

  if (!t) {
    const errorTemplate = loadTemplate('voice-lifecycle-error-template');
    const errOutput = errorTemplate
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{TARGET_ID}}/g, targetId)
      .replace(/{{ERROR_CODE}}/g, 'LIFECYCLE_TARGET_NOT_FOUND')
      .replace(/{{ERROR_MESSAGE}}/g, `The requested Voice Lifecycle ID "${targetId}" was not found in scanned sessions metadata.`);
    console.log(errOutput);
    return errOutput;
  }

  // Build sequential timeline list
  let timelineItemsStr = '';
  t.events.forEach((e, idx) => {
    timelineItemsStr += `${idx + 1}. [${e.timestamp}] **${e.type.toUpperCase()}** (Source: ${e.source}) [Status: ${e.status}]\n   - Detail: ${e.description}\n`;
    if (e.details) {
      timelineItemsStr += `   - Data: \`${e.details}\`\n`;
    }
    timelineItemsStr += '\n';
  });

  if (!timelineItemsStr) {
    timelineItemsStr = '*No chronological transition events recorded for this session ID.*';
  }

  // Find proposed command route
  let proposedRoute = 'None';
  const stagedEvent = t.events.find(e => e.type === 'command_staged');
  if (stagedEvent && stagedEvent.details) {
    const rMatch = stagedEvent.details.match(/Proposed route:\s*"([^"]+)"/);
    if (rMatch) proposedRoute = rMatch[1];
  }

  // Find execution status
  const executedEvent = t.events.find(e => e.type === 'bridge_executed' || e.type === 'command_executed');
  const executionStatus = executedEvent ? 'Executed Successfully' : 'Not Executed / Gated';
  const exitCodeStr = executedEvent && executedEvent.details ? (executedEvent.details.match(/Exit Code:\s*(\d+)/)?.[1] || '0') : 'N/A';
  const logPathStr = executedEvent && executedEvent.details ? 'Refer to command attempts log' : 'N/A';

  const template = loadTemplate('voice-lifecycle-timeline-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{LIFECYCLE_ID}}/g, t.sessionId)
    .replace(/{{SESSION_ID}}/g, t.sessionId)
    .replace(/{{AUDIO_PATH}}/g, t.audioExists ? 'outputs/narrator/voice_sessions/recordings/' + t.sessionId + '.wav' : 'Missing')
    .replace(/{{METADATA_PATH}}/g, 'outputs/narrator/voice_sessions/metadata/' + t.sessionId + '.json')
    .replace(/{{TRANSCRIPT_PATH}}/g, t.transcriptExists ? 'outputs/narrator/asr/transcripts/asr_transcript_' + t.sessionId + '.md' : 'Not transcribed')
    .replace(/{{STAGED_PATH}}/g, t.stagedExists ? 'outputs/narrator/asr/staged_commands/asr_command_packet_' + t.sessionId + '.md' : 'Not staged')
    .replace(/{{APPROVED_PATH}}/g, t.approvedExists ? 'outputs/narrator/asr/approved/asr_command_packet_' + t.sessionId + '.md' : 'Not approved')
    .replace(/{{TIMELINE_ITEMS}}/g, timelineItemsStr)
    .replace(/{{COMMAND_ROUTE}}/g, proposedRoute)
    .replace(/{{BRIDGE_READY_STATUS}}/g, t.approvedExists ? 'Bridge Ready (ASR Approved)' : 'Pending ASR Approval')
    .replace(/{{BRIDGE_EXECUTION_STATUS}}/g, executionStatus)
    .replace(/{{EXECUTION_EXIT_CODE}}/g, exitCodeStr)
    .replace(/{{EXECUTION_LOG_PATH}}/g, logPathStr);

  console.log(output);

  if (writeReport) {
    const reportFilePath = path.join(AUDIT_REPORT_DIR, `voice_command_lifecycle_report_${targetId}.md`);
    fs.writeFileSync(reportFilePath, output, 'utf-8');
    console.log(`✅ Saved timeline report file to: ${reportFilePath}`);
    logEvent(`EXPORT_TIMELINE | Saved report for ID: ${targetId}`);
  }

  return output;
}

// ─── Latest Timeline Command ─────────────────────────────────────────────────
function handleLatestTimeline() {
  const { timelines } = performScan();
  const keys = Object.keys(timelines);
  if (keys.length === 0) {
    console.log('No registered voice lifecycle records discovered.');
    return;
  }
  const latestId = keys[keys.length - 1];
  handleTimeline(latestId);
}

// ─── Lifecycle Map Command ────────────────────────────────────────────────────
function handleLifecycleMap() {
  const { timelines } = performScan();
  
  let rowsStr = '';
  Object.values(timelines).forEach(t => {
    rowsStr += `| \`${t.sessionId}\` | ${t.audioExists ? '✅' : '⏳'} | ${t.events.some(e => e.type === 'asr_dispatched') ? '✅' : '⏳'} | ${t.transcriptExists ? '✅' : '⏳'} | ${t.stagedExists ? '✅' : '⏳'} | ${t.approvedExists ? '✅' : t.events.some(e => e.type === 'asr_rejected') ? '❌ (REJECTED)' : '⏳'} | ${t.approvedExists ? '✅' : '⏳'} | ${t.executedExists ? '✅' : '⏳'} | \`${t.currentState}\` |\n`;
  });

  if (!rowsStr) {
    rowsStr = '| None | - | - | - | - | - | - | - | No records found |\n';
  }

  const template = loadTemplate('voice-lifecycle-map-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{MAP_ROWS}}/g, rowsStr);

  console.log(output);
}

// ─── Safety Events Command ────────────────────────────────────────────────────
function handleSafetyEvents() {
  const { events } = performScan();

  const getEventLines = (typeFilter: string) => {
    let lines = '';
    events
      .filter(e => e.type === typeFilter || (typeFilter === 'rejections' && (e.type === 'asr_rejected' || e.type === 'bridge_rejected')))
      .forEach(e => {
        lines += `- [${e.timestamp}] ID: \`${e.sessionId}\` | Source: ${e.source} | Message: ${e.description}\n`;
      });
    return lines || '*No logged events found for this safety check.*\n';
  };

  const template = loadTemplate('voice-lifecycle-safety-events-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{FUZZY_BLOCKS}}/g, getEventLines('fuzzy_command_blocked'))
    .replace(/{{INJECTION_BLOCKS}}/g, getEventLines('injection_blocked'))
    .replace(/{{DUPLICATE_BLOCKS}}/g, getEventLines('duplicate_blocked'))
    .replace(/{{REJECTION_EVENTS}}/g, getEventLines('rejections'));

  console.log(output);
}

// ─── Execution Events Command ──────────────────────────────────────────────────
function handleExecutionEvents() {
  const { events } = performScan();
  const execs = events.filter(e => e.type === 'command_executed' || e.type === 'bridge_executed');

  let execLines = '';
  execs.forEach(e => {
    execLines += `- [${e.timestamp}] ID: \`${e.sessionId}\` | Source: ${e.source}\n  - ${e.description}\n`;
    if (e.details) {
      execLines += `  - Details: \`${e.details}\`\n`;
    }
  });

  if (!execLines) {
    execLines = '*No command executions recorded in command logs.*\n';
  }

  const template = loadTemplate('voice-lifecycle-execution-events-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{EXECUTION_EVENTS}}/g, execLines)
    .replace(/{{EXECUTION_COUNT}}/g, String(execs.length));

  console.log(output);
}

// ─── Blocked Events Command ──────────────────────────────────────────────────
function handleBlockedEvents() {
  const { events } = performScan();
  const blocks = events.filter(e => e.status === 'BLOCKED' || e.type.includes('blocked'));

  let blockLines = '';
  blocks.forEach(e => {
    blockLines += `- [${e.timestamp}] ID: \`${e.sessionId}\` | Source: ${e.source}\n  - ${e.description}\n`;
  });

  if (!blockLines) {
    blockLines = '*No unauthorized attempts or safety interventions intercepted.*\n';
  }

  const template = loadTemplate('voice-lifecycle-blocked-events-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{BLOCKED_EVENTS}}/g, blockLines)
    .replace(/{{BLOCKED_COUNT}}/g, String(blocks.length));

  console.log(output);
}

// ─── Export Latest Command ───────────────────────────────────────────────────
function handleExportLatest() {
  const { timelines } = performScan();
  const keys = Object.keys(timelines);
  if (keys.length === 0) {
    console.error('❌ Error: No voice lifecycle sessions discovered. Export aborted.');
    process.exit(1);
  }
  const latestId = keys[keys.length - 1];
  handleTimeline(latestId, true);
}

// ─── Summary Report Command ───────────────────────────────────────────────────
function handleAuditSummary() {
  ensureDirs();
  const { events, timelines } = performScan();

  const sessionKeys = Object.keys(timelines);
  const transcribedCount = Object.values(timelines).filter(t => t.transcriptExists).length;
  const stagedCount = Object.values(timelines).filter(t => t.stagedExists).length;
  const approvedCount = Object.values(timelines).filter(t => t.approvedExists).length;
  const executedCount = Object.values(timelines).filter(t => t.executedExists).length;
  const safetyViolations = events.filter(e => e.status === 'BLOCKED' || e.type.includes('blocked')).length;

  const template = loadTemplate('voice-lifecycle-summary-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{TRACKED_SESSIONS_COUNT}}/g, String(sessionKeys.length))
    .replace(/{{TRANSCRIBED_COUNT}}/g, String(transcribedCount))
    .replace(/{{STAGED_COUNT}}/g, String(stagedCount))
    .replace(/{{APPROVED_COUNT}}/g, String(approvedCount))
    .replace(/{{EXECUTED_COUNT}}/g, String(executedCount))
    .replace(/{{SAFETY_VIOLATIONS_COUNT}}/g, String(safetyViolations))
    .replace(/{{RECORDINGS_DIR}}/g, AUDIT_SESSIONS_RECORDINGS_DIR)
    .replace(/{{ASR_INPUT_DIR}}/g, AUDIT_ASR_INPUT_DIR)
    .replace(/{{ASR_TRANSCRIPTS_DIR}}/g, AUDIT_ASR_TRANSCRIPTS_DIR)
    .replace(/{{ASR_STAGED_DIR}}/g, AUDIT_ASR_STAGED_DIR)
    .replace(/{{ASR_APPROVED_DIR}}/g, AUDIT_ASR_APPROVED_DIR)
    .replace(/{{AUTO_TRANSCRIBE}}/g, 'false')
    .replace(/{{AUTO_STAGE}}/g, 'false')
    .replace(/{{AUTO_APPROVE}}/g, 'false')
    .replace(/{{AUTO_EXECUTE}}/g, 'false');

  console.log(output);

  const summaryFilePath = path.join(AUDIT_REPORT_DIR, `voice_pipeline_lifecycle_audit_summary.md`);
  fs.writeFileSync(summaryFilePath, output, 'utf-8');
  console.log(`✅ Saved global audit summary report to: ${summaryFilePath}`);
  logEvent('AUDIT_SUMMARY | Saved global pipeline audit summary report file.');
}

// ─── CLI Router ──────────────────────────────────────────────────────────────
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
    'scan-events',
    'timeline',
    'latest-timeline',
    'lifecycle-map',
    'safety-events',
    'execution-events',
    'blocked-events',
    'export-timeline',
    'export-latest',
    'audit-summary'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown audit command: "${command}". Run "npm run narrator-voice-lifecycle-audit-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-lifecycle-audit-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'scan-events') {
    handleScanEvents();
  } else if (command === 'timeline') {
    if (!target) {
      console.error('[ERR] Please specify a Voice Lifecycle/Session ID.');
      process.exit(1);
    }
    handleTimeline(target);
  } else if (command === 'latest-timeline') {
    handleLatestTimeline();
  } else if (command === 'lifecycle-map') {
    handleLifecycleMap();
  } else if (command === 'safety-events') {
    handleSafetyEvents();
  } else if (command === 'execution-events') {
    handleExecutionEvents();
  } else if (command === 'blocked-events') {
    handleBlockedEvents();
  } else if (command === 'export-timeline') {
    if (!target) {
      console.error('[ERR] Please specify a Voice Lifecycle/Session ID.');
      process.exit(1);
    }
    handleTimeline(target, true);
  } else if (command === 'export-latest') {
    handleExportLatest();
  } else if (command === 'audit-summary') {
    handleAuditSummary();
  }
}

const isRunningDirectly = process.argv[1] && (
  process.argv[1].endsWith('narrator-voice-lifecycle-audit.ts') ||
  process.argv[1].endsWith('narrator-voice-lifecycle-audit.js') ||
  process.argv[1].endsWith('narrator-voice-lifecycle-audit')
);

if (isRunningDirectly) {
  main();
}
