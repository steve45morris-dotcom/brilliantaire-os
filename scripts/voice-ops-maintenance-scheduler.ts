import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  HEALTH_REPORTS_DIR,
  FREEZE_SNAPSHOT_DIR,
  RELEASE_CLOSURE_REPORTS_DIR,
  ARCHIVE_RETENTION_DIR,
  DASHBOARD_DIST_DIR,
  DASHBOARD_TELEMETRY_DIR,
  MAINTENANCE_ROOT,
  MAINTENANCE_QUEUE_DIR,
  MAINTENANCE_APPROVED_DIR,
  MAINTENANCE_REJECTED_DIR,
  MAINTENANCE_COMPLETED_DIR,
  MAINTENANCE_LOGS_DIR,
  MAINTENANCE_REPORTS_DIR,
  SYSTEM_STATUS_PATH,
  PROJECTS_PATH,
  NEXT_ACTIONS_PATH,
  COMMANDS_DOC_PATH,
  PACKAGE_JSON_PATH,
  TASKFILE_PATH,
  COMMANDS_CONFIG_PATH,
  DEFAULT_CADENCE,
  DEFAULT_MAINTENANCE_LABEL,
  MAX_QUEUED_JOBS,
  AUTO_RUN_JOBS,
  AUTO_REPAIR,
  AUTO_RESTORE,
  AUTO_DELETE,
  AUTO_UPLOAD,
  AUTO_PUBLISH,
  MANUAL_APPROVAL_REQUIRED,
  DUPLICATE_MAINTENANCE_JOB_PROTECTION,
  READONLY_DASHBOARD_MODE
} from '../config/voice-ops-maintenance-scheduler.config.js';

// Ensure directories exist
const dirs = [
  MAINTENANCE_ROOT,
  MAINTENANCE_QUEUE_DIR,
  MAINTENANCE_APPROVED_DIR,
  MAINTENANCE_REJECTED_DIR,
  MAINTENANCE_COMPLETED_DIR,
  MAINTENANCE_LOGS_DIR,
  MAINTENANCE_REPORTS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(MAINTENANCE_LOGS_DIR, 'voice_ops_maintenance_scheduler.log');
const SNAPSHOT_JSON_FILE = path.join(MAINTENANCE_ROOT, 'dashboard_maintenance_snapshot.json');

function logEvent(event: string, details: string) {
  const timestamp = new Date().toISOString();
  // Write to log file formatted
  const logEntry = `[${timestamp}] EVENT: ${event} | DETAILS: ${details}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_maintenance_scheduler', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

// Find latest file matching prefix in a directory
function getLatestFile(dir: string, prefix: string, extension = '.md'): string {
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith(extension)).sort();
  if (files.length === 0) return '';
  return path.join(dir, files[files.length - 1]);
}

interface MaintenanceJob {
  jobId: string;
  type: string;
  cadence: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedCommands: string[];
  requiredManualSteps: string[];
  approvedBy: string;
  decisionNote: string;
  approvedAt: string;
  completedBy: string;
  completionNote: string;
  completedAt: string;
}

// Locate a job file across all folders
function locateJob(jobId: string): { dir: string; path: string; data: MaintenanceJob } | null {
  const searchDirs = [
    { name: 'pending', dir: MAINTENANCE_QUEUE_DIR },
    { name: 'approved', dir: MAINTENANCE_APPROVED_DIR },
    { name: 'rejected', dir: MAINTENANCE_REJECTED_DIR },
    { name: 'completed', dir: MAINTENANCE_COMPLETED_DIR }
  ];
  for (const d of searchDirs) {
    const jsonPath = path.join(d.dir, `${jobId}.json`);
    if (fs.existsSync(jsonPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as MaintenanceJob;
        return { dir: d.dir, path: jsonPath, data };
      } catch (e) {
        // Ignored
      }
    }
  }
  return null;
}

// Get all jobs across all states
function getAllJobs(): MaintenanceJob[] {
  const jobs: MaintenanceJob[] = [];
  const searchDirs = [
    MAINTENANCE_QUEUE_DIR,
    MAINTENANCE_APPROVED_DIR,
    MAINTENANCE_REJECTED_DIR,
    MAINTENANCE_COMPLETED_DIR
  ];
  searchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as MaintenanceJob;
            jobs.push(data);
          } catch (e) {
            // Ignore corrupted json
          }
        }
      });
    }
  });
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Check for duplicate jobs of type created on the current date
function checkDuplicate(type: string): boolean {
  if (!DUPLICATE_MAINTENANCE_JOB_PROTECTION) return false;
  const todayDate = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const jobs = getAllJobs();
  return jobs.some(j => j.type === type && j.createdAt.startsWith(todayDate));
}

// Read the latest health report to determine the health verdict
function getLatestHealthVerdict(): string {
  const latestReport = getLatestFile(HEALTH_REPORTS_DIR, 'health_report_', '.md');
  if (latestReport && fs.existsSync(latestReport)) {
    const content = fs.readFileSync(latestReport, 'utf-8');
    const verdictMatch = content.match(/Overall Health Verdict: \*\*(.*?)\*\*/);
    if (verdictMatch) return verdictMatch[1];
  }
  return 'Unknown / Degraded (Modified)';
}

// Serialize telemetry snapshot for Vite dashboard integration
function exportDashboardTelemetry() {
  const jobs = getAllJobs();
  const latestVerdict = getLatestHealthVerdict();
  const latestJob = jobs[0] || null;

  const snapshot = {
    timestamp: new Date().toISOString(),
    pendingCount: jobs.filter(j => j.status === 'pending').length,
    approvedCount: jobs.filter(j => j.status === 'approved').length,
    completedCount: jobs.filter(j => j.status === 'completed').length,
    latestJobId: latestJob ? latestJob.jobId : 'None',
    latestJobType: latestJob ? latestJob.type : 'None',
    latestHealthVerdict: latestVerdict,
    duplicateProtection: DUPLICATE_MAINTENANCE_JOB_PROTECTION,
    autoRunJobs: AUTO_RUN_JOBS,
    autoRepair: AUTO_REPAIR,
    autoRestore: AUTO_RESTORE,
    autoDelete: AUTO_DELETE,
    autoUpload: AUTO_UPLOAD,
    autoPublish: AUTO_PUBLISH,
    manualApprovalRequired: MANUAL_APPROVAL_REQUIRED,
    readonlyDashboardMode: READONLY_DASHBOARD_MODE,
    jobs: jobs.map(j => ({
      jobId: j.jobId,
      type: j.type,
      status: j.status,
      createdAt: j.createdAt,
      completedBy: j.completedBy,
      completedAt: j.completedAt
    }))
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Copy snapshot to Vite public directory if it exists
  if (fs.existsSync(DASHBOARD_TELEMETRY_DIR)) {
    const publicPath = path.join(DASHBOARD_TELEMETRY_DIR, 'dashboard_maintenance_snapshot.json');
    fs.writeFileSync(publicPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }
}

// Write markdown job file
function writeJobMarkdownFile(jobDir: string, job: MaintenanceJob) {
  const mdPath = path.join(jobDir, `${job.jobId}.md`);
  const stepsMd = job.requiredManualSteps.map(s => `- [ ] ${s}`).join('\n');
  const commandsMd = job.recommendedCommands.join('\n');
  
  const content = fillTemplate('voice-ops-maintenance-job-template.md', {
    JOB_ID: job.jobId,
    TYPE: job.type,
    CADENCE: job.cadence,
    CREATED_AT: job.createdAt,
    STATUS: job.status.toUpperCase(),
    RISK_LEVEL: job.riskLevel.toUpperCase(),
    RECOMMENDED_COMMANDS: commandsMd,
    REQUIRED_MANUAL_STEPS: stepsMd,
    APPROVED_BY: job.approvedBy || 'None',
    DECISION_NOTE: job.decisionNote || 'None',
    COMPLETED_BY: job.completedBy || 'None',
    COMPLETION_NOTE: job.completionNote || 'None',
    COMPLETED_AT: job.completedAt || 'None'
  });
  
  fs.writeFileSync(mdPath, content, 'utf-8');
}

// 1. status
function handleStatus() {
  const jobs = getAllJobs();
  const pending = jobs.filter(j => j.status === 'pending');
  const approved = jobs.filter(j => j.status === 'approved');
  const completed = jobs.filter(j => j.status === 'completed');
  const latestJob = jobs[0] || null;
  const verdict = getLatestHealthVerdict();

  const content = fillTemplate('voice-ops-maintenance-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    QUEUE_DIR: path.relative(process.cwd(), MAINTENANCE_QUEUE_DIR),
    APPROVED_DIR: path.relative(process.cwd(), MAINTENANCE_APPROVED_DIR),
    REJECTED_DIR: path.relative(process.cwd(), MAINTENANCE_REJECTED_DIR),
    COMPLETED_DIR: path.relative(process.cwd(), MAINTENANCE_COMPLETED_DIR),
    LOGS_DIR: path.relative(process.cwd(), MAINTENANCE_LOGS_DIR),
    REPORTS_DIR: path.relative(process.cwd(), MAINTENANCE_REPORTS_DIR),
    AUTO_RUN_JOBS: String(AUTO_RUN_JOBS),
    AUTO_REPAIR: String(AUTO_REPAIR),
    AUTO_RESTORE: String(AUTO_RESTORE),
    AUTO_DELETE: String(AUTO_DELETE),
    AUTO_UPLOAD: String(AUTO_UPLOAD),
    AUTO_PUBLISH: String(AUTO_PUBLISH),
    MANUAL_APPROVAL_REQUIRED: String(MANUAL_APPROVAL_REQUIRED),
    DUPLICATE_PROTECTION: String(DUPLICATE_MAINTENANCE_JOB_PROTECTION),
    READONLY_DASHBOARD_MODE: String(READONLY_DASHBOARD_MODE),
    PENDING_COUNT: String(pending.length),
    APPROVED_COUNT: String(approved.length),
    COMPLETED_COUNT: String(completed.length),
    LATEST_JOB_ID: latestJob ? latestJob.jobId : 'None',
    LATEST_JOB_TYPE: latestJob ? latestJob.type : 'None',
    LATEST_HEALTH_VERDICT: verdict
  });

  console.log(content);
}

// Create job template generator
function createJob(type: string, cadence: string, risk: 'low' | 'medium' | 'high', commands: string[], steps: string[]) {
  if (checkDuplicate(type)) {
    console.log(`❌ Blocked: A maintenance job of type "${type}" has already been created for today.`);
    process.exit(0);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const jobId = `job_${timestamp}_${type}`;
  const createdAt = new Date().toISOString();

  const job: MaintenanceJob = {
    jobId,
    type,
    cadence,
    status: 'pending',
    createdAt,
    riskLevel: risk,
    recommendedCommands: commands,
    requiredManualSteps: steps,
    approvedBy: '',
    decisionNote: '',
    approvedAt: '',
    completedBy: '',
    completionNote: '',
    completedAt: ''
  };

  const jsonPath = path.join(MAINTENANCE_QUEUE_DIR, `${jobId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(job, null, 2), 'utf-8');
  writeJobMarkdownFile(MAINTENANCE_QUEUE_DIR, job);

  logEvent('JOB_CREATED', `Staged ${type} job: ${jobId}`);
  exportDashboardTelemetry();

  console.log(`✅ Staged maintenance job successfully: ${jobId}`);
  console.log(`   Path: ${path.relative(process.cwd(), jsonPath.replace('.json', '.md'))}`);
}

// 2. create-weekly
function handleCreateWeekly() {
  const commands = [
    'npm run voice-ops-post-freeze-health -- "run-health-check"',
    'npm run voice-ops-post-freeze-health -- "drift-report"',
    'npm run delivery-archive-retention -- "status"'
  ];
  const steps = [
    'Review latest post-freeze health report.',
    'Review drift report.',
    'Confirm safety posture remains healthy.',
    'Confirm exact-name command routing is active.',
    'Confirm fuzzy aliases remain blocked.',
    'Confirm dashboard telemetry is current.',
    'Confirm dashboard build can be regenerated manually.',
    'Confirm archive retention review status.',
    'Confirm freeze snapshot manifest exists.',
    'Confirm recovery checklist exists.',
    'Record signer and note.'
  ];
  createJob('weekly', 'weekly', 'medium', commands, steps);
}

// 3. create-daily
function handleCreateDaily() {
  const commands = [
    'npm run voice-ops-post-freeze-health -- "status"'
  ];
  const steps = [
    'Confirm latest health report exists.',
    'Confirm dashboard telemetry exists.',
    'Confirm no auto-execute flags are enabled.',
    'Confirm no cloud/upload/publish flags are enabled.',
    'Confirm no critical blockers are present.',
    'Record signer and note.'
  ];
  createJob('daily', 'daily', 'low', commands, steps);
}

// 4. create-health-check
function handleCreateHealthCheck() {
  const commands = [
    'npm run voice-ops-post-freeze-health -- "run-health-check"'
  ];
  const steps = [
    'Verify all codebase checksums match freeze manifest.',
    'Scan freeze tags and recovery checklist existence.',
    'Verify command registry routing exact-name config.',
    'Ensure no unauthorized modifications are reported.'
  ];
  createJob('health-check', 'adhoc', 'medium', commands, steps);
}

// 5. create-dashboard-refresh
function handleCreateDashboardRefresh() {
  const commands = [
    'npm run dashboard:export',
    'npm run dashboard:build'
  ];
  const steps = [
    'Verify local telemetry export outputs correctly.',
    'Rebuild single-page Vite dashboard bundle.',
    'Confirm dashboard.html updates reflect status.'
  ];
  createJob('dashboard-refresh', 'adhoc', 'low', commands, steps);
}

// 6. create-retention-review
function handleCreateRetentionReview() {
  const commands = [
    'npm run delivery-archive-retention -- "retention-review"'
  ];
  const steps = [
    'Inspect delivery archives audit ledger.',
    'Verify hashes of all delivery packages.',
    'Identify and list expired packages exceeding retention policy.'
  ];
  createJob('retention-review', 'adhoc', 'medium', commands, steps);
}

// 7. create-drift-review
function handleCreateDriftReview() {
  const commands = [
    'npm run voice-ops-post-freeze-health -- "drift-report"'
  ];
  const steps = [
    'Analyze drift modifications in public directory assets.',
    'Verify index.html and dashboard-data.json are the only mutated items.',
    'Confirm no command router changes exist.'
  ];
  createJob('drift-review', 'adhoc', 'low', commands, steps);
}

// 8. list-queue
function handleListQueue() {
  const jobs = getAllJobs();
  if (jobs.length === 0) {
    console.log('No maintenance jobs found in queue.');
    return;
  }

  console.log(`\n📋 MAINTENANCE MODE SCHEDULER QUEUE`);
  console.log('================================================================================');
  console.log(`${'JOB ID'.padEnd(32)} | ${'TYPE'.padEnd(20)} | ${'STATUS'.padEnd(10)} | ${'CREATED AT'}`);
  console.log('--------------------------------------------------------------------------------');
  jobs.forEach(j => {
    console.log(`${j.jobId.padEnd(32)} | ${j.type.padEnd(20)} | ${j.status.padEnd(10)} | ${j.createdAt}`);
  });
  console.log('================================================================================\n');
}

// 9. inspect
function handleInspect(jobId: string) {
  const found = locateJob(jobId);
  if (!found) {
    console.error(`❌ Error: Job ID "${jobId}" not found in any queue folder.`);
    process.exit(1);
  }

  const stepsMd = found.data.requiredManualSteps.map(s => `- [ ] ${s}`).join('\n');
  const commandsMd = found.data.recommendedCommands.join('\n');

  const content = fillTemplate('voice-ops-maintenance-inspect-template.md', {
    JOB_ID: found.data.jobId,
    TYPE: found.data.type,
    CADENCE: found.data.cadence,
    STATUS: found.data.status.toUpperCase(),
    CREATED_AT: found.data.createdAt,
    RISK_LEVEL: found.data.riskLevel.toUpperCase(),
    RECOMMENDED_COMMANDS: commandsMd,
    REQUIRED_MANUAL_STEPS: stepsMd,
    SAFETY_BOUNDARY: 'Strict Manual-First Isolation Gate. DO NOT auto-execute.'
  });

  console.log(content);
}

// 10. approve
function handleApprove(jobId: string) {
  const found = locateJob(jobId);
  if (!found) {
    console.error(`❌ Error: Job ID "${jobId}" not found.`);
    process.exit(1);
  }

  if (found.data.status !== 'pending') {
    console.error(`❌ Error: Job status is currently "${found.data.status}". Only pending jobs can be approved.`);
    process.exit(1);
  }

  // Update details
  found.data.status = 'approved';
  found.data.approvedBy = 'system-operator';
  found.data.approvedAt = new Date().toISOString();
  found.data.decisionNote = 'Approved for manual execution only.';

  const newJsonPath = path.join(MAINTENANCE_APPROVED_DIR, `${jobId}.json`);
  fs.writeFileSync(newJsonPath, JSON.stringify(found.data, null, 2), 'utf-8');
  writeJobMarkdownFile(MAINTENANCE_APPROVED_DIR, found.data);

  // Clean old files
  if (fs.existsSync(found.path)) fs.unlinkSync(found.path);
  const oldMdPath = found.path.replace('.json', '.md');
  if (fs.existsSync(oldMdPath)) fs.unlinkSync(oldMdPath);

  logEvent('JOB_APPROVED', `Job ${jobId} approved by system-operator`);
  exportDashboardTelemetry();

  console.log(`✅ Approved job "${jobId}" for manual execution.`);
}

// 11. reject
function handleReject(jobId: string) {
  const found = locateJob(jobId);
  if (!found) {
    console.error(`❌ Error: Job ID "${jobId}" not found.`);
    process.exit(1);
  }

  if (found.data.status !== 'pending' && found.data.status !== 'approved') {
    console.error(`❌ Error: Job status is currently "${found.data.status}". Only pending or approved jobs can be rejected.`);
    process.exit(1);
  }

  // Update details
  found.data.status = 'rejected';
  found.data.approvedBy = 'system-operator';
  found.data.approvedAt = new Date().toISOString();
  found.data.decisionNote = 'Rejected by operator decision.';

  const newJsonPath = path.join(MAINTENANCE_REJECTED_DIR, `${jobId}.json`);
  fs.writeFileSync(newJsonPath, JSON.stringify(found.data, null, 2), 'utf-8');
  writeJobMarkdownFile(MAINTENANCE_REJECTED_DIR, found.data);

  // Clean old files
  if (fs.existsSync(found.path)) fs.unlinkSync(found.path);
  const oldMdPath = found.path.replace('.json', '.md');
  if (fs.existsSync(oldMdPath)) fs.unlinkSync(oldMdPath);

  logEvent('JOB_REJECTED', `Job ${jobId} rejected by operator`);
  exportDashboardTelemetry();

  console.log(`✅ Rejected job "${jobId}". Stored in rejected archive.`);
}

// 12. mark-complete
function handleMarkComplete(jobId: string, signer: string, note: string) {
  if (!signer || !note) {
    console.error('❌ Error: Both --signer "<NAME>" and --note "<NOTE>" options are required.');
    process.exit(1);
  }

  const found = locateJob(jobId);
  if (!found) {
    console.error(`❌ Error: Job ID "${jobId}" not found.`);
    process.exit(1);
  }

  if (found.data.status === 'completed') {
    console.log(`ℹ️ Job "${jobId}" is already completed.`);
    process.exit(0);
  }

  if (found.data.status === 'rejected') {
    console.error(`❌ Error: Rejected jobs cannot be marked complete.`);
    process.exit(1);
  }

  if (found.data.status !== 'approved') {
    console.error(`❌ Error: Job must be approved before completion. Current status is: "${found.data.status}".`);
    process.exit(1);
  }

  // Update details
  found.data.status = 'completed';
  found.data.completedBy = signer;
  found.data.completionNote = note;
  found.data.completedAt = new Date().toISOString();

  const newJsonPath = path.join(MAINTENANCE_COMPLETED_DIR, `${jobId}.json`);
  fs.writeFileSync(newJsonPath, JSON.stringify(found.data, null, 2), 'utf-8');
  
  // Fill completion receipt markdown file
  const stepsCompletedMd = found.data.requiredManualSteps.map(s => `- [x] ${s}`).join('\n');
  const completionContent = fillTemplate('voice-ops-maintenance-completion-template.md', {
    JOB_ID: found.data.jobId,
    TYPE: found.data.type,
    COMPLETED_AT: found.data.completedAt,
    SIGNER: signer,
    NOTE: note,
    STEPS_COMPLETED: stepsCompletedMd
  });
  
  const newMdPath = path.join(MAINTENANCE_COMPLETED_DIR, `${jobId}.md`);
  fs.writeFileSync(newMdPath, completionContent, 'utf-8');

  // Clean old files
  if (fs.existsSync(found.path)) fs.unlinkSync(found.path);
  const oldMdPath = found.path.replace('.json', '.md');
  if (fs.existsSync(oldMdPath)) fs.unlinkSync(oldMdPath);

  logEvent('JOB_COMPLETED', `Job ${jobId} signed off by ${signer}`);
  exportDashboardTelemetry();

  console.log(`✅ Completed job "${jobId}" signed off by "${signer}".`);
}

// 13. maintenance-summary
function handleMaintenanceSummary() {
  const jobs = getAllJobs();
  const timestamp = new Date().toISOString();

  const formatList = (stateJobs: MaintenanceJob[]) => {
    if (stateJobs.length === 0) return '_None_';
    return stateJobs.map(j => {
      let extra = '';
      if (j.status === 'completed') extra = ` (Signed by: ${j.completedBy})`;
      return `- **${j.jobId}** [${j.type}] - ${j.createdAt}${extra}`;
    }).join('\n');
  };

  const pending = jobs.filter(j => j.status === 'pending');
  const approved = jobs.filter(j => j.status === 'approved');
  const rejected = jobs.filter(j => j.status === 'rejected');
  const completed = jobs.filter(j => j.status === 'completed');

  const content = fillTemplate('voice-ops-maintenance-summary-template.md', {
    TIMESTAMP: timestamp,
    PENDING_JOBS_LIST: formatList(pending),
    APPROVED_JOBS_LIST: formatList(approved),
    REJECTED_JOBS_LIST: formatList(rejected),
    COMPLETED_JOBS_LIST: formatList(completed)
  });

  const fileName = `maintenance_summary_${Math.floor(Date.now() / 1000)}.md`;
  const reportPath = path.join(MAINTENANCE_REPORTS_DIR, fileName);
  fs.writeFileSync(reportPath, content, 'utf-8');

  console.log(content);
  console.log(`\n📝 Summary report saved to: ${path.relative(process.cwd(), reportPath)}`);
}

// 14. latest
function handleLatest() {
  const jobs = getAllJobs();
  if (jobs.length === 0) {
    console.log('No maintenance jobs exist.');
    return;
  }
  const latest = jobs[0];
  const found = locateJob(latest.jobId);
  if (found) {
    const mdPath = found.path.replace('.json', '.md');
    if (fs.existsSync(mdPath)) {
      console.log(fs.readFileSync(mdPath, 'utf-8'));
    } else {
      console.log(JSON.stringify(found.data, null, 2));
    }
  }
}

// 15. scheduler-log
function handleSchedulerLog() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No scheduler events logged yet.');
    return;
  }
  const logs = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const last20 = logs.slice(-20);
  console.log(`\n📋 Recent Scheduler Activities (${last20.length} events):`);
  console.log('================================================================================');
  console.log(last20.join('\n'));
  console.log('================================================================================\n');
}

let parsedArgs: string[] = [];
function getOptionValue(flag: string): string {
  const idx = parsedArgs.indexOf(flag);
  if (idx !== -1 && idx + 1 < parsedArgs.length) {
    return parsedArgs[idx + 1].replace(/^['"]|['"]$/g, '').trim();
  }
  return '';
}

async function main() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ') && !args[0].startsWith('-')) {
    const match = args[0].match(/--?\w+|"[^"]*"|'[^']*'|[^\s"']+/g);
    if (match) {
      args = match.map(m => m.replace(/^['"]|['"]$/g, ''));
    }
  }
  parsedArgs = args;

  const positionalArgs: string[] = [];
  for (let i = 0; i < parsedArgs.length; i++) {
    if (parsedArgs[i].startsWith('--')) {
      i++;
      continue;
    }
    positionalArgs.push(parsedArgs[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim() : '';
  const jobIdParam = positionalArgs[1] ? positionalArgs[1].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'create-weekly':
      handleCreateWeekly();
      break;
    case 'create-daily':
      handleCreateDaily();
      break;
    case 'create-health-check':
      handleCreateHealthCheck();
      break;
    case 'create-dashboard-refresh':
      handleCreateDashboardRefresh();
      break;
    case 'create-retention-review':
      handleCreateRetentionReview();
      break;
    case 'create-drift-review':
      handleCreateDriftReview();
      break;
    case 'list-queue':
      handleListQueue();
      break;
    case 'inspect':
      if (!jobIdParam) {
        console.error('❌ Error: Missing <JOB_ID> parameter.');
        process.exit(1);
      }
      handleInspect(jobIdParam);
      break;
    case 'approve':
      if (!jobIdParam) {
        console.error('❌ Error: Missing <JOB_ID> parameter.');
        process.exit(1);
      }
      handleApprove(jobIdParam);
      break;
    case 'reject':
      if (!jobIdParam) {
        console.error('❌ Error: Missing <JOB_ID> parameter.');
        process.exit(1);
      }
      handleReject(jobIdParam);
      break;
    case 'mark-complete': {
      if (!jobIdParam) {
        console.error('❌ Error: Missing <JOB_ID> parameter.');
        process.exit(1);
      }
      const signer = getOptionValue('--signer');
      const note = getOptionValue('--note');
      handleMarkComplete(jobIdParam, signer, note);
      break;
    }
    case 'maintenance-summary':
      handleMaintenanceSummary();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'scheduler-log':
      handleSchedulerLog();
      break;
    default:
      console.error(`❌ Error: Unknown scheduler command "${command}".`);
      console.log('💡 Use: npm run voice-ops-maintenance-scheduler-help for menu instructions.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error in scheduler: ${err}`);
  process.exit(1);
});
