import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ENABLE_BACKGROUND_AUTOMATION,
  DRY_RUN_DEFAULT,
  BACKGROUND_SCHEDULES
} from '../config/background-automation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const LOG_DIR = path.join(REPO_ROOT, 'outputs', 'background_automation', 'logs');
const RUN_DIR = path.join(REPO_ROOT, 'outputs', 'background_automation', 'runs');
const TEMPLATE_PATH = path.join(REPO_ROOT, 'templates', 'background_automation', 'background-status-template.md');

function getLatestFile(dir: string, prefix: string): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.md')).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

function main() {
  const timestamp = new Date().toISOString();

  let template = '';
  if (fs.existsSync(TEMPLATE_PATH)) {
    template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  }

  // Generate lists
  const availableList = BACKGROUND_SCHEDULES.map(s => `- **${s.name}:** Routine \`${s.routine}\` (${s.suggestedTime}) - Owning Agent: \`${s.owningAgent}\``).join('\n');
  const enabledList = BACKGROUND_SCHEDULES.filter(s => s.enabled).map(s => `- **${s.name}:** Routine \`${s.routine}\``).join('\n') || 'None';

  // Read latest files
  const latestLogFile = getLatestFile(LOG_DIR, 'background_log');
  const latestRunFile = getLatestFile(RUN_DIR, 'background_run');

  const latestLogStr = latestLogFile ? `\`${path.basename(latestLogFile)}\` (at \`${path.relative(REPO_ROOT, latestLogFile)}\`)` : 'None Found';
  const latestRunStr = latestRunFile ? `\`${path.basename(latestRunFile)}\` (at \`${path.relative(REPO_ROOT, latestRunFile)}\`)` : 'None Found';

  let nextAction = '';
  if (!ENABLE_BACKGROUND_AUTOMATION) {
    nextAction = 'Enable global background automation in `config/background-automation.ts` to execute live scheduler tasks.';
  } else if (BACKGROUND_SCHEDULES.filter(s => s.enabled).length === 0) {
    nextAction = 'Enable individual background schedules inside `config/background-automation.ts` to allow automatic triggers.';
  } else {
    nextAction = 'Run "npm run background-run" triggers or establish cron/launchd integration pointing to build scripts.';
  }

  if (template) {
    const output = template
      .replace('{{GLOBAL_ENABLED}}', ENABLE_BACKGROUND_AUTOMATION ? 'YES' : 'NO')
      .replace('{{DRY_RUN_DEFAULT}}', DRY_RUN_DEFAULT ? 'YES' : 'NO')
      .replace('{{ALLOW_EXTERNAL_COMMANDS}}', 'NO')
      .replace('{{ALLOW_SOCIAL_POSTING}}', 'NO')
      .replace('{{ALLOW_DESTRUCTIVE_ACTIONS}}', 'NO')
      .replace('{{SCHEDULES_LIST}}', `### Available Schedules:\n${availableList}\n\n### Enabled Schedules:\n${enabledList}\n\n### Recent Logs:\n- **Latest Log:** ${latestLogStr}\n- **Latest Run Summary:** ${latestRunStr}\n\n### Next Recommended Action:\n👉 ${nextAction}`)
      .replace('{{TIMESTAMP}}', timestamp);

    console.log(output);
  } else {
    // Fallback console log
    console.log("=========================================");
    console.log("🛰️ BACKGROUND AUTOMATION STATUS REPORT");
    console.log("=========================================");
    console.log(`Global Enabled:      ${ENABLE_BACKGROUND_AUTOMATION ? 'YES' : 'NO'}`);
    console.log(`Dry-Run Default:     ${DRY_RUN_DEFAULT ? 'YES' : 'NO'}`);
    console.log(`Available Schedules: ${BACKGROUND_SCHEDULES.length}`);
    console.log(`Enabled Schedules:   ${BACKGROUND_SCHEDULES.filter(s => s.enabled).length}`);
    console.log(`Latest Log:          ${latestLogStr}`);
    console.log(`Latest Run Summary:  ${latestRunStr}`);
    console.log(`-----------------------------------------`);
    console.log(`Next Recommended Action:`);
    console.log(`  👉 ${nextAction}`);
    console.log("=========================================");
  }
}

main();
