import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.dirname(__dirname);

// Folders
const COMMAND_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'command_logs');
const VOICE_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'voice_command_logs');
const CONFIRM_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'voice_confirmation_logs');
const VIBE_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'vibevoice_logs');
const LIVE_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'live_asr_logs');
const WRITE_LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'write_logs');
const SIM_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'simulations');
const VALIDATION_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'validation_reports');
const SCHEDULES_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'schedules');
const QUEUE_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'posting_queue');
const LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'execution_logs');

const TELEMETRY_DIR = path.join(REPO_ROOT, 'outputs', 'mesh_telemetry');
const SNAPSHOTS_DIR = path.join(TELEMETRY_DIR, 'snapshots');
const REPORTS_DIR = path.join(TELEMETRY_DIR, 'reports');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates', 'telemetry');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  const dateStr = getFormattedDate();
  const originalPath = path.join(dir, `${baseName}_${dateStr}${ext}`);
  if (!fs.existsSync(originalPath)) {
    return originalPath;
  }
  
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return path.join(dir, `${baseName}_${dateStr}_${hh}${mm}${ss}${ext}`);
}

function ensureDirectories() {
  [SNAPSHOTS_DIR, REPORTS_DIR, TEMPLATES_DIR].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });
}

function getLatestFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.md')).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

function getLatestJSONFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.json')).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

function getTemplate(templateName: string): string {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return '';
}

function countMatchesInFolder(dir: string, pattern: RegExp): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

// snapshot helpers
function getSystemPhase(): string {
  const systemStatusPath = path.join(REPO_ROOT, 'SYSTEM_STATUS.md');
  if (!fs.existsSync(systemStatusPath)) return 'Unknown';
  const content = fs.readFileSync(systemStatusPath, 'utf-8');
  const match = content.match(/-\s+\*\*Current Phase:\*\*\s+(.*)/i);
  return match ? match[1].trim() : 'Unknown';
}

function getActiveCapabilities(): string {
  const systemStatusPath = path.join(REPO_ROOT, 'SYSTEM_STATUS.md');
  if (!fs.existsSync(systemStatusPath)) return 'None';
  const content = fs.readFileSync(systemStatusPath, 'utf-8');
  const lines = content.split('\n');
  let inCapabilities = false;
  const list: string[] = [];
  for (const line of lines) {
    if (line.includes('## 🔋 Active Capabilities')) {
      inCapabilities = true;
      continue;
    }
    if (inCapabilities && line.startsWith('##')) {
      break;
    }
    if (inCapabilities && line.trim()) {
      list.push(line.trim());
    }
  }
  return list.join('\n') || 'None';
}

function getActiveProjects(): string {
  const projectsPath = path.join(REPO_ROOT, 'PROJECTS.md');
  if (!fs.existsSync(projectsPath)) return 'None';
  const content = fs.readFileSync(projectsPath, 'utf-8');
  const lines = content.split('\n');
  const list: string[] = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| Project Name')) {
      inTable = true;
    }
    if (inTable) {
      if (line.trim() === '' && list.length > 2) {
        break;
      }
      list.push(line.trim());
    }
  }
  return list.join('\n') || 'None';
}

function getAvailableCommands(): string {
  const commandsPath = path.join(REPO_ROOT, 'COMMANDS.md');
  if (!fs.existsSync(commandsPath)) return 'None';
  const content = fs.readFileSync(commandsPath, 'utf-8');
  const lines = content.split('\n');
  const list: string[] = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| Command |') || line.startsWith('| `audit` |')) {
      inTable = true;
    }
    if (inTable) {
      if (line.trim() === '' && list.length > 2) {
        break;
      }
      list.push(line.trim());
    }
  }
  return list.join('\n') || 'None';
}

function getActiveAgents(): string {
  const agentsPath = path.join(REPO_ROOT, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) return 'None';
  const content = fs.readFileSync(agentsPath, 'utf-8');
  const lines = content.split('\n');
  const list: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (line.includes('## 👥 The Agent Council') || line.includes('## 2. Roster Details')) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('##')) {
      break;
    }
    if (inSection && line.trim()) {
      list.push(line.trim());
    }
  }
  return list.join('\n') || 'None';
}

function runSnapshot() {
  ensureDirectories();
  const dateStr = getFormattedDate();

  console.log("📸 Compiling System Snapshot...");

  const templateStr = getTemplate('system-snapshot-template.md');
  let snapshot = templateStr;

  if (!snapshot) {
    snapshot = `# System Snapshot Fallback\n- **Snapshot Date:** {{SNAPSHOT_DATE}}\n- **Current Phase:** {{CURRENT_PHASE}}\n`;
  }

  // Get latest files
  const latestCmdLog = getLatestFile(COMMAND_LOGS_DIR, 'command_log');
  const latestVoiceLog = getLatestFile(VOICE_LOGS_DIR, 'voice_command_log');
  const latestConfirmLog = getLatestFile(CONFIRM_LOGS_DIR, 'voice_confirmation_log');
  const latestVibeLog = getLatestFile(VIBE_LOGS_DIR, 'vibevoice_log');
  const latestLiveLog = getLatestFile(LIVE_LOGS_DIR, 'live_asr_log');
  const latestSim = getLatestFile(SIM_DIR, 'sporty_no_go_take_my_soul_simulation');
  const latestVal = getLatestFile(VALIDATION_DIR, 'sporty_no_go_take_my_soul_validation');

  const recentLogsList: string[] = [];
  const missingSignals: string[] = [];

  const logMapping = [
    { name: 'Command Log', path: latestCmdLog },
    { name: 'Voice Log', path: latestVoiceLog },
    { name: 'Confirmation Log', path: latestConfirmLog },
    { name: 'VibeVoice Log', path: latestVibeLog },
    { name: 'Live ASR Log', path: latestLiveLog },
    { name: 'Campaign Simulation', path: latestSim },
    { name: 'Campaign Validation', path: latestVal }
  ];

  logMapping.forEach(lm => {
    if (lm.path) {
      recentLogsList.push(`- **${lm.name}:** \`${path.basename(lm.path)}\` (at \`${path.relative(REPO_ROOT, lm.path)}\`)`);
    } else {
      missingSignals.push(lm.name);
    }
  });

  const capabilities = getActiveCapabilities();
  const projects = getActiveProjects();
  const commands = getAvailableCommands();
  const agents = getActiveAgents();

  snapshot = snapshot
    .replace('{{SNAPSHOT_DATE}}', dateStr)
    .replace('{{CURRENT_PHASE}}', getSystemPhase())
    .replace('{{ACTIVE_CAPABILITIES}}', capabilities)
    .replace('{{ACTIVE_PROJECTS}}', projects)
    .replace('{{AVAILABLE_COMMANDS}}', commands)
    .replace('{{ACTIVE_AGENTS}}', agents)
    .replace('{{RECENT_LOGS}}', recentLogsList.join('\n') || 'None')
    .replace('{{MISSING_SIGNALS}}', missingSignals.length > 0 ? missingSignals.map(s => `- Missing ${s} files`).join('\n') : 'None');

  const destPath = getSafeWritePath(SNAPSHOTS_DIR, 'system_snapshot', '.md');
  fs.writeFileSync(destPath, snapshot);
  console.log(`✅ System Snapshot saved to: ${destPath}`);
}

function runReport() {
  ensureDirectories();
  const dateStr = getFormattedDate();

  console.log("📊 Compiling Unified System Telemetry Report...");

  const templateStr = getTemplate('telemetry-report-template.md');
  let report = templateStr;

  if (!report) {
    report = `# Telemetry Report Fallback\n- **Report Date:** {{REPORT_DATE}}\n- **System Phase:** {{SYSTEM_PHASE}}\n`;
  }

  // Auditing calculations
  // 1. Commands
  const totalCommands = countMatchesInFolder(COMMAND_LOGS_DIR, /##\s+\[/g);
  const successCommands = countMatchesInFolder(COMMAND_LOGS_DIR, /Result Status:\s+`Success`/g);
  const blockedCommands = countMatchesInFolder(COMMAND_LOGS_DIR, /Result Status:\s+`Blocked/g);

  // 2. Voice
  const voiceAccepted = countMatchesInFolder(VOICE_LOGS_DIR, /Result Status:\s+`Success`/g);
  const voiceRejected = countMatchesInFolder(VOICE_LOGS_DIR, /Result Status:\s+`Rejected/g);
  const voicePending = countMatchesInFolder(VOICE_LOGS_DIR, /Result Status:\s+`Blocked: Manual confirmation required`/g);

  // 3. Confirmations
  const confirmApproved = countMatchesInFolder(CONFIRM_LOGS_DIR, /Voice Confirmation Approved:/g);
  const confirmDenied = countMatchesInFolder(CONFIRM_LOGS_DIR, /Voice Confirmation Denied:/g);

  // 4. Campaign outputs
  let scheduleCount = 0;
  let queueCount = 0;
  let logCount = 0;

  const schedulesPath = path.join(REPO_ROOT, 'outputs', 'campaigns', 'schedules');
  const queuePath = path.join(REPO_ROOT, 'outputs', 'campaigns', 'posting_queue');
  const executionLogsPath = path.join(REPO_ROOT, 'outputs', 'campaigns', 'execution_logs');

  if (fs.existsSync(schedulesPath)) scheduleCount = fs.readdirSync(schedulesPath).length;
  if (fs.existsSync(queuePath)) queueCount = fs.readdirSync(queuePath).length;
  if (fs.existsSync(executionLogsPath)) logCount = fs.readdirSync(executionLogsPath).length;

  const totalCampaignOutputs = scheduleCount + queueCount + logCount;

  // 5. Readiness scores
  let latestReadiness = 'N/A';
  const latestSimFile = getLatestFile(SIM_DIR, 'sporty_');
  if (latestSimFile) {
    const simContent = fs.readFileSync(latestSimFile, 'utf-8');
    const match = simContent.match(/-\s+\*\*Overall Readiness:\*\*\s+(.*)/i);
    if (match) {
      latestReadiness = match[1].trim();
    }
  }

  // 6. Obsidian writes
  const obsidianWrites = countMatchesInFolder(WRITE_LOGS_DIR, /"status":\s*"success"/gi);

  // 7. Risk events
  const riskEvents = blockedCommands + voiceRejected + confirmDenied;

  const inputsChecked = [
    `Command Logs (\`${path.relative(REPO_ROOT, COMMAND_LOGS_DIR)}\`)`,
    `Voice Logs (\`${path.relative(REPO_ROOT, VOICE_LOGS_DIR)}\`)`,
    `Confirmation Logs (\`${path.relative(REPO_ROOT, CONFIRM_LOGS_DIR)}\`)`,
    `ASR/VibeVoice Logs`,
    `Write Logs (\`${path.relative(REPO_ROOT, WRITE_LOGS_DIR)}\`)`,
    `Campaign Outputs`
  ].join(', ');

  const commandActivity = [
    `- **Total Command Attempts:** ${totalCommands}`,
    `- **Successful Gated Script Runs:** ${successCommands}`,
    `- **Blocked / Risk Boundary Violations:** ${blockedCommands}`
  ].join('\n');

  const voiceActivity = [
    `- **Total Voice Command Dispatch Runs:** ${voiceAccepted + voiceRejected + voicePending}`,
    `- **Accepted & Executed Immediately (Low Risk):** ${voiceAccepted}`,
    `- **Quarantined / Held for Manual Review (Med/High Risk):** ${voicePending}`,
    `- **Rejected (Unknown voice command phrases):** ${voiceRejected}`,
    `- **Voice Confirmations Approved (Human Released):** ${confirmApproved}`,
    `- **Voice Confirmations Rejected (Human Dismissed):** ${confirmDenied}`
  ].join('\n');

  const campaignActivity = [
    `- **Campaign Schedule Timeline Drafts:** ${scheduleCount}`,
    `- **Daily Staging Posting Queues:** ${queueCount}`,
    `- **Daily Manual Verification Logs:** ${logCount}`,
    `- **Total Campaign Generation Runs:** ${totalCampaignOutputs}`
  ].join('\n');

  const validationScores = `- **Latest Audited Campaign Readiness:** ${latestReadiness}`;
  const writeActivity = `- **Obsidian approved write operations logged:** ${obsidianWrites}`;
  
  const riskSection = [
    `- **Total Logged Mesh Anomalies / Safe Rejections:** ${riskEvents}`,
    `- **Blocked commands count:** ${blockedCommands}`,
    `- **Rejected voice transcript phrases:** ${voiceRejected}`,
    `- **Denied confirmation requests:** ${confirmDenied}`
  ].join('\n');

  const recommendations = [
    `1. Periodic check of rejected Live ASR files under \`voice_input/live_logs/rejected/\` to audit microphone stream clarity.`,
    `2. Execute pending confirmation requests using \`npm run command -- "voice-confirm"\` or reject via \`npm run command -- "voice-deny"\`.`,
    `3. Perform manual execution logs check inside \`outputs/campaigns/execution_logs/\` to track actual daily posts.`
  ].join('\n');

  report = report
    .replace('{{REPORT_DATE}}', dateStr)
    .replace('{{SYSTEM_PHASE}}', getSystemPhase())
    .replace('{{INPUTS_CHECKED}}', inputsChecked)
    .replace('{{COMMAND_ACTIVITY}}', commandActivity)
    .replace('{{VOICE_ACTIVITY}}', voiceActivity)
    .replace('{{CAMPAIGN_ACTIVITY}}', campaignActivity)
    .replace('{{VALIDATION_SCORES}}', validationScores)
    .replace('{{RISK_EVENTS}}', riskSection + `\n\n### Obsidian Write Logs\n${writeActivity}`)
    .replace('{{RECOMMENDATIONS}}', recommendations)
    .replace('{{NEXT_ACTION}}', 'Staging snapshot log reports compiled. Review generated telemetries.');

  const destPath = getSafeWritePath(REPORTS_DIR, 'mesh_telemetry_report', '.md');
  fs.writeFileSync(destPath, report);
  console.log(`✅ Telemetry Report saved to: ${destPath}`);
}

function runCampaignSporty() {
  ensureDirectories();
  const dateStr = getFormattedDate();

  console.log("📊 Compiling Campaign Telemetry for Sporty Rollout...");

  const templateStr = getTemplate('campaign-metrics-template.md');
  let metrics = templateStr;

  if (!metrics) {
    metrics = `# Campaign Metrics Fallback\n- **Campaign Name:** {{CAMPAIGN_NAME}}\n- **Execution Status:** {{EXECUTION_STATUS}}\n`;
  }

  const sched = getLatestFile(SCHEDULES_DIR, 'sporty_');
  const queue = getLatestFile(QUEUE_DIR, 'sporty_');
  const log = getLatestFile(LOGS_DIR, 'sporty_');
  const sim = getLatestFile(SIM_DIR, 'sporty_');
  const val = getLatestFile(VALIDATION_DIR, 'sporty_');

  const filesPresent: string[] = [];
  const missingFiles: string[] = [];

  const mappings = [
    { name: 'Schedule', path: sched },
    { name: 'Posting Queue', path: queue },
    { name: 'Execution Log', path: log },
    { name: 'Simulation Report', path: sim },
    { name: 'Validation Report', path: val }
  ];

  mappings.forEach(m => {
    if (m.path) {
      filesPresent.push(`${m.name} (\`${path.basename(m.path)}\`)`);
    } else {
      missingFiles.push(m.name);
    }
  });

  let score = 'N/A';
  if (sim) {
    const simContent = fs.readFileSync(sim, 'utf-8');
    const match = simContent.match(/-\s+\*\*Overall Readiness:\*\*\s+(.*)/i);
    if (match) {
      score = match[1].trim();
    }
  }

  metrics = metrics
    .replace('{{CAMPAIGN_NAME}}', 'Sporty No Go Take My Soul')
    .replace('{{FILES_PRESENT}}', filesPresent.join(', ') || 'None')
    .replace('{{READINESS_SCORES}}', score)
    .replace('{{EXECUTION_STATUS}}', score.includes('Ready') ? 'STAGED / READY' : 'REVISION REQUIRED')
    .replace('{{MISSING_ITEMS}}', missingFiles.join(', ') || 'None')
    .replace('{{NEXT_ACTION}}', 'Awaiting developer manual execution review.');

  const destPath = getSafeWritePath(REPORTS_DIR, 'sporty_mesh_telemetry', '.md');
  fs.writeFileSync(destPath, metrics);
  console.log(`✅ Sporty Campaign Telemetry saved to: ${destPath}`);
}

function printStatus() {
  ensureDirectories();
  console.log(`=========================================`);
  console.log(`📊 MESH TELEMETRY STATUS REPORT`);
  console.log(`=========================================`);

  const snapshot = getLatestFile(SNAPSHOTS_DIR, 'system_snapshot');
  const report = getLatestFile(REPORTS_DIR, 'mesh_telemetry_report');
  const sporty = getLatestFile(REPORTS_DIR, 'sporty_mesh_telemetry');

  console.log(`Latest Snapshot:     ${snapshot ? path.basename(snapshot) : '❌ None'}`);
  console.log(`Latest Report:       ${report ? path.basename(report) : '❌ None'}`);
  console.log(`Latest Sporty Mesh:  ${sporty ? path.basename(sporty) : '❌ None'}`);
  console.log(`-----------------------------------------`);

  // Log families presence checks
  const families = [
    { name: 'Command Logs', dir: COMMAND_LOGS_DIR },
    { name: 'Voice Logs', dir: VOICE_LOGS_DIR },
    { name: 'Confirmation Logs', dir: CONFIRM_LOGS_DIR },
    { name: 'VibeVoice Logs', dir: VIBE_LOGS_DIR },
    { name: 'Live ASR Logs', dir: LIVE_LOGS_DIR },
    { name: 'Write Logs', dir: WRITE_LOGS_DIR }
  ];

  const missingFamilies: string[] = [];
  families.forEach(f => {
    if (!fs.existsSync(f.dir) || fs.readdirSync(f.dir).length === 0) {
      missingFamilies.push(f.name);
    }
  });

  console.log(`Missing Log Families: ${missingFamilies.length > 0 ? missingFamilies.join(', ') : '✅ None'}`);
  console.log(`-----------------------------------------`);
  console.log(`Next Recommended Action:`);

  if (!snapshot) {
    console.log(`  👉 Run "npm run mesh-telemetry -- snapshot" to capture current repo capabilities.`);
  } else if (!report) {
    console.log(`  👉 Run "npm run mesh-telemetry -- report" to capture metrics overview logs.`);
  } else if (!sporty) {
    console.log(`  👉 Run "npm run mesh-telemetry -- campaign sporty" to capture Sporty rollout details.`);
  } else {
    console.log(`  👉 All telemetry reports compiled! Proceed to review outputs under outputs/mesh_telemetry/.`);
  }
  console.log(`=========================================`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ');

  if (!command || command === 'help') {
    console.log("Usage: npm run mesh-telemetry -- [command]");
    console.log("Available commands: snapshot, report, campaign sporty, status, help");
    process.exit(0);
  }

  switch (command.toLowerCase().trim()) {
    case 'snapshot':
      runSnapshot();
      break;
    case 'report':
      runReport();
      break;
    case 'campaign sporty':
      runCampaignSporty();
      break;
    case 'status':
      printStatus();
      break;
    default:
      console.error(`❌ Unknown command: "${command}"`);
      console.log("Available commands: snapshot, report, campaign sporty, status, help");
      process.exit(1);
  }
}

main();
