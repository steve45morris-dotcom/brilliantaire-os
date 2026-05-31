import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadState,
  saveState,
  calculateNextRun,
  logToHistory,
  generateStatusMd,
  generateReports,
  executeRoutineCommand,
  APPROVED_ROUTINES,
  ApprovedRoutine,
  Schedule,
  SchedulerState
} from '../src/scheduler_layer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  return new Date().toISOString().split('T')[0];
}

async function handleList() {
  const state = loadState();
  console.log("=========================================");
  console.log("⏰ REGISTERED BACKGROUND SCHEDULES");
  console.log("=========================================");
  state.schedules.forEach(s => {
    console.log(`- **Schedule:** "${s.name}"`);
    console.log(`  Routine:   ${s.routine}`);
    console.log(`  Frequency: ${s.frequency} (${s.cronExpression})`);
    console.log(`  Status:    ${s.status.toUpperCase()}`);
    console.log(`  Last Run:  ${s.lastRun || 'Never'}`);
    console.log(`  Next Run:  ${s.nextRun || 'Pending'}`);
    console.log("");
  });
  console.log("=========================================");
}

async function handleCreate(args: string[]) {
  const name = args[1];
  const routine = args[2] as ApprovedRoutine;
  const frequency = args[3] as 'daily' | 'weekly' | 'cron';
  let cronExpression = args.slice(4).join(' ');

  if (!name || !routine || !frequency) {
    console.error("❌ Error: Missing parameters. Usage: create-schedule <name> <routine> <daily|weekly|cron> [cronExpression]");
    process.exit(1);
  }

  if (!APPROVED_ROUTINES.includes(routine)) {
    console.error(`❌ Error: Routine "${routine}" is not approved. Permitted routines: ${APPROVED_ROUTINES.join(', ')}`);
    process.exit(1);
  }

  if (frequency === 'daily') {
    cronExpression = '0 9 * * *';
  } else if (frequency === 'weekly') {
    cronExpression = '0 15 * * 1';
  } else if (frequency === 'cron' && !cronExpression) {
    console.error("❌ Error: Custom cron requires a cron expression (e.g. \"*/5 * * * *\").");
    process.exit(1);
  }

  const state = loadState();
  
  // Check if schedule name already exists
  const existingIdx = state.schedules.findIndex(s => s.name.toLowerCase() === name.toLowerCase().trim());
  
  const newSchedule: Schedule = {
    name: name.trim(),
    routine,
    frequency,
    cronExpression,
    status: 'active',
    lastRun: null,
    nextRun: calculateNextRun(cronExpression)
  };

  if (existingIdx !== -1) {
    // Safety check: append suffix or overwrite warning
    const timestampSuffix = Math.floor(Date.now() / 1000);
    newSchedule.name = `${newSchedule.name}_${timestampSuffix}`;
  }

  state.schedules.push(newSchedule);
  saveState(state);
  generateStatusMd(state);
  
  console.log(`✅ Schedule "${newSchedule.name}" successfully created.`);
}

async function handlePause(name: string) {
  if (!name) {
    console.error("❌ Error: Missing schedule name.");
    process.exit(1);
  }

  const state = loadState();
  const schedule = state.schedules.find(s => s.name.toLowerCase() === name.toLowerCase().trim() || s.routine === name);
  
  if (!schedule) {
    console.error(`❌ Error: Schedule not found matching name/routine: "${name}"`);
    process.exit(1);
  }

  schedule.status = 'paused';
  saveState(state);
  generateStatusMd(state);

  console.log(`⏸️ Schedule "${schedule.name}" is now PAUSED.`);
}

async function handleResume(name: string) {
  if (!name) {
    console.error("❌ Error: Missing schedule name.");
    process.exit(1);
  }

  const state = loadState();
  const schedule = state.schedules.find(s => s.name.toLowerCase() === name.toLowerCase().trim() || s.routine === name);
  
  if (!schedule) {
    console.error(`❌ Error: Schedule not found matching name/routine: "${name}"`);
    process.exit(1);
  }

  schedule.status = 'active';
  schedule.nextRun = calculateNextRun(schedule.cronExpression);
  saveState(state);
  generateStatusMd(state);

  console.log(`▶️ Schedule "${schedule.name}" is now RESUMED.`);
}

async function handleHealth() {
  const state = loadState();
  const avgRuntime = state.health.successfulRuns > 0
    ? Math.round(state.health.totalRuntimeMs / state.health.successfulRuns)
    : 0;

  console.log("=========================================");
  console.log("🛰️ BACKGROUND SCHEDULER HEALTH MONITOR");
  console.log("=========================================");
  console.log(`- **Successful Runs**: ${state.health.successfulRuns}`);
  console.log(`- **Failed Runs**:     ${state.health.failedRuns}`);
  console.log(`- **Skipped Runs**:    ${state.health.skippedRuns}`);
  console.log(`- **Average Runtime**: ${avgRuntime}ms`);
  console.log(`- **Runs Today**:      ${state.todayRunsCount} / 5`);
  console.log(`- **Concurrency**:     ${state.concurrentExecutionState}`);
  console.log("=========================================");
}

async function handleReport() {
  const state = loadState();
  generateReports(state);
}

async function handleTick() {
  console.log("⏱️ Checking scheduler triggers (Tick)...");
  const state = loadState();
  const today = getFormattedDate();

  // Reset daily limit count if date shifted
  if (state.lastRunsResetDate !== today) {
    state.todayRunsCount = 0;
    state.lastRunsResetDate = today;
  }

  const now = new Date();
  let executedAny = false;

  for (const s of state.schedules) {
    if (s.status !== 'active') continue;

    // Check if trigger time is reached
    const triggerTime = s.nextRun ? new Date(s.nextRun) : null;
    if (triggerTime && triggerTime <= now) {
      console.log(`🔔 Schedule "${s.name}" is due for execution.`);

      // Check Execution Limit: Max 5 runs per day
      if (state.todayRunsCount >= 5) {
        console.warn("⚠️ Warning: Daily schedule run limit (5) reached. Skipping run.");
        state.health.skippedRuns++;
        logToHistory(s.routine, 'SKIPPED_LIMIT_EXCEEDED', 0, 1);
        s.nextRun = calculateNextRun(s.cronExpression);
        saveState(state);
        continue;
      }

      // Check Execution Limit: Concurrency Max 1
      if (state.concurrentExecutionState === 'Running') {
        console.warn("⚠️ Warning: Concurrency lock active. Queueing routine for next cycle.");
        state.health.skippedRuns++;
        logToHistory(s.routine, 'SKIPPED_CONCURRENT_LOCK', 0, 1);
        s.nextRun = calculateNextRun(s.cronExpression);
        saveState(state);
        continue;
      }

      // Execute routine
      state.concurrentExecutionState = 'Running';
      saveState(state);

      const startTime = Date.now();
      const exitCode = await executeRoutineCommand(s.routine);
      const duration = Date.now() - startTime;

      state.concurrentExecutionState = 'Idle';
      state.todayRunsCount++;

      const success = exitCode === 0;
      if (success) {
        state.health.successfulRuns++;
      } else {
        state.health.failedRuns++;
      }

      s.lastRun = now.toISOString();
      s.nextRun = calculateNextRun(s.cronExpression);
      saveState(state);

      const statusString = success ? 'SUCCESS' : 'FAILED';
      logToHistory(s.routine, statusString, duration, exitCode);
      executedAny = true;
    }
  }

  if (executedAny) {
    generateStatusMd(state);
  } else {
    console.log("💤 No schedules due for trigger.");
  }
}

async function main() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'list-schedules':
    case 'list':
      await handleList();
      break;
    case 'create-schedule':
    case 'create':
      await handleCreate(args);
      break;
    case 'pause-schedule':
    case 'pause':
      await handlePause(args[1]);
      break;
    case 'resume-schedule':
    case 'resume':
      await handleResume(args[1]);
      break;
    case 'scheduler-health':
    case 'health':
      await handleHealth();
      break;
    case 'scheduler-report':
    case 'report':
      await handleReport();
      break;
    case 'tick':
      await handleTick();
      break;
    default:
      console.log("=========================================");
      console.log("🛰️ BACKGROUND SCHEDULER CLI");
      console.log("=========================================");
      console.log("Usage: npm run scheduler -- <command> [arguments]");
      console.log("\nCommands:");
      console.log("  list-schedules");
      console.log("  create-schedule <name> <routine> <daily|weekly|cron> [cronExpression]");
      console.log("  pause-schedule <name>");
      console.log("  resume-schedule <name>");
      console.log("  scheduler-health");
      console.log("  scheduler-report");
      console.log("  tick");
      console.log("=========================================");
  }
}

main();
