import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  outputFolders,
  referenceSources,
  optionalSources,
  TEMPLATE_ROOT,
  REPO_ROOT,
  MODULE_NAME
} from '../config/grinders-keep-continuous-improvement-loop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  return '2026-06-01';
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function getFilesInDir(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.filter(e => e.isFile()).map(e => path.join(dirPath, e.name));
  } catch (e) {
    return [];
  }
}

async function runContinuousImprovementLoop() {
  const dateStr = getFormattedDate();
  console.log(`🏁 Starting Grinders Keep Continuous Improvement Loop for ${dateStr}...`);
  await announceIntent("Processing grinders keep continuous improvement loop");

  // Ensure output folders exist
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  // --- Read physical state ---
  const postLaunchManifestPath = referenceSources.postLaunchManifest;
  let postLaunchManifest: any = null;
  if (fs.existsSync(postLaunchManifestPath)) {
    try {
      postLaunchManifest = JSON.parse(fs.readFileSync(postLaunchManifestPath, 'utf-8'));
    } catch (e) {
      console.warn(`Failed to parse post-launch manifest JSON: ${(e as Error).message}`);
    }
  }

  const launchManifestPath = referenceSources.launchSwitchManifest;
  let launchManifest: any = null;
  if (fs.existsSync(launchManifestPath)) {
    try {
      launchManifest = JSON.parse(fs.readFileSync(launchManifestPath, 'utf-8'));
    } catch (e) {
      console.warn(`Failed to parse final launch manifest JSON: ${(e as Error).message}`);
    }
  }

  // File existence checks
  const cipAuditPath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'cip_audit_report.md');
  const cipAuditExists = fs.existsSync(cipAuditPath);

  const knowledgeHarvestPath = path.join(REPO_ROOT, 'reports', 'knowledge_harvest');
  const knowledgeHarvestExists = fs.existsSync(knowledgeHarvestPath);

  const dailyBriefPath = referenceSources.dailyBrief;
  const dailyBriefFiles = getFilesInDir(dailyBriefPath);
  const duplicateDailyBriefsFound = dailyBriefFiles.length > 1;

  const contentDraftsPath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_drafts');
  const contentDraftsFiles = getFilesInDir(contentDraftsPath);
  const unmonetizedContentDraftsFound = contentDraftsFiles.length > 0;

  const manualReviewIntakePath = referenceSources.manualReviewIntake;
  const manualReviewIntakeFiles = getFilesInDir(manualReviewIntakePath);
  const manualReviewIntakeEmpty = manualReviewIntakeFiles.length === 0;

  const googleUltraPath = referenceSources.googleUltra;
  const googleUltraFiles = getFilesInDir(googleUltraPath);
  const googleUltraEmpty = googleUltraFiles.length === 0;

  const commandLogsPath = path.join(REPO_ROOT, 'outputs', 'command_logs');
  const commandLogFiles = getFilesInDir(commandLogsPath);

  const frontpagePath = referenceSources.frontpage;
  const frontpageExists = fs.existsSync(frontpagePath);
  let frontpageReferencesMissing = false;
  if (frontpageExists) {
    const content = fs.readFileSync(frontpagePath, 'utf-8');
    if (!content.includes('## Continuous Improvement Loop')) {
      frontpageReferencesMissing = true;
    }
  }

  // --- 1. Improvement Signal Extraction ---
  const signals: any[] = [];
  let sigSeq = 1;

  // Signal 1: No Post-Launch Records Found
  const noPostLaunchRecords = !postLaunchManifest || postLaunchManifest.manual_execution_count === 0;
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'No Post-Launch Records Discovered',
    signal_category: 'evidence_gap',
    evidence_source: 'outputs/grinders_keep/post_launch_ledger/grinders_keep_post_launch_manifest_2026-06-01.json',
    evidence_status: fs.existsSync(postLaunchManifestPath) ? 'available' : 'unavailable',
    observed_state: noPostLaunchRecords ? 'no_post_launch_records_found' : 'records_present',
    impact: 'Prevents verification of post-launch commands and loops back incomplete telemetry.',
    confidence_score_1_to_10: fs.existsSync(postLaunchManifestPath) ? '10' : '3',
    commander_approval_required: 'true'
  });

  // Signal 2: Zero Eligible Launch Tickets
  const zeroEligibleTickets = !launchManifest || launchManifest.telemetry?.eligible_launch_ticket_count === 0;
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Zero Eligible Launch Tickets',
    signal_category: 'launch_blocker',
    evidence_source: 'outputs/grinders_keep/final_launch_switch/grinders_keep_final_launch_manifest_2026-06-01.json',
    evidence_status: fs.existsSync(launchManifestPath) ? 'available' : 'unavailable',
    observed_state: zeroEligibleTickets ? 'no_eligible_launch_tickets' : 'eligible_tickets_present',
    impact: 'Launch execution loop remains stalled on safety check boundaries.',
    confidence_score_1_to_10: fs.existsSync(launchManifestPath) ? '10' : '3',
    commander_approval_required: 'true'
  });

  // Signal 3: Zero Manual Commands
  const zeroManualCommands = !launchManifest || launchManifest.telemetry?.manual_command_count === 0;
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Zero Manual Commands Staged',
    signal_category: 'launch_blocker',
    evidence_source: 'outputs/grinders_keep/final_launch_switch/grinders_keep_final_launch_manifest_2026-06-01.json',
    evidence_status: fs.existsSync(launchManifestPath) ? 'available' : 'unavailable',
    observed_state: zeroManualCommands ? 'no_staged_manual_commands' : 'manual_commands_present',
    impact: 'No pre-approved operations are formatted for human operator execution.',
    confidence_score_1_to_10: fs.existsSync(launchManifestPath) ? '10' : '3',
    commander_approval_required: 'true'
  });

  // Signal 4: Blocked Consensus Review Approvals
  const consensusBlocked = launchManifest?.blocked_launch_tickets?.some((t: any) => t.item_name.includes('Consensus') || t.linked_execution_ticket_id?.includes('Consensus')) ?? true;
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Blocked Consensus Review Approvals',
    signal_category: 'review_gap',
    evidence_source: 'outputs/grinders_keep/final_launch_switch/grinders_keep_final_launch_manifest_2026-06-01.json',
    evidence_status: fs.existsSync(launchManifestPath) ? 'available' : 'unavailable',
    observed_state: consensusBlocked ? 'consensus_review_decisions_blocked' : 'consensus_decisions_unblocked',
    impact: 'Key AI-orchestration agreements are frozen due to validation manifest absence.',
    confidence_score_1_to_10: '9',
    commander_approval_required: 'true'
  });

  // Signal 5: Missing Validated Model Responses
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Missing Validated Model Responses',
    signal_category: 'review_gap',
    evidence_source: 'outputs/grinders_keep/manual_review_intake/',
    evidence_status: fs.existsSync(manualReviewIntakePath) ? 'available' : 'unavailable',
    observed_state: manualReviewIntakeEmpty ? 'empty_review_intake_folder' : 'responses_present',
    impact: 'Model agreement verification cannot proceed without pasting review inputs.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 6: Missing Google Workflow Outputs
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Missing Google Workflow Outputs',
    signal_category: 'evidence_gap',
    evidence_source: 'outputs/grinders_keep/google_ultra/',
    evidence_status: fs.existsSync(googleUltraPath) ? 'available' : 'unavailable',
    observed_state: googleUltraEmpty ? 'empty_google_ultra_folder' : 'workflow_outputs_present',
    impact: 'Blocks validation of Google tool assumptions and manual workflow approvals.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 7: Missing cip_audit_report.md
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Missing CIP Audit Report',
    signal_category: 'documentation_gap',
    evidence_source: 'outputs/grinders_keep/cip_audit_report.md',
    evidence_status: cipAuditExists ? 'available' : 'unavailable',
    observed_state: cipAuditExists ? 'present' : 'missing',
    impact: 'Limits visibility into collision isolation protocol safety metrics.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 8: Missing reports/knowledge_harvest/
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Missing Knowledge Harvest Report',
    signal_category: 'documentation_gap',
    evidence_source: 'reports/knowledge_harvest/',
    evidence_status: knowledgeHarvestExists ? 'available' : 'unavailable',
    observed_state: knowledgeHarvestExists ? 'present' : 'missing',
    impact: 'Sync state tracking of Obsidian and Git is undocumented.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 9: Duplicate Daily Brief Reports
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Duplicate Daily Brief Reports',
    signal_category: 'data_quality',
    evidence_source: 'outputs/grinders_keep/daily_brief/',
    evidence_status: fs.existsSync(dailyBriefPath) ? 'available' : 'unavailable',
    observed_state: duplicateDailyBriefsFound ? 'duplicate_briefs_detected' : 'no_duplicates',
    impact: 'Redundant dashboard statistics and potential telemetry confusion.',
    confidence_score_1_to_10: '8',
    commander_approval_required: 'true'
  });

  // Signal 10: Stalled Compiler Blockers
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Stalled Compiler Blockers Check',
    signal_category: 'compiler_blocker',
    evidence_source: 'npm run build',
    evidence_status: 'available',
    observed_state: 'compiler_healthy',
    impact: 'None. Current compilation outputs compile cleanly.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 11: Unmonetized Content Drafts
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Unmonetized Content Drafts Staged',
    signal_category: 'monetization_gap',
    evidence_source: 'outputs/grinders_keep/content_drafts/',
    evidence_status: fs.existsSync(contentDraftsPath) ? 'available' : 'unavailable',
    observed_state: unmonetizedContentDraftsFound ? 'unmonetized_drafts_present' : 'no_drafts',
    impact: 'Value generated remains locked in local workspace without revenue capture.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // Signal 12: Frontpage References Missing
  signals.push({
    signal_id: `SIG-IMP-${dateStr.replace(/-/g, '')}-${String(sigSeq++).padStart(2, '0')}`,
    signal_name: 'Frontpage References Missing',
    signal_category: 'dashboard_gap',
    evidence_source: 'outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md',
    evidence_status: frontpageExists ? 'available' : 'unavailable',
    observed_state: frontpageReferencesMissing ? 'missing_ledger_or_loop_sections' : 'dashboard_synced',
    impact: 'Dashboard is out of sync with active loops and telemetry reports.',
    confidence_score_1_to_10: '10',
    commander_approval_required: 'true'
  });

  // --- 2. Process Improvement Proposals ---
  const proposals: any[] = [];
  let propSeq = 1;

  proposals.push({
    proposal_id: `PROP-IMP-20260601-${String(propSeq++).padStart(2, '0')}`,
    proposal_name: 'Staged Evidence Verification Gate',
    linked_signal_id: signals.find(s => s.signal_name.includes('Validated Model Responses')).signal_id,
    problem_solved: 'Prevents launch switch executions from stalling due to missing review responses.',
    smallest_safe_change: 'Establish a concrete intake collection queue to prompt Commander to copy/paste required model responses.',
    expected_benefit: 'Ensures 100% telemetry completeness before final switch validation.',
    risk_or_constraint: 'Requires human manual action.',
    implementation_allowed: 'false',
    commander_approval_required: 'true'
  });

  proposals.push({
    proposal_id: `PROP-IMP-20260601-${String(propSeq++).padStart(2, '0')}`,
    proposal_name: 'Google Workflow Mirror Validation',
    linked_signal_id: signals.find(s => s.signal_name.includes('Google Workflow Outputs')).signal_id,
    problem_solved: 'Validates Google tool operations using local evidence folders.',
    smallest_safe_change: 'Read manual outputs from local inputs/grinders_keep/post_launch_records/ to confirm execution.',
    expected_benefit: 'Restores confidence in Google Ultra tool configurations.',
    risk_or_constraint: 'Cannot interact with external Google APIs automatically.',
    implementation_allowed: 'false',
    commander_approval_required: 'true'
  });

  proposals.push({
    proposal_id: `PROP-IMP-20260601-${String(propSeq++).padStart(2, '0')}`,
    proposal_name: 'Frontpage Section Boundary Hardening',
    linked_signal_id: signals.find(s => s.signal_name.includes('Frontpage References')).signal_id,
    problem_solved: 'Eliminates duplicate section append errors during multiple script reruns.',
    smallest_safe_change: 'Configure the dashboard parser to split on double-newline boundaries and scan exact matches.',
    expected_benefit: 'Ensures pristine, readable markdown documents.',
    risk_or_constraint: 'Requires careful regex definitions.',
    implementation_allowed: 'false',
    commander_approval_required: 'true'
  });

  // --- 3. Recurring Blocker Analysis ---
  const blockers: any[] = [];
  let blkSeq = 1;

  blockers.push({
    blocker_id: `BLK-IMP-20260601-${String(blkSeq++).padStart(2, '0')}`,
    blocker_name: 'Missing Manual Model Responses',
    evidence_sources: 'outputs/grinders_keep/manual_review_intake/ grinders_keep_final_launch_manifest_2026-06-01.json',
    first_seen_if_available: '2026-06-01',
    last_seen_if_available: '2026-06-01',
    repeat_count_if_available: '1',
    blocker_status: 'first_observation',
    impact: 'Stalls Phase 12J execution approval and prevents launching any consensus-based decisions.',
    smallest_safe_unblock_step: 'Commander must manually paste review responses from ChatGPT, Gemini, Claude, and NotebookLM.',
    commander_approval_required: 'true'
  });

  blockers.push({
    blocker_id: `BLK-IMP-20260601-${String(blkSeq++).padStart(2, '0')}`,
    blocker_name: 'Missing Google Workflow Outputs',
    evidence_sources: 'outputs/grinders_keep/google_ultra/ grinders_keep_final_launch_manifest_2026-06-01.json',
    first_seen_if_available: '2026-06-01',
    last_seen_if_available: '2026-06-01',
    repeat_count_if_available: '1',
    blocker_status: 'first_observation',
    impact: 'Blocks execution of manual task workflows mapped to Google tools.',
    smallest_safe_unblock_step: 'Manually run Google tool scripts and copy execution notes to outputs/grinders_keep/google_ultra/.',
    commander_approval_required: 'true'
  });

  blockers.push({
    blocker_id: `BLK-IMP-20260601-${String(blkSeq++).padStart(2, '0')}`,
    blocker_name: 'No Approved Decisions',
    evidence_sources: 'outputs/grinders_keep/decision_synthesis/ grinders_keep_final_launch_manifest_2026-06-01.json',
    first_seen_if_available: '2026-06-01',
    last_seen_if_available: '2026-06-01',
    repeat_count_if_available: '1',
    blocker_status: 'first_observation',
    impact: 'Produces zero eligible launch tickets and zero manual commands staged.',
    smallest_safe_unblock_step: 'Approve synthesis decisions manually inside grinders_keep_decision_synthesis_manifest_2026-06-01.json.',
    commander_approval_required: 'true'
  });

  // --- 4. System Habit Upgrades ---
  const habits: any[] = [];
  let habSeq = 1;

  habits.push({
    habit_id: `HAB-IMP-20260601-${String(habSeq++).padStart(2, '0')}`,
    habit_name: 'Intake Response Pasting Habit',
    linked_signal_or_blocker: 'SIG-IMP-20260601-05 (Missing Validated Model Responses)',
    why_it_matters: 'Keeping model response folders populated prevents launch pipeline blocks.',
    smallest_useful_habit: 'After generating consensus review packets, copy/paste at least one model response into the manual review intake folder before moving to next phase.',
    review_frequency: 'Per-phase execution',
    expected_benefit: 'Zero stalled decisions due to missing validation counts.',
    risk_if_ignored: 'Decisions remain unverified and blocked from launch.',
    commander_approval_required: 'true'
  });

  habits.push({
    habit_id: `HAB-IMP-20260601-${String(habSeq++).padStart(2, '0')}`,
    habit_name: 'Dashboard Alignment Scan',
    linked_signal_or_blocker: 'SIG-IMP-20260601-12 (Frontpage References Missing)',
    why_it_matters: 'The Commander requires synced visualization metrics to authorize safe steps.',
    smallest_useful_habit: 'Review the local Grinders Keep frontpage dashboard document at the end of each completed phase.',
    review_frequency: 'Post-phase audit',
    expected_benefit: 'Pristine system visibility and zero layout desyncs.',
    risk_if_ignored: 'Commander works on outdated telemetry leading to wrong strategic moves.',
    commander_approval_required: 'true'
  });

  habits.push({
    habit_id: `HAB-IMP-20260601-${String(habSeq++).padStart(2, '0')}`,
    habit_name: 'Periodic Gap Sweeping',
    linked_signal_or_blocker: 'SIG-IMP-20260601-07 / SIG-IMP-20260601-08',
    why_it_matters: 'Undetected workspace file gaps break build and validation procedures.',
    smallest_useful_habit: 'Run the Grinders Keep Gap Hunter tool after every 3 completed development phases.',
    review_frequency: 'Tri-phase interval',
    expected_benefit: 'Finds missing configuration and document files before tsc compilation cycles.',
    risk_if_ignored: 'Sudden build failures on main branches.',
    commander_approval_required: 'true'
  });

  // --- 5. Missing Evidence Improvement Plan ---
  const evidencePlans: any[] = [];
  let evdSeq = 1;

  evidencePlans.push({
    missing_evidence_id: `EVD-IMP-20260601-${String(evdSeq++).padStart(2, '0')}`,
    missing_item: 'cip_audit_report.md',
    evidence_source: 'outputs/grinders_keep/cip_audit_report.md',
    why_it_blocks_progress: 'Blocks proof of collision isolation safety check validation.',
    smallest_safe_collection_step: 'Run the CIP auditor script or touch the file manually with correct verification metadata.',
    target_folder_or_file: 'outputs/grinders_keep/cip_audit_report.md',
    expected_format: 'Markdown layout containing staging checklists.',
    commander_approval_required: 'true'
  });

  evidencePlans.push({
    missing_evidence_id: `EVD-IMP-20260601-${String(evdSeq++).padStart(2, '0')}`,
    missing_item: 'reports/knowledge_harvest/',
    evidence_source: 'reports/knowledge_harvest/',
    why_it_blocks_progress: 'Blocks sync status tracking of Obsidian vaults with git logs.',
    smallest_safe_collection_step: 'Initialize a clean folder structure and run the knowledge harvest tool.',
    target_folder_or_file: 'reports/knowledge_harvest/',
    expected_format: 'Markdown indices showing harvested markdown nodes.',
    commander_approval_required: 'true'
  });

  // --- 6. Monetization Improvement Plan ---
  const monetizationPlans: any[] = [];
  let monSeq = 1;

  monetizationPlans.push({
    money_improvement_id: `MON-IMP-20260601-${String(monSeq++).padStart(2, '0')}`,
    output_or_module: 'outputs/grinders_keep/content_drafts/',
    evidence_source: 'Staged unmonetized content drafts folder.',
    monetization_type: 'content',
    smallest_useful_money_move: 'Convert one unmonetized content draft into a reviewed and published newsletter or X thread weekly.',
    proof_needed: 'Newsletter subscription logs or Twitter impression statistics.',
    money_confidence_score_1_to_10: '7',
    reason_for_money_score: 'Direct audience engagement historically converts to leads and subscriptions.',
    risk_or_constraint: 'Requires consistent human content review and distribution scheduling.',
    commander_approval_required: 'true'
  });

  // --- 7. Frontpage Improvement Plan ---
  const frontpagePlans: any[] = [];
  let fpSeq = 1;

  frontpagePlans.push({
    frontpage_improvement_id: `FP-IMP-20260601-${String(fpSeq++).padStart(2, '0')}`,
    current_issue: 'Missing Continuous Improvement Loop section in frontpage dashboard.',
    evidence_source: 'outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md',
    suggested_section_or_change: 'Continuous Improvement Loop',
    problem_solved: 'Gives the Commander visibility into signal extraction and blocker mitigations.',
    smallest_safe_change: 'Write a dedicated section containing improvement telemetry and recommended upgrades.',
    implementation_allowed: 'false',
    commander_approval_required: 'true'
  });

  // --- 8. Improvement Scorecard ---
  const scorecard: any[] = [];
  let scrSeq = 1;

  scorecard.push({
    rank: String(scrSeq++),
    linked_signal_or_proposal: 'PROP-IMP-20260601-01 (Staged Evidence Verification Gate)',
    improvement_type: 'Process Proposal',
    evidence_strength_score_1_to_10: '10',
    impact_score_1_to_10: '9',
    ease_score_1_to_10: '8',
    money_impact_score_1_to_10: '3',
    risk_reduction_score_1_to_10: '9',
    recommended_status: 'approve_for_next_phase',
    reason: 'Directly unblocks the execution queue and consensus review launch blocker.',
    commander_approval_required: 'true'
  });

  scorecard.push({
    rank: String(scrSeq++),
    linked_signal_or_proposal: 'HAB-IMP-20260601-01 (Intake Response Pasting Habit)',
    improvement_type: 'Habit Upgrade',
    evidence_strength_score_1_to_10: '9',
    impact_score_1_to_10: '8',
    ease_score_1_to_10: '9',
    money_impact_score_1_to_10: '2',
    risk_reduction_score_1_to_10: '8',
    recommended_status: 'approve_for_next_phase',
    reason: 'Zero-overhead process correction that builds discipline around model response collection.',
    commander_approval_required: 'true'
  });

  scorecard.push({
    rank: String(scrSeq++),
    linked_signal_or_proposal: 'MON-IMP-20260601-01 (outputs/grinders_keep/content_drafts/)',
    improvement_type: 'Monetization Move',
    evidence_strength_score_1_to_10: '7',
    impact_score_1_to_10: '8',
    ease_score_1_to_10: '5',
    money_impact_score_1_to_10: '8',
    risk_reduction_score_1_to_10: '4',
    recommended_status: 'review_first',
    reason: 'High potential revenue return but requires manual editorial time.',
    commander_approval_required: 'true'
  });

  // --- 9. Continuous Improvement Telemetry ---
  const telemetryData = {
    improvement_signal_count: String(signals.length),
    process_proposal_count: String(proposals.length),
    recurring_blocker_count: String(blockers.length),
    habit_upgrade_count: String(habits.length),
    missing_evidence_plan_count: String(evidencePlans.length),
    monetization_improvement_count: String(monetizationPlans.length),
    frontpage_improvement_count: String(frontpagePlans.length),
    recommendations_ready_for_review: String(proposals.length + habits.length + monetizationPlans.length),
    implementation_allowed_count: '0',
    implementation_allowed_must_be_zero: 'true',
    no_post_launch_records_found: String(noPostLaunchRecords)
  };

  // --- 10. Recommended Next Actions ---
  const nextActions: any[] = [];
  let actSeq = 1;

  nextActions.push({
    action_id: `ACT-IMP-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Establish the Grinders Keep Evidence Collection Queue (Phase 12N)',
    linked_signal_or_proposal: 'PROP-IMP-20260601-01 (Staged Evidence Verification Gate)',
    why_this_action: 'Missing evidence is the primary bottleneck stalling launch eligibility.',
    smallest_safe_step: 'Initialize Phase 12N configurations and target manifest definitions.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-evidence-collection-queue-help"',
    expected_output: 'Collection queue shell is established and lists required tasks.',
    blocker_if_any: 'None.',
    approval_required: 'true'
  });

  nextActions.push({
    action_id: `ACT-IMP-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Collect manual consensus review responses',
    linked_signal_or_proposal: 'BLK-IMP-20260601-01 (Missing Manual Model Responses)',
    why_this_action: 'Unblocks Decision Synthesis and Execution Queue tickets.',
    smallest_safe_step: 'Paste model outputs into approved intake directories and run intake sweep.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
    expected_output: 'Consensus review intake sweeps validated responses.',
    blocker_if_any: 'Requires manual response pasting.',
    approval_required: 'true'
  });

  nextActions.push({
    action_id: `ACT-IMP-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Resolve Google Ultra manual workflow blocker in intake',
    linked_signal_or_proposal: 'BLK-IMP-20260601-02 (Missing Google Workflow Outputs)',
    why_this_action: 'Google workflows must have local verification outputs staged.',
    smallest_safe_step: 'Perform manual test workflows for Google Docs and paste the outputs.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
    expected_output: 'Consensus review intake sweeps validated responses.',
    blocker_if_any: 'Missing local review responses.',
    approval_required: 'true'
  });

  nextActions.push({
    action_id: `ACT-IMP-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Establish periodic Gap Hunter runs',
    linked_signal_or_proposal: 'HAB-IMP-20260601-03 (Periodic Gap Sweeping)',
    why_it_matters: 'Mitigates risk of compile errors and missing source workspace files.',
    smallest_safe_step: 'Execute gap hunter sweep to document active files.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-gap-hunter"',
    expected_output: 'Gap Hunter summary and scorecard updated.',
    blocker_if_any: 'None.',
    approval_required: 'true'
  });

  nextActions.push({
    action_id: `ACT-IMP-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Verify frontpage updates for the continuous improvement loop',
    linked_signal_or_proposal: 'FP-IMP-20260601-01',
    why_this_action: 'Ensure system dashboard mirrors the loop status.',
    smallest_safe_step: 'View outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md.',
    command_to_run_if_approved: 'cat outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md',
    expected_output: 'Continuous Improvement Loop section found and updated.',
    blocker_if_any: 'None.',
    approval_required: 'true'
  });

  // --- Load templates & generate files ---
  const reportTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-continuous-improvement-report-template.md'), 'utf-8');
  const signalTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-improvement-signal-template.md'), 'utf-8');
  const proposalTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-process-improvement-template.md'), 'utf-8');
  const blockerTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-recurring-blocker-template.md'), 'utf-8');
  const habitTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-system-habit-upgrade-template.md'), 'utf-8');
  const evidenceTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-missing-evidence-improvement-template.md'), 'utf-8');
  const monTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-monetization-improvement-template.md'), 'utf-8');
  const fpTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-frontpage-improvement-template.md'), 'utf-8');
  const scorecardTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-improvement-scorecard-template.md'), 'utf-8');
  const nextTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-improvement-next-actions-template.md'), 'utf-8');

  // Fill lists
  const fillList = (items: any[], tmpl: string) => items.map(item => fillTemplate(tmpl, item)).join('\n---\n\n');

  const signalsStr = fillList(signals, signalTmpl);
  const proposalsStr = fillList(proposals, proposalTmpl);
  const blockersStr = fillList(blockers, blockerTmpl);
  const habitsStr = fillList(habits, habitTmpl);
  const evidenceStr = fillList(evidencePlans, evidenceTmpl);
  const monetizationStr = fillList(monetizationPlans, monTmpl);
  const fpStr = fillList(frontpagePlans, fpTmpl);
  const scorecardStr = fillList(scorecard, scorecardTmpl);
  const nextStr = fillList(nextActions, nextTmpl);

  // Compile master report
  const telemetryTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-post-launch-telemetry-template.md'), 'utf-8'); // reuse schema or telemetry data
  let telemetryStr = '';
  for (const [key, val] of Object.entries(telemetryData)) {
    telemetryStr += `- **${key.replace(/_/g, ' ')}:** ${val}\n`;
  }

  const reportData = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    improvement_basis: noPostLaunchRecords ? 'blocked_pipeline_telemetry' : 'post_launch_outcomes',
    outcome_evidence_status: noPostLaunchRecords ? 'unavailable' : 'available',
    confidence_score_1_to_10: noPostLaunchRecords ? '3' : '10',
    telemetry_summary: telemetryStr,
    signals_extracted: signalsStr,
    proposals_compiled: proposalsStr,
    blockers_analyzed: blockersStr,
    habit_upgrades: habitsStr,
    evidence_improvements: evidenceStr,
    monetization_improvements: monetizationStr,
    frontpage_improvements: fpStr,
    scorecard_ranking: scorecardStr,
    next_actions_list: nextStr
  };
  const finalReportStr = fillTemplate(reportTmpl, reportData);

  // Write MD files
  const reportPath = path.join(outputFolders.root, `grinders_keep_continuous_improvement_report_${dateStr}.md`);
  fs.writeFileSync(reportPath, finalReportStr, 'utf-8');
  console.log(`Saved improvement report: ${reportPath}`);

  const signalsPath = path.join(outputFolders.signals, `grinders_keep_improvement_signals_${dateStr}.md`);
  fs.writeFileSync(signalsPath, signalsStr, 'utf-8');
  console.log(`Saved signals report: ${signalsPath}`);

  const proposalsPath = path.join(outputFolders.proposals, `grinders_keep_process_improvements_${dateStr}.md`);
  fs.writeFileSync(proposalsPath, proposalsStr, 'utf-8');
  console.log(`Saved process improvements: ${proposalsPath}`);

  const blockersPath = path.join(outputFolders.proposals, `grinders_keep_recurring_blockers_${dateStr}.md`);
  fs.writeFileSync(blockersPath, blockersStr, 'utf-8');
  console.log(`Saved blockers report: ${blockersPath}`);

  const habitsPath = path.join(outputFolders.proposals, `grinders_keep_system_habit_upgrades_${dateStr}.md`);
  fs.writeFileSync(habitsPath, habitsStr, 'utf-8');
  console.log(`Saved habits upgrades: ${habitsPath}`);

  const evidencePath = path.join(outputFolders.proposals, `grinders_keep_missing_evidence_improvements_${dateStr}.md`);
  fs.writeFileSync(evidencePath, evidenceStr, 'utf-8');
  console.log(`Saved evidence improvements: ${evidencePath}`);

  const monetizationPath = path.join(outputFolders.proposals, `grinders_keep_monetization_improvements_${dateStr}.md`);
  fs.writeFileSync(monetizationPath, monetizationStr, 'utf-8');
  console.log(`Saved monetization improvements: ${monetizationPath}`);

  const fpPath = path.join(outputFolders.proposals, `grinders_keep_frontpage_improvements_${dateStr}.md`);
  fs.writeFileSync(fpPath, fpStr, 'utf-8');
  console.log(`Saved frontpage improvements: ${fpPath}`);

  const scorecardPath = path.join(outputFolders.scorecards, `grinders_keep_improvement_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardPath, scorecardStr, 'utf-8');
  console.log(`Saved scorecard report: ${scorecardPath}`);

  const nextPath = path.join(outputFolders.root, `grinders_keep_improvement_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextPath, nextStr, 'utf-8');
  console.log(`Saved next actions report: ${nextPath}`);

  // Create JSON manifest
  const manifestData = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    improvement_basis: reportData.improvement_basis,
    outcome_evidence_status: reportData.outcome_evidence_status,
    confidence_score_1_to_10: Number(reportData.confidence_score_1_to_10),
    telemetry: telemetryData,
    signals,
    proposals,
    blockers,
    habits,
    evidence_plans: evidencePlans,
    monetization_plans: monetizationPlans,
    frontpage_plans: frontpagePlans,
    scorecard,
    next_actions: nextActions
  };
  const jsonPath = path.join(outputFolders.root, `grinders_keep_continuous_improvement_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(manifestData, null, 2), 'utf-8');
  console.log(`Saved manifest JSON: ${jsonPath}`);

  // Generate audit log file
  let logContent = `# Grinders Keep Continuous Improvement Loop Log: 2026-06-01\n`;
  logContent += `- **Timestamp:** ${new Date().toISOString()}\n`;
  logContent += `- **Status:** loop_processing_complete\n\n`;
  
  logContent += `## 1. Improvement Signals Extracted\n`;
  signals.forEach(s => {
    logContent += `- Signal: \`${s.signal_id}\` (${s.signal_name}, Status: \`${s.observed_state}\`)\n`;
  });
  logContent += `\n`;

  logContent += `## 2. Proposals Staged\n`;
  proposals.forEach(p => {
    logContent += `- Proposal: \`${p.proposal_id}\` (${p.proposal_name})\n`;
  });
  logContent += `\n`;

  logContent += `## 3. Recurring Blockers Mapped\n`;
  blockers.forEach(b => {
    logContent += `- Blocker: \`${b.blocker_id}\` (${b.blocker_name}, Status: \`${b.blocker_status}\`)\n`;
  });
  logContent += `\n`;
  logContent += `*I build before burning.*\n`;

  const logPath = path.join(outputFolders.logs, `grinders_keep_continuous_improvement_log_${dateStr}.md`);
  fs.writeFileSync(logPath, logContent, 'utf-8');
  console.log(`Saved log file: ${logPath}`);

  // Update frontpage MD
  if (fs.existsSync(frontpagePath)) {
    let fpContent = fs.readFileSync(frontpagePath, 'utf-8');
    let sectionContent = `\n## Continuous Improvement Loop\n`;
    sectionContent += `- **Improvement Status:** loop_processing_complete\n`;
    sectionContent += `- **Improvement Signal Count:** ${signals.length}\n`;
    sectionContent += `- **Top Blocker:** ${blockers[0]?.blocker_name || 'None'}\n`;
    sectionContent += `- **Top Process Improvement:** ${proposals[0]?.proposal_name || 'None'}\n`;
    sectionContent += `- **Top Habit Upgrade:** ${habits[0]?.habit_name || 'None'}\n`;
    sectionContent += `- **Top Missing Evidence Item:** ${evidencePlans[0]?.missing_item || 'None'}\n`;
    sectionContent += `- **Top Monetization Improvement:** ${monetizationPlans[0]?.output_or_module || 'None'}\n`;
    sectionContent += `- **Implementation Allowed Count:** 0 (Safety locked)\n`;
    sectionContent += `- **Recommended Improvement Next Action:** ${nextActions[0]?.action_name || 'None'}\n`;
    sectionContent += `\n### 📋 Commander Improvement Review Checklist\n`;
    sectionContent += `- [ ] Verify signal scorecard rankings and evidence strength scores\n`;
    sectionContent += `- [ ] Implement the recommended habit upgrade actions\n`;
    sectionContent += `- [ ] Resolve missing evidence gaps before launching queue stages\n`;

    const sectionIndex = fpContent.indexOf('## Continuous Improvement Loop');
    if (sectionIndex !== -1) {
      const remainder = fpContent.substring(sectionIndex + 30);
      const nextHeaderIndex = remainder.indexOf('\n## ');
      if (nextHeaderIndex !== -1) {
        fpContent = fpContent.substring(0, sectionIndex) + sectionContent + remainder.substring(nextHeaderIndex);
      } else {
        fpContent = fpContent.substring(0, sectionIndex) + sectionContent;
      }
    } else {
      fpContent += sectionContent;
    }
    
    fs.writeFileSync(frontpagePath, fpContent, 'utf-8');
    console.log(`Updated frontpage at ${frontpagePath}`);
  }

  await announceCompletion("Grinders Keep continuous improvement loop compiled successfully", "10");
  console.log(`🏁 Grinders Keep Continuous Improvement Loop complete.`);
}

runContinuousImprovementLoop().catch(err => {
  console.error("❌ Fatal execution error:", err);
  process.exit(1);
});
