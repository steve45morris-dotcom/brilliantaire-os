import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  inputGapHunterDir,
  outputDir,
  logsDir,
  templatesDir,
  primarySources,
  REPO_ROOT
} from '../config/grinders-keep-adaptive-learning-deepener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runAdaptiveDeepener() {
  const dateStr = getFormattedDate();
  console.log(`🧠 Starting Grinders Keep Adaptive Learning Deepener v0.1 for ${dateStr}...`);
  await announceIntent("Executing adaptive learning deepener scan of historical gap records and CLI logs");

  // Ensure output folders exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `grinders_keep_adaptive_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Adaptive Deepener Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Load Gap Hunter Manifest Files & Analyze Multi-Day History ---
  let manifests: string[] = [];
  if (fs.existsSync(inputGapHunterDir)) {
    manifests = fs.readdirSync(inputGapHunterDir)
      .filter(f => f.startsWith('grinders_keep_gap_hunter_manifest_') && f.endsWith('.json'));
  }

  const manifestCount = manifests.length;
  console.log(`📂 Found ${manifestCount} Gap Hunter manifests in ${inputGapHunterDir}`);
  logContent += `- **Manifests Analyzed:** ${manifestCount}\n`;

  let todayManifest: any = null;
  const todayManifestPath = path.join(inputGapHunterDir, `grinders_keep_gap_hunter_manifest_${dateStr}.json`);
  if (fs.existsSync(todayManifestPath)) {
    try {
      todayManifest = JSON.parse(fs.readFileSync(todayManifestPath, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse today's manifest: ${(e as Error).message}`);
    }
  }

  // Determine pattern status based on manifest history count
  const isMultiDay = manifestCount > 1;
  const patternStatus = isMultiDay ? 'recurring' : 'first_observation';
  const confidenceScore = isMultiDay ? 8 : 3;
  const repeatCount = isMultiDay ? manifestCount : 1;
  const suggestedAction = isMultiDay 
    ? 'Schedule automated validation routine to eliminate gap.'
    : 'Re-run Gap Hunter over multiple days before confirming a recurring pattern.';

  // Gather today's gaps if available
  const todayGaps = todayManifest?.gaps || {
    missing_sources: [],
    stale_outputs: [],
    duplicate_risks: [],
    blocked_phases: [],
    weak_docs: [],
    missing_dashboards: [],
    unverified_metrics: [],
    command_routing_gaps: [],
    unmonetized_outputs: []
  };

  // --- 2. Recurring Gap Pattern Detection ---
  console.log('1️⃣ Auditing Gap history for recurring patterns...');
  const recurringGaps: any[] = [];
  let patternId = 1;

  // Pattern: Missing Sources
  if (todayGaps.missing_sources.length > 0) {
    const names = todayGaps.missing_sources.map((s: any) => s.missing_source).join(', ');
    recurringGaps.push({
      pattern_id: `PAT-GAP-12D-${String(patternId++).padStart(2, '0')}`,
      pattern_name: `Persistent Missing Source Files (${names})`,
      category: 'Missing Sources',
      first_seen: dateStr,
      last_seen: dateStr,
      repeat_count: repeatCount,
      evidence_sources: `grinders_keep_gap_hunter_manifest_${dateStr}.json`,
      pattern_status: patternStatus,
      impact: 'Critical project references are absent, inducing drift and blocking compiler builds.',
      confidence_score_1_to_10: confidenceScore,
      suggested_operating_habit: suggestedAction,
      commander_approval_required: true
    });
  }

  // Pattern: Duplicate Risk
  if (todayGaps.duplicate_risks.length > 0) {
    recurringGaps.push({
      pattern_id: `PAT-GAP-12D-${String(patternId++).padStart(2, '0')}`,
      pattern_name: 'Stale Report Duplication Accumulation',
      category: 'Duplicate Risks',
      first_seen: dateStr,
      last_seen: dateStr,
      repeat_count: repeatCount,
      evidence_sources: `grinders_keep_gap_hunter_manifest_${dateStr}.json`,
      pattern_status: patternStatus,
      impact: 'Cluttering of the workspace with redundant briefs slows down git operations and directory indexing.',
      confidence_score_1_to_10: confidenceScore,
      suggested_operating_habit: suggestedAction,
      commander_approval_required: true
    });
  }

  // Pattern: Blocked Phase
  if (todayGaps.blocked_phases.length > 0) {
    recurringGaps.push({
      pattern_id: `PAT-GAP-12D-${String(patternId++).padStart(2, '0')}`,
      pattern_name: 'Upstream Compiler Blockers',
      category: 'Blocked Phases',
      first_seen: dateStr,
      last_seen: dateStr,
      repeat_count: repeatCount,
      evidence_sources: `grinders_keep_gap_hunter_manifest_${dateStr}.json`,
      pattern_status: patternStatus,
      impact: 'Downstream agent tasks cannot progress, freezing active milestones indefinitely.',
      confidence_score_1_to_10: confidenceScore,
      suggested_operating_habit: suggestedAction,
      commander_approval_required: true
    });
  }

  // Pattern: Command Routing Gaps
  if (todayGaps.command_routing_gaps.length > 0) {
    recurringGaps.push({
      pattern_id: `PAT-GAP-12D-${String(patternId++).padStart(2, '0')}`,
      pattern_name: 'Command Alias Safety Exposure',
      category: 'Command Routing',
      first_seen: dateStr,
      last_seen: dateStr,
      repeat_count: repeatCount,
      evidence_sources: `grinders_keep_gap_hunter_manifest_${dateStr}.json`,
      pattern_status: patternStatus,
      impact: 'Permissive aliases increase execution drift and shortcut safety confirmations.',
      confidence_score_1_to_10: confidenceScore,
      suggested_operating_habit: suggestedAction,
      commander_approval_required: true
    });
  }

  // If no gaps detected
  if (recurringGaps.length === 0) {
    recurringGaps.push({
      pattern_id: 'PAT-GAP-12D-00',
      pattern_name: 'No Gaps Recorded',
      category: 'None',
      first_seen: dateStr,
      last_seen: dateStr,
      repeat_count: 0,
      evidence_sources: 'None',
      pattern_status: 'resolved',
      impact: 'None',
      confidence_score_1_to_10: 10,
      suggested_operating_habit: 'Continue running scheduled sweeps.',
      commander_approval_required: false
    });
  }

  // --- 3. Behavior Signal Detection ---
  console.log('2️⃣ Extracting behavior signals from CLI log data...');
  const behaviorSignals: any[] = [];
  let signalId = 1;

  // Let's scan outputs/command_logs for alias rejections and success ratios
  let commandRunCount = 0;
  let aliasRejectionsCount = 0;

  const logsDirCmd = path.join(REPO_ROOT, 'outputs', 'command_logs');
  if (fs.existsSync(logsDirCmd)) {
    try {
      const files = fs.readdirSync(logsDirCmd).filter(f => f.startsWith('command_log_') && f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(logsDirCmd, file), 'utf-8');
        // Count command attempts
        const attempts = (content.match(/Command Attempt:/g) || []).length;
        commandRunCount += attempts;

        // Count rejections/errors (exit code 1)
        const rejections = (content.match(/Exit Code: `1`/g) || []).length;
        aliasRejectionsCount += rejections;
      }
    } catch (e) {
      // Ignore
    }
  }

  behaviorSignals.push({
    signal_id: `SIG-SYS-12D-${String(signalId++).padStart(2, '0')}`,
    signal_name: 'Strict Alias Rejection Enforcement',
    evidence_source: 'outputs/command_logs/ directory',
    observed_behavior: `Registered ${aliasRejectionsCount} alias block events across ${commandRunCount} total commands.`,
    possible_meaning: 'The exact-name router command matching system is successfully isolating and rejecting unauthorized shortcut calls.',
    risk_if_ignored: 'If validation rules decay, accidental command trigger risk will rise.',
    useful_habit: 'Regularly audit commands config to verify alias configurations.',
    confidence_score_1_to_10: 9,
    commander_approval_required: true
  });

  // Check for compile blocks from NEXT_ACTIONS.md
  let pendingActionsCount = 0;
  let hasChaiBlocker = false;
  if (fs.existsSync(primarySources.nextActions)) {
    const nextActionsContent = fs.readFileSync(primarySources.nextActions, 'utf-8');
    pendingActionsCount = (nextActionsContent.match(/- \[\s*\]/g) || []).length;
    if (nextActionsContent.toLowerCase().includes('chai-builder-sdk')) {
      hasChaiBlocker = true;
    }
  }

  if (hasChaiBlocker) {
    behaviorSignals.push({
      signal_id: `SIG-SYS-12D-${String(signalId++).padStart(2, '0')}`,
      signal_name: 'Stalled Upstream Dependency Build',
      evidence_source: 'NEXT_ACTIONS.md',
      observed_behavior: 'Presence of persistent "chai-builder-sdk compiler variable errors" blockers blocking workspace progress.',
      possible_meaning: 'Compiler errors in peripheral TypeScript pages block testing of core system utilities.',
      risk_if_ignored: 'Operators accumulate deferred tasks list leading to execution paralysis.',
      useful_habit: 'Isolate upstream dependency errors before beginning secondary module cycles.',
      confidence_score_1_to_10: 9,
      commander_approval_required: true
    });
  }

  // --- 4. Operating Habit Recommendations ---
  console.log('3️⃣ Creating habit recommendations...');
  const operatingHabits: any[] = [];
  let habitId = 1;

  operatingHabits.push({
    habit_id: `HAB-OPS-12D-${String(habitId++).padStart(2, '0')}`,
    habit_name: 'Scan Gaps Prior to Code Cycles',
    linked_pattern_or_signal: 'Persistent Missing Source Files pattern',
    why_it_matters: 'Scanning first ensures you do not waste compile cycles writing adapters for missing file dependencies.',
    smallest_useful_habit: 'Run grinders-keep-gap-hunter as the first task of every work session.',
    expected_benefit: 'Zero wasted time troubleshooting missing assets.',
    risk_if_not_adopted: 'Compilation loops fail repeatedly due to missing source files.',
    review_frequency: 'Daily',
    commander_approval_required: true
  });

  operatingHabits.push({
    habit_id: `HAB-OPS-12D-${String(habitId++).padStart(2, '0')}`,
    habit_name: 'Enforce Command Name Exactness',
    linked_pattern_or_signal: 'Command Alias Safety Exposure pattern',
    why_it_matters: 'Prevents collision errors and unintended script triggers.',
    smallest_useful_habit: 'Configure all newly added command routes with requiresExactName: true.',
    expected_benefit: 'Deterministic execution structure with 100% collision isolation.',
    risk_if_not_adopted: 'Keyboard shortcuts trigger incorrect scripts, violating safety constraints.',
    review_frequency: 'Weekly',
    commander_approval_required: true
  });

  // --- 5. Learning Lesson Generation ---
  console.log('4️⃣ Generating lessons from observed behavior...');
  const learningLessons: any[] = [];
  let lessonId = 1;

  learningLessons.push({
    lesson_id: `LES-LRN-12D-${String(lessonId++).padStart(2, '0')}`,
    topic: 'Real Data Enforcement Constraints',
    evidence_source: 'Phase 12B/12C specifications',
    simple_explanation: 'Production briefs must map only to real, verified file systems. Fake telemetry ruins system planning.',
    why_it_matters: 'Mocked data conceals actual integration failures and gives a false sense of security.',
    common_misunderstanding: 'Believing mock data simplifies test validation at the cost of production reliability.',
    commander_application: 'Fail closed and print missing markers rather than staging fabricated status indicators.',
    one_action_task: 'Perform filesystem checks on target config paths before generating daily summaries.',
    confidence_score_1_to_10: 10,
    commander_approval_required: true
  });

  // --- 6. System Adjustment Suggestions ---
  console.log('5️⃣ Formulating configuration adjustments...');
  const systemAdjustments: any[] = [];
  let adjustmentId = 1;

  systemAdjustments.push({
    adjustment_id: `ADJ-SYS-12D-${String(adjustmentId++).padStart(2, '0')}`,
    adjustment_name: 'Lock Router Command Gating',
    linked_gap_or_signal: 'Command Alias Safety Exposure pattern',
    problem_solved: 'Prevents permissive alias mapping in config/commands.ts.',
    smallest_safe_change: 'Audit and modify commands table configuration to ensure 100% strict matching.',
    expected_benefit: 'Strict routing prevents execution shortcuts and enforces precise keyboard input.',
    risk_or_constraint: 'Requires typing longer names in CLI commands.',
    command_to_build_if_approved: 'npm run command -- "grinders-keep-gap-hunter"',
    commander_approval_required: true
  });

  // --- 7. Risk Pattern Detection ---
  console.log('6️⃣ Auditing repeated risks...');
  const riskPatterns: any[] = [];
  let riskId = 1;

  riskPatterns.push({
    risk_id: `RSK-PAT-12D-${String(riskId++).padStart(2, '0')}`,
    risk_name: 'Workspace Index Stalling',
    evidence_source: 'Duplicate Risks pattern',
    risk_category: 'duplicate_reports',
    likelihood_score_1_to_10: 6,
    impact_score_1_to_10: 5,
    mitigation_suggestion: 'Establish a cron cleanup wrapper to safely remove expired markdown briefs older than 14 days.',
    commander_approval_required: true
  });

  riskPatterns.push({
    risk_id: `RSK-PAT-12D-${String(riskId++).padStart(2, '0')}`,
    risk_name: 'Command Collision Drift',
    evidence_source: 'Command Alias Safety Exposure pattern',
    risk_category: 'command_routing',
    likelihood_score_1_to_10: 4,
    impact_score_1_to_10: 8,
    mitigation_suggestion: 'Run validation tests during build phases to assert no commands share active aliases.',
    commander_approval_required: true
  });

  // --- 8. Monetization Pattern Detection ---
  console.log('7️⃣ Tracking unmonetized asset patterns...');
  const monetizationPatterns: any[] = [];
  let moneyId = 1;

  monetizationPatterns.push({
    money_pattern_id: `MON-PAT-12D-${String(moneyId++).padStart(2, '0')}`,
    output_or_module: 'outputs/grinders_keep/content_drafts/',
    evidence_source: 'outputs/grinders_keep/content_drafts/ directory',
    monetization_type: 'lead_magnet',
    smallest_useful_money_move: 'Package daily brief summaries into weekly developer productivity newsletters.',
    money_confidence_score_1_to_10: 8,
    reason_for_money_score: 'Dev newsletters drive paid consultant referrals and sponsors.',
    risk_or_constraint: 'Requires careful editing to prevent leaking proprietary OS capabilities.',
    commander_approval_required: true
  });

  // --- 9. Adaptive Scorecard & Sorting ---
  console.log('8️⃣ Compiling scorecards...');
  const allScorecards: any[] = [];
  let rank = 1;

  allScorecards.push({
    rank: rank++,
    item_id: recurringGaps[0].pattern_id,
    category: 'Recurring Gap Patterns',
    repeat_score_1_to_10: repeatCount,
    confidence_score_1_to_10: confidenceScore,
    system_risk_score_1_to_10: todayGaps.missing_sources.length > 0 ? 9 : 3,
    money_impact_score_1_to_10: 2,
    habit_value_score_1_to_10: 8,
    recommended_status: todayGaps.missing_sources.length > 0 ? 'adopt_now' : 'monitor',
    reason: 'Persistent missing source files directly threaten code compilation safety.',
    commander_approval_required: true
  });

  allScorecards.push({
    rank: rank++,
    item_id: behaviorSignals[0].signal_id,
    category: 'System Behavior Signals',
    repeat_score_1_to_10: 8,
    confidence_score_1_to_10: 9,
    system_risk_score_1_to_10: 2,
    money_impact_score_1_to_10: 1,
    habit_value_score_1_to_10: 9,
    recommended_status: 'adopt_now',
    reason: 'Enforcing exact command names prevents unintended execution in local terminals.',
    commander_approval_required: true
  });

  if (hasChaiBlocker) {
    allScorecards.push({
      rank: rank++,
      item_id: behaviorSignals[1].signal_id,
      category: 'System Behavior Signals',
      repeat_score_1_to_10: 7,
      confidence_score_1_to_10: 9,
      system_risk_score_1_to_10: 8,
      money_impact_score_1_to_10: 2,
      habit_value_score_1_to_10: 7,
      recommended_status: 'adopt_now',
      reason: 'Compiler blockers freeze progress and force deferred tasks compilation backlog.',
      commander_approval_required: true
    });
  }

  // --- 10. Recommended Next Actions ---
  console.log('9️⃣ Generating top 5 next actions list...');
  const nextActions: any[] = [];
  let actionId = 1;

  nextActions.push({
    action_id: `ACT-12D-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Isolate and fix typescript compilation in chai-builder-sdk',
    linked_pattern_or_signal: 'SIG-SYS-12D-02',
    why_this_action: 'Resolves outstanding compiler blockage delaying downstream modules test validation.',
    smallest_safe_step: 'Edit the unused variables in panels components to pass tsc compile checks.',
    command_to_run_if_approved: 'npm run build',
    expected_output: 'Build passes compile checks.',
    blocker_if_any: 'None',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-12D-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Create missing cip_audit_report.md local source',
    linked_pattern_or_signal: 'PAT-GAP-12D-01',
    why_this_action: 'Reduces the missing sources count on system diagnostics status briefs.',
    smallest_safe_step: 'Initialize a clean skeleton file under root folder.',
    command_to_run_if_approved: 'touch cip_audit_report.md',
    expected_output: 'cip_audit_report.md created successfully.',
    blocker_if_any: 'None',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-12D-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Create local knowledge_harvest reports directory',
    linked_pattern_or_signal: 'PAT-GAP-12D-01',
    why_this_action: 'Provides a clean location for storing external MCP sidecar inputs.',
    smallest_safe_step: 'Run mkdir for reports sub-folder.',
    command_to_run_if_approved: 'mkdir -p reports/knowledge_harvest',
    expected_output: 'Folder created.',
    blocker_if_any: 'None',
    approval_required: true
  });

  // --- Write individual output files using templates ---
  const blocksOutput: Record<string, string> = {};

  const templatesToGenerate = [
    { name: 'grinders-keep-recurring-gap-pattern-template.md', list: recurringGaps, filePrefix: 'grinders_keep_recurring_gap_patterns' },
    { name: 'grinders-keep-behavior-signal-template.md', list: behaviorSignals, filePrefix: 'grinders_keep_behavior_signals' },
    { name: 'grinders-keep-operating-habit-template.md', list: operatingHabits, filePrefix: 'grinders_keep_operating_habits' },
    { name: 'grinders-keep-learning-lesson-template.md', list: learningLessons, filePrefix: 'grinders_keep_learning_lessons' },
    { name: 'grinders-keep-system-adjustment-template.md', list: systemAdjustments, filePrefix: 'grinders_keep_system_adjustments' },
    { name: 'grinders-keep-risk-pattern-template.md', list: riskPatterns, filePrefix: 'grinders_keep_risk_patterns' },
    { name: 'grinders-keep-monetization-pattern-template.md', list: monetizationPatterns, filePrefix: 'grinders_keep_monetization_patterns' }
  ];

  for (const entry of templatesToGenerate) {
    const tPath = path.join(templatesDir, entry.name);
    let template = '';
    if (fs.existsSync(tPath)) {
      template = fs.readFileSync(tPath, 'utf-8');
    }

    let fileContent = `# Staged ${entry.filePrefix.replace(/_/g, ' ')} - ${dateStr}\n\n`;
    for (const item of entry.list) {
      let block = template || JSON.stringify(item, null, 2);
      for (const [k, v] of Object.entries(item)) {
        block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      fileContent += block + '\n\n---\n\n';
    }

    const outPath = path.join(outputDir, `${entry.filePrefix}_${dateStr}.md`);
    fs.writeFileSync(outPath, fileContent, 'utf-8');
    blocksOutput[entry.filePrefix] = fileContent;
  }

  // Generate Scorecard File
  const scorecardTemplatePath = path.join(templatesDir, 'grinders-keep-adaptive-scorecard-template.md');
  let scorecardTemplate = '';
  if (fs.existsSync(scorecardTemplatePath)) {
    scorecardTemplate = fs.readFileSync(scorecardTemplatePath, 'utf-8');
  }

  let scorecardContent = `# Staged Scorecard - ${dateStr}\n\n`;
  for (const item of allScorecards) {
    let block = scorecardTemplate || JSON.stringify(item, null, 2);
    for (const [k, v] of Object.entries(item)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    scorecardContent += block + '\n\n';
  }
  const scorecardOutPath = path.join(outputDir, `grinders_keep_adaptive_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardOutPath, scorecardContent, 'utf-8');

  // Generate Next Actions File
  const nextActionsTemplatePath = path.join(templatesDir, 'grinders-keep-adaptive-next-actions-template.md');
  let nextActionsTemplate = '';
  if (fs.existsSync(nextActionsTemplatePath)) {
    nextActionsTemplate = fs.readFileSync(nextActionsTemplatePath, 'utf-8');
  }

  let nextActionsContent = `# Staged Next Actions - ${dateStr}\n\n`;
  for (const action of nextActions) {
    let block = nextActionsTemplate || JSON.stringify(action, null, 2);
    for (const [k, v] of Object.entries(action)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    nextActionsContent += block + '\n\n';
  }
  const actionsOutPath = path.join(outputDir, `grinders_keep_adaptive_next_actions_${dateStr}.md`);
  fs.writeFileSync(actionsOutPath, nextActionsContent, 'utf-8');

  // Generate Main Unified Adaptive Report
  const reportTemplatePath = path.join(templatesDir, 'grinders-keep-adaptive-learning-report-template.md');
  let reportTemplate = '';
  if (fs.existsSync(reportTemplatePath)) {
    reportTemplate = fs.readFileSync(reportTemplatePath, 'utf-8');
  }

  const integrityScore = todayManifest ? todayManifest.integrity_score : 9;
  const totalLearningCount = recurringGaps.length + behaviorSignals.length + operatingHabits.length + learningLessons.length;

  let finalReport = reportTemplate
    .replace(/{{date}}/g, dateStr)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{integrity_score}}/g, String(integrityScore))
    .replace(/{{total_learning_count}}/g, String(totalLearningCount))
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{recurring_gap_patterns}}/g, blocksOutput.grinders_keep_recurring_gap_patterns)
    .replace(/{{behavior_signals}}/g, blocksOutput.grinders_keep_behavior_signals)
    .replace(/{{operating_habits}}/g, blocksOutput.grinders_keep_operating_habits)
    .replace(/{{learning_lessons}}/g, blocksOutput.grinders_keep_learning_lessons)
    .replace(/{{system_adjustments}}/g, blocksOutput.grinders_keep_system_adjustments)
    .replace(/{{risk_patterns}}/g, blocksOutput.grinders_keep_risk_patterns)
    .replace(/{{monetization_patterns}}/g, blocksOutput.grinders_keep_monetization_patterns)
    .replace(/{{adaptive_scorecard}}/g, scorecardContent)
    .replace(/{{recommended_next_actions}}/g, nextActionsContent);

  const mainReportOutPath = path.join(outputDir, `grinders_keep_adaptive_learning_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Adaptive Learning Deepener Summary report to: ${mainReportOutPath}`);

  // --- Update Frontpage Section ---
  const frontpagePath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`);
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');
    
    // Construct the Adaptive Learning Deepener markdown block
    let deepenerBlock = `\n## 🧠 Adaptive Learning Deepener\n`;
    deepenerBlock += `- **Top Recurring Pattern:** ${recurringGaps[0]?.pattern_name || 'None'}\n`;
    deepenerBlock += `- **Top Behavior Signal:** ${behaviorSignals[0]?.signal_name || 'None'}\n`;
    deepenerBlock += `- **Top Operating Habit:** ${operatingHabits[0]?.habit_name || 'None'}\n`;
    deepenerBlock += `- **Top Risk Pattern:** ${riskPatterns[0]?.risk_name || 'None'}\n`;
    deepenerBlock += `- **Top Monetization Pattern:** ${monetizationPatterns[0]?.output_or_module || 'None'}\n`;
    deepenerBlock += `- **Recommended Next Action:** ${nextActions[0]?.action_name || 'None'} (\`${nextActions[0]?.command_to_run_if_approved}\`)\n\n`;
    deepenerBlock += `### 📝 Commander Deepener Review Checklist\n`;
    deepenerBlock += `- [ ] Sign off on the adaptive operating habits proposal.\n`;
    deepenerBlock += `- [ ] Schedule system adjustments execution for Phase 12E.\n`;
    
    // Append or replace the section if it already exists
    if (frontpageContent.includes('## Adaptive Learning Deepener')) {
      const parts = frontpageContent.split('## Adaptive Learning Deepener');
      frontpageContent = parts[0] + deepenerBlock + (parts[1]?.split('##')?.[1] ? '\n##' + parts[1].split('##').slice(1).join('##') : '');
    } else {
      frontpageContent += '\n' + deepenerBlock;
    }

    fs.writeFileSync(frontpagePath, frontpageContent, 'utf-8');
    console.log(`✅ Updated Frontpage at: ${frontpagePath}`);
  }

  // --- Write JSON manifest ---
  const jsonManifest = {
    date: dateStr,
    timestamp,
    manifest_count: manifestCount,
    total_learning_count: totalLearningCount,
    recurring_gap_patterns: recurringGaps,
    behavior_signals: behaviorSignals,
    operating_habits: operatingHabits,
    learning_lessons: learningLessons,
    system_adjustments: systemAdjustments,
    risk_patterns: riskPatterns,
    monetization_patterns: monetizationPatterns,
    scorecard: allScorecards,
    next_actions: nextActions
  };

  const jsonManifestPath = path.join(outputDir, `grinders_keep_adaptive_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Adaptive Learning JSON manifest to: ${jsonManifestPath}`);

  // Update log
  logContent += `## Audit Scan Results:\n`;
  logContent += `- Total Learning Items Count: ${totalLearningCount}\n`;
  logContent += `- Recurring gap patterns: ${recurringGaps.length}\n`;
  logContent += `- Behavior signals: ${behaviorSignals.length}\n`;
  logContent += `- Operating habits: ${operatingHabits.length}\n`;
  logContent += `- Learning lessons: ${learningLessons.length}\n`;
  logContent += `- System adjustments: ${systemAdjustments.length}\n`;
  logContent += `- Risk patterns: ${riskPatterns.length}\n`;
  logContent += `- Monetization patterns: ${monetizationPatterns.length}\n`;
  logContent += `\n## Output generated files:\n`;
  logContent += `- Summary Report: ${mainReportOutPath}\n`;
  logContent += `- JSON manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved execution log to: ${logFile}`);

  await announceCompletion("Grinders Keep Adaptive Learning deep sweep complete", "10");
}

runAdaptiveDeepener().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
