import { BackgroundQueueManager } from '../src/agent-upgrade/queue.js';
import { JobType } from '../src/agent-upgrade/types.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        params[key] = val;
        i++;
      } else {
        params[key] = 'true';
      }
    }
  }
  return params;
}

async function main() {
  const params = parseArgs();
  const name = params.name;
  const type = params.type as JobType;
  const schedule = params.schedule;
  const payloadRaw = params.payload || '{}';

  if (!name || !type || !schedule) {
    console.error('Usage: npm run create-background-job -- --name [job-name] --type [job-type] --schedule [interval-or-cron] --payload [json-string]');
    process.exit(1);
  }

  let payload = {};
  try {
    payload = JSON.parse(payloadRaw);
  } catch (e) {
    console.error(`✗ Payload parsing failed: ${(e as Error).message}. Ensure it is a valid JSON string.`);
    process.exit(1);
  }

  const manager = new BackgroundQueueManager();
  const job = manager.createJob(name, type, schedule, payload);

  console.log(`✓ Job "${job.name}" registered successfully.`);
  console.log(`  ID:            ${job.id}`);
  console.log(`  Status:        ${job.status} ${job.status === 'waiting_approval' ? '(Gated, requires human approval)' : ''}`);
  console.log(`  Schedule:      ${job.schedule}`);
}

main();
