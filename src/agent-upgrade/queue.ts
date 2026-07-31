import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BackgroundJob, JobType } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const STATE_PATH = path.join(REPO_ROOT, 'outputs', 'background_queue.json');

// Helper to calculate mock next run dates based on interval or schedule patterns
function getNextRun(schedule: string): string {
  const now = new Date();
  if (schedule.startsWith('interval:')) {
    const minutes = parseInt(schedule.split(':')[1], 10) || 5;
    now.setMinutes(now.getMinutes() + minutes);
  } else {
    // Default mock cron mapping: +1 hour for hourly, +1 day for daily, etc.
    now.setHours(now.getHours() + 1);
  }
  return now.toISOString();
}

const DEFAULT_JOBS: BackgroundJob[] = [
  {
    id: 'job-01',
    name: 'GitHub Monitoring Scan',
    type: 'git_monitoring',
    schedule: 'interval:60', // Every 60 minutes
    status: 'queued',
    retries: 0,
    maxRetries: 3,
    failureLogs: [],
    payload: { repoUrl: 'https://github.com/steve45morris-dotcom/brilliantaire-os' },
    nextRun: getNextRun('interval:60')
  },
  {
    id: 'job-02',
    name: 'Overnight Trend Scanner',
    type: 'trend_monitoring',
    schedule: '0 2 * * *', // Daily at 2 AM
    status: 'queued',
    retries: 0,
    maxRetries: 2,
    failureLogs: [],
    payload: { niche: 'AI Agent Architecture models' },
    nextRun: getNextRun('0 2 * * *')
  },
  {
    id: 'job-03',
    name: 'Content Pipeline Check',
    type: 'content_check',
    schedule: 'interval:1440', // Daily
    status: 'waiting_approval', // Requires human approval before dispatch
    retries: 0,
    maxRetries: 3,
    failureLogs: [],
    payload: { draftCountThreshold: 5, autoPublish: true },
    nextRun: getNextRun('interval:1440')
  }
];

export class BackgroundQueueManager {
  constructor() {
    this.ensureState();
  }

  private ensureState() {
    if (!fs.existsSync(STATE_PATH)) {
      const parentDir = path.dirname(STATE_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_JOBS, null, 2), 'utf-8');
    }
  }

  loadJobs(): BackgroundJob[] {
    try {
      this.ensureState();
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    } catch (e) {
      console.error(`[Queue Error] Failed to read queue state: ${(e as Error).message}`);
      return [];
    }
  }

  saveJobs(jobs: BackgroundJob[]) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
  }

  // Create job
  createJob(name: string, type: JobType, schedule: string, payload: Record<string, any>, maxRetries = 3): BackgroundJob {
    const jobs = this.loadJobs();
    
    // Check if job requires human approval before queuing
    const requiresApproval = 
      payload.autoPublish === true || 
      payload.externalAction === true || 
      type === 'content_check';

    const newJob: BackgroundJob = {
      id: `job-${Date.now()}`,
      name,
      type,
      schedule,
      status: requiresApproval ? 'waiting_approval' : 'queued',
      retries: 0,
      maxRetries,
      failureLogs: [],
      payload,
      nextRun: getNextRun(schedule)
    };

    jobs.push(newJob);
    this.saveJobs(jobs);
    return newJob;
  }

  // List jobs
  listJobs(): BackgroundJob[] {
    return this.loadJobs();
  }

  // Approve job waiting in gate
  approveJob(jobId: string): boolean {
    const jobs = this.loadJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return false;

    if (job.status !== 'waiting_approval') {
      console.warn(`[Queue] Job ${jobId} is not in waiting_approval state. Current state: ${job.status}`);
      return false;
    }

    job.status = 'queued';
    this.saveJobs(jobs);
    return true;
  }

  // Process a specific job
  processJob(jobId: string): { success: boolean; log: string } {
    const jobs = this.loadJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, log: 'Job not found.' };

    if (job.status === 'waiting_approval') {
      return { success: false, log: 'Job requires human approval gate check. Aborting processing.' };
    }

    job.status = 'running';
    job.lastRun = new Date().toISOString();
    this.saveJobs(jobs);

    let success = true;
    let logMsg = 'Job executed successfully.';

    try {
      // Mock execution mapping
      if (job.type === 'git_monitoring') {
        // Mock boundary and pr scan
        logMsg = `Scanned ${job.payload.repoUrl || 'repo'}. Zero boundary violations found. Packages auditted successfully.`;
      } else if (job.type === 'trend_monitoring') {
        logMsg = `Scanned trends for query "${job.payload.niche || 'agent'}". Identified opportunity signals.`;
      } else if (job.type === 'content_check') {
        logMsg = `Content pipeline scan complete. ${job.payload.draftCountThreshold || 0} drafts checked.`;
      } else {
        logMsg = `Executed background loop for task ${job.name}.`;
      }

      job.status = 'completed';
      job.result = { message: logMsg, timestamp: new Date().toISOString() };
    } catch (e) {
      success = false;
      const errorMsg = (e as Error).message;
      logMsg = `Execution failure: ${errorMsg}`;
      
      job.retries += 1;
      job.failureLogs.push(`${new Date().toISOString()}: ${errorMsg}`);

      if (job.retries >= job.maxRetries) {
        job.status = 'failed';
      } else {
        job.status = 'queued'; // Stage for retry
      }
    }

    job.nextRun = getNextRun(job.schedule);
    this.saveJobs(jobs);

    return { success, log: logMsg };
  }

  // Run all queued jobs
  runPendingJobs(): string[] {
    const jobs = this.loadJobs();
    const logs: string[] = [];

    jobs.forEach((job) => {
      if (job.status === 'queued') {
        const result = this.processJob(job.id);
        logs.push(`Job [${job.id}] "${job.name}": ${result.success ? 'Success' : 'Fail'} - ${result.log}`);
      }
    });

    return logs;
  }
}
