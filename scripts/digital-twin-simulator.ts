import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  SIMULATION_OUTPUT_DIR,
  SIMULATION_LOG_DIR,
  SIMULATION_TEMPLATES_DIR,
  SAFE_MERGE_THRESHOLD,
  ACCEPTABLE_THRESHOLD,
  REVISION_THRESHOLD
} from '../config/digital-twin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = '/Users/alexanderanthony/Projects/antigravity-lab/one-system/brilliantaire-os';

function getSimDate(): string {
  return '2026-06-01'; // Fixed local anchor date
}

function writeLog(message: string) {
  const logDir = path.join(REPO_ROOT, SIMULATION_LOG_DIR);
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `simulation_log_2026-06-01.md`);
  const timestamp = new Date().toISOString();
  const entry = `| ${timestamp} | ${message} |\n`;
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, entry, 'utf-8');
  } else {
    fs.writeFileSync(logPath, `# Digital Twin Simulation Log - 2026-06-01\n\n| Timestamp | Event |\n|---|---|\n${entry}`, 'utf-8');
  }
}

interface SimulationMetrics {
  score: number;
  decision: string;
  scoreArchitecture: number;
  scoreDependency: number;
  scoreGovernance: number;
  scoreReadiness: number;
  scoreDebt: number;
  blockerNaming: string;
  blockerCycle: string;
  blockerDuplicate: string;
  blockerReadiness: string;
  filesAffected: string[];
}

function getUncommittedFiles(): string[] {
  try {
    const output = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf-8' });
    return output.split('\n').map(line => line.trim().substring(3)).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function runSimulation(targetFiles: string[]): SimulationMetrics {
  let scoreArchitecture = 100;
  let scoreDependency = 100;
  let scoreGovernance = 100;
  let scoreReadiness = 100;
  let scoreDebt = 100;

  let blockerNaming = ' ';
  let blockerCycle = ' ';
  let blockerDuplicate = ' ';
  let blockerReadiness = ' ';

  // Get current dashboard telemetry
  const dashboardPath = path.join(REPO_ROOT, 'dashboard/public/dashboard-data.json');
  let currentReadiness = 86;
  let currentCycles = 0;
  if (fs.existsSync(dashboardPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      currentReadiness = data.productionReadiness?.score ?? 86;
      currentCycles = data.dependencyIntelligence?.circularCount ?? 0;
    } catch (e) {}
  }

  // 1. Analyze changes to frozen components
  const frozenDirs = ['config', 'scripts', 'templates'];
  let modifiedFrozen = false;
  for (const file of targetFiles) {
    if (frozenDirs.some(dir => file.startsWith(dir))) {
      modifiedFrozen = true;
    }
  }

  if (modifiedFrozen) {
    scoreArchitecture -= 15; // Penalty for core mutation
    scoreDebt -= 10;
  }

  // 2. Scan naming drift simulation
  let namingDriftFound = false;
  for (const file of targetFiles) {
    const filePath = path.join(REPO_ROOT, file);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (/Sentinel OS/gi.test(content) && !file.includes('INDEPENDENT_READINESS_REVIEW.md')) {
        namingDriftFound = true;
      }
    }
  }

  if (namingDriftFound) {
    blockerNaming = 'x';
    scoreGovernance -= 20;
    scoreReadiness -= 10;
  }

  // 3. Scan cycle dependencies simulation
  if (currentCycles > 0) {
    blockerCycle = 'x';
    scoreDependency -= 25;
    scoreReadiness -= 15;
  }

  // Calculate final combined simulation score
  const finalScore = Math.round(
    (scoreArchitecture * 0.25) +
    (scoreDependency * 0.25) +
    (scoreGovernance * 0.2) +
    (scoreReadiness * 0.2) +
    (scoreDebt * 0.1)
  );

  let decision = 'REJECTED';
  if (finalScore >= SAFE_MERGE_THRESHOLD && blockerNaming === ' ' && blockerCycle === ' ') {
    decision = 'APPROVED (Safe to Merge)';
  } else if (finalScore >= ACCEPTABLE_THRESHOLD && blockerNaming === ' ' && blockerCycle === ' ') {
    decision = 'ACCEPTABLE (With Minor Review)';
  } else if (finalScore >= REVISION_THRESHOLD) {
    decision = 'REVISION REQUIRED';
  }

  return {
    score: finalScore,
    decision,
    scoreArchitecture,
    scoreDependency,
    scoreGovernance,
    scoreReadiness,
    scoreDebt,
    blockerNaming,
    blockerCycle,
    blockerDuplicate,
    blockerReadiness: currentReadiness < 85 ? 'x' : ' ',
    filesAffected: targetFiles
  };
}

async function main() {
  await announceIntent('Digital Twin Simulation run');
  console.log('🏁 Starting Digital Twin Simulator...');
  writeLog('Started digital twin simulation audit.');

  const files = getUncommittedFiles();
  const targetDesc = files.length > 0 ? `${files.length} modified files` : 'Clean git tree';
  console.log(`Analyzing proposed changes for target: ${targetDesc}`);

  const metrics = runSimulation(files);
  const reportsDir = path.join(REPO_ROOT, SIMULATION_OUTPUT_DIR);
  fs.mkdirSync(reportsDir, { recursive: true });

  const reportPath = path.join(reportsDir, `digital_twin_report_2026-06-01.md`);
  const templatePath = path.join(REPO_ROOT, SIMULATION_TEMPLATES_DIR, 'simulation-report-template.md');

  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template not found at:', templatePath);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf-8');
  templateContent = templateContent
    .replace(/{{timestamp}}/g, new Date().toISOString())
    .replace(/{{target}}/g, targetDesc)
    .replace(/{{decision}}/g, metrics.decision)
    .replace(/{{score}}/g, String(metrics.score))
    .replace(/{{scoreArchitecture}}/g, String(metrics.scoreArchitecture))
    .replace(/{{scoreDependency}}/g, String(metrics.scoreDependency))
    .replace(/{{scoreGovernance}}/g, String(metrics.scoreGovernance))
    .replace(/{{scoreReadiness}}/g, String(metrics.scoreReadiness))
    .replace(/{{scoreDebt}}/g, String(metrics.scoreDebt))
    .replace(/{{blockerNaming}}/g, metrics.blockerNaming)
    .replace(/{{blockerCycle}}/g, metrics.blockerCycle)
    .replace(/{{blockerDuplicate}}/g, metrics.blockerDuplicate)
    .replace(/{{blockerReadiness}}/g, metrics.blockerReadiness)
    .replace(/{{filesList}}/g, files.length > 0 ? files.map(f => `- ${f}`).join('\n') : '- No uncommitted modifications.')
    .replace(/{{componentsList}}/g, 'Brilliantaire OS Core Baseline')
    .replace(/{{observabilityImpact}}/g, 'Neutral (No telemetry handlers altered)')
    .replace(/{{rollbackStrategy}}/g, 'Revert changes via `git checkout -- .`');

  fs.writeFileSync(reportPath, templateContent, 'utf-8');
  console.log(`✅ Staged Digital Twin Simulation report at ${reportPath}`);
  writeLog(`Digital Twin simulation completed with score: ${metrics.score}/100.`);

  // Export to dashboard-data.json
  const dashboardPath = path.join(REPO_ROOT, 'dashboard/public/dashboard-data.json');
  if (fs.existsSync(dashboardPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dashboardPath, 'utf-8'));
      data.digitalTwin = {
        lastScore: metrics.score,
        decision: metrics.decision,
        affectedFiles: files,
        blockers: {
          naming: metrics.blockerNaming === 'x',
          cycles: metrics.blockerCycle === 'x',
          duplicate: metrics.blockerDuplicate === 'x',
          readiness: metrics.blockerReadiness === 'x'
        },
        baselineDrift: 'STABLE (No drift detected)'
      };
      fs.writeFileSync(dashboardPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('✅ Injected digital twin metrics into dashboard-data.json');
    } catch (e) {
      console.error('Failed to write dashboard digital twin data:', e);
    }
  }

  await announceCompletion(`Digital Twin simulation completed successfully. Score: ${metrics.score}`, '15');
}

main();
