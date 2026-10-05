import * as fs from 'fs';
import * as path from 'path';
import {
  SYSTEM_STATUS_PATH,
  PROJECTS_PATH,
  NEXT_ACTIONS_PATH,
  COMMANDS_DOC_PATH,
  HEALTH_REPORTS_DIR,
  FREEZE_SNAPSHOT_DIR,
  RELEASE_CLOSURE_REPORTS_DIR,
  MAINTENANCE_REPORTS_DIR,
  DASHBOARD_DIST_DIR,
  DASHBOARD_PREVIEW_SCRIPT_PATH,
  RUNBOOK_ROOT,
  RUNBOOK_RUNBOOKS_DIR,
  RUNBOOK_CHECKLISTS_DIR,
  RUNBOOK_INDEX_DIR,
  RUNBOOK_LOGS_DIR,
  RUNBOOK_REPORTS_DIR,
  INCLUDE_COMMAND_INDEX,
  INCLUDE_SAFETY_CHECKLIST,
  INCLUDE_TROUBLESHOOTING_MATRIX,
  INCLUDE_EMERGENCY_STOP_GUIDE,
  READONLY_MODE,
  AUTO_EXECUTE,
  AUTO_REPAIR,
  AUTO_RESTORE,
  AUTO_DELETE,
  AUTO_SEND,
  AUTO_UPLOAD,
  AUTO_PUBLISH
} from '../config/voice-ops-operator-runbook.config.js';

// Ensure directories exist
const dirs = [
  RUNBOOK_ROOT,
  RUNBOOK_RUNBOOKS_DIR,
  RUNBOOK_CHECKLISTS_DIR,
  RUNBOOK_INDEX_DIR,
  RUNBOOK_LOGS_DIR,
  RUNBOOK_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(RUNBOOK_LOGS_DIR, 'voice_ops_operator_runbook.log');
const SNAPSHOT_JSON_FILE = path.join(RUNBOOK_ROOT, 'dashboard_runbook_snapshot.json');

function logEvent(event: string, details: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] EVENT: ${event} | DETAILS: ${details}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

// Find latest file matching prefix in a directory
function getLatestFile(dir: string, prefix: string, extension = '.md'): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith(extension)).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

// Get detected freeze tag name
function getDetectedFreezeTag(): string {
  const tagsDir = path.join(FREEZE_SNAPSHOT_DIR, 'tags');
  if (fs.existsSync(tagsDir)) {
    const files = fs.readdirSync(tagsDir).filter(f => f.startsWith('tag_') && f.endsWith('.md')).sort();
    if (files.length > 0) {
      return files[files.length - 1].replace('tag_', '').replace('.md', '');
    }
  }
  return 'voice-ops-n5q-stable';
}

// Get latest health report verdict
function getLatestHealthVerdict(): string {
  const latestReport = getLatestFile(HEALTH_REPORTS_DIR, 'health_report_', '.md');
  if (latestReport && fs.existsSync(latestReport)) {
    const content = fs.readFileSync(latestReport, 'utf-8');
    const verdictMatch = content.match(/Overall Health Verdict: \*\*(.*?)\*\*/);
    if (verdictMatch) return verdictMatch[1];
  }
  return 'Degraded (Vite Asset Changes Detected)';
}

// Serialize telemetry snapshot for Vite dashboard integration
function exportDashboardTelemetry() {
  const latestRunbook = getLatestFile(RUNBOOK_RUNBOOKS_DIR, 'voice_ops_operator_runbook_', '.md');
  const indexStatus = fs.existsSync(path.join(RUNBOOK_INDEX_DIR, 'command_index.md')) ? 'Available' : 'Missing';
  const safetyStatus = fs.existsSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'safety_checklist.md')) ? 'Available' : 'Missing';
  const dailyStatus = fs.existsSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'daily_checklist.md')) ? 'Available' : 'Missing';
  const weeklyStatus = fs.existsSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'weekly_checklist.md')) ? 'Available' : 'Missing';
  const troubleshootingStatus = fs.existsSync(path.join(RUNBOOK_INDEX_DIR, 'troubleshooting_matrix.md')) ? 'Available' : 'Missing';
  const emergencyStatus = fs.existsSync(path.join(RUNBOOK_INDEX_DIR, 'emergency_stop_guide.md')) ? 'Available' : 'Missing';

  const snapshot = {
    timestamp: new Date().toISOString(),
    latestRunbookPath: latestRunbook ? path.relative(process.cwd(), latestRunbook) : 'None',
    commandIndexStatus: indexStatus,
    safetyChecklistStatus: safetyStatus,
    dailyChecklistStatus: dailyStatus,
    weeklyChecklistStatus: weeklyStatus,
    troubleshootingGuideStatus: troubleshootingStatus,
    emergencyStopGuideStatus: emergencyStatus,
    recommendedNextPhase: 'Phase N5V: Operator Training Simulation Pack',
    autoExecuteStatus: AUTO_EXECUTE ? 'enabled' : 'disabled',
    autoRepairStatus: AUTO_REPAIR ? 'enabled' : 'disabled',
    autoRestoreStatus: AUTO_RESTORE ? 'enabled' : 'disabled'
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Copy snapshot to Vite public directory if it exists
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'dashboard_runbook_snapshot.json');
    fs.writeFileSync(publicPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }
}

// 1. status
function handleStatus() {
  const docsFound = {
    systemStatus: fs.existsSync(SYSTEM_STATUS_PATH),
    projects: fs.existsSync(PROJECTS_PATH),
    nextActions: fs.existsSync(NEXT_ACTIONS_PATH),
    commands: fs.existsSync(COMMANDS_DOC_PATH)
  };
  const latestRunbook = getLatestFile(RUNBOOK_RUNBOOKS_DIR, 'voice_ops_operator_runbook_', '.md');

  console.log(`\n🌌 VOICE OPS OPERATOR RUNBOOK STATUS`);
  console.log('================================================================================');
  console.log(`- Runbook Root: ${path.relative(process.cwd(), RUNBOOK_ROOT)}`);
  console.log(`- Runbooks Dir: ${path.relative(process.cwd(), RUNBOOK_RUNBOOKS_DIR)}`);
  console.log(`- Checklists Dir: ${path.relative(process.cwd(), RUNBOOK_CHECKLISTS_DIR)}`);
  console.log(`- Index Dir: ${path.relative(process.cwd(), RUNBOOK_INDEX_DIR)}`);
  console.log(`- Logs Dir: ${path.relative(process.cwd(), RUNBOOK_LOGS_DIR)}`);
  console.log(`- Reports Dir: ${path.relative(process.cwd(), RUNBOOK_REPORTS_DIR)}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`- System Status Found: ${docsFound.systemStatus ? '✅ Yes' : '❌ No'}`);
  console.log(`- Projects Matrix Found: ${docsFound.projects ? '✅ Yes' : '❌ No'}`);
  console.log(`- Next Actions Found: ${docsFound.nextActions ? '✅ Yes' : '❌ No'}`);
  console.log(`- Command Docs Found: ${docsFound.commands ? '✅ Yes' : '❌ No'}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`- Latest Runbook File: ${latestRunbook ? path.relative(process.cwd(), latestRunbook) : 'None'}`);
  console.log(`- Read-only Policy: ${READONLY_MODE}`);
  console.log(`- Auto Execute: ${AUTO_EXECUTE} (Safety: locked)`);
  console.log(`- Auto Repair: ${AUTO_REPAIR} (Safety: locked)`);
  console.log(`- Auto Restore: ${AUTO_RESTORE} (Safety: locked)`);
  console.log(`- Auto Delete: ${AUTO_DELETE} (Safety: locked)`);
  console.log(`- Auto Send/Upload: ${AUTO_SEND}/${AUTO_UPLOAD} (Safety: locked)`);
  console.log(`- Auto Publish: ${AUTO_PUBLISH} (Safety: locked)`);
  console.log('================================================================================\n');
}

// 2. generate
function handleGenerate() {
  const timestamp = new Date().toISOString();
  const fileTimestamp = Math.floor(Date.now() / 1000);
  const freezeTag = getDetectedFreezeTag();
  const verdict = getLatestHealthVerdict();
  const dashboardPreview = path.relative(process.cwd(), path.join(DASHBOARD_DIST_DIR, 'index.html'));

  // Phase Map
  const phaseMap = `| Phase | Description | Primary Command Family | Safety Boundary |
|---|---|---|---|
| **N5A** | Local TTS Render Queue | \`voice-ops-scheduled-briefing\` | Queue checks, no autoplay |
| **N5B** | Local TTS Audio Renderer | \`briefing-tts-render-approval\` | Local file rendering switch |
| **N5C** | Local TTS Model & Cache | \`narrator-tts-models\` | Verification scans, offline check |
| **N5D** | Local ASR Command Listener | \`narrator-asr-listener\` | Whisper model binary auditing |
| **N5E** | Voice Approval Bridge | \`voice-confirm\` / \`voice-deny\` | Manual confirm switch REQUIRED |
| **N5F** | Voice Loop Dashboard | \`narrator-voice-loop-dashboard\` | Read-only telemetry, no run controls |
| **N5G** | Voice Session Recorder | \`narrator-voice-session-recorder\` | Local mic capture switch |
| **N5H** | Voice to ASR Orchestrator | \`narrator-voice-asr-orchestrator\` | Dry-run mapping tables |
| **N5I** | Lifecycle Audit Timeline | \`narrator-voice-lifecycle-audit\` | Sequential ledger logging |
| **N5J** | Voice Ops Daily Report | \`narrator-voice-ops-daily-report\` | Compile summaries, telemetry files |
| **N5K** | Scheduled Briefing Queue | \`voice-ops-scheduled-briefing\` | Brief staging checklist |
| **N5L** | Briefing TTS Approval | \`briefing-tts-render-approval\` | Render validation checklist |
| **N5M** | Playback Review Gate | \`briefing-audio-playback-review\` | Playback signoff checklist |
| **N5N** | Delivery Package Exporter | \`briefing-delivery-package-exporter\` | Local compiler, no auto-upload |
| **N5O** | Manual Handoff Log | \`manual-delivery-handoff\` | SHA256 integrity verifications |
| **N5P** | Archive Retention Ledger | \`delivery-archive-retention\` | Retention audits, no auto-delete |
| **N5Q** | Release Closure Report | \`voice-ops-release-closure\` | Phase audit closure verification |
| **N5R** | Freeze Tag & Snapshot | \`voice-ops-freeze-snapshot\` | Snapshot tags, recovery checklists |
| **N5S** | Post-Freeze Health Monitor | \`voice-ops-post-freeze-health\` | Diagnostic checks, no auto-repair |
| **N5T** | Maintenance Scheduler | \`voice-ops-maintenance-scheduler\` | Stages checks, no automation |
| **N5U** | Operator Runbook | \`voice-ops-operator-runbook\` | Runbook compiler, read-only |`;

  // Read sub-components
  const workflows = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-workflow-map-template.md'), 'utf-8').replace(/^#\s+🧭.*?\n/, '');
  const safety = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-safety-checklist-template.md'), 'utf-8').replace(/^#\s+⚠️.*?\n/, '');
  const dailyCheck = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-daily-checklist-template.md'), 'utf-8').replace(/^#\s+📅.*?\n/, '');
  const weeklyCheck = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-weekly-checklist-template.md'), 'utf-8').replace(/^#\s+📅.*?\n/, '');
  const troubleshooting = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-troubleshooting-template.md'), 'utf-8').replace(/^#\s+🛠️.*?\n/, '');
  const emergencyStop = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-emergency-stop-template.md'), 'utf-8').replace(/^#\s+🚨.*?\n/, '');
  const commandIndex = fs.readFileSync(path.resolve(process.cwd(), 'templates/voice_ops_operator_runbook/voice-ops-runbook-command-index-template.md'), 'utf-8').replace(/^#\s+📋.*?\n/, '');

  const checklists = `### Safety Guidelines\n${safety}\n\n### Daily Routine\n${dailyCheck}\n\n### Weekly Routine\n${weeklyCheck}`;
  const roadmap = `- **Phase N5V: Operator Training Simulation Pack:** (Recommended) Standardized sandbox to simulate script drift, ASR transcription anomalies, and emergency stop protocols.\n- **Optional Repair Branches:** Recheck configuration keys in \`config/paths.ts\` if source documentation matrices cannot be indexed.`;

  const masterContent = fillTemplate('voice-ops-runbook-master-template.md', {
    TIMESTAMP: timestamp,
    FREEZE_TAG: freezeTag,
    HEALTH_VERDICT: verdict,
    DASHBOARD_PATH: dashboardPreview,
    PHASE_MAP: phaseMap,
    WORKFLOWS: workflows,
    SAFETY_BOUNDARIES: 'Strict Read-Only Local Verification Only.',
    CHECKLISTS: checklists,
    TROUBLESHOOTING: troubleshooting,
    EMERGENCY_STOP: emergencyStop,
    COMMAND_INDEX: commandIndex,
    ROADMAP: roadmap
  });

  // Save files
  const runbookPath = path.join(RUNBOOK_RUNBOOKS_DIR, `voice_ops_operator_runbook_${fileTimestamp}.md`);
  fs.writeFileSync(runbookPath, masterContent, 'utf-8');
  
  // Overwrite Master at root
  const rootPath = path.join(process.cwd(), 'VOICE_OPS_OPERATOR_RUNBOOK.md');
  fs.writeFileSync(rootPath, masterContent, 'utf-8');

  // Generate sub-index files
  fs.writeFileSync(path.join(RUNBOOK_INDEX_DIR, 'command_index.md'), commandIndex, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'safety_checklist.md'), safety, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'daily_checklist.md'), dailyCheck, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_CHECKLISTS_DIR, 'weekly_checklist.md'), weeklyCheck, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_INDEX_DIR, 'workflow_map.md'), workflows, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_INDEX_DIR, 'troubleshooting_matrix.md'), troubleshooting, 'utf-8');
  fs.writeFileSync(path.join(RUNBOOK_INDEX_DIR, 'emergency_stop_guide.md'), emergencyStop, 'utf-8');

  logEvent('RUNBOOK_GENERATED', `Compiled master runbook at ${runbookPath}`);
  exportDashboardTelemetry();

  console.log(`✅ Master Operator Runbook compiled and generated successfully.`);
  console.log(`   Local Path: VOICE_OPS_OPERATOR_RUNBOOK.md`);
  console.log(`   Archive Path: ${path.relative(process.cwd(), runbookPath)}`);
}

// 3. command-index
function handleCommandIndex() {
  const content = fillTemplate('voice-ops-runbook-command-index-template.md', {});
  const outputPath = path.join(RUNBOOK_INDEX_DIR, 'command_index.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('COMMAND_INDEX_VIEWED', 'Rendered grouped command index');
}

// 4. safety-checklist
function handleSafetyChecklist() {
  const content = fillTemplate('voice-ops-runbook-safety-checklist-template.md', {});
  const outputPath = path.join(RUNBOOK_CHECKLISTS_DIR, 'safety_checklist.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('SAFETY_CHECKLIST_VIEWED', 'Rendered safety checklist');
}

// 5. daily-checklist
function handleDailyChecklist() {
  const content = fillTemplate('voice-ops-runbook-daily-checklist-template.md', {});
  const outputPath = path.join(RUNBOOK_CHECKLISTS_DIR, 'daily_checklist.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('DAILY_CHECKLIST_VIEWED', 'Rendered daily checklist');
}

// 6. weekly-checklist
function handleWeeklyChecklist() {
  const content = fillTemplate('voice-ops-runbook-weekly-checklist-template.md', {});
  const outputPath = path.join(RUNBOOK_CHECKLISTS_DIR, 'weekly_checklist.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('WEEKLY_CHECKLIST_VIEWED', 'Rendered weekly checklist');
}

// 7. workflow-map
function handleWorkflowMap() {
  const content = fillTemplate('voice-ops-runbook-workflow-map-template.md', {});
  const outputPath = path.join(RUNBOOK_INDEX_DIR, 'workflow_map.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('WORKFLOW_MAP_VIEWED', 'Rendered workflows map');
}

// 8. troubleshooting
function handleTroubleshooting() {
  const content = fillTemplate('voice-ops-runbook-troubleshooting-template.md', {});
  const outputPath = path.join(RUNBOOK_INDEX_DIR, 'troubleshooting_matrix.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('TROUBLESHOOTING_VIEWED', 'Rendered troubleshooting matrix');
}

// 9. emergency-stop
function handleEmergencyStop() {
  const content = fillTemplate('voice-ops-runbook-emergency-stop-template.md', {});
  const outputPath = path.join(RUNBOOK_INDEX_DIR, 'emergency_stop_guide.md');
  fs.writeFileSync(outputPath, content, 'utf-8');
  
  console.log(content);
  console.log(`\n💾 Saved to: ${path.relative(process.cwd(), outputPath)}`);
  logEvent('EMERGENCY_STOP_VIEWED', 'Rendered emergency stop guide');
}

// 10. latest
function handleLatest() {
  const latest = getLatestFile(RUNBOOK_RUNBOOKS_DIR, 'voice_ops_operator_runbook_', '.md');
  if (!latest) {
    console.log('No compiled runbooks found.');
    return;
  }
  console.log(`\n📚 Latest Runbook: ${path.relative(process.cwd(), latest)}`);
  console.log('================================================================================');
  const content = fs.readFileSync(latest, 'utf-8');
  const lines = content.split('\n').slice(0, 40); // print head
  console.log(lines.join('\n'));
  console.log('...\n================================================================================');
}

// 11. list-runbooks
function handleListRunbooks() {
  if (!fs.existsSync(RUNBOOK_RUNBOOKS_DIR)) {
    console.log('Runbooks directory is empty.');
    return;
  }
  const files = fs.readdirSync(RUNBOOK_RUNBOOKS_DIR).filter(f => f.endsWith('.md')).sort();
  if (files.length === 0) {
    console.log('No compiled runbooks found.');
    return;
  }

  console.log(`\n📋 COMPILED OPERATOR RUNBOOKS`);
  console.log('================================================================================');
  files.forEach(f => {
    const fullPath = path.join(RUNBOOK_RUNBOOKS_DIR, f);
    const size = fs.statSync(fullPath).size;
    console.log(`- ${f} (${size} bytes)`);
  });
  console.log('================================================================================\n');
}

// 12. runbook-summary
function handleRunbookSummary() {
  const timestamp = new Date().toISOString();
  const files = fs.existsSync(RUNBOOK_RUNBOOKS_DIR) ? fs.readdirSync(RUNBOOK_RUNBOOKS_DIR).filter(f => f.endsWith('.md')) : [];
  const runbooksList = files.length > 0 
    ? files.map(f => `- **${f}**`).join('\n') 
    : '_None Compiled_';

  const checklistFiles = fs.existsSync(RUNBOOK_CHECKLISTS_DIR) ? fs.readdirSync(RUNBOOK_CHECKLISTS_DIR).filter(f => f.endsWith('.md')) : [];
  const checklistsList = checklistFiles.length > 0 
    ? checklistFiles.map(f => `- **${f}**`).join('\n') 
    : '_None Staged_';

  const indexFiles = fs.existsSync(RUNBOOK_INDEX_DIR) ? fs.readdirSync(RUNBOOK_INDEX_DIR).filter(f => f.endsWith('.md')) : [];
  
  const hasSafety = checklistFiles.includes('safety_checklist.md') ? '✅ Staged' : '❌ Missing';
  const hasTrouble = indexFiles.includes('troubleshooting_matrix.md') ? '✅ Staged' : '❌ Missing';
  const hasStop = indexFiles.includes('emergency_stop_guide.md') ? '✅ Staged' : '❌ Missing';

  const content = fillTemplate('voice-ops-runbook-summary-template.md', {
    TIMESTAMP: timestamp,
    RUNBOOKS_LIST: runbooksList,
    CHECKLISTS_LIST: checklistsList,
    SAFETY_CHECK_STATUS: hasSafety,
    TROUBLESHOOTING_STATUS: hasTrouble,
    EMERGENCY_STOP_STATUS: hasStop
  });

  const summaryPath = path.join(RUNBOOK_REPORTS_DIR, `runbook_summary_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(summaryPath, content, 'utf-8');

  console.log(content);
  console.log(`\n📝 Summary report saved to: ${path.relative(process.cwd(), summaryPath)}`);
}

// 13. runbook-log
function handleRunbookLog() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No runbook events logged yet.');
    return;
  }
  const logs = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const last20 = logs.slice(-20);
  console.log(`\n📋 Recent Operator Runbook Activity Logs:`);
  console.log('================================================================================');
  console.log(last20.join('\n'));
  console.log('================================================================================\n');
}

let parsedArgs: string[] = [];

async function main() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ') && !args[0].startsWith('-')) {
    const match = args[0].match(/--?\w+|"[^"]*"|'[^']*'|[^\s"']+/g);
    if (match) {
      args = match.map(m => m.replace(/^['"]|['"]$/g, ''));
    }
  }
  parsedArgs = args;

  const positionalArgs: string[] = [];
  for (let i = 0; i < parsedArgs.length; i++) {
    if (parsedArgs[i].startsWith('--')) {
      i++;
      continue;
    }
    positionalArgs.push(parsedArgs[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'generate':
      handleGenerate();
      break;
    case 'command-index':
      handleCommandIndex();
      break;
    case 'safety-checklist':
      handleSafetyChecklist();
      break;
    case 'daily-checklist':
      handleDailyChecklist();
      break;
    case 'weekly-checklist':
      handleWeeklyChecklist();
      break;
    case 'workflow-map':
      handleWorkflowMap();
      break;
    case 'troubleshooting':
      handleTroubleshooting();
      break;
    case 'emergency-stop':
      handleEmergencyStop();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'list-runbooks':
      handleListRunbooks();
      break;
    case 'runbook-summary':
      handleRunbookSummary();
      break;
    case 'runbook-log':
      handleRunbookLog();
      break;
    default:
      console.error(`❌ Error: Unknown runbook command "${command}".`);
      console.log('💡 Use: npm run voice-ops-operator-runbook-help for instructions.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error in operator runbook: ${err}`);
  process.exit(1);
});
