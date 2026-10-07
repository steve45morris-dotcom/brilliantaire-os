import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMMAND_REGISTRY } from '../config/commands.js';
import { announceIntent, announceCompletion } from './vnp.js';
import { inputFiles } from '../config/grinders-keep-core-brief-engine.js';
import {
  expectedFiles,
  expectedFolders,
  staleCheckDirs,
  outputDir,
  logsDir,
  templatesDir
} from '../config/grinders-keep-gap-hunter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runGapHunter() {
  const dateStr = getFormattedDate();
  console.log(`🔍 Starting Grinders Keep Gap Hunter v0.1 for ${dateStr}...`);
  await announceIntent("Executing gap hunter scan of local project directories");

  // Ensure output folders exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `grinders_keep_gap_hunter_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Gap Hunter Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Missing Source Detection ---
  console.log('1️⃣ Scanning for missing expected files and folders...');
  const missingSourcesGaps: any[] = [];
  let missingSourceGapId = 1;

  for (const item of expectedFiles) {
    const exists = fs.existsSync(item.path);
    if (!exists) {
      missingSourcesGaps.push({
        gap_id: `GAP-SRC-12C-${String(missingSourceGapId++).padStart(2, '0')}`,
        missing_source: path.basename(item.path),
        expected_path: path.relative(REPO_ROOT, item.path),
        source_type: 'file',
        evidence_status: 'unavailable',
        impact: `Core file ${path.basename(item.path)} is missing, preventing proper parsing of active OS configuration.`,
        severity: 'high',
        suggested_next_action: `Re-create or restore ${path.basename(item.path)} in the repository root.`,
        confidence_score_1_to_10: 1,
        commander_approval_required: true
      });
    }
  }

  for (const folder of expectedFolders) {
    const exists = fs.existsSync(folder.path);
    if (!exists) {
      missingSourcesGaps.push({
        gap_id: `GAP-SRC-12C-${String(missingSourceGapId++).padStart(2, '0')}`,
        missing_source: path.basename(folder.path) || folder.path,
        expected_path: path.relative(REPO_ROOT, folder.path),
        source_type: 'folder',
        evidence_status: 'unavailable',
        impact: `Required staging/output directory is missing, blocking file exports or read metrics.`,
        severity: folder.path.includes('reports') ? 'medium' : 'high',
        suggested_next_action: `Create ${path.basename(folder.path) || folder.path} folder structure manually.`,
        confidence_score_1_to_10: 1,
        commander_approval_required: true
      });
    }
  }

  // --- 2. Stale Output Detection ---
  console.log('2️⃣ Auditing folders for stale output files...');
  const staleGaps: any[] = [];
  let staleGapId = 1;

  for (const checkDir of staleCheckDirs) {
    if (fs.existsSync(checkDir)) {
      try {
        const files = fs.readdirSync(checkDir).filter(f => !f.startsWith('.'));
        for (const file of files) {
          const filePath = path.join(checkDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            const ageInMs = Date.now() - stat.mtimeMs;
            // Mark files older than 24 hours as stale
            if (ageInMs > 24 * 60 * 60 * 1000) {
              const fileAgeHours = Math.round(ageInMs / (1000 * 60 * 60));
              staleGaps.push({
                gap_id: `GAP-STL-12C-${String(staleGapId++).padStart(2, '0')}`,
                output_path: path.relative(REPO_ROOT, filePath),
                last_modified: stat.mtime.toISOString(),
                report_date_if_available: file.match(/\d{4}-\d{2}-\d{2}/)?.[0] || 'unknown',
                current_phase_reference: 'Phase 12C: Grinders Keep Gap Hunter',
                stale_reason: `File has not been modified for ${fileAgeHours} hours, showing inactivity since previous phase.`,
                impact: 'Decisions are processed using outdated telemetry outputs, increasing system execution risk.',
                severity: 'medium',
                suggested_next_action: `Run corresponding npm run command to refresh output file: ${file}`,
                confidence_score_1_to_10: 8,
                commander_approval_required: true
              });
            }
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // --- 3. Duplicate Risk Detection ---
  console.log('3️⃣ Checking for duplicate generated reports...');
  const duplicateGaps: any[] = [];
  let duplicateGapId = 1;

  const briefOutputDir = path.join(REPO_ROOT, 'outputs', 'daily_briefs');
  if (fs.existsSync(briefOutputDir)) {
    try {
      const files = fs.readdirSync(briefOutputDir).filter(f => f.startsWith('daily_brief_') && f.endsWith('.md'));
      if (files.length > 1) {
        duplicateGaps.push({
          gap_id: `GAP-DUP-12C-${String(duplicateGapId++).padStart(2, '0')}`,
          suspected_duplicate_group: 'Multiple daily briefs under outputs/daily_briefs/',
          files_detected: files.join(', '),
          duplicate_basis: 'filename_similarity, same_output_type',
          risk_if_ignored: 'Accumulation of stale text files increases workspace clutter and makes sync status slow.',
          suggested_review_action: 'Run cleanup-gate scan-duplicates to review staging plans.',
          cleanup_allowed: false,
          commander_approval_required: true
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  // --- 4. Blocked Phase Detection ---
  console.log('4️⃣ Reading NEXT_ACTIONS.md for blocked/incomplete tasks...');
  const blockedGaps: any[] = [];
  let blockedGapId = 1;

  const nextActionsPath = path.join(REPO_ROOT, 'NEXT_ACTIONS.md');
  if (fs.existsSync(nextActionsPath)) {
    const content = fs.readFileSync(nextActionsPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      // Check for blocked indicator warnings
      if (line.includes('- [ ]') && (line.includes('⚠️') || line.toLowerCase().includes('blocked') || line.toLowerCase().includes('dependency'))) {
        blockedGaps.push({
          gap_id: `GAP-BLK-12C-${String(blockedGapId++).padStart(2, '0')}`,
          phase_name: 'Stalled action checklist task',
          evidence_source: `NEXT_ACTIONS.md: "${line.trim()}"`,
          blocker: line.includes('chai-builder-sdk') ? 'chai-builder-sdk compilation error' : 'Pending documentation or compiler checks',
          dependency: line.includes('chai-builder-sdk') ? 'upstream TypeScript variable definitions' : 'Unresolved prerequisite tasks',
          impact: 'Downstream integrations are paused, delaying overall operating milestones.',
          severity: 'medium',
          suggested_next_action: 'Perform manual audit and remove compiler hurdles.',
          commander_approval_required: true
        });
      }
    }
  }

  // --- 5. Weak Documentation Detection ---
  console.log('5️⃣ Auditing markdown documentation files for weak/unresolved items...');
  const weakDocGaps: any[] = [];
  let weakDocGapId = 1;

  const filesToAudit = [
    { path: path.join(REPO_ROOT, 'README.md'), name: 'README.md' },
    { path: path.join(REPO_ROOT, 'COMMANDS.md'), name: 'COMMANDS.md' },
    { path: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'), name: 'SYSTEM_STATUS.md' },
    { path: path.join(REPO_ROOT, 'PROJECTS.md'), name: 'PROJECTS.md' }
  ];

  for (const doc of filesToAudit) {
    if (fs.existsSync(doc.path)) {
      const content = fs.readFileSync(doc.path, 'utf-8');
      const lines = content.split('\n');
      
      let todoCount = 0;
      let conflictCount = 0;
      let unresolvedMatch = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('TODO') || line.includes('FIXME')) {
          todoCount++;
          if (!unresolvedMatch) unresolvedMatch = `Line ${i + 1}: ${line.trim()}`;
        }
        if (line.includes('<<<<<<<') || line.includes('=======') || line.includes('>>>>>>>')) {
          conflictCount++;
          if (!unresolvedMatch) unresolvedMatch = `Line ${i + 1}: ${line.trim()}`;
        }
      }

      if (todoCount > 0 || conflictCount > 0) {
        weakDocGaps.push({
          gap_id: `GAP-DOC-12C-${String(weakDocGapId++).padStart(2, '0')}`,
          doc_path: doc.name,
          issue_type: conflictCount > 0 ? 'conflict_markers' : 'unresolved_todos',
          evidence_snippet: unresolvedMatch,
          impact: 'Outdated or conflicting document guidelines confuse operators and increase runtime errors.',
          suggested_fix: conflictCount > 0 ? 'Resolve git merge conflict flags manually.' : 'Audit and resolve outstanding TODO flags.',
          confidence_score_1_to_10: 9,
          commander_approval_required: true
        });
      }
    }
  }

  // --- 6. Missing Dashboard Detection ---
  console.log('6️⃣ Auditing modules for lack of top-level README/dashboard summaries...');
  const missingDashboardsGaps: any[] = [];
  let dashboardGapId = 1;

  const foldersToCheckDashboards = [
    { path: path.join(REPO_ROOT, 'outputs', 'asr_validation'), name: 'outputs/asr_validation' },
    { path: path.join(REPO_ROOT, 'outputs', 'asr_dry_run'), name: 'outputs/asr_dry_run' },
    { path: path.join(REPO_ROOT, 'outputs', 'grounded_narrator'), name: 'outputs/grounded_narrator' }
  ];

  for (const folder of foldersToCheckDashboards) {
    if (fs.existsSync(folder.path)) {
      const files = fs.readdirSync(folder.path);
      const hasDashboard = files.some(f => ['README.md', 'index.html', 'dashboard.md', 'index.md'].includes(f));
      if (!hasDashboard) {
        missingDashboardsGaps.push({
          gap_id: `GAP-DSH-12C-${String(dashboardGapId++).padStart(2, '0')}`,
          module_or_output_group: folder.name,
          reports_detected: files.filter(f => !f.startsWith('.')).slice(0, 3).join(', '),
          dashboard_detected: false,
          impact: 'Individual files are generated without a unified dashboard or index page, cluttering visibility.',
          suggested_dashboard_file: `${folder.name}/README.md listing file indexes.`,
          commander_approval_required: true
        });
      }
    }
  }

  // --- 7. Unverified Metrics Detection ---
  console.log('7️⃣ Audit workspace status metrics lack of verification metadata...');
  const unverifiedMetricsGaps: any[] = [];
  let metricGapId = 1;

  const schedulerPath = path.join(REPO_ROOT, 'SCHEDULER_STATUS.md');
  if (fs.existsSync(schedulerPath)) {
    const content = fs.readFileSync(schedulerPath, 'utf-8');
    // Successful runs metric
    const match = content.match(/-\s+\*\*Successful runs\*\*:\s*(\d+)/i);
    if (match) {
      unverifiedMetricsGaps.push({
        gap_id: `GAP-MTR-12C-${String(metricGapId++).padStart(2, '0')}`,
        metric_name: 'scheduler_successful_runs',
        metric_value: match[1],
        evidence_source: 'SCHEDULER_STATUS.md line 5',
        verification_status: 'unverified_by_log_hash',
        risk: 'Scheduler run telemetry could drift without validation signatures.',
        suggested_verification_action: 'Audit logs under outputs/ logs/ to map run execution receipts.',
        commander_approval_required: true
      });
    }
  }

  // --- 8. Command Routing Gap Detection ---
  console.log('8️⃣ Auditing Command Router registry against COMMANDS.md...');
  const routingGaps: any[] = [];
  let routingGapId = 1;

  if (fs.existsSync(inputFiles.commands)) {
    const commandsContent = fs.readFileSync(inputFiles.commands, 'utf-8');
    
    // Check if commands in registry have requiresExactName: false
    for (const cmd of COMMAND_REGISTRY) {
      if (!cmd.requiresExactName) {
        routingGaps.push({
          gap_id: `GAP-RTR-12C-${String(routingGapId++).padStart(2, '0')}`,
          command_name: cmd.name,
          gap_type: 'missing_requires_exact_name',
          evidence_source: `config/commands.ts: cmd.name = ${cmd.name}`,
          risk: 'Aliases allowed for this command, increasing accidental execution risk under keyboard collisions.',
          suggested_fix: `Update command config to set requiresExactName: true for command "${cmd.name}".`,
          commander_approval_required: true
        });
      }
    }

    // Check if COMMANDS.md contains documented commands missing from config/commands.ts
    const documentedCommands = commandsContent.match(/\|\s*`[a-zA-Z0-9-]+`\s*\|/g);
    if (documentedCommands) {
      for (const rawCmd of documentedCommands) {
        const cmdName = rawCmd.replace(/[|`\s]/g, '');
        const exists = COMMAND_REGISTRY.some(c => c.name === cmdName);
        if (!exists) {
          routingGaps.push({
            gap_id: `GAP-RTR-12C-${String(routingGapId++).padStart(2, '0')}`,
            command_name: cmdName,
            gap_type: 'documented_command_missing_from_router',
            evidence_source: `COMMANDS.md documentation table`,
            risk: 'Operators cannot run documented command because it is missing from configuration.',
            suggested_fix: `Add command definition for "${cmdName}" to config/commands.ts registry.`,
            commander_approval_required: true
          });
        }
      }
    }
  }

  // --- 9. Unmonetized Output Detection ---
  console.log('9️⃣ Inspecting folders for unmonetized creative outputs...');
  const unmonetizedGaps: any[] = [];
  let unmonetizedGapId = 1;

  const contentDraftsDir = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_drafts');
  if (fs.existsSync(contentDraftsDir)) {
    try {
      const files = fs.readdirSync(contentDraftsDir);
      if (files.length > 0) {
        unmonetizedGaps.push({
          gap_id: `GAP-MON-12C-${String(unmonetizedGapId++).padStart(2, '0')}`,
          output_path_or_module: 'outputs/grinders_keep/content_drafts/',
          monetization_type: 'lead_magnet',
          why_it_has_value: 'Contains verified Icyflamze ideas and build notes that can build audience growth.',
          smallest_useful_money_move: 'Export the draft texts to premium developer newsletter calendar.',
          money_confidence_score_1_to_10: 8,
          reason_for_money_score: 'Dev newsletters drive paid consultant referrals and sponsors.',
          risk_or_constraint: 'Requires careful editing to prevent leaking proprietary OS capabilities.',
          commander_approval_required: true
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  // --- 10. Gap Scorecard & Sorting ---
  console.log('🔟 Formatting Gap Scorecard and Next Actions...');
  const allGaps = [
    ...missingSourcesGaps.map(g => ({ ...g, category: 'Missing Sources' })),
    ...staleGaps.map(g => ({ ...g, category: 'Stale Outputs' })),
    ...duplicateGaps.map(g => ({ ...g, category: 'Duplicate Risks' })),
    ...blockedGaps.map(g => ({ ...g, category: 'Blocked Phases' })),
    ...weakDocGaps.map(g => ({ ...g, category: 'Weak Documentation' })),
    ...missingDashboardsGaps.map(g => ({ ...g, category: 'Missing Dashboards' })),
    ...unverifiedMetricsGaps.map(g => ({ ...g, category: 'Unverified Metrics' })),
    ...routingGaps.map(g => ({ ...g, category: 'Command Routing' })),
    ...unmonetizedGaps.map(g => ({ ...g, category: 'Unmonetized Outputs' }))
  ];

  // Assign scorecard scores based on category and severity
  const scorecardItems = allGaps.map((gap, index) => {
    let severity = gap.severity === 'high' ? 9 : (gap.severity === 'medium' ? 6 : 3);
    let moneyImpact = gap.category === 'Unmonetized Outputs' ? 8 : (gap.category === 'Blocked Phases' ? 6 : 2);
    let risk = gap.category === 'Missing Sources' ? 9 : (gap.category === 'Command Routing' ? 8 : 3);
    let effort = gap.category === 'Missing Dashboards' ? 2 : 5;

    return {
      rank: index + 1,
      gap_id: gap.gap_id,
      category: gap.category,
      severity_score_1_to_10: severity,
      urgency_score_1_to_10: severity,
      money_impact_score_1_to_10: moneyImpact,
      system_risk_score_1_to_10: risk,
      effort_score_1_to_10: effort,
      recommended_status: severity >= 8 ? 'fix_now' : 'schedule',
      reason: `Audited based on local file scan findings for category ${gap.category}.`,
      commander_approval_required: true
    };
  });

  // --- 11. Recommended Next Actions ---
  const topGaps = allGaps.slice(0, 5);
  const nextActions = topGaps.map((gap, index) => {
    const actionId = `ACT-12C-0${index + 1}`;
    let actionName = '';
    let step = '';
    let cmd = 'npm run command -- "grinders-keep-gap-hunter"';

    if (gap.category === 'Missing Sources') {
      actionName = `Restore missing source file ${gap.missing_source}`;
      step = `Verify existence of ${gap.missing_source} and run local check.`;
    } else if (gap.category === 'Stale Outputs') {
      actionName = `Refresh stale report at ${gap.output_path}`;
      step = `Execute updater command to regenerate the report.`;
    } else if (gap.category === 'Command Routing') {
      actionName = `Add requiresExactName config for ${gap.command_name}`;
      step = `Edit config/commands.ts and update requiresExactName flag.`;
      cmd = `npm run command -- "grinders-keep-daily-brief"`;
    } else {
      actionName = `Audit and resolve gaps in ${gap.category}`;
      step = `Verify local files are mapped safely before updates.`;
    }

    return {
      action_id: actionId,
      action_name: actionName,
      linked_gap_id: gap.gap_id,
      why_this_action: `Addresses the detected ${gap.category} gap under local safety gates.`,
      smallest_safe_step: step,
      command_to_run_if_approved: cmd,
      expected_output: 'Verified file or status checklist.',
      blocker_if_any: 'None (Requires Commander approval flag)',
      approval_required: true
    };
  });

  // --- Write individual output files ---
  const templatesToGenerate = [
    { name: 'grinders-keep-missing-source-gap-template.md', list: missingSourcesGaps, filePrefix: 'grinders_keep_missing_sources' },
    { name: 'grinders-keep-stale-output-gap-template.md', list: staleGaps, filePrefix: 'grinders_keep_stale_outputs' },
    { name: 'grinders-keep-duplicate-risk-gap-template.md', list: duplicateGaps, filePrefix: 'grinders_keep_duplicate_risks' },
    { name: 'grinders-keep-blocked-phase-gap-template.md', list: blockedGaps, filePrefix: 'grinders_keep_blocked_phases' },
    { name: 'grinders-keep-weak-doc-gap-template.md', list: weakDocGaps, filePrefix: 'grinders_keep_weak_docs' },
    { name: 'grinders-keep-missing-dashboard-gap-template.md', list: missingDashboardsGaps, filePrefix: 'grinders_keep_missing_dashboards' },
    { name: 'grinders-keep-unverified-metric-gap-template.md', list: unverifiedMetricsGaps, filePrefix: 'grinders_keep_unverified_metrics' },
    { name: 'grinders-keep-command-routing-gap-template.md', list: routingGaps, filePrefix: 'grinders_keep_command_routing_gaps' },
    { name: 'grinders-keep-unmonetized-output-gap-template.md', list: unmonetizedGaps, filePrefix: 'grinders_keep_unmonetized_outputs' }
  ];

  const blocksOutput: Record<string, string> = {};

  for (const entry of templatesToGenerate) {
    const tPath = path.join(templatesDir, entry.name);
    let template = '';
    if (fs.existsSync(tPath)) {
      template = fs.readFileSync(tPath, 'utf-8');
    }

    let fileContent = `# Staged ${entry.filePrefix.replace(/_/g, ' ')} list - ${dateStr}\n\n`;

    if (entry.list.length === 0) {
      fileContent += `*No gaps detected in this category under real project scans.*\n`;
    } else {
      for (const item of entry.list) {
        let block = template || JSON.stringify(item, null, 2);
        for (const [k, v] of Object.entries(item)) {
          block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        }
        fileContent += block + '\n\n---\n\n';
      }
    }

    const outPath = path.join(outputDir, `${entry.filePrefix}_${dateStr}.md`);
    fs.writeFileSync(outPath, fileContent, 'utf-8');
    blocksOutput[entry.filePrefix] = fileContent;
  }

  // Generate Scorecard File
  const scorecardTemplatePath = path.join(templatesDir, 'grinders-keep-gap-scorecard-template.md');
  let scorecardTemplate = '';
  if (fs.existsSync(scorecardTemplatePath)) {
    scorecardTemplate = fs.readFileSync(scorecardTemplatePath, 'utf-8');
  }

  let scorecardContent = `# Staged Scorecard Gaps - ${dateStr}\n\n`;
  if (scorecardItems.length === 0) {
    scorecardContent += `*Zero scorecard gaps logged.*`;
  } else {
    for (const item of scorecardItems) {
      let block = scorecardTemplate;
      for (const [k, v] of Object.entries(item)) {
        block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      scorecardContent += block + '\n\n';
    }
  }
  const scorecardOutPath = path.join(outputDir, `grinders_keep_gap_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardOutPath, scorecardContent, 'utf-8');

  // Generate Next Actions File
  const nextActionsTemplatePath = path.join(templatesDir, 'grinders-keep-gap-next-actions-template.md');
  let nextActionsTemplate = '';
  if (fs.existsSync(nextActionsTemplatePath)) {
    nextActionsTemplate = fs.readFileSync(nextActionsTemplatePath, 'utf-8');
  }

  let nextActionsContent = `# Staged Next Actions - ${dateStr}\n\n`;
  if (nextActions.length === 0) {
    nextActionsContent += `*Zero recommended actions.*`;
  } else {
    for (const action of nextActions) {
      let block = nextActionsTemplate;
      for (const [k, v] of Object.entries(action)) {
        block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      nextActionsContent += block + '\n\n';
    }
  }
  const actionsOutPath = path.join(outputDir, `grinders_keep_gap_next_actions_${dateStr}.md`);
  fs.writeFileSync(actionsOutPath, nextActionsContent, 'utf-8');

  // Generate Unified Gap Hunter Report
  const mainReportTemplatePath = path.join(templatesDir, 'grinders-keep-gap-hunter-report-template.md');
  let reportTemplate = '';
  if (fs.existsSync(mainReportTemplatePath)) {
    reportTemplate = fs.readFileSync(mainReportTemplatePath, 'utf-8');
  }

  // Compute System Integrity score: starts at 10, minus 1 for each severe gap
  const severeGaps = allGaps.filter(g => g.severity === 'high').length;
  const integrityScore = Math.max(1, 10 - severeGaps);

  let finalReport = reportTemplate
    .replace(/{{date}}/g, dateStr)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{total_gaps_count}}/g, String(allGaps.length))
    .replace(/{{integrity_score}}/g, String(integrityScore))
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{gap_scorecard}}/g, scorecardContent)
    .replace(/{{recommended_next_actions}}/g, nextActionsContent);

  const mainReportOutPath = path.join(outputDir, `grinders_keep_gap_hunter_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Gap Hunter Summary report to: ${mainReportOutPath}`);

  // Generate Grinders Keep Frontpage
  const topGapsNames = allGaps.slice(0, 3).map(g => `- **${g.gap_id}**: ${g.category === 'Missing Sources' ? g.missing_source : (g.category === 'Blocked Phases' ? g.phase_name : g.gap_id)}`).join('\n');
  const topMissingSource = missingSourcesGaps[0] ? `- **${missingSourcesGaps[0].gap_id}**: ${missingSourcesGaps[0].missing_source}` : 'None';
  const topBlockedPhase = blockedGaps[0] ? `- **${blockedGaps[0].gap_id}**: ${blockedGaps[0].phase_name} (${blockedGaps[0].blocker})` : 'None';
  const topUnmonetizedOutput = unmonetizedGaps[0] ? `- **${unmonetizedGaps[0].gap_id}**: ${unmonetizedGaps[0].output_path_or_module}` : 'None';
  const topCommandRouting = routingGaps[0] ? `- **${routingGaps[0].gap_id}**: ${routingGaps[0].command_name} (${routingGaps[0].gap_type})` : 'None';

  let frontpageContent = `# Grinders Keep Frontpage: ${dateStr}\n\n`;
  frontpageContent += `## 🚀 R&D Engine Status\n`;
  frontpageContent += `- **Status:** Phase 12C Gap Hunter audit sweep active\n`;
  frontpageContent += `- **System Integrity Rating:** ${integrityScore}/10\n`;
  frontpageContent += `- **Total Gaps Tracked:** ${allGaps.length}\n\n`;

  frontpageContent += `## ⚠️ Top Gaps Detected\n${topGapsNames}\n\n`;
  frontpageContent += `## 🔍 Key Indicators\n`;
  frontpageContent += `- **Top Missing Source:**\n  ${topMissingSource}\n`;
  frontpageContent += `- **Top Blocked Phase:**\n  ${topBlockedPhase}\n`;
  frontpageContent += `- **Top Unmonetized Output:**\n  ${topUnmonetizedOutput}\n`;
  frontpageContent += `- **Top Command Routing Issue:**\n  ${topCommandRouting}\n\n`;

  frontpageContent += `## 🚀 Recommended Next Action\n`;
  frontpageContent += nextActions[0] ? `- **Action:** ${nextActions[0].action_name}\n  - **Smallest Step:** ${nextActions[0].smallest_safe_step}\n  - **Command:** \`${nextActions[0].command_to_run_if_approved}\`\n` : 'None\n';

  frontpageContent += `\n## 📁 Latest Generated Outputs\n`;
  frontpageContent += `- Summary Report: ${mainReportOutPath}\n`;
  frontpageContent += `- Scorecard MD: ${scorecardOutPath}\n`;
  frontpageContent += `- JSON manifest: outputs/grinders_keep/gap_hunter/grinders_keep_gap_hunter_manifest_${dateStr}.json\n\n`;

  frontpageContent += `## 📝 Commander Review Checklist\n`;
  frontpageContent += `- [ ] Review and approve the Gap Hunter Summary report.\n`;
  frontpageContent += `- [ ] Sign off on high-priority missing source files correction checklists.\n`;
  frontpageContent += `- [ ] Approve task scheduling for Phase 12D.\n`;

  const frontpageOutPath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`);
  fs.writeFileSync(frontpageOutPath, frontpageContent, 'utf-8');
  console.log(`✅ Saved Grinders Keep Frontpage to: ${frontpageOutPath}`);

  // Write JSON manifest
  const jsonManifest = {
    date: dateStr,
    timestamp,
    total_gaps_detected: allGaps.length,
    integrity_score: integrityScore,
    gaps: {
      missing_sources: missingSourcesGaps,
      stale_outputs: staleGaps,
      duplicate_risks: duplicateGaps,
      blocked_phases: blockedGaps,
      weak_docs: weakDocGaps,
      missing_dashboards: missingDashboardsGaps,
      unverified_metrics: unverifiedMetricsGaps,
      command_routing_gaps: routingGaps,
      unmonetized_outputs: unmonetizedGaps
    },
    scorecard: scorecardItems,
    recommended_next_actions: nextActions
  };

  const jsonManifestPath = path.join(outputDir, `grinders_keep_gap_hunter_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Gap Hunter JSON manifest to: ${jsonManifestPath}`);

  // Update log
  logContent += `## Audit Scan Results:\n`;
  logContent += `- Total Gaps Count: ${allGaps.length}\n`;
  logContent += `- Missing sources detected: ${missingSourcesGaps.length}\n`;
  logContent += `- Stale outputs detected: ${staleGaps.length}\n`;
  logContent += `- Duplicate risks detected: ${duplicateGaps.length}\n`;
  logContent += `- Blocked phases detected: ${blockedGaps.length}\n`;
  logContent += `- Weak docs detected: ${weakDocGaps.length}\n`;
  logContent += `- Missing dashboards: ${missingDashboardsGaps.length}\n`;
  logContent += `- Unverified metrics: ${unverifiedMetricsGaps.length}\n`;
  logContent += `- Command routing gaps: ${routingGaps.length}\n`;
  logContent += `- Unmonetized outputs: ${unmonetizedGaps.length}\n`;
  logContent += `\n## Output generated files:\n`;
  logContent += `- Summary Report: ${mainReportOutPath}\n`;
  logContent += `- Frontpage MD: ${frontpageOutPath}\n`;
  logContent += `- JSON manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved execution log to: ${logFile}`);

  await announceCompletion("Grinders Keep Gap Hunter sweep complete", "10");
}

runGapHunter().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
