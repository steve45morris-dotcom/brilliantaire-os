import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globalGovernanceEngine } from '../src/kernel/governance/GovernanceEngine.js';
import { globalLiveOperationsStore } from '../src/kernel/live/LiveOperationsStore.js';
import {
  projectPublicDashboardData,
  writePublicDashboardArtifact,
} from '../src/dashboard/PublicDashboardProjection.js';
import {
  projectAllProvidersHealth,
  writeProviderHealthDashboardArtifact,
} from '../src/integrations/core/ProviderHealthProjection.js';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT_JSON_DIR = path.join(REPO_ROOT, 'dashboard', 'public');
const OUTPUT_JSON_PATH = path.join(OUTPUT_JSON_DIR, 'dashboard-data.json');
const OUTPUT_PROVIDER_HEALTH_PATH = path.join(OUTPUT_JSON_DIR, 'provider-health-data.json');

function readText(relativePath: string): string {
  const filePath = path.join(REPO_ROOT, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

function currentPhase(): string {
  return readText('SYSTEM_STATUS.md').match(/-\s+\*\*Current Phase:\*\*\s+(.*)/i)?.[1]?.trim() || 'Unavailable';
}

function activeProjects(): string[] {
  const projects: string[] = [];
  let inTable = false;
  for (const line of readText('PROJECTS.md').split('\n')) {
    if (line.startsWith('| Project Name')) { inTable = true; continue; }
    if (!inTable || !line.startsWith('|') || line.includes('---')) continue;
    const name = line.split('|').map((column) => column.trim()).filter(Boolean)[0]?.replace(/\*\*/g, '');
    if (name && name !== 'Project Name') projects.push(name);
  }
  return projects;
}

function latestTelemetryReport(): string {
  const directory = path.join(REPO_ROOT, 'outputs', 'mesh_telemetry', 'reports');
  if (!fs.existsSync(directory)) return '';
  const latest = fs.readdirSync(directory)
    .filter((name) => name.startsWith('mesh_telemetry_report') && name.endsWith('.md'))
    .sort()
    .at(-1);
  return latest ? fs.readFileSync(path.join(directory, latest), 'utf-8') : '';
}

function count(report: string, pattern: RegExp): number {
  const match = report.match(pattern);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function voiceSummary() {
  const report = latestTelemetryReport();
  return {
    accepted: count(report, /-\s+\*\*Accepted &\s+Executed\s+Immediately.*:\*\*\s+(\d+)/i),
    pending: count(report, /-\s+\*\*Quarantined \/\s+Held\s+for\s+Manual\s+Review.*:\*\*\s+(\d+)/i),
    rejected: count(report, /-\s+\*\*Rejected\s+\(Unknown.*:\*\*\s+(\d+)/i),
    approvedConfirmations: count(report, /-\s+\*\*Voice\s+Confirmations\s+Approved.*:\*\*\s+(\d+)/i),
    deniedConfirmations: count(report, /-\s+\*\*Voice\s+Confirmations\s+Rejected.*:\*\*\s+(\d+)/i),
  };
}

function main(): void {
  console.log('Exporting validated public dashboard telemetry...');
  fs.mkdirSync(OUTPUT_JSON_DIR, { recursive: true });
  const publicData = projectPublicDashboardData({
    currentPhase: currentPhase(),
    activeProjects: activeProjects(),
    voiceSummary: voiceSummary(),
    governance: globalGovernanceEngine.runAudit(),
    agentExecutions: globalLiveOperationsStore.getAgentExecutionStates(),
  });
  writePublicDashboardArtifact(OUTPUT_JSON_PATH, publicData);
  console.log(`Public dashboard data exported to: ${OUTPUT_JSON_PATH}`);

  const providerHealthData = projectAllProvidersHealth();
  writeProviderHealthDashboardArtifact(OUTPUT_PROVIDER_HEALTH_PATH, providerHealthData);
  console.log(`Public provider health data exported to: ${OUTPUT_PROVIDER_HEALTH_PATH}`);
}

main();
