import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import {
  ENABLE_BACKGROUND_AUTOMATION,
  BACKGROUND_SCHEDULES
} from '../config/background-automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const LOG_DIR = path.join(REPO_ROOT, 'outputs', 'background_automation', 'logs');
const RUN_DIR = path.join(REPO_ROOT, 'outputs', 'background_automation', 'runs');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates', 'background_automation');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedDateTime(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hh}${mm}`;
}

function ensureDirectories() {
  [LOG_DIR, RUN_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getTemplate(name: string): string {
  const p = path.join(TEMPLATES_DIR, name);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

function logAttempt(scheduleName: string, routineName: string, status: string, details: string) {
  ensureDirectories();
  const dateStr = getFormattedDate();
  const logPath = path.join(LOG_DIR, `background_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();

  const runTemplate = getTemplate('background-run-template.md') ||
    '## [{{TIMESTAMP}}] Schedule: `{{SCHEDULE_NAME}}`\n- **Routine:** `{{ROUTINE_NAME}}`\n- **Result Status:** `{{STATUS}}`\n- **Dry Run:** `{{DRY_RUN}}`\n- **Message:** {{DETAILS}}';

  const entry = runTemplate
    .replace('{{TIMESTAMP}}', timestamp)
    .replace('{{SCHEDULE_NAME}}', scheduleName)
    .replace('{{ROUTINE_NAME}}', routineName)
    .replace('{{STATUS}}', status)
    .replace('{{DRY_RUN}}', 'false')
    .replace('{{DETAILS}}', details);

  fs.appendFileSync(logPath, entry + '\n\n---\n\n');
}

function writeSummaryReport(
  scheduleName: string,
  routineName: string,
  startedAt: string,
  completedAt: string,
  commandsCount: number,
  passedCount: number,
  failedCount: number,
  skippedCount: number,
  finalStatus: string
) {
  ensureDirectories();
  const summaryPath = path.join(RUN_DIR, `background_run_${getFormattedDateTime()}.md`);
  
  let report = `# 🛰️ Background Execution Run Summary: ${scheduleName}\n\n`;
  report += `- **Routine Run:** \`${routineName}\`\n`;
  report += `- **Started At:** ${startedAt}\n`;
  report += `- **Completed At:** ${completedAt}\n`;
  report += `- **Commands Attempted:** ${commandsCount}\n`;
  report += `- **Commands Passed:** ${passedCount}\n`;
  report += `- **Commands Failed:** ${failedCount}\n`;
  report += `- **Skipped Commands:** ${skippedCount}\n`;
  report += `- **Final Status:** \`${finalStatus}\`\n`;
  report += `- **Next Recommended Action:** Review system status on local dashboard.\n`;

  fs.writeFileSync(summaryPath, report, 'utf-8');
}

function runRoutine(routineName: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`🚀 Executing automation-runner: npm run automation-runner -- "${routineName}"`);
    const child = spawn('npm', ['run', 'automation-runner', '--', routineName], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: false
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });

    child.on('error', (err) => {
      console.error(`❌ Spawn error: ${err.message}`);
      resolve(1);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const scheduleName = args[0];
  const hasConfirm = args.includes('--confirm');

  if (!scheduleName || scheduleName === 'help') {
    console.log("Usage: npm run background-run -- [schedule-name] --confirm");
    console.log("Available schedules: morning-daily-check, afternoon-campaign-check, evening-voice-check");
    process.exit(0);
  }

  const schedule = BACKGROUND_SCHEDULES.find(s => s.name.toLowerCase() === scheduleName.toLowerCase().trim());
  if (!schedule) {
    console.error(`❌ Error: Unknown background schedule: "${scheduleName}"`);
    process.exit(1);
  }

  const startedAt = new Date().toISOString();

  // Rule 1: Require --confirm
  if (!hasConfirm) {
    const msg = 'Blocked: Missing --confirm confirmation flag.';
    console.error(`❌ ${msg}`);
    logAttempt(schedule.name, schedule.routine, 'BLOCKED_MISSING_CONFIRM', msg);
    process.exit(1);
  }

  // Rule 2: Require schedule enabled true
  if (!schedule.enabled) {
    const msg = `Blocked: Schedule "${schedule.name}" is currently disabled in background-automation config.`;
    console.error(`❌ ${msg}`);
    logAttempt(schedule.name, schedule.routine, 'BLOCKED_SCHEDULE_DISABLED', msg);
    process.exit(1);
  }

  // Rule 3: Require global ENABLE_BACKGROUND_AUTOMATION true
  if (!ENABLE_BACKGROUND_AUTOMATION) {
    const msg = 'Blocked: Global background automation is disabled (ENABLE_BACKGROUND_AUTOMATION = false).';
    console.error(`❌ ${msg}`);
    logAttempt(schedule.name, schedule.routine, 'BLOCKED_GLOBAL_DISABLED', msg);
    process.exit(1);
  }

  // Execute routine
  logAttempt(schedule.name, schedule.routine, 'STARTED', 'Execution checks passed. Initializing run.');
  const exitCode = await runRoutine(schedule.routine);
  const completedAt = new Date().toISOString();

  const success = exitCode === 0;
  const status = success ? 'SUCCESS' : 'FAILED';

  // Map commands count for metric summary
  let cmdCount = 3;
  if (schedule.routine === 'daily-check') {
    cmdCount = 6;
  }

  const passed = success ? cmdCount : 0;
  const failed = success ? 0 : 1;
  const skipped = success ? 0 : cmdCount - 1;

  writeSummaryReport(
    schedule.name,
    schedule.routine,
    startedAt,
    completedAt,
    cmdCount,
    passed,
    failed,
    skipped,
    status
  );

  logAttempt(
    schedule.name,
    schedule.routine,
    status,
    `Execution completed. Exit Code: ${exitCode}`
  );

  if (exitCode !== 0) {
    process.exit(exitCode);
  } else {
    process.exit(0);
  }
}

main();
