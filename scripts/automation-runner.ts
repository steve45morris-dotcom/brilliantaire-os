import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { AUTOMATION_ROUTINES, AutomationRoutine } from '../config/automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const LOG_DIR = path.join(REPO_ROOT, 'outputs', 'automation', 'logs');
const RUN_DIR = path.join(REPO_ROOT, 'outputs', 'automation', 'runs');
const TEMPLATE_DIR = path.join(REPO_ROOT, 'templates', 'automation');

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
  const p = path.join(TEMPLATE_DIR, name);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

function runCommandThroughRouter(cmd: string): Promise<number> {
  return new Promise((resolve) => {
    console.log(`\n🤖 [Automation] Executing command: npm run command -- "${cmd}"`);
    const child = spawn('npm', ['run', 'command', '--', cmd], {
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

async function runRoutine(routine: AutomationRoutine) {
  ensureDirectories();
  const startedAt = new Date().toISOString();
  console.log(`🚀 Starting Automation Routine: "${routine.name}"`);

  const runLogEntries: string[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let hasCriticalFailure = false;

  const runTemplate = getTemplate('automation-run-template.md') || 
    '## [{{TIMESTAMP}}] Command: `{{COMMAND}}`\n- **Result Status:** `{{RESULT}}`\n- **Exit Code:** `{{EXIT_CODE}}`';

  for (const cmd of routine.commands) {
    if (hasCriticalFailure) {
      skippedCount++;
      continue;
    }

    const timestamp = new Date().toISOString();
    const exitCode = await runCommandThroughRouter(cmd);
    const success = exitCode === 0;

    const resultStatus = success ? 'Success' : 'Failed';
    if (success) {
      passedCount++;
    } else {
      failedCount++;
      if (routine.stopOnFailure) {
        hasCriticalFailure = true;
      }
    }

    const entry = runTemplate
      .replace('{{TIMESTAMP}}', timestamp)
      .replace('{{COMMAND}}', cmd)
      .replace('{{RESULT}}', resultStatus)
      .replace('{{EXIT_CODE}}', String(exitCode));

    runLogEntries.push(entry);

    // Write immediately to the daily log
    const dailyLogPath = path.join(LOG_DIR, `automation_log_${getFormattedDate()}.md`);
    fs.appendFileSync(dailyLogPath, `## [${timestamp}] Routine: ${routine.name} | Command: "${cmd}"\n- Result: \`${resultStatus}\`\n- Exit Code: \`${exitCode}\`\n\n---\n\n`);
  }

  const completedAt = new Date().toISOString();
  const finalStatus = failedCount > 0 ? 'FAILED' : 'SUCCESS';
  const nextRecommendedAction = failedCount > 0 
    ? 'Review command router failures, verify permissions, and fix configurations.'
    : 'All routines completed successfully. Run dashboard export to synchronize views.';

  const summaryTemplate = getTemplate('automation-summary-template.md') || 
    '# Automation Run Summary: {{ROUTINE_NAME}}\n- Final Status: {{FINAL_STATUS}}';

  const summaryReport = summaryTemplate
    .replace(/{{ROUTINE_NAME}}/g, routine.name)
    .replace('{{STARTED_AT}}', startedAt)
    .replace('{{COMPLETED_AT}}', completedAt)
    .replace('{{FINAL_STATUS}}', finalStatus)
    .replace('{{COMMANDS_ATTEMPTED}}', String(routine.commands.length))
    .replace('{{COMMANDS_PASSED}}', String(passedCount))
    .replace('{{COMMANDS_FAILED}}', String(failedCount))
    .replace('{{COMMANDS_SKIPPED}}', String(skippedCount))
    .replace('{{DETAILED_LOG_LIST}}', runLogEntries.join('\n\n'))
    .replace('{{NEXT_RECOMMENDED_ACTION}}', nextRecommendedAction);

  const summaryPath = path.join(RUN_DIR, `automation_run_${getFormattedDateTime()}.md`);
  fs.writeFileSync(summaryPath, summaryReport, 'utf-8');
  console.log(`\n✅ Routine completed! Run summary report saved to: ${summaryPath}`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function main() {
  const args = process.argv.slice(2);
  const routineName = args[0];

  if (!routineName || routineName === 'help') {
    console.log("Usage: npm run automation-runner -- [routine-name]");
    console.log("Available routines: daily-check, campaign-check, voice-check");
    process.exit(0);
  }

  const routine = AUTOMATION_ROUTINES.find(r => r.name.toLowerCase() === routineName.toLowerCase().trim());
  if (!routine) {
    console.error(`❌ Error: Unknown routine: "${routineName}"`);
    console.log("Available routines: daily-check, campaign-check, voice-check");
    process.exit(1);
  }

  if (!routine.enabled) {
    console.error(`❌ Error: Routine "${routine.name}" is currently disabled.`);
    process.exit(1);
  }

  runRoutine(routine);
}

main();
