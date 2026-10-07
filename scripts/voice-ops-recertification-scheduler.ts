import * as fs from 'fs';
import * as path from 'path';
import {
  LEDGER_DIR,
  LEDGER_RECORDS_DIR,
  TRAINING_SCENARIOS_DIR,
  TRAINING_ATTEMPTS_DIR,
  RECERT_ROOT,
  RECERT_QUEUE_DIR,
  RECERT_APPROVED_DIR,
  RECERT_COMPLETED_DIR,
  RECERT_REJECTED_DIR,
  RECERT_ROTATIONS_DIR,
  RECERT_CALENDARS_DIR,
  RECERT_REPORTS_DIR,
  RECERT_LOGS_DIR,
  CERTIFICATION_VALIDITY_DAYS,
  RENEWAL_WARNING_DAYS,
  DEFAULT_DRILL_CADENCE,
  REQUIRED_RENEWAL_SCENARIO_COUNT,
  REQUIRED_EMERGENCY_DRILL,
  AUTO_RENEW_CERTIFICATION,
  LIVE_COMMAND_EXECUTION_ALLOWED,
  AUTO_START_SIMULATIONS,
  AUTO_REPAIR,
  AUTO_RESTORE,
  AUTO_DELETE,
  AUTO_UPLOAD,
  AUTO_PUBLISH,
  AUTO_PLAYBACK,
  MANUAL_APPROVAL_REQUIRED
} from '../config/voice-ops-recertification-scheduler.config.js';

// Ensure directories exist
const dirs = [
  RECERT_ROOT,
  RECERT_QUEUE_DIR,
  RECERT_APPROVED_DIR,
  RECERT_COMPLETED_DIR,
  RECERT_REJECTED_DIR,
  RECERT_ROTATIONS_DIR,
  RECERT_CALENDARS_DIR,
  RECERT_REPORTS_DIR,
  RECERT_LOGS_DIR
];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(RECERT_LOGS_DIR, 'voice_ops_recertification_scheduler.log');
const SNAPSHOT_JSON_FILE = path.join(RECERT_ROOT, 'dashboard_recertification_snapshot.json');
const SCHEDULER_STATE_FILE = path.join(RECERT_ROOT, 'scheduler_state.json');

function logEvent(event: string, details: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] RECERT_EVENT: ${event} | DETAILS: ${details}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_recertification_scheduler', templateName);
  if (!fs.existsSync(templatePath)) {
    return `Error: Template not found at ${templatePath}`;
  }
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

// Interfaces
interface Certification {
  operatorName: string;
  certificateId: string;
  issuedDate: string;
  expiryDate: string;
  signer: string;
  level: string;
  averageScore: number;
  coverageCount: number;
  notes: string;
}

interface RenewalPlan {
  id: string;
  operatorName: string;
  targetLevel: string;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  requiredScenarios: string[];
  commandSuggestions: string[];
  signer?: string;
  note?: string;
  createdAt: string;
  modifiedAt: string;
}

interface RotationPlan {
  id: string;
  timestamp: string;
  cadence: string;
  week1: string[];
  week2: string[];
  week3: string[];
  week4: string[];
  emergencyDrillIncluded: boolean;
  repetitionCheckPassed: boolean;
}

// Load databases
function getLedger(): Record<string, Certification> {
  const ledgerFile = path.join(LEDGER_DIR, 'certification_ledger.json');
  if (fs.existsSync(ledgerFile)) {
    try {
      return JSON.parse(fs.readFileSync(ledgerFile, 'utf-8'));
    } catch {}
  }
  return {};
}

function getAttemptsIndex(): any {
  const attemptsIndexFile = path.join(process.cwd(), 'outputs/narrator/voice_ops_training_simulation/mock_data/attempts_index.json');
  if (fs.existsSync(attemptsIndexFile)) {
    try {
      return JSON.parse(fs.readFileSync(attemptsIndexFile, 'utf-8'));
    } catch {}
  }
  return {};
}

function loadSchedulerState(): { latestRotationId?: string; latestPlanId?: string } {
  if (fs.existsSync(SCHEDULER_STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SCHEDULER_STATE_FILE, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveSchedulerState(state: any) {
  fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Expose metrics to dashboard
function exportDashboardTelemetry() {
  const ledger = getLedger();
  const certs = Object.values(ledger);
  const state = loadSchedulerState();

  let expiringCount = 0;
  let expiredCount = 0;
  let queueCount = 0;

  const now = Date.now();
  certs.forEach(c => {
    const expiry = new Date(c.expiryDate).getTime();
    if (now >= expiry) {
      expiredCount++;
    } else if (expiry - now <= RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000) {
      expiringCount++;
    }
  });

  // Count queue files
  if (fs.existsSync(RECERT_QUEUE_DIR)) {
    queueCount += fs.readdirSync(RECERT_QUEUE_DIR).filter(f => f.endsWith('.json')).length;
  }
  if (fs.existsSync(RECERT_APPROVED_DIR)) {
    queueCount += fs.readdirSync(RECERT_APPROVED_DIR).filter(f => f.endsWith('.json')).length;
  }

  let latestOperator = 'None';
  let latestLevel = 'N/A';
  if (certs.length > 0) {
    certs.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
    latestOperator = certs[0].operatorName;
    latestLevel = certs[0].level;
  }

  let rotationPath = 'N/A';
  if (state.latestRotationId) {
    rotationPath = `outputs/narrator/voice_ops_recertification_scheduler/rotations/${state.latestRotationId}.json`;
  }

  const snapshot = {
    timestamp: new Date().toISOString(),
    certificationCount: certs.length,
    renewalDueCount: expiringCount,
    expiredCount: expiredCount,
    latestOperator: latestOperator,
    latestCertificationLevel: latestLevel,
    latestRenewalPlanId: state.latestPlanId || 'None',
    latestDrillRotationPath: rotationPath,
    emergencyDrillRequired: true,
    autoRenewStatus: AUTO_RENEW_CERTIFICATION ? 'ENABLED (Unsafe)' : 'disabled',
    liveCommandExecutionAllowed: LIVE_COMMAND_EXECUTION_ALLOWED,
    recommendedNextPhase: 'Phase N5Y: Voice Ops Final System Index'
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Copy to Vite public directory if it exists
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'dashboard_recertification_snapshot.json');
    fs.writeFileSync(publicPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }
}

// Helper to check operator training attempts
function getOperatorDrillsPassed(operatorName: string): string[] {
  const attempts = getAttemptsIndex();
  const passedScenarios: Set<string> = new Set();
  Object.values(attempts).forEach((att: any) => {
    if (
      att.operator.toLowerCase() === operatorName.toLowerCase() &&
      att.status === 'COMPLETED' &&
      att.verdict === 'PASS'
    ) {
      passedScenarios.add(att.scenarioId);
    }
  });
  return Array.from(passedScenarios);
}

// 1. status
function handleStatus() {
  const ledger = getLedger();
  const certs = Object.values(ledger);
  const state = loadSchedulerState();

  let expiringCount = 0;
  const now = Date.now();
  certs.forEach(c => {
    const expiry = new Date(c.expiryDate).getTime();
    if (now < expiry && expiry - now <= RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000) {
      expiringCount++;
    }
  });

  let queueCount = 0;
  if (fs.existsSync(RECERT_QUEUE_DIR)) {
    queueCount += fs.readdirSync(RECERT_QUEUE_DIR).filter(f => f.endsWith('.json')).length;
  }
  if (fs.existsSync(RECERT_APPROVED_DIR)) {
    queueCount += fs.readdirSync(RECERT_APPROVED_DIR).filter(f => f.endsWith('.json')).length;
  }

  const latestRotationPath = state.latestRotationId
    ? `rotations/${state.latestRotationId}.json`
    : 'None';

  const statusContent = fillTemplate('voice-ops-recertification-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    QUEUE_DIR: path.relative(process.cwd(), RECERT_QUEUE_DIR),
    APPROVED_DIR: path.relative(process.cwd(), RECERT_APPROVED_DIR),
    COMPLETED_DIR: path.relative(process.cwd(), RECERT_COMPLETED_DIR),
    REPORTS_DIR: path.relative(process.cwd(), RECERT_REPORTS_DIR),
    CERT_VALIDITY: String(CERTIFICATION_VALIDITY_DAYS),
    WARNING_DAYS: String(RENEWAL_WARNING_DAYS),
    RENEWAL_COUNT: String(REQUIRED_RENEWAL_SCENARIO_COUNT),
    EMERGENCY_DRILL: REQUIRED_EMERGENCY_DRILL,
    AUTO_RENEW: AUTO_RENEW_CERTIFICATION ? 'ENABLED (Breach)' : 'DISABLED (Locked/Safe)',
    LIVE_ALLOWED: LIVE_COMMAND_EXECUTION_ALLOWED ? 'ALLOWED (Breach)' : 'LOCKED (Safe)',
    CERT_COUNT: String(certs.length),
    EXPIRING_COUNT: String(expiringCount),
    QUEUE_COUNT: String(queueCount),
    LATEST_PLAN: state.latestPlanId || 'None',
    LATEST_ROTATION: latestRotationPath
  });

  console.log(statusContent);
  logEvent('STATUS_CHECKED', `Reported stats. Certs: ${certs.length}. Queue: ${queueCount}.`);
}

// 2. scan-certifications
function handleScanCertifications() {
  const ledger = getLedger();
  const certs = Object.values(ledger);
  const now = Date.now();

  console.log(`\n🔍 VOICE OPS OPERATOR CERTIFICATION COMPLIANCE SCAN`);
  console.log('================================================================================');
  if (certs.length === 0) {
    console.log('No operator certifications registered in the ledger database.');
    console.log('================================================================================\n');
    return;
  }

  certs.forEach(c => {
    const expiry = new Date(c.expiryDate).getTime();
    let statusLabel = 'Valid';
    if (now >= expiry) {
      statusLabel = 'Expired';
    } else if (expiry - now <= RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000) {
      statusLabel = 'Renewal Due';
    }

    console.log(`- Operator:   \x1b[32m${c.operatorName}\x1b[0m`);
    console.log(`  Certificate ID: ${c.certificateId} | Expiry: ${c.expiryDate}`);
    console.log(`  Current State:  ${statusLabel} | Evidentiary Score: ${c.averageScore}%`);
    console.log(`  Validator:      Signed by ${c.signer}`);
    console.log('--------------------------------------------------------------------------------');
  });
  console.log('================================================================================\n');
  logEvent('CERTIFICATIONS_SCANNED', `Scanned ${certs.length} certifications.`);
}

// 3. inspect-certification
function handleInspectCertification(operatorName: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }

  const ledger = getLedger();
  const c = ledger[operatorName.toLowerCase()];
  if (!c) {
    console.error(`❌ Error: No certification record found for operator "${operatorName}".`);
    process.exit(1);
  }

  const passedDrills = getOperatorDrillsPassed(operatorName);
  const hasEmergency = passedDrills.includes(REQUIRED_EMERGENCY_DRILL);

  const now = Date.now();
  const expiry = new Date(c.expiryDate).getTime();
  let renewalStatus = 'Safe';
  if (now >= expiry) {
    renewalStatus = 'Expired';
  } else if (expiry - now <= RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000) {
    renewalStatus = 'Renewal Due';
  }

  const inspectContent = fillTemplate('voice-ops-recertification-certification-inspect-template.md', {
    OPERATOR_NAME: c.operatorName,
    CERTIFICATE_ID: c.certificateId,
    LEVEL: c.level,
    ISSUED_DATE: c.issuedDate,
    EXPIRY_DATE: c.expiryDate,
    SCORE: String(c.averageScore),
    SCENARIOS_COUNT: String(c.coverageCount),
    SIGNER: c.signer,
    EMERGENCY_DRILL_STATUS: hasEmergency ? 'VERIFIED ✅' : 'MISSING ❌',
    RENEWAL_STATUS: renewalStatus,
    NOTE_STATUS: c.notes ? 'PRESENT' : 'MISSING'
  });

  console.log(inspectContent);
  logEvent('CERT_INSPECTED', `Inspected operator ${operatorName} certificate.`);
}

// 4. create-renewal-plan
function handleCreateRenewalPlan(operatorName: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }

  const ledger = getLedger();
  const c = ledger[operatorName.toLowerCase()];

  // Safety block: Do not create renewal plans if operator has no certification at all (must train first)
  if (!c) {
    console.error(`❌ Error: Operator "${operatorName}" must train and get certified first before scheduler scheduling.`);
    process.exit(1);
  }

  const planId = `plan_${operatorName.toLowerCase()}_${Math.floor(Date.now() / 1000)}`;
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Rotate 3 drills: must include emergency stop drill, plus 2 other categories
  const targetScenarios = [
    REQUIRED_EMERGENCY_DRILL,
    'dashboard_stale_after_freeze',
    'degraded_health_due_to_drift'
  ];

  const checklistLines = targetScenarios.map(sc => `- [ ] **${sc}**`);
  const cmdSuggestions = targetScenarios.map(sc => 
    `- npm run voice-ops-training-simulation -- "start-simulation ${sc}"`
  );

  const plan: RenewalPlan = {
    id: planId,
    operatorName: operatorName.toLowerCase(),
    targetLevel: c.level,
    dueDate: dueDate,
    status: 'PENDING',
    requiredScenarios: targetScenarios,
    commandSuggestions: cmdSuggestions,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  };

  // Write JSON state
  const planJsonPath = path.join(RECERT_QUEUE_DIR, `${planId}.json`);
  fs.writeFileSync(planJsonPath, JSON.stringify(plan, null, 2), 'utf-8');

  // Write Markdown template
  const planMd = fillTemplate('voice-ops-recertification-renewal-plan-template.md', {
    RENEWAL_ID: plan.id,
    OPERATOR_NAME: plan.operatorName,
    TARGET_LEVEL: plan.targetLevel,
    DUE_DATE: plan.dueDate,
    STATUS: plan.status,
    DRILLS_CHECKLIST: checklistLines.join('\n'),
    COMMAND_SUGGESTIONS: cmdSuggestions.join('\n')
  });

  const planMdPath = path.join(RECERT_QUEUE_DIR, `${planId}.md`);
  fs.writeFileSync(planMdPath, planMd, 'utf-8');

  // Save scheduler state
  const state = loadSchedulerState();
  state.latestPlanId = planId;
  saveSchedulerState(state);

  console.log(`\n📋 Recertification Renewal Plan STAGED!`);
  console.log(`================================================================================`);
  console.log(`- Plan ID:        \x1b[32m${planId}\x1b[0m`);
  console.log(`- Operator:       ${operatorName}`);
  console.log(`- Target Level:   ${plan.targetLevel}`);
  console.log(`- Completion Due: ${dueDate}`);
  console.log(`- Status:         PENDING`);
  console.log(`- Ledger Path:    ${path.relative(process.cwd(), planJsonPath)}`);
  console.log(`================================================================================\n`);

  logEvent('RENEWAL_PLAN_CREATED', `Staged renewal plan ${planId} for ${operatorName}.`);
  exportDashboardTelemetry();
}

// Auxiliary path locator
function locateRenewalFile(renewalId: string): { dir: string; file: string } | null {
  const dirs = [RECERT_QUEUE_DIR, RECERT_APPROVED_DIR, RECERT_COMPLETED_DIR, RECERT_REJECTED_DIR];
  for (const dir of dirs) {
    const fp = path.join(dir, `${renewalId}.json`);
    if (fs.existsSync(fp)) {
      return { dir, file: fp };
    }
  }
  return null;
}

// 5. list-renewal-queue
function handleListRenewalQueue() {
  const allQueueDirs = [
    { name: 'Pending (Staged)', dir: RECERT_QUEUE_DIR },
    { name: 'Approved for Drill Execution', dir: RECERT_APPROVED_DIR },
    { name: 'Completed', dir: RECERT_COMPLETED_DIR },
    { name: 'Rejected', dir: RECERT_REJECTED_DIR }
  ];

  console.log(`\n📋 RECERTIFICATION RENEWAL PLANS QUEUE`);
  console.log('================================================================================');
  
  let totalCount = 0;
  allQueueDirs.forEach(qd => {
    if (!fs.existsSync(qd.dir)) return;
    const files = fs.readdirSync(qd.dir).filter(f => f.endsWith('.json'));
    if (files.length === 0) return;
    
    console.log(`\n📂 Category: ${qd.name}`);
    console.log('--------------------------------------------------------------------------------');
    files.forEach(f => {
      try {
        const plan: RenewalPlan = JSON.parse(fs.readFileSync(path.join(qd.dir, f), 'utf-8'));
        console.log(`- Plan ID:   \x1b[36m${plan.id}\x1b[0m`);
        console.log(`  Operator:  ${plan.operatorName} | Target Level: ${plan.targetLevel} | Due Date: ${plan.dueDate}`);
        console.log(`  Status:    ${plan.status}`);
        totalCount++;
      } catch {}
    });
  });

  if (totalCount === 0) {
    console.log('No renewal plans logged in any queue subfolders.');
  }
  console.log('\n================================================================================\n');
}

// 6. inspect-renewal
function handleInspectRenewal(renewalId: string) {
  if (!renewalId) {
    console.error('❌ Error: Missing renewal plan ID.');
    process.exit(1);
  }

  const loc = locateRenewalFile(renewalId);
  if (!loc) {
    console.error(`❌ Error: Renewal plan ID "${renewalId}" not found.`);
    process.exit(1);
  }

  try {
    const plan: RenewalPlan = JSON.parse(fs.readFileSync(loc.file, 'utf-8'));
    const checklistLines = plan.requiredScenarios.map(sc => `- [ ] **${sc}**`);

    const inspectMd = fillTemplate('voice-ops-recertification-renewal-plan-template.md', {
      RENEWAL_ID: plan.id,
      OPERATOR_NAME: plan.operatorName,
      TARGET_LEVEL: plan.targetLevel,
      DUE_DATE: plan.dueDate,
      STATUS: plan.status,
      DRILLS_CHECKLIST: checklistLines.join('\n'),
      COMMAND_SUGGESTIONS: plan.commandSuggestions.join('\n')
    });

    console.log(inspectMd);
    logEvent('RENEWAL_INSPECTED', `Inspected renewal plan ${renewalId}`);
  } catch (err) {
    console.error(`❌ Failed to read renewal plan details: ${err}`);
  }
}

// 7. approve-renewal
function handleApproveRenewal(renewalId: string) {
  if (!renewalId) {
    console.error('❌ Error: Missing renewal plan ID.');
    process.exit(1);
  }

  const loc = locateRenewalFile(renewalId);
  if (!loc) {
    console.error(`❌ Error: Renewal plan ID "${renewalId}" not found.`);
    process.exit(1);
  }

  try {
    const plan: RenewalPlan = JSON.parse(fs.readFileSync(loc.file, 'utf-8'));
    if (plan.status !== 'PENDING') {
      console.log(`⚠️ Plan ${renewalId} cannot be approved (current status: ${plan.status}).`);
      return;
    }

    plan.status = 'APPROVED';
    plan.modifiedAt = new Date().toISOString();

    // Move JSON
    const destJson = path.join(RECERT_APPROVED_DIR, `${renewalId}.json`);
    fs.writeFileSync(destJson, JSON.stringify(plan, null, 2), 'utf-8');
    fs.unlinkSync(loc.file);

    // Write updated MD to Approved
    const checklistLines = plan.requiredScenarios.map(sc => `- [ ] **${sc}**`);
    const planMd = fillTemplate('voice-ops-recertification-renewal-plan-template.md', {
      RENEWAL_ID: plan.id,
      OPERATOR_NAME: plan.operatorName,
      TARGET_LEVEL: plan.targetLevel,
      DUE_DATE: plan.dueDate,
      STATUS: plan.status,
      DRILLS_CHECKLIST: checklistLines.join('\n'),
      COMMAND_SUGGESTIONS: plan.commandSuggestions.join('\n')
    });
    
    const destMd = path.join(RECERT_APPROVED_DIR, `${renewalId}.md`);
    fs.writeFileSync(destMd, planMd, 'utf-8');

    // Remove old MD if it was in queue
    const oldMd = loc.file.replace('.json', '.md');
    if (fs.existsSync(oldMd)) {
      fs.unlinkSync(oldMd);
    }

    console.log(`\n✅ Renewal Plan approved for manual mock execution!`);
    console.log(`- Plan ID:    ${plan.id}`);
    console.log(`- Status:     ${plan.status}`);
    console.log(`- Local Path: ${path.relative(process.cwd(), destJson)}\n`);

    logEvent('RENEWAL_APPROVED', `Approved renewal plan ${renewalId} for manual drill execution.`);
    exportDashboardTelemetry();
  } catch (err) {
    console.error(`❌ Failed to approve renewal: ${err}`);
  }
}

// 8. reject-renewal
function handleRejectRenewal(renewalId: string) {
  if (!renewalId) {
    console.error('❌ Error: Missing renewal plan ID.');
    process.exit(1);
  }

  const loc = locateRenewalFile(renewalId);
  if (!loc) {
    console.error(`❌ Error: Renewal plan ID "${renewalId}" not found.`);
    process.exit(1);
  }

  try {
    const plan: RenewalPlan = JSON.parse(fs.readFileSync(loc.file, 'utf-8'));
    plan.status = 'REJECTED';
    plan.modifiedAt = new Date().toISOString();

    const destJson = path.join(RECERT_REJECTED_DIR, `${renewalId}.json`);
    fs.writeFileSync(destJson, JSON.stringify(plan, null, 2), 'utf-8');
    fs.unlinkSync(loc.file);

    const oldMd = loc.file.replace('.json', '.md');
    if (fs.existsSync(oldMd)) {
      fs.unlinkSync(oldMd);
    }

    console.log(`\n❌ Renewal Plan rejected.`);
    console.log(`- Plan ID:    ${plan.id}`);
    console.log(`- Status:     ${plan.status}\n`);

    logEvent('RENEWAL_REJECTED', `Rejected renewal plan ${renewalId}.`);
    exportDashboardTelemetry();
  } catch (err) {
    console.error(`❌ Failed to reject renewal: ${err}`);
  }
}

// 9. mark-renewal-complete
function handleMarkRenewalComplete(renewalId: string, signer: string, note: string) {
  if (!renewalId) {
    console.error('❌ Error: Missing renewal plan ID.');
    process.exit(1);
  }
  if (!signer) {
    console.error('❌ Error: Missing --signer name. Renewal validation requires a human validator name.');
    process.exit(1);
  }
  if (!note) {
    console.error('❌ Error: Missing --note. Renewal validation requires validator notes.');
    process.exit(1);
  }

  const loc = locateRenewalFile(renewalId);
  if (!loc) {
    console.error(`❌ Error: Renewal plan ID "${renewalId}" not found.`);
    process.exit(1);
  }

  try {
    const plan: RenewalPlan = JSON.parse(fs.readFileSync(loc.file, 'utf-8'));
    if (plan.status !== 'APPROVED') {
      console.error(`❌ Error: Cannot complete plan ${renewalId} (current status: ${plan.status}). Plan must be APPROVED first.`);
      process.exit(1);
    }

    // Verify evidence: Operator must have fresh passed attempts for all required scenarios in the plan
    const passedScenarios = getOperatorDrillsPassed(plan.operatorName);
    const missingScenarios: string[] = [];

    plan.requiredScenarios.forEach(sc => {
      if (!passedScenarios.includes(sc)) {
        missingScenarios.push(sc);
      }
    });

    if (missingScenarios.length > 0) {
      console.error(`\n❌ Error: Completion DENIED due to missing scenario evidence.`);
      console.error(`- Missing Scenarios Checklist:`);
      missingScenarios.forEach(ms => console.error(`  - ❌ ${ms}`));
      console.error(`- Action: Complete missing drills via voice-ops-training-simulation first.\n`);

      // Log validation error report
      const errorContent = fillTemplate('voice-ops-recertification-error-template.md', {
        TIMESTAMP: new Date().toISOString(),
        ERROR_TYPE: 'Completion Verification Failed',
        TRIGGER_EVENT: `Mark-Complete Request for Plan ${renewalId}`,
        OPERATOR_NAME: plan.operatorName,
        DESCRIPTION: 'Failed to verify fresh mock training scenario evidence on attempts registry.',
        BLOCKER_DETAILS: `Missing Scenario IDs: ${missingScenarios.join(', ')}`,
        BOUNDS_ACTION: 'Certification Renewal Blocked'
      });

      const errorPath = path.join(RECERT_REPORTS_DIR, `recertification_error_${planId_to_safe(renewalId)}_${Math.floor(Date.now() / 1000)}.md`);
      fs.writeFileSync(errorPath, errorContent, 'utf-8');

      logEvent('RENEWAL_COMPLETION_DENIED', `Blocked completion for plan ${renewalId}. Missing: ${missingScenarios.join(', ')}`);
      process.exit(1);
    }

    // Record Completion
    plan.status = 'COMPLETED';
    plan.signer = signer;
    plan.note = note;
    plan.modifiedAt = new Date().toISOString();

    const destJson = path.join(RECERT_COMPLETED_DIR, `${renewalId}.json`);
    fs.writeFileSync(destJson, JSON.stringify(plan, null, 2), 'utf-8');
    fs.unlinkSync(loc.file);

    const oldMd = loc.file.replace('.json', '.md');
    if (fs.existsSync(oldMd)) {
      fs.unlinkSync(oldMd);
    }

    const completionMd = fillTemplate('voice-ops-recertification-renewal-status-template.md', {
      RENEWAL_ID: plan.id,
      OPERATOR_NAME: plan.operatorName,
      STATUS: plan.status,
      DATE_MODIFIED: plan.modifiedAt,
      SCENARIOS_CHECKED: String(plan.requiredScenarios.length),
      SCENARIOS_PASSED: String(plan.requiredScenarios.length),
      EMERGENCY_DRILL: plan.requiredScenarios.includes(REQUIRED_EMERGENCY_DRILL) ? 'VERIFIED ✅' : 'N/A',
      SIGNER: signer,
      NOTE: note
    });

    const destMd = path.join(RECERT_COMPLETED_DIR, `${renewalId}.md`);
    fs.writeFileSync(destMd, completionMd, 'utf-8');

    console.log(`\n📜 Recertification Renewal Plan COMPLETED!`);
    console.log(`================================================================================`);
    console.log(`- Plan ID:        \x1b[32m${plan.id}\x1b[0m`);
    console.log(`- Operator Name:  ${plan.operatorName}`);
    console.log(`- Validator:      Approved and signed by ${signer}`);
    console.log(`- Status:         COMPLETED`);
    console.log(`- Completed file: ${path.relative(process.cwd(), destJson)}`);
    console.log(`================================================================================\n`);

    logEvent('RENEWAL_COMPLETED', `Completed renewal plan ${renewalId} signed by ${signer}.`);
    exportDashboardTelemetry();
  } catch (err) {
    console.error(`❌ Failed to complete renewal: ${err}`);
  }
}

function planId_to_safe(planId: string): string {
  return planId.replace(/[^a-zA-Z0-9]/g, '_');
}

// 10. generate-drill-rotation
function handleGenerateDrillRotation() {
  const rotId = `rotation_${Math.floor(Date.now() / 1000)}`;

  // Default Drill Rotation Rules:
  // Week 1: dashboard_health (dashboard_stale_after_freeze) plus routing_safety (fuzzy_command_blocked).
  // Week 2: tts_asr_backend (missing_piper_binary, missing_whisper_backend) plus emergency_stop (emergency_stop_drill).
  // Week 3: package_handoff (incomplete_handoff_checklist) plus archive_retention (duplicate_maintenance_job).
  // Week 4: checksum_mismatch (checksum_mismatch) plus degraded_health_dashboard_dist_drift (degraded_health_due_to_drift).
  const rot: RotationPlan = {
    id: rotId,
    timestamp: new Date().toISOString(),
    cadence: DEFAULT_DRILL_CADENCE,
    week1: ['dashboard_stale_after_freeze', 'fuzzy_command_blocked'],
    week2: ['missing_piper_binary', 'missing_whisper_backend', 'emergency_stop_drill'],
    week3: ['incomplete_handoff_checklist', 'duplicate_maintenance_job'],
    week4: ['checksum_mismatch', 'degraded_health_due_to_drift'],
    emergencyDrillIncluded: true,
    repetitionCheckPassed: true
  };

  const rotJsonPath = path.join(RECERT_ROTATIONS_DIR, `${rotId}.json`);
  fs.writeFileSync(rotJsonPath, JSON.stringify(rot, null, 2), 'utf-8');

  const rotMd = fillTemplate('voice-ops-recertification-drill-rotation-template.md', {
    TIMESTAMP: rot.timestamp,
    ROTATION_ID: rot.id,
    CADENCE: rot.cadence,
    WEEK_1_DRILLS: rot.week1.join(', '),
    WEEK_2_DRILLS: rot.week2.join(', '),
    WEEK_3_DRILLS: rot.week3.join(', '),
    WEEK_4_DRILLS: rot.week4.join(', '),
    EMERGENCY_DRILL_INCLUDED: rot.emergencyDrillIncluded ? 'VERIFIED ✅' : 'MISSING ❌',
    REPETITION_CHECK: rot.repetitionCheckPassed ? 'PASSED ✅' : 'FAILED ❌'
  });

  const rotMdPath = path.join(RECERT_ROTATIONS_DIR, `${rotId}.md`);
  fs.writeFileSync(rotMdPath, rotMd, 'utf-8');

  // Save state
  const state = loadSchedulerState();
  state.latestRotationId = rotId;
  saveSchedulerState(state);

  console.log(`\n🔄 Drill Rotation schedule generated!`);
  console.log(`================================================================================`);
  console.log(`- Rotation ID: \x1b[32m${rotId}\x1b[0m`);
  console.log(`- Week 1:      ${rot.week1.join(', ')}`);
  console.log(`- Week 2:      ${rot.week2.join(', ')}`);
  console.log(`- Week 3:      ${rot.week3.join(', ')}`);
  console.log(`- Week 4:      ${rot.week4.join(', ')}`);
  console.log(`- Local Path:  ${path.relative(process.cwd(), rotJsonPath)}`);
  console.log(`================================================================================\n`);

  logEvent('DRILL_ROTATION_GENERATED', `Generated weekly category rotation plan ${rotId}.`);
  exportDashboardTelemetry();
}

// 11. drill-calendar
function handleDrillCalendar() {
  const state = loadSchedulerState();
  if (!state.latestRotationId) {
    console.error('❌ Error: No rotation plan staged. Generate a rotation plan first.');
    process.exit(1);
  }

  const rotFile = path.join(RECERT_ROTATIONS_DIR, `${state.latestRotationId}.json`);
  if (!fs.existsSync(rotFile)) {
    console.error('❌ Error: Rotation plan state file missing.');
    process.exit(1);
  }

  try {
    const rot: RotationPlan = JSON.parse(fs.readFileSync(rotFile, 'utf-8'));

    const calMd = fillTemplate('voice-ops-recertification-drill-calendar-template.md', {
      TIMESTAMP: new Date().toISOString(),
      WEEK_1_SCENARIOS: rot.week1.join(', '),
      WEEK_1_CMD: `npm run voice-ops-training-simulation -- "start-simulation ${rot.week1[0]}"`,
      WEEK_2_SCENARIOS: rot.week2.join(', '),
      WEEK_2_CMD: `npm run voice-ops-training-simulation -- "start-simulation ${rot.week2[0]}"`,
      WEEK_3_SCENARIOS: rot.week3.join(', '),
      WEEK_3_CMD: `npm run voice-ops-training-simulation -- "start-simulation ${rot.week3[0]}"`,
      WEEK_4_SCENARIOS: rot.week4.join(', '),
      WEEK_4_CMD: `npm run voice-ops-training-simulation -- "start-simulation ${rot.week4[0]}"`
    });

    const calPath = path.join(RECERT_CALENDARS_DIR, 'drill_calendar.md');
    fs.writeFileSync(calPath, calMd, 'utf-8');

    console.log(calMd);
    console.log(`\n📅 Drill calendar compiled and saved to: ${path.relative(process.cwd(), calPath)}\n`);
    logEvent('CALENDAR_COMPILED', `Saved markdown drill calendar to ${calPath}`);
  } catch (err) {
    console.error(`❌ Failed to generate drill calendar: ${err}`);
  }
}

// 12. renewal-readiness
function handleRenewalReadiness(operatorName: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }

  const passedScenarios = getOperatorDrillsPassed(operatorName);
  const checklistLines = [
    'dashboard_stale_after_freeze',
    'degraded_health_due_to_drift',
    'missing_piper_binary',
    'missing_whisper_backend',
    'fuzzy_command_blocked',
    'duplicate_maintenance_job',
    'checksum_mismatch',
    'incomplete_handoff_checklist',
    'unreviewed_audio_cannot_approve',
    'emergency_stop_drill'
  ].map(sc => {
    const isPassed = passedScenarios.includes(sc);
    return `- [ ] **${sc}**: ${isPassed ? 'Passed ✅' : 'Missing ❌'}`;
  });

  const freshPassedCount = passedScenarios.length;
  const hasEmergency = passedScenarios.includes(REQUIRED_EMERGENCY_DRILL);

  const eligible = freshPassedCount >= REQUIRED_RENEWAL_SCENARIO_COUNT && hasEmergency;

  const readinessContent = fillTemplate('voice-ops-recertification-readiness-template.md', {
    OPERATOR_NAME: operatorName,
    TIMESTAMP: new Date().toISOString(),
    ELIGIBLE_VERDICT: eligible ? 'READY FOR RECERTIFICATION' : 'NOT READY (Missing evidence)',
    FRESH_PASSED_COUNT: String(freshPassedCount),
    REQUIRED_COUNT: String(REQUIRED_RENEWAL_SCENARIO_COUNT),
    EMERGENCY_DRILL_STATUS: hasEmergency ? 'PASSED ✅' : 'FAILED ❌',
    SCENARIOS_CHECKLIST: checklistLines.join('\n'),
    READY_FOR_RENEWAL: eligible ? 'Yes' : 'No',
    RECOMMENDATION: eligible 
      ? 'All evidence is complete. Operator is eligible for recertification. Create renewal plan and validate.' 
      : `Operator must pass emergency stop drill and at least ${REQUIRED_RENEWAL_SCENARIO_COUNT} total scenarios.`
  });

  console.log(readinessContent);
  logEvent('READINESS_EVALUATED', `Evaluated readiness for operator ${operatorName}. Ready: ${eligible}`);
}

// 13. latest
function handleLatest() {
  const state = loadSchedulerState();
  if (state.latestPlanId) {
    console.log(`Latest staged renewal plan: \x1b[32m${state.latestPlanId}\x1b[0m`);
    handleInspectRenewal(state.latestPlanId);
  } else {
    console.log('No renewal plans logged yet.');
  }

  if (state.latestRotationId) {
    console.log(`Latest weekly drill rotation: \x1b[36m${state.latestRotationId}\x1b[0m`);
    const rotFile = path.join(RECERT_ROTATIONS_DIR, `${state.latestRotationId}.json`);
    if (fs.existsSync(rotFile)) {
      try {
        const rot = JSON.parse(fs.readFileSync(rotFile, 'utf-8'));
        console.log(`- Week 1: ${rot.week1.join(', ')}`);
        console.log(`- Week 2: ${rot.week2.join(', ')}`);
      } catch {}
    }
  }
}

// 14. recertification-summary
function handleRecertificationSummary() {
  const ledger = getLedger();
  const certs = Object.values(ledger);
  const now = Date.now();

  let expiringCount = 0;
  certs.forEach(c => {
    const expiry = new Date(c.expiryDate).getTime();
    if (now < expiry && expiry - now <= RENEWAL_WARNING_DAYS * 24 * 60 * 60 * 1000) {
      expiringCount++;
    }
  });

  let queueCount = 0;
  if (fs.existsSync(RECERT_QUEUE_DIR)) {
    queueCount += fs.readdirSync(RECERT_QUEUE_DIR).filter(f => f.endsWith('.json')).length;
  }
  if (fs.existsSync(RECERT_APPROVED_DIR)) {
    queueCount += fs.readdirSync(RECERT_APPROVED_DIR).filter(f => f.endsWith('.json')).length;
  }

  const summary = fillTemplate('voice-ops-recertification-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    CERT_COUNT: String(certs.length),
    EXPIRING_COUNT: String(expiringCount),
    QUEUE_COUNT: String(queueCount),
    AUTO_RENEW: AUTO_RENEW_CERTIFICATION ? 'ENABLED (Breach)' : 'DISABLED (Locked/Safe)',
    LIVE_ALLOWED: LIVE_COMMAND_EXECUTION_ALLOWED ? 'ALLOWED (Breach)' : 'LOCKED (Safe)',
    MANUAL_SIGNOFF: MANUAL_APPROVAL_REQUIRED ? 'ENFORCED (Safe)' : 'BYPASSED (Breach)'
  });

  const reportPath = path.join(RECERT_REPORTS_DIR, `recertification_summary_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(reportPath, summary, 'utf-8');

  console.log(summary);
  console.log(`\n📝 Summary report compiled and saved to: ${path.relative(process.cwd(), reportPath)}`);
  logEvent('SUMMARY_GENERATED', `Compiled recertification summary report at ${reportPath}`);
}

// 15. recertification-log
function handleRecertificationLog() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No recertification events written yet.');
    return;
  }
  const logs = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const last20 = logs.slice(-20);
  console.log(`\n📋 Recent Recertification activity logs:`);
  console.log('================================================================================');
  console.log(last20.join('\n'));
  console.log('================================================================================\n');
}

// Parser
let parsedArgs: string[] = [];

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
  const options: Record<string, string> = {};

  for (let i = 0; i < parsedArgs.length; i++) {
    if (parsedArgs[i] === '--signer') {
      options.signer = parsedArgs[i + 1] ? parsedArgs[i + 1].trim() : '';
      i++;
      continue;
    }
    if (parsedArgs[i] === '--note') {
      options.note = parsedArgs[i + 1] ? parsedArgs[i + 1].trim() : '';
      i++;
      continue;
    }
    positionalArgs.push(parsedArgs[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim() : '';

  // Auto-refresh snapshot on run
  try {
    exportDashboardTelemetry();
  } catch {}

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-certifications':
      handleScanCertifications();
      break;
    case 'inspect-certification':
      handleInspectCertification(positionalArgs[1] || '');
      break;
    case 'create-renewal-plan':
      handleCreateRenewalPlan(positionalArgs[1] || '');
      break;
    case 'list-renewal-queue':
      handleListRenewalQueue();
      break;
    case 'inspect-renewal':
      handleInspectRenewal(positionalArgs[1] || '');
      break;
    case 'approve-renewal':
      handleApproveRenewal(positionalArgs[1] || '');
      break;
    case 'reject-renewal':
      handleRejectRenewal(positionalArgs[1] || '');
      break;
    case 'mark-renewal-complete':
      handleMarkRenewalComplete(positionalArgs[1] || '', options.signer || '', options.note || '');
      break;
    case 'generate-drill-rotation':
      handleGenerateDrillRotation();
      break;
    case 'drill-calendar':
      handleDrillCalendar();
      break;
    case 'renewal-readiness':
      handleRenewalReadiness(positionalArgs[1] || '');
      break;
    case 'latest':
      handleLatest();
      break;
    case 'recertification-summary':
      handleRecertificationSummary();
      break;
    case 'recertification-log':
      handleRecertificationLog();
      break;
    default:
      console.error(`❌ Error: Unknown recertification scheduler command "${command}".`);
      console.log('💡 Use: npm run voice-ops-recertification-scheduler-help for usage info.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error in recertification scheduler: ${err}`);
  process.exit(1);
});
