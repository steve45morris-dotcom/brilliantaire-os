import { BackgroundQueueManager } from '../src/agent-upgrade/queue.js';

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
  const approveId = params.approve;
  const runPending = params.run === 'true';

  const manager = new BackgroundQueueManager();

  if (approveId) {
    console.log(`Checking human approval for job: ${approveId}...`);
    const approved = manager.approveJob(approveId);
    if (approved) {
      console.log(`✓ Job ${approveId} approved and placed back in queued state.`);
    } else {
      console.error(`✗ Failed to approve job ${approveId}. Confirm that the ID exists and is currently in 'waiting_approval' state.`);
    }
    return;
  }

  // Running pending jobs
  if (runPending) {
    console.log('Processing queued background jobs...');
    const executionLogs = manager.runPendingJobs();
    if (executionLogs.length === 0) {
      console.log('No queued jobs found to run.');
    } else {
      executionLogs.forEach((log) => console.log(`  - ${log}`));
    }
    return;
  }

  // Just listing
  console.log('\n======================================');
  console.log('      BACKGROUND EXECUTION QUEUE      ');
  console.log('======================================');
  const jobs = manager.listJobs();
  if (jobs.length === 0) {
    console.log('No registered background jobs found.');
  } else {
    jobs.forEach((job) => {
      let statusSymbol = '[ ]';
      if (job.status === 'completed') statusSymbol = '[✓]';
      if (job.status === 'failed') statusSymbol = '[✗]';
      if (job.status === 'running') statusSymbol = '[➔]';
      if (job.status === 'waiting_approval') statusSymbol = '[⚠️ Gated]';

      console.log(`${statusSymbol} ID: ${job.id} | Name: "${job.name}"`);
      console.log(`    Type:       ${job.type}`);
      console.log(`    Schedule:   ${job.schedule}`);
      console.log(`    Status:     ${job.status} (Retries: ${job.retries}/${job.maxRetries})`);
      if (job.nextRun) console.log(`    Next Run:   ${job.nextRun}`);
      if (job.result) console.log(`    Result:     ${JSON.stringify(job.result)}`);
      console.log('--------------------------------------');
    });
  }
  console.log('======================================\n');
  console.log('Tip: Run queued jobs with: npm run list-jobs -- --run true');
  console.log('Tip: Approve a gated job with: npm run list-jobs -- --approve [jobId]');
}

main();
