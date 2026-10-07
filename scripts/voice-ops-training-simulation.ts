import * as fs from 'fs';
import * as path from 'path';
import {
  TRAINING_ROOT,
  SCENARIO_DIR,
  ATTEMPTS_DIR,
  REPORTS_DIR,
  LOGS_DIR,
  MOCK_DATA_DIR,
  SIMULATION_MODE,
  PRODUCTION_MUTATION_ALLOWED,
  LIVE_COMMAND_EXECUTION_ALLOWED,
  MOCK_DATA_ONLY,
  AUTO_REPAIR,
  AUTO_RESTORE,
  AUTO_DELETE
} from '../config/voice-ops-training-simulation.config.js';

// Ensure directories exist
const dirs = [TRAINING_ROOT, SCENARIO_DIR, ATTEMPTS_DIR, REPORTS_DIR, LOGS_DIR, MOCK_DATA_DIR];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(LOGS_DIR, 'voice_ops_training_simulation.log');
const SNAPSHOT_JSON_FILE = path.join(TRAINING_ROOT, 'dashboard_training_snapshot.json');
const ATTEMPTS_INDEX_FILE = path.join(MOCK_DATA_DIR, 'attempts_index.json');
const SCENARIOS_INDEX_FILE = path.join(MOCK_DATA_DIR, 'scenarios_index.json');

function logEvent(event: string, details: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] SIM_EVENT: ${event} | DETAILS: ${details}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_training_simulation', templateName);
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
interface ScenarioStep {
  id: string;
  description: string;
  expectedKeywords: string[];
  forbiddenKeywords: string[];
  hint: string;
}

interface Scenario {
  id: string;
  title: string;
  riskLevel: string;
  objective: string;
  startingState: string;
  expectedActions: string;
  forbiddenActions: string;
  scoringRules: string;
  passThreshold: number;
  steps: ScenarioStep[];
}

interface OperatorAnswer {
  stepId: string;
  response: string;
  timestamp: string;
  score: number;
  feedback: string;
}

interface SimulationAttempt {
  id: string;
  scenarioId: string;
  operator: string;
  startedAt: string;
  status: string; // 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  answers: OperatorAnswer[];
  finalScore: number;
  verdict: string; // 'PASS' | 'FAIL' | 'UNGRADED'
  gradedAt?: string;
  notes: string;
}

// 10 Default Training Scenarios
const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'dashboard_stale_after_freeze',
    title: 'Dashboard Stale After Freeze',
    riskLevel: 'Medium',
    objective: 'Operator identifies dashboard stale state and triggers telemetry refresh manually.',
    startingState: 'Freeze snapshot complete. Loop dashboard metrics show outdated figures. No logs written in 24 hours.',
    expectedActions: 'Verify health report, execute manual telemetry export command, and rebuild dashboard.',
    forbiddenActions: 'Execute auto-repair config scripts, modify Vite config files directly, or delete output directories.',
    scoringRules: 'Identify dashboard stale state and trigger manual updates. Pass threshold: 70%.',
    passThreshold: 70,
    steps: [
      {
        id: 'step_1',
        description: 'What pre-flight investigation commands do you execute to diagnose dashboard staleness?',
        expectedKeywords: ['inspect', 'health', 'dashboard', 'telemetry', 'status'],
        forbiddenKeywords: ['auto-repair', 'repair', 'delete', 'modify'],
        hint: 'Use status check commands first. Do not attempt automatic repair.'
      },
      {
        id: 'step_2',
        description: 'How do you refresh the loop dashboard stale metrics safely?',
        expectedKeywords: ['refresh', 'checklist', 'manual', 'export', 'build'],
        forbiddenKeywords: ['auto', 'automatic'],
        hint: 'Run dashboard data export followed by Vite rebuild.'
      }
    ]
  },
  {
    id: 'degraded_health_due_to_drift',
    title: 'Degraded Health Due to Dashboard Dist Drift',
    riskLevel: 'High',
    objective: 'Operator recognizes Vite build dist changes as expected drift and performs checks.',
    startingState: 'Post-freeze health checker returns "Verdict: Degraded" due to mutated index.html checksum after a rebuild.',
    expectedActions: 'Inspect drift logs, verify index.html mutation contains telemetry data updates only, mark checklist.',
    forbiddenActions: 'Force rollback codebase to freeze snapshot tag, execute auto-repair scripts, or delete dist/ directories.',
    scoringRules: 'Confirm drift boundaries and complete verification checklist manually. Pass threshold: 80%.',
    passThreshold: 80,
    steps: [
      {
        id: 'step_1',
        description: 'How do you verify whether the reported health degradation is a true security incident or normal build drift?',
        expectedKeywords: ['drift', 'report', 'log', 'inspect', 'checksum', 'html'],
        forbiddenKeywords: ['repair', 'rollback', 'delete'],
        hint: 'Inspect health diagnostic files to check which file checksums have modified.'
      },
      {
        id: 'step_2',
        description: 'What action do you take once drift is confirmed as expected Vite telemetry updates?',
        expectedKeywords: ['checklist', 'sign', 'verify', 'manual', 'log'],
        forbiddenKeywords: ['auto-repair', 'restore', 'rollback'],
        hint: 'Proceed with manual validation and sign off the post-freeze check.'
      }
    ]
  },
  {
    id: 'missing_piper_binary',
    title: 'Missing Local Piper Binary',
    riskLevel: 'High',
    objective: 'Operator registers voice config paths and models offline without triggering cloud APIs.',
    startingState: 'TTS briefing rendering fails with "Piper binary execution path missing" console error.',
    expectedActions: 'Look up paths in configuration, download binary manually, verify SHA256 matches manifest.',
    forbiddenActions: 'Inject cloud synthesis API keys, enable autoplay, or download unverified external scripts.',
    scoringRules: 'Follow offline verification guidelines and local configuration rules. Pass threshold: 75%.',
    passThreshold: 75,
    steps: [
      {
        id: 'step_1',
        description: 'What are the first steps to restore Piper TTS synthesis without network access?',
        expectedKeywords: ['config', 'paths', 'binary', 'local', 'manual'],
        forbiddenKeywords: ['cloud', 'google', 'aws', 'api', 'online'],
        hint: 'Locate local model paths and verify physical binary existence on the filesystem.'
      },
      {
        id: 'step_2',
        description: 'How do you ensure the newly added binary is safe to use in the Sovereign pipeline?',
        expectedKeywords: ['sha256', 'checksum', 'manifest', 'verify', 'validation'],
        forbiddenKeywords: ['ignore', 'bypass'],
        hint: 'Check binary integrity matches registered hashes in configuration manifests.'
      }
    ]
  },
  {
    id: 'missing_whisper_backend',
    title: 'Missing Whisper ASR Backend',
    riskLevel: 'High',
    objective: 'Operator audits local ASR engine assets and GGML model files without cloud fallbacks.',
    startingState: 'Voice-to-ASR pipeline command fails because ggml-model file is missing or unreadable.',
    expectedActions: 'Perform ASR model presence preflight check, verify file checksum, stage backend paths in config.',
    forbiddenActions: 'Configure cloud speech API keys, disable local ASR gate checklists, or use auto-restores.',
    scoringRules: 'Perform ASR model integrity and location verification. Pass threshold: 75%.',
    passThreshold: 75,
    steps: [
      {
        id: 'step_1',
        description: 'How do you check why the speech recognizer backend cannot load?',
        expectedKeywords: ['preflight', 'check', 'model', 'presence', 'asr-model-gate'],
        forbiddenKeywords: ['cloud', 'google-cloud', 'whisper-api'],
        hint: 'Execute the model gate verification script to verify GGML model existence.'
      },
      {
        id: 'step_2',
        description: 'How do you update ASR settings once the correct model binary is placed manually?',
        expectedKeywords: ['stage', 'manifest', 'config', 'path', 'verify'],
        forbiddenKeywords: ['auto-restore', 'restore', 'git checkout'],
        hint: 'Update file configurations and run ASR staging validation gate.'
      }
    ]
  },
  {
    id: 'fuzzy_command_blocked',
    title: 'Fuzzy Command Routing Blocked',
    riskLevel: 'Low',
    objective: 'Operator identifies fuzzy routing restriction and uses exact command naming.',
    startingState: 'Operator executes `npm run command -- "operator status"` and receives "Error: Command blocked" message.',
    expectedActions: 'Inspect command configuration lists, lookup whitelisted names, execute exact router script.',
    forbiddenActions: 'Disable requiresExactName configuration filters, run scripts via unsafe eval, or add custom shell aliases.',
    scoringRules: 'Use exact whitelisted routing schemas exclusively. Pass threshold: 100%.',
    passThreshold: 100,
    steps: [
      {
        id: 'step_1',
        description: 'Why did the router block the command?',
        expectedKeywords: ['fuzzy', 'blocked', 'exact-name', 'alias', 'requiresexactname'],
        forbiddenKeywords: ['disable', 'bypass', 'eval'],
        hint: 'Read router policies. The Safe Router blocks fuzzy name aliases and loose routing.'
      },
      {
        id: 'step_2',
        description: 'What command string must be run to retrieve status safely?',
        expectedKeywords: ['npm run command', 'voice-ops-operator-runbook status', 'quotes'],
        forbiddenKeywords: ['operator status', 'alias', 'eval'],
        hint: 'Wrap the exact whitelisted npm command string in quotes: npm run command -- "voice-ops-operator-runbook status".'
      }
    ]
  },
  {
    id: 'duplicate_maintenance_job',
    title: 'Duplicate Maintenance Job Blocked',
    riskLevel: 'Low',
    objective: 'Operator handles idempotent scheduler warnings and checks pending queues.',
    startingState: 'Maintenance scheduler blocks creation of a daily job because a similar type is already queued for today.',
    expectedActions: 'Query maintenance scheduler status, list active queues, inspect existing job parameters.',
    forbiddenActions: 'Prune active jobs directories automatically, force bypass idempotent controls, or restart daemons.',
    scoringRules: 'Investigate queues and execute pre-approved job steps manually. Pass threshold: 70%.',
    passThreshold: 70,
    steps: [
      {
        id: 'step_1',
        description: 'What scheduler status commands do you use to locate the existing duplicate job?',
        expectedKeywords: ['scheduler status', 'list-queue', 'inspect'],
        forbiddenKeywords: ['delete', 'force', 'clear'],
        hint: 'Use list-queue or status commands to retrieve queued task details.'
      },
      {
        id: 'step_2',
        description: 'What is the correct protocol once the queued job is inspected?',
        expectedKeywords: ['approve', 'execute', 'manual', 'mark-complete'],
        forbiddenKeywords: ['recreate', 'bypass', 'delete'],
        hint: 'Approve the staged job and manually execute the steps listed.'
      }
    ]
  },
  {
    id: 'checksum_mismatch',
    title: 'Post-Freeze Codebase Checksum Mismatch',
    riskLevel: 'High',
    objective: 'Operator handles integrity mismatch by audit checks, avoiding automated rollbacks.',
    startingState: 'Post-freeze health checker returns "Warning: File hash checksum mismatch on narrator.ts".',
    expectedActions: 'Run drift audit reports, isolate file anomalies, verify mutations with manual checklist.',
    forbiddenActions: 'Execute automated git rollback snapshots, repair files automatically, or delete mutated modules.',
    scoringRules: 'Perform manual auditing and file drift checks. Pass threshold: 80%.',
    passThreshold: 80,
    steps: [
      {
        id: 'step_1',
        description: 'What tools do you use to identify which parts of the script have changed?',
        expectedKeywords: ['diff', 'git diff', 'drift', 'report', 'health'],
        forbiddenKeywords: ['auto-repair', 'restore', 'delete'],
        hint: 'Use differential scans or git diff to locate the mutated line changes.'
      },
      {
        id: 'step_2',
        description: 'What action is strictly forbidden when resolving post-freeze hash mismatches?',
        expectedKeywords: ['auto-restore', 'auto-repair', 'automatic', 'git checkout'],
        forbiddenKeywords: ['manual', 'audit', 'inspect'],
        hint: 'Avoid automatic rollbacks or automatic code modifications. Restores must be human-reviewed.'
      }
    ]
  },
  {
    id: 'incomplete_handoff_checklist',
    title: 'Incomplete Briefing Handoff Checklist',
    riskLevel: 'Medium',
    objective: 'Operator resolves missing checks before signing delivery package logs.',
    startingState: 'Delivery exporter refuses handoff command because verification checklist signatures are missing.',
    expectedActions: 'Inspect checklist validation state, review checklist steps manually, sign each validation item.',
    forbiddenActions: 'Bypass checklists using force flags, delete checklist schemas, or export raw unverified folders.',
    scoringRules: 'Complete all checklist gates and provide signer keys. Pass threshold: 75%.',
    passThreshold: 75,
    steps: [
      {
        id: 'step_1',
        description: 'How do you view which checks are missing from the handoff ledger?',
        expectedKeywords: ['status', 'inspect', 'checklist', 'missing'],
        forbiddenKeywords: ['bypass', 'force', 'ignore'],
        hint: 'Run the manual-delivery-handoff status command.'
      },
      {
        id: 'step_2',
        description: 'What command compiles the handoff release once checklists are manually completed?',
        expectedKeywords: ['sign', 'manual-delivery-handoff -- "sign"', '--signer'],
        forbiddenKeywords: ['bypass', 'force'],
        hint: 'Sign the handoff ledger explicitly, passing your signer name.'
      }
    ]
  },
  {
    id: 'unreviewed_audio_cannot_approve',
    title: 'Unreviewed Audio Playback Gate Lockout',
    riskLevel: 'Medium',
    objective: 'Operator reviews audio metrics and registers manual signoff before approval.',
    startingState: 'Briefing queue rejects render approval command because the daily playback review status is "Unreviewed".',
    expectedActions: 'Check playback review status, review generated files, signoff playback checklist.',
    forbiddenActions: 'Bypass playback check configurations, override render parameters, or force build exports.',
    scoringRules: 'Perform manual playback review and sign off the playback gate. Pass threshold: 75%.',
    passThreshold: 75,
    steps: [
      {
        id: 'step_1',
        description: 'What steps do you take to play back and check the rendered audio quality?',
        expectedKeywords: ['play', 'manually', 'inspect', 'wav', 'audio'],
        forbiddenKeywords: ['autoplay', 'bypass'],
        hint: 'Locate the WAV file and trigger local playback manually to review clarity.'
      },
      {
        id: 'step_2',
        description: 'What command verifies the audio and transitions status to approved?',
        expectedKeywords: ['briefing-audio-playback-review', 'approve', '--signer'],
        forbiddenKeywords: ['force', 'bypass', 'auto-approve'],
        hint: 'Run briefing-audio-playback-review approve command.'
      }
    ]
  },
  {
    id: 'emergency_stop_drill',
    title: 'Emergency Stop Protocol Drill',
    riskLevel: 'Critical',
    objective: 'Operator secures rogue background recording session and locks automatic executes.',
    startingState: 'Rogue recording daemon is active on the local terminal, staging directory queues are growing.',
    expectedActions: 'Identify audio recorder process, kill recorder process ID, verify configuration execute parameters.',
    forbiddenActions: 'Trigger system purge deletes, shut down core databases, or wipe log archives.',
    scoringRules: 'Terminate active capture sessions and verify execute lock configurations. Pass threshold: 100%.',
    passThreshold: 100,
    steps: [
      {
        id: 'step_1',
        description: 'How do you check for and terminate an active background recording process?',
        expectedKeywords: ['kill', 'pgrep', 'ps aux', 'narrator-voice-session-recorder', 'pid'],
        forbiddenKeywords: ['purge', 'delete', 'format'],
        hint: 'Locate process IDs using pgrep and terminate them using kill.'
      },
      {
        id: 'step_2',
        description: 'What parameters in configuration files must you confirm to prevent bridge dispatch execution?',
        expectedKeywords: ['auto_execute', 'readonly_mode', 'false', 'true'],
        forbiddenKeywords: ['delete', 'auto-repair'],
        hint: 'Verify AUTO_EXECUTE = false and READONLY_MODE = true.'
      }
    ]
  }
];

function loadScenarios(): Scenario[] {
  if (fs.existsSync(SCENARIOS_INDEX_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SCENARIOS_INDEX_FILE, 'utf-8'));
    } catch {
      return DEFAULT_SCENARIOS;
    }
  }
  return DEFAULT_SCENARIOS;
}

function saveScenarios(scenarios: Scenario[]) {
  fs.writeFileSync(SCENARIOS_INDEX_FILE, JSON.stringify(scenarios, null, 2), 'utf-8');
}

function loadAttempts(): Record<string, SimulationAttempt> {
  if (fs.existsSync(ATTEMPTS_INDEX_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ATTEMPTS_INDEX_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveAttempts(attempts: Record<string, SimulationAttempt>) {
  fs.writeFileSync(ATTEMPTS_INDEX_FILE, JSON.stringify(attempts, null, 2), 'utf-8');
}

// Telemetry Export for Vite Dashboard
function exportDashboardTelemetry() {
  const attempts = loadAttempts();
  const attemptsList = Object.values(attempts);
  const scenarios = loadScenarios();
  
  let latestAttempt: SimulationAttempt | undefined;
  if (attemptsList.length > 0) {
    attemptsList.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    latestAttempt = attemptsList[0];
  }

  const snapshot = {
    timestamp: new Date().toISOString(),
    scenarioCount: scenarios.length,
    attemptCount: attemptsList.length,
    latestScenarioId: latestAttempt ? latestAttempt.scenarioId : 'None',
    latestSimulationScore: latestAttempt ? `${latestAttempt.finalScore}%` : 'N/A',
    latestPassFailStatus: latestAttempt ? latestAttempt.verdict : 'N/A',
    simulationMode: SIMULATION_MODE ? 'enabled' : 'disabled',
    productionMutationAllowed: PRODUCTION_MUTATION_ALLOWED ? 'enabled' : 'disabled',
    liveCommandExecutionAllowed: LIVE_COMMAND_EXECUTION_ALLOWED ? 'enabled' : 'disabled',
    recommendedNextPhase: 'Phase N5W: Operator Certification Ledger'
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Copy to Vite public directory if it exists
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'dashboard_training_snapshot.json');
    fs.writeFileSync(publicPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }
}

// 1. status
function handleStatus() {
  const scenarios = loadScenarios();
  const attempts = loadAttempts();
  const attemptsList = Object.values(attempts);

  let latestAttempt: SimulationAttempt | undefined;
  if (attemptsList.length > 0) {
    attemptsList.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    latestAttempt = attemptsList[0];
  }

  const statusContent = fillTemplate('voice-ops-training-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    TRAINING_ROOT: path.relative(process.cwd(), TRAINING_ROOT),
    SCENARIO_DIR: path.relative(process.cwd(), SCENARIO_DIR),
    ATTEMPTS_DIR: path.relative(process.cwd(), ATTEMPTS_DIR),
    LOGS_DIR: path.relative(process.cwd(), LOGS_DIR),
    SIMULATION_MODE: SIMULATION_MODE ? 'ACTIVE (Safe Drill Mode)' : 'INACTIVE',
    PRODUCTION_MUTATION_ALLOWED: PRODUCTION_MUTATION_ALLOWED ? 'ALLOWED (Unsafe)' : 'LOCKED (Safe)',
    LIVE_COMMAND_EXECUTION_ALLOWED: LIVE_COMMAND_EXECUTION_ALLOWED ? 'ALLOWED (Unsafe)' : 'LOCKED (Safe)',
    MOCK_DATA_ONLY: MOCK_DATA_ONLY ? 'ENABLED' : 'DISABLED',
    SCENARIO_COUNT: String(scenarios.length),
    ATTEMPT_COUNT: String(attemptsList.length),
    LATEST_ATTEMPT_ID: latestAttempt ? latestAttempt.id : 'None',
    LATEST_SCORE: latestAttempt ? `${latestAttempt.finalScore}% (${latestAttempt.verdict})` : 'N/A'
  });

  console.log(statusContent);
  logEvent('STATUS_CHECKED', `Reported stats for ${scenarios.length} scenarios and ${attemptsList.length} attempts.`);
}

// 2. generate-scenarios
function handleGenerateScenarios() {
  const scenarios = DEFAULT_SCENARIOS;
  saveScenarios(scenarios);

  scenarios.forEach(sc => {
    const content = fillTemplate('voice-ops-training-scenario-template.md', {
      TITLE: sc.title,
      SCENARIO_ID: sc.id,
      RISK_LEVEL: sc.riskLevel,
      OBJECTIVE: sc.objective,
      STARTING_STATE: sc.startingState,
      EXPECTED_ACTIONS: sc.expectedActions,
      FORBIDDEN_ACTIONS: sc.forbiddenActions,
      SCORING_RULES: sc.scoringRules,
      PASS_THRESHOLD: `${sc.passThreshold}%`
    });

    const filePath = path.join(SCENARIO_DIR, `${sc.id}.md`);
    fs.writeFileSync(filePath, content, 'utf-8');
  });

  logEvent('SCENARIOS_GENERATED', `Created 10 mock training scenario documentation files.`);
  exportDashboardTelemetry();
  console.log(`✅ 10 default simulation scenarios generated successfully under: ${path.relative(process.cwd(), SCENARIO_DIR)}`);
}

// 3. list-scenarios
function handleListScenarios() {
  const scenarios = loadScenarios();
  console.log(`\n📋 AVAILABLE OPERATOR TRAINING SCENARIOS`);
  console.log('================================================================================');
  scenarios.forEach(sc => {
    console.log(`- Scenario ID: \x1b[36m${sc.id}\x1b[0m`);
    console.log(`  Title:       ${sc.title}`);
    console.log(`  Risk Level:  ${sc.riskLevel}`);
    console.log(`  Pass Threshold: ${sc.passThreshold}%`);
    console.log('--------------------------------------------------------------------------------');
  });
  console.log('================================================================================\n');
  logEvent('SCENARIOS_LISTED', `Displayed ${scenarios.length} scenarios.`);
}

// 4. inspect-scenario
function handleInspectScenario(scenarioId: string) {
  const scenarios = loadScenarios();
  const sc = scenarios.find(s => s.id === scenarioId);
  if (!sc) {
    console.error(`❌ Scenario ID "${scenarioId}" not found.`);
    process.exit(1);
  }

  const content = fillTemplate('voice-ops-training-scenario-template.md', {
    TITLE: sc.title,
    SCENARIO_ID: sc.id,
    RISK_LEVEL: sc.riskLevel,
    OBJECTIVE: sc.objective,
    STARTING_STATE: sc.startingState,
    EXPECTED_ACTIONS: sc.expectedActions,
    FORBIDDEN_ACTIONS: sc.forbiddenActions,
    SCORING_RULES: sc.scoringRules,
    PASS_THRESHOLD: `${sc.passThreshold}%`
  });

  console.log(content);
  logEvent('SCENARIO_INSPECTED', `Inspected scenario ${scenarioId}`);
}

// 5. start-simulation
function handleStartSimulation(scenarioId: string) {
  const scenarios = loadScenarios();
  const sc = scenarios.find(s => s.id === scenarioId);
  if (!sc) {
    console.error(`❌ Scenario ID "${scenarioId}" not found.`);
    process.exit(1);
  }

  const simId = `sim_${Math.floor(Date.now() / 1000)}`;
  const attempts = loadAttempts();

  const newAttempt: SimulationAttempt = {
    id: simId,
    scenarioId: scenarioId,
    operator: process.env.USER || 'HumanOperator',
    startedAt: new Date().toISOString(),
    status: 'IN_PROGRESS',
    answers: [],
    finalScore: 0,
    verdict: 'UNGRADED',
    notes: 'Training session started. Awaiting operator answers.'
  };

  attempts[simId] = newAttempt;
  saveAttempts(attempts);

  const attemptContent = fillTemplate('voice-ops-training-attempt-template.md', {
    SIMULATION_ID: simId,
    SCENARIO_ID: scenarioId,
    OPERATOR: newAttempt.operator,
    STARTED_AT: newAttempt.startedAt,
    STATUS: newAttempt.status,
    ANSWERS_LEDGER: '_No answers submitted yet. Run npm run voice-ops-training-simulation -- "answer-step" to answer steps._',
    SCORE: '0%',
    NOTES: newAttempt.notes
  });

  const filePath = path.join(ATTEMPTS_DIR, `${simId}.md`);
  fs.writeFileSync(filePath, attemptContent, 'utf-8');

  logEvent('SIMULATION_STARTED', `Started training simulation ${simId} for scenario ${scenarioId}`);
  exportDashboardTelemetry();

  console.log(`\n🚀 Simulation Session Staged!`);
  console.log(`================================================================================`);
  console.log(`- Simulation ID: \x1b[32m${simId}\x1b[0m`);
  console.log(`- Scenario ID:   ${scenarioId}`);
  console.log(`- Drill Title:   ${sc.title}`);
  console.log(`- Risks:         ${sc.riskLevel}`);
  console.log(`- First Step:    ${sc.steps[0].id}: ${sc.steps[0].description}`);
  console.log(`  Hint:          ${sc.steps[0].hint}`);
  console.log(`================================================================================`);
  console.log(`💡 Next run: npm run voice-ops-training-simulation -- "answer-step ${simId} ${sc.steps[0].id} --response \\"<your answer>\\""\n`);
}

// 6. answer-step
function handleAnswerStep(simId: string, stepId: string, responseText: string) {
  const attempts = loadAttempts();
  const attempt = attempts[simId];
  if (!attempt) {
    console.error(`❌ Simulation Attempt ID "${simId}" not found.`);
    process.exit(1);
  }

  const scenarios = loadScenarios();
  const sc = scenarios.find(s => s.id === attempt.scenarioId);
  if (!sc) {
    console.error(`❌ Scenario "${attempt.scenarioId}" not found for this attempt.`);
    process.exit(1);
  }

  const step = sc.steps.find(st => st.id === stepId);
  if (!step) {
    console.error(`❌ Step ID "${stepId}" not found in scenario "${sc.id}".`);
    console.log(`💡 Available steps: ${sc.steps.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  // Record answer
  const existingIdx = attempt.answers.findIndex(a => a.stepId === stepId);
  const answerRecord: OperatorAnswer = {
    stepId: stepId,
    response: responseText,
    timestamp: new Date().toISOString(),
    score: 0,
    feedback: 'Pending scoring evaluation.'
  };

  if (existingIdx >= 0) {
    attempt.answers[existingIdx] = answerRecord;
  } else {
    attempt.answers.push(answerRecord);
  }

  attempt.notes = `Answered step ${stepId}. Session state: IN_PROGRESS.`;
  saveAttempts(attempts);

  // Write attempt documentation update
  const answersListStr = attempt.answers.map(ans => 
    `- **Step ID:** \`${ans.stepId}\`\n  **Response:** "${ans.response}"\n  **Logged At:** ${ans.timestamp}`
  ).join('\n\n');

  const attemptContent = fillTemplate('voice-ops-training-attempt-template.md', {
    SIMULATION_ID: simId,
    SCENARIO_ID: attempt.scenarioId,
    OPERATOR: attempt.operator,
    STARTED_AT: attempt.startedAt,
    STATUS: attempt.status,
    ANSWERS_LEDGER: answersListStr,
    SCORE: `${attempt.finalScore}%`,
    NOTES: attempt.notes
  });

  const filePath = path.join(ATTEMPTS_DIR, `${simId}.md`);
  fs.writeFileSync(filePath, attemptContent, 'utf-8');

  logEvent('STEP_ANSWERED', `Recorded response for sim ${simId} step ${stepId}`);

  console.log(`✅ Recorded response for ${stepId} successfully.`);
  
  // Suggest next step
  const currentStepIdx = sc.steps.findIndex(s => s.id === stepId);
  if (currentStepIdx < sc.steps.length - 1) {
    const nextStep = sc.steps[currentStepIdx + 1];
    console.log(`💡 Next step is: \x1b[36m${nextStep.id}\x1b[0m: ${nextStep.description}`);
  } else {
    console.log(`💡 Drill steps completed. Run command to grade session:`);
    console.log(`   \x1b[32mnpm run voice-ops-training-simulation -- "score-simulation ${simId}"\x1b[0m\n`);
  }
}

// 7. score-simulation
function handleScoreSimulation(simId: string) {
  const attempts = loadAttempts();
  const attempt = attempts[simId];
  if (!attempt) {
    console.error(`❌ Simulation Attempt ID "${simId}" not found.`);
    process.exit(1);
  }

  const scenarios = loadScenarios();
  const sc = scenarios.find(s => s.id === attempt.scenarioId);
  if (!sc) {
    console.error(`❌ Scenario "${attempt.scenarioId}" not found.`);
    process.exit(1);
  }

  let totalScore = 0;
  const gradingDetailsArray: string[] = [];

  sc.steps.forEach(step => {
    const answer = attempt.answers.find(a => a.stepId === step.id);
    if (!answer) {
      gradingDetailsArray.push(`- **Step ID:** \`${step.id}\`\n  ⚠️ *No response submitted.* (Score: 0%)`);
      return;
    }

    const text = answer.response.toLowerCase();
    
    // Check forbidden violations first
    let violatedForbidden: string | null = null;
    for (const fKeyword of step.forbiddenKeywords) {
      if (text.includes(fKeyword.toLowerCase())) {
        violatedForbidden = fKeyword;
        break;
      }
    }

    if (violatedForbidden) {
      answer.score = 0;
      answer.feedback = `BREACH: Operator answer included forbidden automatic execution or repair keyword "${violatedForbidden}". Step score locked to 0%.`;
      gradingDetailsArray.push(
        `- **Step ID:** \`${step.id}\`\n  ❌ **Verdict: FAILED SAFETY RULES**\n  - Response: "${answer.response}"\n  - Feedback: ${answer.feedback}\n  - Score: **0%**`
      );
      // Log emergency error report for safety violation
      const errorContent = fillTemplate('voice-ops-training-error-template.md', {
        TIMESTAMP: new Date().toISOString(),
        SIMULATION_ID: simId,
        TRIGGER: `Step ${step.id} answer evaluation`,
        VIOLATION: `Forbidden keyword trigger: "${violatedForbidden}"`
      });
      fs.writeFileSync(path.join(REPORTS_DIR, `simulation_error_${simId}_${step.id}.md`), errorContent, 'utf-8');
      return;
    }

    // Score based on expected keyword matches
    let matchCount = 0;
    const matchedKeywords: string[] = [];
    step.expectedKeywords.forEach(k => {
      if (text.includes(k.toLowerCase())) {
        matchCount++;
        matchedKeywords.push(k);
      }
    });

    const stepScore = step.expectedKeywords.length > 0 
      ? Math.round((matchCount / step.expectedKeywords.length) * 100) 
      : 100;

    answer.score = stepScore;
    answer.feedback = `Matched ${matchCount}/${step.expectedKeywords.length} expected safety keywords (${matchedKeywords.join(', ')}).`;
    totalScore += stepScore;

    gradingDetailsArray.push(
      `- **Step ID:** \`${step.id}\`\n  ✅ **Verdict: Graded**\n  - Response: "${answer.response}"\n  - Feedback: ${answer.feedback}\n  - Score: **${stepScore}%**`
    );
  });

  const finalScore = sc.steps.length > 0 
    ? Math.round(totalScore / sc.steps.length) 
    : 0;

  const passed = finalScore >= sc.passThreshold;
  attempt.finalScore = finalScore;
  attempt.verdict = passed ? 'PASS' : 'FAIL';
  attempt.status = 'COMPLETED';
  attempt.gradedAt = new Date().toISOString();
  attempt.notes = `Grading complete. Verdict: ${attempt.verdict} with final score ${finalScore}%.`;

  saveAttempts(attempts);

  // Write scoring file
  const gradingDetailsStr = gradingDetailsArray.join('\n\n');
  const scoreContent = fillTemplate('voice-ops-training-score-template.md', {
    SIMULATION_ID: simId,
    SCENARIO_ID: attempt.scenarioId,
    GRADED_AT: attempt.gradedAt,
    SCORE: String(finalScore),
    PASS_THRESHOLD: String(sc.passThreshold),
    VERDICT: attempt.verdict,
    GRADING_DETAILS: gradingDetailsStr
  });

  const scorePath = path.join(REPORTS_DIR, `score_report_${simId}.md`);
  fs.writeFileSync(scorePath, scoreContent, 'utf-8');

  // Update attempt md log
  const answersListStr = attempt.answers.map(ans => 
    `- **Step ID:** \`${ans.stepId}\`\n  **Response:** "${ans.response}"\n  **Score:** ${ans.score}%\n  **Feedback:** ${ans.feedback}`
  ).join('\n\n');

  const attemptContent = fillTemplate('voice-ops-training-attempt-template.md', {
    SIMULATION_ID: simId,
    SCENARIO_ID: attempt.scenarioId,
    OPERATOR: attempt.operator,
    STARTED_AT: attempt.startedAt,
    STATUS: attempt.status,
    ANSWERS_LEDGER: answersListStr,
    SCORE: `${finalScore}%`,
    NOTES: attempt.notes
  });
  fs.writeFileSync(path.join(ATTEMPTS_DIR, `${simId}.md`), attemptContent, 'utf-8');

  logEvent('SIMULATION_SCORED', `Graded attempt ${simId} for scenario ${attempt.scenarioId}. Final Score: ${finalScore} (${attempt.verdict})`);
  exportDashboardTelemetry();

  console.log(`\n🏆 Simulation Graded Successfully!`);
  console.log(`================================================================================`);
  console.log(`- Simulation ID: \x1b[32m${simId}\x1b[0m`);
  console.log(`- Pass Verdict:  \x1b[36m${attempt.verdict}\x1b[0m`);
  console.log(`- Final Score:   ${finalScore}% (Threshold: ${sc.passThreshold}%)`);
  console.log(`- Detailed Report: ${path.relative(process.cwd(), scorePath)}`);
  console.log(`================================================================================\n`);
}

// 8. simulation-status
function handleSimulationStatus(simId: string) {
  const attempts = loadAttempts();
  const attempt = attempts[simId];
  if (!attempt) {
    console.error(`❌ Simulation Attempt ID "${simId}" not found.`);
    process.exit(1);
  }

  console.log(`\n🔍 SIMULATION SESSION STATUS`);
  console.log('================================================================================');
  console.log(`- Simulation ID: ${attempt.id}`);
  console.log(`- Scenario ID:   ${attempt.scenarioId}`);
  console.log(`- Operator:      ${attempt.operator}`);
  console.log(`- Status:        ${attempt.status}`);
  console.log(`- Verdict:       ${attempt.verdict}`);
  console.log(`- Final Score:   ${attempt.finalScore}%`);
  console.log(`- Graded At:     ${attempt.gradedAt || 'N/A'}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`- Current Logs / Progress Notes:\n  ${attempt.notes}`);
  console.log('================================================================================\n');
}

// 9. latest
function handleLatest() {
  const attempts = loadAttempts();
  const attemptsList = Object.values(attempts);
  if (attemptsList.length === 0) {
    console.log('No simulation attempts logged yet.');
    return;
  }
  attemptsList.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  handleSimulationStatus(attemptsList[0].id);
}

// 10. list-attempts
function handleListAttempts() {
  const attempts = loadAttempts();
  const attemptsList = Object.values(attempts);
  if (attemptsList.length === 0) {
    console.log('No simulation attempts found.');
    return;
  }

  console.log(`\n📋 REGISTERED OPERATOR SIMULATION ATTEMPTS`);
  console.log('================================================================================');
  attemptsList.forEach(a => {
    console.log(`- Sim ID:    \x1b[32m${a.id}\x1b[0m (${a.scenarioId})`);
    console.log(`  Operator:  ${a.operator} | Verdict: ${a.verdict}`);
    console.log(`  Score:     ${a.finalScore}% | Status: ${a.status}`);
    console.log('--------------------------------------------------------------------------------');
  });
  console.log('================================================================================\n');
}

// 11. training-summary
function handleTrainingSummary() {
  const scenarios = loadScenarios();
  const attempts = loadAttempts();
  const attemptsList = Object.values(attempts);

  const scenariosListStr = scenarios.map(sc => 
    `- **${sc.title}** (ID: \`${sc.id}\`) - Threshold: ${sc.passThreshold}%`
  ).join('\n');

  const attemptsListStr = attemptsList.length > 0
    ? attemptsList.map(a => 
        `- Attempt \`${a.id}\` | Scenario: \`${a.scenarioId}\` | Verdict: **${a.verdict}** (${a.finalScore}%) | Status: ${a.status}`
      ).join('\n')
    : '_None Logged_';

  const summaryContent = fillTemplate('voice-ops-training-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    SCENARIOS_LIST: scenariosListStr,
    ATTEMPTS_LIST: attemptsListStr,
    MUTATION_VERDICT: PRODUCTION_MUTATION_ALLOWED ? '⚠️ ACTIVE (CRITICAL FAILURE)' : '✅ LOCKED (Safe)',
    DISPATCH_GUARD: LIVE_COMMAND_EXECUTION_ALLOWED ? '⚠️ ACTIVE (CRITICAL FAILURE)' : '✅ LOCKED (Safe)'
  });

  const reportPath = path.join(REPORTS_DIR, `training_summary_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(reportPath, summaryContent, 'utf-8');

  console.log(summaryContent);
  console.log(`\n📝 Training summary compiled and saved to: ${path.relative(process.cwd(), reportPath)}`);
  logEvent('SUMMARY_GENERATED', `Compiled training runs summary report at ${reportPath}`);
}

// 12. training-log
function handleTrainingLog() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No simulation log events written yet.');
    return;
  }
  const logs = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const last20 = logs.slice(-20);
  console.log(`\n📋 Recent Operator Simulation Activity Logs:`);
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
    if (parsedArgs[i] === '--response') {
      options.response = parsedArgs[i + 1] ? parsedArgs[i + 1].trim() : '';
      i++;
      continue;
    }
    positionalArgs.push(parsedArgs[i]);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'generate-scenarios':
      handleGenerateScenarios();
      break;
    case 'list-scenarios':
      handleListScenarios();
      break;
    case 'inspect-scenario':
      handleInspectScenario(positionalArgs[1] || '');
      break;
    case 'start-simulation':
      handleStartSimulation(positionalArgs[1] || '');
      break;
    case 'answer-step':
      handleAnswerStep(positionalArgs[1] || '', positionalArgs[2] || '', options.response || '');
      break;
    case 'score-simulation':
      handleScoreSimulation(positionalArgs[1] || '');
      break;
    case 'simulation-status':
      handleSimulationStatus(positionalArgs[1] || '');
      break;
    case 'latest':
      handleLatest();
      break;
    case 'list-attempts':
      handleListAttempts();
      break;
    case 'training-summary':
      handleTrainingSummary();
      break;
    case 'training-log':
      handleTrainingLog();
      break;
    default:
      console.error(`❌ Error: Unknown training simulation command "${command}".`);
      console.log('💡 Use: npm run voice-ops-training-simulation-help for usage info.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error in training simulation: ${err}`);
  process.exit(1);
});
