import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BACKGROUND_SCHEDULES } from '../config/background-automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const LOG_DIR = path.join(REPO_ROOT, 'outputs', 'background_automation', 'logs');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates', 'background_automation');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ensureDirectories() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getTemplate(name: string): string {
  const p = path.join(TEMPLATES_DIR, name);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

function writeBackgroundLog(scheduleName: string, routineName: string, status: string, details: string) {
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
    .replace('{{DRY_RUN}}', 'true')
    .replace('{{DETAILS}}', details);

  fs.appendFileSync(logPath, entry + '\n\n---\n\n');
}

function main() {
  const args = process.argv.slice(2);
  const scheduleName = args[0];

  if (!scheduleName || scheduleName === 'help') {
    console.log("Usage: npm run background-dry-run -- [schedule-name]");
    console.log("Available schedules: morning-daily-check, afternoon-campaign-check, evening-voice-check");
    process.exit(0);
  }

  const schedule = BACKGROUND_SCHEDULES.find(s => s.name.toLowerCase() === scheduleName.toLowerCase().trim());
  if (!schedule) {
    console.error(`❌ Unknown background schedule: "${scheduleName}"`);
    console.log("Available schedules: morning-daily-check, afternoon-campaign-check, evening-voice-check");
    process.exit(1);
  }

  console.log(`🧪 [Dry-Run] Verifying schedule: "${schedule.name}"`);
  console.log(`👉 Would execute routine: "${schedule.routine}"`);
  console.log(`👉 Owning Agent:          ${schedule.owningAgent}`);
  console.log(`👉 Time Trigger:          ${schedule.suggestedTime}`);
  console.log(`👉 Enabled State:         ${schedule.enabled ? 'Enabled' : 'Disabled (Config Locked)'}`);

  writeBackgroundLog(schedule.name, schedule.routine, 'DRY_RUN_PASSED', 'Dry run verification checks successfully passed. Routine was simulated.');
  console.log("✅ Dry run logged successfully.");
}

main();
