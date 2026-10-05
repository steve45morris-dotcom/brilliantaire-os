import * as fs from 'fs';
import * as path from 'path';
import {
  TRAINING_SCENARIOS_DIR,
  TRAINING_ATTEMPTS_DIR,
  LEDGER_ROOT,
  LEDGER_DIR,
  LEDGER_RECORDS_DIR,
  LEDGER_REPORTS_DIR,
  LEDGER_LOGS_DIR,
  LEDGER_EXPORTS_DIR,
  MINIMUM_PASSING_SCORE,
  REQUIRED_SCENARIO_COUNT,
  REQUIRED_EMERGENCY_SCENARIO,
  CERTIFICATION_VALIDITY_DAYS,
  SIMULATION_EVIDENCE_REQUIRED,
  PRODUCTION_MUTATION_ALLOWED,
  LIVE_COMMAND_EXECUTION_ALLOWED,
  AUTO_CERTIFY
} from '../config/voice-ops-certification-ledger.config.js';

// Ensure directories exist
const dirs = [LEDGER_ROOT, LEDGER_DIR, LEDGER_RECORDS_DIR, LEDGER_REPORTS_DIR, LEDGER_LOGS_DIR, LEDGER_EXPORTS_DIR];
dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const LOG_FILE = path.join(LEDGER_LOGS_DIR, 'voice_ops_certification_ledger.log');
const SNAPSHOT_JSON_FILE = path.join(LEDGER_ROOT, 'dashboard_certification_snapshot.json');
const LEDGER_DB_FILE = path.join(LEDGER_DIR, 'certification_ledger.json');

function logEvent(event: string, details: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] CERT_EVENT: ${event} | DETAILS: ${details}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

function fillTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.resolve(process.cwd(), 'templates/voice_ops_certification_ledger', templateName);
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
interface ScenarioInfo {
  id: string;
  title: string;
  passThreshold: number;
}

interface AttemptInfo {
  id: string;
  scenarioId: string;
  operator: string;
  startedAt: string;
  status: string;
  finalScore: number;
  verdict: string;
  hasViolation: boolean;
}

interface Certification {
  operatorName: string;
  certificateId: string;
  issuedDate: string;
  expiryDate: string;
  signer: string;
  level: 'Trainee' | 'Operator Ready' | 'Safety Certified' | 'Renewal Due' | 'Expired';
  averageScore: number;
  coverageCount: number;
  notes: string;
}

// Read simulation data safely
function getScenariosList(): ScenarioInfo[] {
  const scIndexFile = path.join(process.cwd(), 'outputs/narrator/voice_ops_training_simulation/mock_data/scenarios_index.json');
  if (fs.existsSync(scIndexFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(scIndexFile, 'utf-8'));
      return data.map((s: any) => ({ id: s.id, title: s.title, passThreshold: s.passThreshold }));
    } catch {}
  }
  return [];
}

function getAttemptsList(): AttemptInfo[] {
  const attIndexFile = path.join(process.cwd(), 'outputs/narrator/voice_ops_training_simulation/mock_data/attempts_index.json');
  if (fs.existsSync(attIndexFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(attIndexFile, 'utf-8'));
      return Object.values(data).map((a: any) => {
        let hasViolation = false;
        if (a.answers) {
          hasViolation = a.answers.some((ans: any) => ans.feedback && ans.feedback.includes('BREACH'));
        }
        return {
          id: a.id,
          scenarioId: a.scenarioId,
          operator: a.operator,
          startedAt: a.startedAt,
          status: a.status,
          finalScore: a.finalScore,
          verdict: a.verdict,
          hasViolation
        };
      });
    } catch {}
  }
  return [];
}

function loadLedger(): Record<string, Certification> {
  if (fs.existsSync(LEDGER_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LEDGER_DB_FILE, 'utf-8'));
    } catch {}
  }
  return {};
}

function saveLedger(ledger: Record<string, Certification>) {
  fs.writeFileSync(LEDGER_DB_FILE, JSON.stringify(ledger, null, 2), 'utf-8');
}

// Calculate level and validity state
function evaluateCertificationState(cert: Certification): 'Trainee' | 'Operator Ready' | 'Safety Certified' | 'Renewal Due' | 'Expired' {
  const now = Date.now();
  const expiry = new Date(cert.expiryDate).getTime();
  const validityDaysMs = CERTIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
  const renewalWindowMs = 7 * 24 * 60 * 60 * 1000;

  if (now >= expiry) {
    return 'Expired';
  } else if (expiry - now <= renewalWindowMs) {
    return 'Renewal Due';
  }
  return cert.level;
}

// Ingestion telemetry database mapping
function exportDashboardTelemetry() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);
  const attempts = getAttemptsList();

  let latestCert: Certification | undefined;
  let renewalDueCount = 0;

  if (certs.length > 0) {
    certs.forEach(c => {
      c.level = evaluateCertificationState(c);
      if (c.level === 'Renewal Due' || c.level === 'Expired') {
        renewalDueCount++;
      }
    });
    // Sort to get latest
    certs.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
    latestCert = certs[0];
  }

  const passedAttempts = attempts.filter(a => a.verdict === 'PASS').length;
  const failedAttempts = attempts.filter(a => a.verdict === 'FAIL').length;

  const snapshot = {
    timestamp: new Date().toISOString(),
    attemptCount: attempts.length,
    passedAttemptCount: passedAttempts,
    failedAttemptCount: failedAttempts,
    latestOperatorName: latestCert ? latestCert.operatorName : 'None',
    latestCertificationLevel: latestCert ? latestCert.level : 'N/A',
    latestCertificationExpiry: latestCert ? latestCert.expiryDate : 'N/A',
    renewalDueCount: renewalDueCount,
    simulationEvidenceRequired: SIMULATION_EVIDENCE_REQUIRED,
    liveCommandExecutionAllowed: LIVE_COMMAND_EXECUTION_ALLOWED,
    productionMutationAllowed: PRODUCTION_MUTATION_ALLOWED,
    recommendedNextPhase: 'Phase N5X: Operator Recertification and Drill Rotation Scheduler'
  };

  fs.writeFileSync(SNAPSHOT_JSON_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Copy to Vite public directory if it exists
  const publicDir = path.join(process.cwd(), 'dashboard/public');
  if (fs.existsSync(publicDir)) {
    const publicPath = path.join(publicDir, 'dashboard_certification_snapshot.json');
    fs.writeFileSync(publicPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  }
}

// 1. status
function handleStatus() {
  const attempts = getAttemptsList();
  const ledger = loadLedger();
  const certs = Object.values(ledger);

  let latestCert: Certification | undefined;
  if (certs.length > 0) {
    certs.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
    latestCert = certs[0];
  }

  const statusContent = fillTemplate('voice-ops-certification-status-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LEDGER_ROOT: path.relative(process.cwd(), LEDGER_ROOT),
    LEDGER_RECORDS_DIR: path.relative(process.cwd(), LEDGER_RECORDS_DIR),
    LEDGER_DIR: path.relative(process.cwd(), LEDGER_DIR),
    LEDGER_REPORTS_DIR: path.relative(process.cwd(), LEDGER_REPORTS_DIR),
    MINIMUM_PASSING_SCORE: String(MINIMUM_PASSING_SCORE),
    REQUIRED_SCENARIO_COUNT: String(REQUIRED_SCENARIO_COUNT),
    REQUIRED_EMERGENCY_SCENARIO: REQUIRED_EMERGENCY_SCENARIO,
    CERTIFICATION_VALIDITY_DAYS: String(CERTIFICATION_VALIDITY_DAYS),
    LIVE_COMMAND_EXECUTION_ALLOWED: LIVE_COMMAND_EXECUTION_ALLOWED ? 'ALLOWED (Unsafe)' : 'LOCKED (Safe)',
    PRODUCTION_MUTATION_ALLOWED: PRODUCTION_MUTATION_ALLOWED ? 'ALLOWED (Unsafe)' : 'LOCKED (Safe)',
    ATTEMPTS_COUNT: String(attempts.length),
    CERTIFICATIONS_COUNT: String(certs.length),
    LATEST_OPERATOR: latestCert ? latestCert.operatorName : 'None',
    LATEST_LEVEL: latestCert ? latestCert.level : 'N/A',
    LATEST_EXPIRY: latestCert ? latestCert.expiryDate : 'N/A'
  });

  console.log(statusContent);
  logEvent('STATUS_CHECKED', `Reported stats for ${attempts.length} attempts and ${certs.length} certifications.`);
}

// 2. scan-attempts
function handleScanAttempts() {
  const attempts = getAttemptsList();
  console.log(`\n🔍 INGESTING VOICE OPS TRAINING SIMULATION ATTEMPTS`);
  console.log('================================================================================');
  if (attempts.length === 0) {
    console.log('No simulation attempts evidence found in training folders.');
    console.log('================================================================================\n');
    return;
  }

  const passed = attempts.filter(a => a.verdict === 'PASS');
  const failed = attempts.filter(a => a.verdict === 'FAIL');
  const inProgress = attempts.filter(a => a.status === 'IN_PROGRESS');

  console.log(`- Ingested Attempts:  ${attempts.length}`);
  console.log(`- Passed Drill Sessions: ${passed.length} ✅`);
  console.log(`- Failed Drill Sessions: ${failed.length} ❌`);
  console.log(`- In-Progress Sessions:  ${inProgress.length} ⏳`);
  console.log('--------------------------------------------------------------------------------');
  attempts.forEach(a => {
    console.log(`- Attempt ID: ${a.id} | Scenario: ${a.scenarioId} | Operator: ${a.operator}`);
    console.log(`  Verdict:    ${a.verdict} | Score: ${a.finalScore}% | Safety Violations: ${a.hasViolation ? '⚠️ YES (Breached)' : 'NO'}`);
  });
  console.log('================================================================================\n');
  logEvent('ATTEMPTS_SCANNED', `Found ${attempts.length} attempts, ${passed.length} passed, ${failed.length} failed.`);
}

// 3. inspect-attempt
function handleInspectAttempt(simId: string) {
  const attempts = getAttemptsList();
  const att = attempts.find(a => a.id === simId);
  if (!att) {
    console.error(`❌ Simulation Attempt ID "${simId}" not found.`);
    process.exit(1);
  }

  const content = fillTemplate('voice-ops-certification-attempt-inspect-template.md', {
    SIMULATION_ID: att.id,
    SCENARIO_ID: att.scenarioId,
    OPERATOR: att.operator,
    TIMESTAMP: att.startedAt,
    SCORE: String(att.finalScore),
    VERDICT: att.verdict,
    VIOLATION: att.hasViolation ? 'CRITICAL SAFETY BREACH (Forbidden Actions Used)' : 'None detected'
  });

  console.log(content);
  logEvent('ATTEMPT_INSPECTED', `Inspected attempt ${simId}`);
}

// Core evaluation processor
function processOperatorEvaluation(operatorName: string) {
  const scenarios = getScenariosList();
  const attempts = getAttemptsList().filter(a => a.operator.toLowerCase() === operatorName.toLowerCase());

  // Find latest passed score for each scenario
  const scenarioScores: Record<string, number> = {};
  const scenarioViolations: Record<string, boolean> = {};

  scenarios.forEach(sc => {
    const scAttempts = attempts.filter(a => a.scenarioId === sc.id && a.verdict === 'PASS');
    if (scAttempts.length > 0) {
      // Sort by start timestamp descending to get latest
      scAttempts.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      scenarioScores[sc.id] = scAttempts[0].finalScore;
      scenarioViolations[sc.id] = scAttempts[0].hasViolation;
    }
  });

  const attemptedCount = scenarios.filter(sc => attempts.some(a => a.scenarioId === sc.id)).length;
  const passedScenarios = scenarios.filter(sc => scenarioScores[sc.id] !== undefined);
  const failedScenariosCount = scenarios.filter(sc => attempts.some(a => a.scenarioId === sc.id && a.verdict === 'FAIL')).length;

  const totalPassedScore = Object.values(scenarioScores).reduce((sum, s) => sum + s, 0);
  const averageScore = passedScenarios.length > 0 
    ? Math.round(totalPassedScore / passedScenarios.length) 
    : 0;

  const emergencyDrillPassed = scenarioScores[REQUIRED_EMERGENCY_SCENARIO] !== undefined && scenarioScores[REQUIRED_EMERGENCY_SCENARIO] >= MINIMUM_PASSING_SCORE;
  const coverageCount = passedScenarios.length;

  const allScenariosPassed = coverageCount >= REQUIRED_SCENARIO_COUNT;
  const anyViolation = Object.values(scenarioViolations).some(v => v === true);

  let level: 'Trainee' | 'Operator Ready' | 'Safety Certified' = 'Trainee';
  let eligible = false;
  let recommendation = 'Complete all 10 required simulation drills and pass the emergency stop drill.';

  if (allScenariosPassed && emergencyDrillPassed && averageScore >= MINIMUM_PASSING_SCORE) {
    eligible = true;
    if (averageScore >= 90 && !anyViolation) {
      level = 'Safety Certified';
      recommendation = 'Eligible for Safety Certified status. Operator demonstrated deep compliance with zero safety breaches.';
    } else {
      level = 'Operator Ready';
      recommendation = 'Eligible for Operator Ready status. Maintain manual-first checklists to achieve Safety Certified status.';
    }
  }

  return {
    scenarios,
    scenarioScores,
    attemptedCount,
    passedCount: coverageCount,
    failedCount: failedScenariosCount,
    averageScore,
    emergencyDrillPassed,
    level,
    eligible,
    recommendation,
    anyViolation
  };
}

// 4. evaluate-operator
function handleEvaluateOperator(operatorName: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }

  const evalResult = processOperatorEvaluation(operatorName);

  const checklistArray = evalResult.scenarios.map(sc => {
    const score = evalResult.scenarioScores[sc.id];
    const statusMark = score !== undefined ? `✅ Passed (${score}%)` : '❌ Missing';
    return `- [ ] **${sc.title}** (ID: \`${sc.id}\`): ${statusMark}`;
  });

  const evaluationContent = fillTemplate('voice-ops-certification-evaluation-template.md', {
    OPERATOR_NAME: operatorName,
    EVALUATION_DATE: new Date().toISOString(),
    ATTEMPTED_COUNT: String(evalResult.attemptedCount),
    REQUIRED_COUNT: String(REQUIRED_SCENARIO_COUNT),
    PASSED_COUNT: String(evalResult.passedCount),
    FAILED_COUNT: String(evalResult.failedCount),
    AVERAGE_SCORE: String(evalResult.averageScore),
    EMERGENCY_DRILL_PASSED: evalResult.emergencyDrillPassed ? 'PASSED ✅' : 'FAILED ❌',
    SCENARIOS_CHECKLIST: checklistArray.join('\n'),
    LEVEL: evalResult.level,
    STATUS: evalResult.eligible ? 'QUALIFIED' : 'NOT QUALIFIED (Insufficient evidence)',
    RECOMMENDATION: evalResult.recommendation
  });

  console.log(evaluationContent);
  logEvent('OPERATOR_EVALUATED', `Evaluated operator ${operatorName}. Level: ${evalResult.level}. Qualified: ${evalResult.eligible}`);
  
  return evalResult;
}

// 5. create-certification
function handleCreateCertification(operatorName: string, signer: string, note: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }
  if (!signer) {
    console.error('❌ Error: Missing --signer name. Certification sign-off requires a human validator name.');
    process.exit(1);
  }
  if (!note) {
    console.error('❌ Error: Missing --note. Certification sign-off requires auditable validation notes.');
    process.exit(1);
  }

  console.log(`\n⏳ Checking training evidence guidelines for operator "${operatorName}"...`);
  const evalResult = processOperatorEvaluation(operatorName);

  if (!evalResult.eligible) {
    console.error(`\n❌ Error: Certification DENIED due to incomplete training evidence.`);
    console.error(`- Average Score:     ${evalResult.averageScore}% (Passing threshold: ${MINIMUM_PASSING_SCORE}%)`);
    console.error(`- Covered Scenarios: ${evalResult.passedCount}/${REQUIRED_SCENARIO_COUNT}`);
    console.error(`- Emergency Drill:   ${evalResult.emergencyDrillPassed ? 'PASS' : 'FAIL (Mandatory)'}`);
    console.error(`- Recommendation:    ${evalResult.recommendation}\n`);

    // Log validation error report
    const errorReportContent = fillTemplate('voice-ops-certification-error-template.md', {
      TIMESTAMP: new Date().toISOString(),
      OPERATOR_NAME: operatorName,
      TRIGGER: 'Create Certification Request',
      MISSING_EVIDENCE: `Coverage: ${evalResult.passedCount}/${REQUIRED_SCENARIO_COUNT} passed. Emergency stop drill: ${evalResult.emergencyDrillPassed ? 'PASS' : 'FAIL'}. Average Score: ${evalResult.averageScore}%`
    });

    const errorPath = path.join(LEDGER_REPORTS_DIR, `certification_error_${operatorName.toLowerCase()}_${Math.floor(Date.now() / 1000)}.md`);
    fs.writeFileSync(errorPath, errorReportContent, 'utf-8');

    logEvent('CERTIFICATION_DENIED', `Blocked certificate for ${operatorName}. Coverage: ${evalResult.passedCount}. Avg: ${evalResult.averageScore}%`);
    exportDashboardTelemetry();
    
    // Provide local placeholder report
    console.log(`💡 Local evaluation report generated detailing missing drill metrics at:`);
    console.log(`   ${path.relative(process.cwd(), errorPath)}\n`);
    process.exit(1);
  }

  // Issue certification record
  const certId = `cert_${operatorName.toLowerCase()}_${Math.floor(Date.now() / 1000)}`;
  const issuedDate = new Date().toISOString().split('T')[0];
  const expiryDate = new Date(Date.now() + CERTIFICATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newCert: Certification = {
    operatorName,
    certificateId: certId,
    issuedDate,
    expiryDate,
    signer,
    level: evalResult.level,
    averageScore: evalResult.averageScore,
    coverageCount: evalResult.passedCount,
    notes: note
  };

  // Save Record
  const ledger = loadLedger();
  ledger[operatorName.toLowerCase()] = newCert;
  saveLedger(ledger);

  const certMarkdown = fillTemplate('voice-ops-certification-record-template.md', {
    OPERATOR_NAME: operatorName,
    CERTIFICATE_ID: certId,
    ISSUED_DATE: issuedDate,
    EXPIRY_DATE: expiryDate,
    SIGNER: signer,
    LEVEL: newCert.level,
    AVERAGE_SCORE: String(newCert.averageScore),
    COVERAGE_COUNT: String(newCert.coverageCount),
    NOTE: note
  });

  const certPath = path.join(LEDGER_RECORDS_DIR, `${operatorName.toLowerCase()}_cert.md`);
  fs.writeFileSync(certPath, certMarkdown, 'utf-8');

  // JSON record copy
  fs.writeFileSync(path.join(LEDGER_RECORDS_DIR, `${operatorName.toLowerCase()}_cert.json`), JSON.stringify(newCert, null, 2), 'utf-8');

  console.log(`\n📜 Certification ISSUED successfully!`);
  console.log(`================================================================================`);
  console.log(`- Operator Name:  \x1b[32m${operatorName}\x1b[0m`);
  console.log(`- Certificate ID: ${certId}`);
  console.log(`- Level Issued:   \x1b[36m${newCert.level}\x1b[0m`);
  console.log(`- Average Score:  ${newCert.averageScore}%`);
  console.log(`- Expiration:     ${expiryDate} (Validity: ${CERTIFICATION_VALIDITY_DAYS} Days)`);
  console.log(`- Sign-off:       Signed by ${signer}`);
  console.log(`- Ledger Record:  ${path.relative(process.cwd(), certPath)}`);
  console.log(`================================================================================\n`);

  logEvent('CERTIFICATION_ISSUED', `Certificate ${certId} issued to ${operatorName} by ${signer}. Level: ${newCert.level}`);
  exportDashboardTelemetry();
}

// 6. certification-status
function handleCertificationStatus(operatorName: string) {
  if (!operatorName) {
    console.error('❌ Error: Missing operator name.');
    process.exit(1);
  }

  const ledger = loadLedger();
  const cert = ledger[operatorName.toLowerCase()];
  if (!cert) {
    console.log(`\n❌ No certification records found in the ledger database for operator "${operatorName}".`);
    console.log(`💡 Tip: Run evaluate-operator to check qualifying training attempts.\n`);
    return;
  }

  cert.level = evaluateCertificationState(cert);

  console.log(`\n📜 OPERATOR CERTIFICATE RECORD`);
  console.log('================================================================================');
  console.log(`- Operator Name:      ${cert.operatorName}`);
  console.log(`- Certificate ID:     ${cert.certificateId}`);
  console.log(`- Level:              ${cert.level}`);
  console.log(`- Average Score:      ${cert.averageScore}%`);
  console.log(`- Coverage Scenarios: ${cert.coverageCount}/${REQUIRED_SCENARIO_COUNT}`);
  console.log(`- Issued On:          ${cert.issuedDate}`);
  console.log(`- Expiration Date:    ${cert.expiryDate}`);
  console.log(`- Signer Validator:   ${cert.signer}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`- Validation Sign-off Notes:\n  ${cert.notes}`);
  console.log('================================================================================\n');
}

// 7. list-certifications
function handleListCertifications() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);
  console.log(`\n📋 REGISTERED OPERATOR CERTIFICATIONS`);
  console.log('================================================================================');
  if (certs.length === 0) {
    console.log('No operator certifications found in the ledger database.');
    console.log('================================================================================\n');
    return;
  }

  certs.forEach(c => {
    c.level = evaluateCertificationState(c);
    console.log(`- Operator:   \x1b[32m${c.operatorName}\x1b[0m (${c.level})`);
    console.log(`  ID:         ${c.certificateId} | Avg Score: ${c.averageScore}%`);
    console.log(`  Validity:   ${c.issuedDate} to ${c.expiryDate} | Signer: ${c.signer}`);
    console.log('--------------------------------------------------------------------------------');
  });
  console.log('================================================================================\n');
  logEvent('CERTIFICATIONS_LISTED', `Displayed ${certs.length} records.`);
}

// 8. latest
function handleLatest() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);
  if (certs.length === 0) {
    console.log('No certifications registered yet.');
    return;
  }
  certs.sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  handleCertificationStatus(certs[0].operatorName);
}

// 9. renewal-review
function handleRenewalReview() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);
  const renewalLines: string[] = [];

  console.log(`\n⏳ CERTIFICATION RENEWAL STATUS REVIEW`);
  console.log('================================================================================');
  if (certs.length === 0) {
    console.log('No certification records to review.');
    console.log('================================================================================\n');
    return;
  }

  certs.forEach(c => {
    c.level = evaluateCertificationState(c);
    const now = Date.now();
    const expiry = new Date(c.expiryDate).getTime();
    const remainingDays = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));

    let alertMark = '✅ Safe';
    if (c.level === 'Expired') {
      alertMark = '❌ EXPIRED (Action Required: Recertify Operator)';
    } else if (c.level === 'Renewal Due') {
      alertMark = `⚠️ RENEWAL DUE (${remainingDays} Days remaining)`;
    }

    console.log(`- Operator: \x1b[32m${c.operatorName}\x1b[0m | ID: ${c.certificateId}`);
    console.log(`  Expiry:   ${c.expiryDate} (${remainingDays} days remaining) | Level: ${c.level}`);
    console.log(`  Status:   ${alertMark}`);
    console.log('--------------------------------------------------------------------------------');

    renewalLines.push(`- **${c.operatorName}** (ID: \`${c.certificateId}\`) - Expiry: ${c.expiryDate} | Level: **${c.level}** (${alertMark})`);
  });
  console.log('================================================================================\n');

  const content = fillTemplate('voice-ops-certification-renewal-template.md', {
    TIMESTAMP: new Date().toISOString(),
    RENEWALS_LIST: renewalLines.join('\n'),
    CERT_VALIDITY: String(CERTIFICATION_VALIDITY_DAYS)
  });

  const renewalReportPath = path.join(LEDGER_REPORTS_DIR, `renewal_review_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(renewalReportPath, content, 'utf-8');

  logEvent('RENEWAL_REVIEW_COMPLETED', `Performed renewal check on ${certs.length} records. Saved to ${renewalReportPath}`);
}

// 10. export-ledger
function handleExportLedger() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);

  const entriesMarkdown = certs.map(c => {
    c.level = evaluateCertificationState(c);
    return `### Operator: ${c.operatorName}\n- Certificate ID: \`${c.certificateId}\`\n- Level: **${c.level}**\n- Average Score: ${c.averageScore}%\n- Range Coverage: ${c.coverageCount}/${REQUIRED_SCENARIO_COUNT}\n- Issued: ${c.issuedDate} | Expiry: ${c.expiryDate}\n- Signer Validator: ${c.signer}\n- Note: "${c.notes}"\n`;
  }).join('\n');

  const mdLedgerContent = fillTemplate('voice-ops-certification-ledger-export-template.md', {
    TIMESTAMP: new Date().toISOString(),
    LEDGER_ENTRIES: entriesMarkdown.length > 0 ? entriesMarkdown : '_No Certified Operators Registered_'
  });

  const exportMdPath = path.join(LEDGER_EXPORTS_DIR, `certification_ledger_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(exportMdPath, mdLedgerContent, 'utf-8');

  // JSON Export Copy
  const exportJsonPath = path.join(LEDGER_EXPORTS_DIR, `certification_ledger_${Math.floor(Date.now() / 1000)}.json`);
  fs.writeFileSync(exportJsonPath, JSON.stringify(ledger, null, 2), 'utf-8');

  console.log(`✅ Certification Ledger database exported successfully.`);
  console.log(`   Markdown Export: ${path.relative(process.cwd(), exportMdPath)}`);
  console.log(`   JSON Export:     ${path.relative(process.cwd(), exportJsonPath)}`);

  logEvent('LEDGER_EXPORTED', `Exported markdown and json database ledgers.`);
}

// 11. certification-summary
function handleCertificationSummary() {
  const ledger = loadLedger();
  const certs = Object.values(ledger);

  const certsListStr = certs.length > 0
    ? certs.map(c => {
        c.level = evaluateCertificationState(c);
        return `- Operator: \`${c.operatorName}\` | Level: **${c.level}** | Certificate: \`${c.certificateId}\` | Issued: ${c.issuedDate}`;
      }).join('\n')
    : '_No Certified Operators Registered_';

  const summaryContent = fillTemplate('voice-ops-certification-summary-template.md', {
    TIMESTAMP: new Date().toISOString(),
    CERTIFICATIONS_LIST: certsListStr,
    BLOCKER_VERDICT: SIMULATION_EVIDENCE_REQUIRED ? '✅ ACTIVE (Locked)' : '⚠️ BYPASSED',
    MUTATION_VERDICT: PRODUCTION_MUTATION_ALLOWED ? '⚠️ ACTIVE (CRITICAL FAILURE)' : '✅ LOCKED (Safe)'
  });

  const summaryReportPath = path.join(LEDGER_REPORTS_DIR, `certification_summary_${Math.floor(Date.now() / 1000)}.md`);
  fs.writeFileSync(summaryReportPath, summaryContent, 'utf-8');

  console.log(summaryContent);
  console.log(`\n📝 Summary report compiled and saved to: ${path.relative(process.cwd(), summaryReportPath)}`);
  logEvent('SUMMARY_GENERATED', `Compiled certifications summary report at ${summaryReportPath}`);
}

// 12. certification-log
function handleCertificationLog() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No ledger events written yet.');
    return;
  }
  const logs = fs.readFileSync(LOG_FILE, 'utf-8').trim().split('\n');
  const last20 = logs.slice(-20);
  console.log(`\n📋 Recent Operator Certification Activity Logs:`);
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

  try {
    exportDashboardTelemetry();
  } catch (err) {
    console.error(`Failed to update dashboard telemetry: ${err}`);
  }

  const command = positionalArgs[0] ? positionalArgs[0].trim() : '';

  switch (command) {
    case 'status':
      handleStatus();
      break;
    case 'scan-attempts':
      handleScanAttempts();
      break;
    case 'inspect-attempt':
      handleInspectAttempt(positionalArgs[1] || '');
      break;
    case 'evaluate-operator':
      handleEvaluateOperator(positionalArgs[1] || '');
      break;
    case 'create-certification':
      handleCreateCertification(positionalArgs[1] || '', options.signer || '', options.note || '');
      break;
    case 'certification-status':
      handleCertificationStatus(positionalArgs[1] || '');
      break;
    case 'list-certifications':
      handleListCertifications();
      break;
    case 'latest':
      handleLatest();
      break;
    case 'renewal-review':
      handleRenewalReview();
      break;
    case 'export-ledger':
      handleExportLedger();
      break;
    case 'certification-summary':
      handleCertificationSummary();
      break;
    case 'certification-log':
      handleCertificationLog();
      break;
    default:
      console.error(`❌ Error: Unknown certification ledger command "${command}".`);
      console.log('💡 Use: npm run voice-ops-certification-ledger-help for usage info.');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`Fatal runtime error in certification ledger: ${err}`);
  process.exit(1);
});
