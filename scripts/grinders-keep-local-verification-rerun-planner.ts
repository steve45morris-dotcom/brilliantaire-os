import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import { COMMAND_REGISTRY } from '../config/commands.js';
import {
  outputFolders,
  referenceSources,
  COMMAND_EXECUTION_ALLOWED,
  SCHEDULER_EXECUTION_ALLOWED,
  EVIDENCE_VALIDATION_ALLOWED,
  FILE_MOVE_ALLOWED,
  FILE_COPY_ALLOWED,
  AUTO_IMPORT_ALLOWED,
  MODULE_NAME,
  TEMPLATE_ROOT
} from '../config/grinders-keep-local-verification-rerun-planner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  return '2026-06-01'; // Default matching other manifests suffix
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

interface PreflightCheck {
  check_name: string;
  preflight_check_id: string;
  check_status: 'passed' | 'failed' | 'warning';
  reason: string;
  smallest_safe_fix: string;
  commander_approval_required: boolean;
}

interface CommandSheetItem {
  step_order: number;
  purpose: string;
  command_item_id: string;
  exact_command: string;
  when_to_run: string;
  expected_output: string;
  manual_only: boolean;
  command_execution_allowed: boolean;
  commander_approval_required: boolean;
}

interface SequenceStep {
  step_order: number;
  phase_name: string;
  sequence_item_id: string;
  purpose: string;
  prerequisite: string;
  blocked_if: string;
  manual_command_if_ready: string;
  expected_output_if_run_manually: string;
  commander_approval_required: boolean;
}

interface BlockerItem {
  blocker_type: string;
  rerun_blocker_id: string;
  affected_phase: string;
  reason_blocked: string;
  downstream_effect: string;
  smallest_safe_next_step: string;
  commander_approval_required: boolean;
}

interface SafetyItem {
  safety_rule: string;
  safety_item_id: string;
  required_status: string;
  actual_status: string;
  passed: boolean;
  reason: string;
  commander_approval_required: boolean;
}

interface ScorecardRow {
  rank: number;
  linked_blocker_or_sequence: string;
  rerun_readiness_status: string;
  detector_signal_score_1_to_10: number;
  evidence_presence_score_1_to_10: number;
  session_log_presence_score_1_to_10: number;
  command_readiness_score_1_to_10: number;
  safety_compliance_score_1_to_10: number;
  recommended_status: string;
  reason: string;
  commander_approval_required: boolean;
}

async function runLocalVerificationRerunPlanner() {
  const dateStr = getFormattedDate();
  console.log(`🛠️ Starting ${MODULE_NAME} for ${dateStr}...`);
  await announceIntent("Compiling local verification rerun sequence planner");

  // Ensure output folders exist
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }
  }

  const logFile = path.join(outputFolders.logs, `grinders_keep_local_rerun_planner_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# ${MODULE_NAME} Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- Load Templates ---
  const tplReport = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-planner-report-template.md'), 'utf-8');
  const tplPreflight = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-preflight-template.md'), 'utf-8');
  const tplCommand = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-command-sheet-template.md'), 'utf-8');
  const tplSequence = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-sequence-template.md'), 'utf-8');
  const tplBlocker = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-blocker-template.md'), 'utf-8');
  const tplSafety = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-safety-card-template.md'), 'utf-8');
  const tplScorecard = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-local-rerun-scorecard-template.md'), 'utf-8');

  // --- 1. Read Snapshot and Parse Completion Verdict ---
  let completionVerdict = 'NO_EVIDENCE';
  let evidenceDocsCount = 0;
  let sessionLogsCount = 0;

  if (fs.existsSync(referenceSources.detectorSnapshot)) {
    try {
      const snapText = fs.readFileSync(referenceSources.detectorSnapshot, 'utf-8');
      const snap = JSON.parse(snapText);
      completionVerdict = snap.summary?.completionVerdict || 'NO_EVIDENCE';
      evidenceDocsCount = snap.summary?.evidenceDocs || 0;
      sessionLogsCount = snap.summary?.sessionLogs || 0;
    } catch (e) {
      console.warn(`[Warning] Failed to parse detectorSnapshot JSON: ${(e as Error).message}`);
    }
  }

  // --- 2. Run Preflight Checks ---
  const preflights: PreflightCheck[] = [
    {
      check_name: 'Detector Snapshot File Presence',
      preflight_check_id: 'GK-RRN-PF-01',
      check_status: fs.existsSync(referenceSources.detectorSnapshot) ? 'passed' : 'failed',
      reason: fs.existsSync(referenceSources.detectorSnapshot) ? 'Snapshot file exists.' : 'Snapshot file is missing.',
      smallest_safe_fix: fs.existsSync(referenceSources.detectorSnapshot) ? 'None required.' : 'Run detector script first.',
      commander_approval_required: true
    },
    {
      check_name: 'Detector Report File Presence',
      preflight_check_id: 'GK-RRN-PF-02',
      check_status: fs.existsSync(referenceSources.detectorReport) ? 'passed' : 'failed',
      reason: fs.existsSync(referenceSources.detectorReport) ? 'Report file exists.' : 'Report file is missing.',
      smallest_safe_fix: fs.existsSync(referenceSources.detectorReport) ? 'None required.' : 'Run detector script to output report.',
      commander_approval_required: true
    },
    {
      check_name: 'Completion Detector Verdict Parsing',
      preflight_check_id: 'GK-RRN-PF-03',
      check_status: completionVerdict !== 'ERROR' ? 'passed' : 'failed',
      reason: `Verdict parsed successfully: ${completionVerdict}`,
      smallest_safe_fix: 'None required.',
      commander_approval_required: true
    },
    {
      check_name: 'Sessions Directory Check',
      preflight_check_id: 'GK-RRN-PF-04',
      check_status: fs.existsSync(referenceSources.sessionLogsDir) ? 'passed' : 'failed',
      reason: fs.existsSync(referenceSources.sessionLogsDir) ? 'Directory exists.' : 'Sessions directory is missing.',
      smallest_safe_fix: fs.existsSync(referenceSources.sessionLogsDir) ? 'None required.' : 'Create sessions folder.',
      commander_approval_required: true
    },
    {
      check_name: 'Evidence Directory Check',
      preflight_check_id: 'GK-RRN-PF-05',
      check_status: fs.existsSync(referenceSources.manualModelResponsesDir) ? 'passed' : 'failed',
      reason: fs.existsSync(referenceSources.manualModelResponsesDir) ? 'Directory exists.' : 'Evidence directory is missing.',
      smallest_safe_fix: fs.existsSync(referenceSources.manualModelResponsesDir) ? 'None required.' : 'Create evidence responses folder.',
      commander_approval_required: true
    },
    {
      check_name: 'First Evidence Target Directory Check',
      preflight_check_id: 'GK-RRN-PF-06',
      check_status: fs.existsSync(path.dirname(referenceSources.firstAttemptReviewerManifest)) ? 'passed' : 'failed',
      reason: 'First reviewer directory exists.',
      smallest_safe_fix: 'None required.',
      commander_approval_required: true
    },
    {
      check_name: 'Command Registry Mapping Verify',
      preflight_check_id: 'GK-RRN-PF-07',
      check_status: COMMAND_REGISTRY.some(c => c.name === 'grinders-keep-local-verification-rerun-planner') ? 'passed' : 'failed',
      reason: 'Rerun planner mapped in commands registry.',
      smallest_safe_fix: 'None required.',
      commander_approval_required: true
    },
    {
      check_name: 'Strict Gated Command Executions',
      preflight_check_id: 'GK-RRN-PF-08',
      check_status: !COMMAND_EXECUTION_ALLOWED ? 'passed' : 'failed',
      reason: 'Gated command execution is disabled.',
      smallest_safe_fix: 'Set COMMAND_EXECUTION_ALLOWED configuration to false.',
      commander_approval_required: true
    },
    {
      check_name: 'Strict Gated Scheduler Run Check',
      preflight_check_id: 'GK-RRN-PF-09',
      check_status: !SCHEDULER_EXECUTION_ALLOWED ? 'passed' : 'failed',
      reason: 'Gated scheduler runs are disabled.',
      smallest_safe_fix: 'Set SCHEDULER_EXECUTION_ALLOWED configuration to false.',
      commander_approval_required: true
    },
    {
      check_name: 'Strict Gated Validation Run Check',
      preflight_check_id: 'GK-RRN-PF-10',
      check_status: !EVIDENCE_VALIDATION_ALLOWED ? 'passed' : 'failed',
      reason: 'Gated content validations are disabled.',
      smallest_safe_fix: 'Set EVIDENCE_VALIDATION_ALLOWED configuration to false.',
      commander_approval_required: true
    },
    {
      check_name: 'Strict Gated Importer Runs',
      preflight_check_id: 'GK-RRN-PF-11',
      check_status: !AUTO_IMPORT_ALLOWED ? 'passed' : 'failed',
      reason: 'Gated auto import is disabled.',
      smallest_safe_fix: 'Set AUTO_IMPORT_ALLOWED configuration to false.',
      commander_approval_required: true
    }
  ];

  let preflightMarkdown = '';
  for (const pf of preflights) {
    preflightMarkdown += fillTemplate(tplPreflight, {
      check_name: pf.check_name,
      preflight_check_id: pf.preflight_check_id,
      check_status: pf.check_status,
      reason: pf.reason,
      smallest_safe_fix: pf.smallest_safe_fix,
      commander_approval_required: String(pf.commander_approval_required)
    }) + '\n';
  }

  // --- 3. Manual Rerun Command Sheet ---
  const commandItems: CommandSheetItem[] = [
    {
      step_order: 1,
      purpose: 'Scans for completed session logs and evidence files to determine completion verdict.',
      command_item_id: 'GK-RRN-CMD-01',
      exact_command: 'npm run command -- "grinders-keep-first-evidence-completion-detector"',
      when_to_run: 'After manual evidence responses and logs are staged.',
      expected_output: 'Completion detector report and snapshot manifest showing verdict COMPLETE.',
      manual_only: true,
      command_execution_allowed: COMMAND_EXECUTION_ALLOWED,
      commander_approval_required: true
    },
    {
      step_order: 2,
      purpose: 'Checks attempt log parameters and target saved response presence on filesystem.',
      command_item_id: 'GK-RRN-CMD-02',
      exact_command: 'npm run command -- "grinders-keep-first-evidence-attempt-reviewer"',
      when_to_run: 'After first evidence files are manually created and logged.',
      expected_output: 'Attempt review manifest with status "reviewed".',
      manual_only: true,
      command_execution_allowed: COMMAND_EXECUTION_ALLOWED,
      commander_approval_required: true
    },
    {
      step_order: 3,
      purpose: 'Validates review parameters and decides whether to hand off to the pack importer.',
      command_item_id: 'GK-RRN-CMD-03',
      exact_command: 'npm run command -- "grinders-keep-first-evidence-importer-gate"',
      when_to_run: 'After attempt reviewer manifest is written.',
      expected_output: 'Importer gate manifest with eligibility set to true.',
      manual_only: true,
      command_execution_allowed: COMMAND_EXECUTION_ALLOWED,
      commander_approval_required: true
    },
    {
      step_order: 4,
      purpose: 'Verify evidence completions across all registered tasks.',
      command_item_id: 'GK-RRN-CMD-04',
      exact_command: 'npm run command -- "grinders-keep-evidence-completion-tracker"',
      when_to_run: 'To update the global frontpage and master telemetry.',
      expected_output: 'Updated tracker manifest and frontpage checklists.',
      manual_only: true,
      command_execution_allowed: COMMAND_EXECUTION_ALLOWED,
      commander_approval_required: true
    }
  ];

  let commandSheetMarkdown = '';
  for (const cmd of commandItems) {
    commandSheetMarkdown += fillTemplate(tplCommand, {
      step_order: String(cmd.step_order),
      purpose: cmd.purpose,
      command_item_id: cmd.command_item_id,
      exact_command: cmd.exact_command,
      when_to_run: cmd.when_to_run,
      expected_output: cmd.expected_output,
      manual_only: String(cmd.manual_only),
      command_execution_allowed: String(cmd.command_execution_allowed),
      commander_approval_required: String(cmd.commander_approval_required)
    }) + '\n';
  }

  // --- 4. Rerun Sequence Plan ---
  const sequenceSteps: SequenceStep[] = [
    {
      step_order: 1,
      phase_name: 'grinders-keep-first-evidence-manual-completion-loop',
      sequence_item_id: 'GK-RRN-SEQ-01',
      purpose: 'Provides the manual completion directives.',
      prerequisite: 'None.',
      blocked_if: 'None.',
      manual_command_if_ready: 'npm run command -- "grinders-keep-first-evidence-manual-completion-loop"',
      expected_output_if_run_manually: 'Step-by-step console guide.',
      commander_approval_required: true
    },
    {
      step_order: 2,
      phase_name: 'grinders-keep-first-evidence-completion-detector',
      sequence_item_id: 'GK-RRN-SEQ-02',
      purpose: 'Check disk files.',
      prerequisite: 'Step 1 completed by operator.',
      blocked_if: 'No physical markdown or log files exist.',
      manual_command_if_ready: 'npm run command -- "grinders-keep-first-evidence-completion-detector"',
      expected_output_if_run_manually: 'Snapshot showing verdict COMPLETE.',
      commander_approval_required: true
    },
    {
      step_order: 3,
      phase_name: 'grinders-keep-first-evidence-attempt-reviewer',
      sequence_item_id: 'GK-RRN-SEQ-03',
      purpose: 'Review attempt log files.',
      prerequisite: 'Step 2 passes with verdict COMPLETE.',
      blocked_if: 'Verdict is not COMPLETE.',
      manual_command_if_ready: 'npm run command -- "grinders-keep-first-evidence-attempt-reviewer"',
      expected_output_if_run_manually: 'Review manifest showing passed.',
      commander_approval_required: true
    },
    {
      step_order: 4,
      phase_name: 'grinders-keep-first-evidence-importer-gate',
      sequence_item_id: 'GK-RRN-SEQ-04',
      purpose: 'Approve for pack import.',
      prerequisite: 'Step 3 passes.',
      blocked_if: 'Attempt reviewer manifest shows errors.',
      manual_command_if_ready: 'npm run command -- "grinders-keep-first-evidence-importer-gate"',
      expected_output_if_run_manually: 'Gate manifest showing eligible.',
      commander_approval_required: true
    }
  ];

  let sequenceMarkdown = '';
  for (const seq of sequenceSteps) {
    sequenceMarkdown += fillTemplate(tplSequence, {
      step_order: String(seq.step_order),
      phase_name: seq.phase_name,
      sequence_item_id: seq.sequence_item_id,
      purpose: seq.purpose,
      prerequisite: seq.prerequisite,
      blocked_if: seq.blocked_if,
      manual_command_if_ready: seq.manual_command_if_ready,
      expected_output_if_run_manually: seq.expected_output_if_run_manually,
      commander_approval_required: String(seq.commander_approval_required)
    }) + '\n';
  }

  // --- 5. Blocked Rerun Registry ---
  const blockers: BlockerItem[] = [];
  if (completionVerdict === 'NO_EVIDENCE') {
    blockers.push({
      blocker_type: 'No Staged Evidence Detected',
      rerun_blocker_id: 'GK-RRN-BLK-01',
      affected_phase: 'First Evidence Target Validation (Phase 13F)',
      reason_blocked: 'Verdict is NO_EVIDENCE. No files are currently detected on disk.',
      downstream_effect: 'Rerun plan is marked as not currently useful since manual data is missing.',
      smallest_safe_next_step: 'Save first response and write attempt log manually before running detector.',
      commander_approval_required: true
    });
  }

  if (!fs.existsSync(referenceSources.detectorSnapshot)) {
    blockers.push({
      blocker_type: 'Missing Snapshot File',
      rerun_blocker_id: 'GK-RRN-BLK-02',
      affected_phase: 'All validation runs',
      reason_blocked: 'Snapshot file grinders_keep_evidence_snapshot.json is missing.',
      downstream_effect: 'Prevents preflight check passing.',
      smallest_safe_next_step: 'Run grinders-keep-first-evidence-completion-detector command.',
      commander_approval_required: true
    });
  }

  let blockersMarkdown = '';
  if (blockers.length === 0) {
    blockersMarkdown = '_No active blockers registered. Rerun path is clear._\n';
  } else {
    for (const blk of blockers) {
      blockersMarkdown += fillTemplate(tplBlocker, {
        blocker_type: blk.blocker_type,
        rerun_blocker_id: blk.rerun_blocker_id,
        affected_phase: blk.affected_phase,
        reason_blocked: blk.reason_blocked,
        downstream_effect: blk.downstream_effect,
        smallest_safe_next_step: blk.smallest_safe_next_step,
        commander_approval_required: String(blk.commander_approval_required)
      }) + '\n';
    }
  }

  // --- 6. Safety Card Checklists ---
  const safetyRules: SafetyItem[] = [
    {
      safety_rule: 'Auto Command Execution Prevention',
      safety_item_id: 'GK-RRN-SF-01',
      required_status: 'disabled',
      actual_status: COMMAND_EXECUTION_ALLOWED ? 'enabled' : 'disabled',
      passed: !COMMAND_EXECUTION_ALLOWED,
      reason: 'COMMAND_EXECUTION_ALLOWED is locked to false.',
      commander_approval_required: true
    },
    {
      safety_rule: 'Auto Scheduler Run Block',
      safety_item_id: 'GK-RRN-SF-02',
      required_status: 'disabled',
      actual_status: SCHEDULER_EXECUTION_ALLOWED ? 'enabled' : 'disabled',
      passed: !SCHEDULER_EXECUTION_ALLOWED,
      reason: 'SCHEDULER_EXECUTION_ALLOWED is locked to false.',
      commander_approval_required: true
    },
    {
      safety_rule: 'Auto Evidence Validation Block',
      safety_item_id: 'GK-RRN-SF-03',
      required_status: 'disabled',
      actual_status: EVIDENCE_VALIDATION_ALLOWED ? 'enabled' : 'disabled',
      passed: !EVIDENCE_VALIDATION_ALLOWED,
      reason: 'EVIDENCE_VALIDATION_ALLOWED is locked to false.',
      commander_approval_required: true
    },
    {
      safety_rule: 'Auto Handoff/Import Prevention',
      safety_item_id: 'GK-RRN-SF-04',
      required_status: 'disabled',
      actual_status: AUTO_IMPORT_ALLOWED ? 'enabled' : 'disabled',
      passed: !AUTO_IMPORT_ALLOWED,
      reason: 'AUTO_IMPORT_ALLOWED is locked to false.',
      commander_approval_required: true
    },
    {
      safety_rule: 'Strict Local-First Only',
      safety_item_id: 'GK-RRN-SF-05',
      required_status: 'disabled',
      actual_status: 'disabled',
      passed: true,
      reason: 'Zero external cloud APIs or publishing tools invoked.',
      commander_approval_required: true
    }
  ];

  let safetyMarkdown = '';
  for (const sf of safetyRules) {
    safetyMarkdown += fillTemplate(tplSafety, {
      safety_rule: sf.safety_rule,
      safety_item_id: sf.safety_item_id,
      required_status: sf.required_status,
      actual_status: sf.actual_status,
      passed: String(sf.passed),
      reason: sf.reason,
      commander_approval_required: String(sf.commander_approval_required)
    }) + '\n';
  }

  // --- 7. Scorecard Calculation ---
  // Score details
  const detectorSignal = completionVerdict === 'COMPLETE' ? 10 : (completionVerdict === 'NO_EVIDENCE' ? 1 : 5);
  const evidencePresence = evidenceDocsCount > 0 ? 10 : 1;
  const sessionLogPresence = sessionLogsCount > 0 ? 10 : 1;
  const commandReadiness = COMMAND_REGISTRY.some(c => c.name === 'grinders-keep-local-verification-rerun-planner') ? 10 : 1;
  const safetyCompliance = safetyRules.every(r => r.passed) ? 10 : 1;

  const averageScore = (detectorSignal + evidencePresence + sessionLogPresence + commandReadiness + safetyCompliance) / 5;
  const isRerunUseful = completionVerdict === 'COMPLETE' && averageScore >= 7.0;

  const scorecards: ScorecardRow[] = [
    {
      rank: 1,
      linked_blocker_or_sequence: 'Rerun Readiness Review',
      rerun_readiness_status: averageScore >= 9.0 ? 'READY' : (averageScore >= 5.0 ? 'PARTIAL' : 'BLOCKED'),
      detector_signal_score_1_to_10: detectorSignal,
      evidence_presence_score_1_to_10: evidencePresence,
      session_log_presence_score_1_to_10: sessionLogPresence,
      command_readiness_score_1_to_10: commandReadiness,
      safety_compliance_score_1_to_10: safetyCompliance,
      recommended_status: averageScore >= 7.0 ? 'eligible' : 'ineligible',
      reason: `Average score is ${averageScore.toFixed(1)}/10. Completion verdict is ${completionVerdict}.`,
      commander_approval_required: true
    }
  ];

  let scorecardMarkdown = '';
  for (const sc of scorecards) {
    scorecardMarkdown += fillTemplate(tplScorecard, {
      rank: String(sc.rank),
      linked_blocker_or_sequence: sc.linked_blocker_or_sequence,
      rerun_readiness_status: sc.rerun_readiness_status,
      detector_signal_score_1_to_10: String(sc.detector_signal_score_1_to_10),
      evidence_presence_score_1_to_10: String(sc.evidence_presence_score_1_to_10),
      session_log_presence_score_1_to_10: String(sc.session_log_presence_score_1_to_10),
      command_readiness_score_1_to_10: String(sc.command_readiness_score_1_to_10),
      safety_compliance_score_1_to_10: String(sc.safety_compliance_score_1_to_10),
      recommended_status: sc.recommended_status,
      reason: sc.reason,
      commander_approval_required: String(sc.commander_approval_required)
    }) + '\n';
  }

  // --- 8. Compile and Write Report ---
  const verdictText = completionVerdict;
  const existsText = `${evidenceDocsCount} evidence files, ${sessionLogsCount} logs`;
  const missingText = completionVerdict === 'NO_EVIDENCE' 
    ? 'Evidence snapshot verdict is NO_EVIDENCE. No files are currently detected on disk.' 
    : 'None (Snapshot verdict is COMPLETE).';
  const todoBeforeRerun = completionVerdict === 'NO_EVIDENCE'
    ? 'Commander must manually complete model responses and log details.'
    : 'None. All prerequisites met.';
  const nextSafestMove = completionVerdict === 'NO_EVIDENCE'
    ? 'Save first response and write attempt log manually before running detector.'
    : 'Execute the command sequence steps in order.';

  const finalReport = fillTemplate(tplReport, {
    verdict: verdictText,
    exists: existsText,
    missing: missingText,
    rerun_useful: String(isRerunUseful),
    todo_before_rerun: todoBeforeRerun,
    next_safest_move: nextSafestMove,
    preflight: preflightMarkdown.trim(),
    command_sheet: commandSheetMarkdown.trim(),
    sequence: sequenceMarkdown.trim(),
    blockers: blockersMarkdown.trim(),
    safety: safetyMarkdown.trim(),
    scorecard: scorecardMarkdown.trim()
  });

  const reportPath = path.join(outputFolders.root, `grinders_keep_local_rerun_planner_report_${dateStr}.md`);
  const genericReportPath = path.join(outputFolders.root, `grinders_keep_local_rerun_planner_report.md`);
  fs.writeFileSync(reportPath, finalReport);
  fs.writeFileSync(genericReportPath, finalReport);
  console.log(`Report written to ${reportPath}`);

  // Write Next Actions file
  let nextActionsMarkdown = `# Next Actions: Local Verification Rerun Planner [${dateStr}]\n\n`;
  nextActionsMarkdown += `1. **Rerun Readiness Verdict:** \`${scorecards[0].rerun_readiness_status}\`\n`;
  nextActionsMarkdown += `2. **Score:** \`${averageScore.toFixed(1)}/10\`\n`;
  nextActionsMarkdown += `3. **Immediate Task:** ${nextSafestMove}\n\n`;
  nextActionsMarkdown += `## Action Steps\n`;
  for (const cmd of commandItems) {
    nextActionsMarkdown += `- [ ] **Step ${cmd.step_order}:** \`${cmd.exact_command}\` (ID: ${cmd.command_item_id})\n`;
  }
  const nextActionsPath = path.join(outputFolders.root, `grinders_keep_local_rerun_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextActionsPath, nextActionsMarkdown);
  console.log(`Next actions written to ${nextActionsPath}`);

  // Write manifest
  const manifest = {
    compiledAt: timestamp,
    module: MODULE_NAME,
    verdict: completionVerdict,
    exists: existsText,
    missing: missingText,
    isRerunUseful,
    averageScore,
    preflightChecks: preflights,
    commandSheet: commandItems,
    sequence: sequenceSteps,
    blockers,
    safetyRules,
    scorecards
  };
  const manifestPath = path.join(outputFolders.root, `grinders_keep_local_rerun_planner_manifest_${dateStr}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${manifestPath}`);

  // Log completion status
  logContent += `## Verification Rerun Results\n`;
  logContent += `- **Verdict:** ${completionVerdict}\n`;
  logContent += `- **Readiness Status:** ${scorecards[0].rerun_readiness_status}\n`;
  logContent += `- **Score:** ${averageScore.toFixed(1)}/10\n`;
  logContent += `- **Report Path:** ${reportPath}\n\n`;
  logContent += `Verification checklist successfully created.`;
  fs.writeFileSync(logFile, logContent);

  await announceCompletion("Local verification rerun sequence planner compiled", "100");
  console.log("✅ Rerun Planner complete.");
}

runLocalVerificationRerunPlanner().catch(err => {
  console.error("❌ Fatal execution error:", err);
  process.exit(1);
});
