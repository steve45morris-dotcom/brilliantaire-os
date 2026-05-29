import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const SYSTEM_STATUS_PATH = path.join(REPO_ROOT, 'SYSTEM_STATUS.md');
const PROJECTS_PATH = path.join(REPO_ROOT, 'PROJECTS.md');
const NEXT_ACTIONS_PATH = path.join(REPO_ROOT, 'NEXT_ACTIONS.md');
const COMMANDS_PATH = path.join(REPO_ROOT, 'COMMANDS.md');
const AGENTS_PATH = path.join(REPO_ROOT, 'AGENTS.md');

const TELEMETRY_DIR = path.join(REPO_ROOT, 'outputs', 'mesh_telemetry');
const SNAPSHOTS_DIR = path.join(TELEMETRY_DIR, 'snapshots');
const REPORTS_DIR = path.join(TELEMETRY_DIR, 'reports');

const OUTPUT_JSON_DIR = path.join(REPO_ROOT, 'dashboard', 'public');
const OUTPUT_JSON_PATH = path.join(OUTPUT_JSON_DIR, 'dashboard-data.json');

function getLatestFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.md')).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

function parseSystemStatus(): { currentPhase: string; activeCapabilities: string[] } {
  let currentPhase = 'Unknown';
  const activeCapabilities: string[] = [];

  if (fs.existsSync(SYSTEM_STATUS_PATH)) {
    const content = fs.readFileSync(SYSTEM_STATUS_PATH, 'utf-8');
    const phaseMatch = content.match(/-\s+\*\*Current Phase:\*\*\s+(.*)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
    }

    const capLines = content.split('\n');
    let inCaps = false;
    for (const line of capLines) {
      if (line.includes('## 🔋 Active Capabilities')) {
        inCaps = true;
        continue;
      }
      if (inCaps && line.startsWith('##')) {
        break;
      }
      if (inCaps && line.trim().startsWith('-')) {
        activeCapabilities.push(line.trim().replace(/^-\s+/, ''));
      }
    }
  }

  return { currentPhase, activeCapabilities };
}

function parseProjects(): string[] {
  const projects: string[] = [];
  if (fs.existsSync(PROJECTS_PATH)) {
    const content = fs.readFileSync(PROJECTS_PATH, 'utf-8');
    const lines = content.split('\n');
    let inTable = false;
    for (const line of lines) {
      if (line.startsWith('| Project Name')) {
        inTable = true;
        continue;
      }
      if (inTable && line.startsWith('|')) {
        if (line.includes('---')) continue;
        const cols = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length > 0) {
          // clean up markdown bold if present
          const name = cols[0].replace(/\*\*/g, '');
          if (name && name !== 'Project Name') {
            projects.push(name);
          }
        }
      } else if (inTable && line.trim() === '') {
        // Table ended or spacing
      }
    }
  }
  return projects;
}

function parseNextActions(): string[] {
  const actions: string[] = [];
  if (fs.existsSync(NEXT_ACTIONS_PATH)) {
    const content = fs.readFileSync(NEXT_ACTIONS_PATH, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      // Find unchecked markdown tasks
      if (line.trim().startsWith('- [ ]')) {
        actions.push(line.trim().replace(/^-\s+\[\s+\]\s+/, ''));
      }
    }
  }
  return actions;
}

function parseTelemetryReport(reportPath: string) {
  const summary = {
    totalCommands: 0,
    successfulCommands: 0,
    blockedCommands: 0,
    totalVoiceCommands: 0,
    voiceAccepted: 0,
    voicePending: 0,
    voiceRejected: 0,
    voiceApprovedConfirmations: 0,
    voiceDeniedConfirmations: 0,
    obsidianWrites: 0,
    totalRiskEvents: 0
  };

  if (reportPath && fs.existsSync(reportPath)) {
    const content = fs.readFileSync(reportPath, 'utf-8');
    
    // Command matches
    const totalCmdMatch = content.match(/-\s+\*\*Total Command Attempts:\*\*\s+(\d+)/i);
    const successCmdMatch = content.match(/-\s+\*\*Successful Gated Script Runs:\*\*\s+(\d+)/i);
    const blockedCmdMatch = content.match(/-\s+\*\*Blocked \/\s+Risk\s+Boundary\s+Violations:\*\*\s+(\d+)/i);

    // Voice matches
    const totalVoiceMatch = content.match(/-\s+\*\*Total Voice Command Dispatch Runs:\*\*\s+(\d+)/i);
    const acceptedVoiceMatch = content.match(/-\s+\*\*Accepted &\s+Executed\s+Immediately.*:\*\*\s+(\d+)/i);
    const pendingVoiceMatch = content.match(/-\s+\*\*Quarantined \/\s+Held\s+for\s+Manual\s+Review.*:\*\*\s+(\d+)/i);
    const rejectedVoiceMatch = content.match(/-\s+\*\*Rejected\s+\(Unknown.*:\*\*\s+(\d+)/i);
    const approvedConfMatch = content.match(/-\s+\*\*Voice\s+Confirmations\s+Approved.*:\*\*\s+(\d+)/i);
    const deniedConfMatch = content.match(/-\s+\*\*Voice\s+Confirmations\s+Rejected.*:\*\*\s+(\d+)/i);

    // Writes
    const writesMatch = content.match(/-\s+\*\*Obsidian\s+approved\s+write.*:\*\*\s+(\d+)/i);
    
    // Risk anomalies
    const anomaliesMatch = content.match(/-\s+\*\*Total\s+Logged\s+Mesh\s+Anomalies.*:\*\*\s+(\d+)/i);

    if (totalCmdMatch) summary.totalCommands = parseInt(totalCmdMatch[1], 10);
    if (successCmdMatch) summary.successfulCommands = parseInt(successCmdMatch[1], 10);
    if (blockedCmdMatch) summary.blockedCommands = parseInt(blockedCmdMatch[1], 10);

    if (totalVoiceMatch) summary.totalVoiceCommands = parseInt(totalVoiceMatch[1], 10);
    if (acceptedVoiceMatch) summary.voiceAccepted = parseInt(acceptedVoiceMatch[1], 10);
    if (pendingVoiceMatch) summary.voicePending = parseInt(pendingVoiceMatch[1], 10);
    if (rejectedVoiceMatch) summary.voiceRejected = parseInt(rejectedVoiceMatch[1], 10);
    if (approvedConfMatch) summary.voiceApprovedConfirmations = parseInt(approvedConfMatch[1], 10);
    if (deniedConfMatch) summary.voiceDeniedConfirmations = parseInt(deniedConfMatch[1], 10);

    if (writesMatch) summary.obsidianWrites = parseInt(writesMatch[1], 10);
    if (anomaliesMatch) summary.totalRiskEvents = parseInt(anomaliesMatch[1], 10);
  }

  return summary;
}

function parseSportyMetrics(reportPath: string) {
  const sporty = {
    campaignName: 'Sporty No Go Take My Soul',
    readinessScore: 'N/A',
    executionStatus: 'UNKNOWN',
    filesPresentCount: 0,
    missingFilesCount: 0,
    missingFilesList: [] as string[]
  };

  if (reportPath && fs.existsSync(reportPath)) {
    const content = fs.readFileSync(reportPath, 'utf-8');
    const scoreMatch = content.match(/-\s+\*\*Readiness Scores:\*\*\s+(.*)/i);
    const statusMatch = content.match(/-\s+\*\*Execution Status:\*\*\s+(.*)/i);
    const filesMatch = content.match(/-\s+\*\*Files Present:\*\*\s+(.*)/i);
    const missingMatch = content.match(/-\s+\*\*Missing Items:\*\*\s+(.*)/i);

    if (scoreMatch) sporty.readinessScore = scoreMatch[1].trim();
    if (statusMatch) sporty.executionStatus = statusMatch[1].trim();

    if (filesMatch) {
      const list = filesMatch[1].split(',').map(f => f.trim()).filter(Boolean);
      sporty.filesPresentCount = list.length;
    }
    if (missingMatch) {
      const items = missingMatch[1].split(',').map(f => f.trim()).filter(Boolean);
      if (items.length > 0 && items[0] !== 'None') {
        sporty.missingFilesList = items;
        sporty.missingFilesCount = items.length;
      }
    }
  }

  return sporty;
}

function parseSnapshotMissingSignals(snapshotPath: string): string[] {
  const missing: string[] = [];
  if (snapshotPath && fs.existsSync(snapshotPath)) {
    const content = fs.readFileSync(snapshotPath, 'utf-8');
    const lines = content.split('\n');
    let inSection = false;
    for (const line of lines) {
      if (line.includes('## Missing Signals')) {
        inSection = true;
        continue;
      }
      if (inSection && line.startsWith('##')) {
        break;
      }
      if (inSection && line.trim()) {
        const text = line.trim().replace(/^-\s+/, '');
        if (text && text !== 'None') {
          missing.push(text);
        }
      }
    }
  }
  return missing;
}

function main() {
  console.log("📤 Exporting dashboard telemetry data...");

  if (!fs.existsSync(OUTPUT_JSON_DIR)) {
    fs.mkdirSync(OUTPUT_JSON_DIR, { recursive: true });
  }

  const { currentPhase, activeCapabilities } = parseSystemStatus();
  const activeProjects = parseProjects();
  const nextActions = parseNextActions();

  // Telemetry files
  const latestSnapshot = getLatestFile(SNAPSHOTS_DIR, 'system_snapshot');
  const latestReport = getLatestFile(REPORTS_DIR, 'mesh_telemetry_report');
  const latestSporty = getLatestFile(REPORTS_DIR, 'sporty_mesh_telemetry');

  const commandSummary = parseTelemetryReport(latestReport);
  const campaignReadiness = parseSportyMetrics(latestSporty);
  const missingSignals = parseSnapshotMissingSignals(latestSnapshot);

  const data = {
    currentPhase,
    activeCapabilities,
    activeProjects,
    nextActions,
    commandSummary,
    voiceSummary: {
      accepted: commandSummary.voiceAccepted,
      pending: commandSummary.voicePending,
      rejected: commandSummary.voiceRejected,
      approvedConfirmations: commandSummary.voiceApprovedConfirmations,
      deniedConfirmations: commandSummary.voiceDeniedConfirmations
    },
    campaignReadiness,
    latestSnapshotPath: latestSnapshot ? path.relative(REPO_ROOT, latestSnapshot) : '',
    latestTelemetryReportPath: latestReport ? path.relative(REPO_ROOT, latestReport) : '',
    latestSportyReportPath: latestSporty ? path.relative(REPO_ROOT, latestSporty) : '',
    missingSignals,
    exportedAt: new Date().toISOString()
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Dashboard data exported successfully to: ${OUTPUT_JSON_PATH}`);
}

main();
