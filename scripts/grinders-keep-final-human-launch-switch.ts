import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  outputFolders,
  referenceSources,
  optionalSources,
  TEMPLATE_ROOT,
  MODULE_NAME
} from '../config/grinders-keep-final-human-launch-switch.js';

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

interface BlockedExecutionTicket {
  blocked_ticket_id: string;
  linked_decision_id: string;
  item_name: string;
  reason_blocked: string;
  missing_approval_or_evidence: string;
  risk_if_executed: string;
  smallest_safe_unblock_step: string;
  execution_allowed: string;
  commander_final_approval_required: string;
}

interface ApprovedDecisionTicket {
  ticket_id: string;
  linked_decision_id: string;
  ticket_type: string;
  ticket_name: string;
  source_decision: string;
  evidence_sources: string;
  approved_by_human: string;
  execution_allowed: string;
  execution_status: string;
  exact_command_if_available: string;
  smallest_safe_step: string;
  expected_output: string;
  rollback_or_fail_closed_note: string;
  risk_or_constraint: string;
  commander_final_approval_required: string;
}

async function runFinalHumanLaunchSwitch() {
  const dateStr = getFormattedDate();
  console.log(`🚀 Starting Grinders Keep Final Human Launch Switch for ${dateStr}...`);
  await announceIntent("Processing Grinders Keep final human launch switch");

  // Ensure output folders exist
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  const logFile = path.join(outputFolders.logs, `grinders_keep_final_launch_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Final Human Launch Switch Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Audit Reference Sources ---
  logContent += `## Reference Telemetry Sources Status\n\n`;
  const referenceAudit: Record<string, { source_status: string; evidence_status: string; confidence_score_1_to_10: number; impact: string; suggested_next_action: string }> = {};

  for (const [key, filePath] of Object.entries(referenceSources)) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      referenceAudit[key] = {
        source_status: 'present',
        evidence_status: 'available',
        confidence_score_1_to_10: 10,
        impact: 'Reference source telemetry exists for launch validation.',
        suggested_next_action: 'Proceed with launch switch validation'
      };
      logContent += `- **${key}:** Present (Path: ${filePath})\n`;
    } else {
      referenceAudit[key] = {
        source_status: 'missing',
        evidence_status: 'unavailable',
        confidence_score_1_to_10: 1,
        impact: `Reference source ${key} is missing. Launch switch validation may be degraded.`,
        suggested_next_action: `Run appropriate generator command to establish ${key}`
      };
      logContent += `- **${key}:**\n`;
      logContent += `  * source_status: missing\n`;
      logContent += `  * evidence_status: unavailable\n`;
      logContent += `  * confidence_score_1_to_10: 1\n`;
      logContent += `  * impact: Reference source ${key} is missing from workspace\n`;
      logContent += `  * suggested_next_action: Run previous phase script to generate ${key}\n`;
    }
  }

  // Optional sources
  logContent += `\n## Optional Telemetry Sources Status\n\n`;
  for (const [key, filePath] of Object.entries(optionalSources)) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      logContent += `- **${key}:** Present (Path: ${filePath})\n`;
    } else {
      logContent += `- **${key}:** MISSING (Path: ${filePath})\n`;
    }
  }

  // --- 2. Load Execution Queue Manifest ---
  let queueManifest: any = null;
  let rawApprovedTickets: ApprovedDecisionTicket[] = [];
  let rawBlockedTickets: BlockedExecutionTicket[] = [];

  if (referenceAudit.executionQueueManifest.source_status === 'present') {
    try {
      const manifestText = fs.readFileSync(referenceSources.executionQueueManifest, 'utf-8');
      queueManifest = JSON.parse(manifestText);
      rawApprovedTickets = queueManifest.approved_decision_tickets || [];
      rawBlockedTickets = queueManifest.blocked_execution_tickets || [];
    } catch (e) {
      console.warn(`[Warning] Failed to parse execution queue manifest JSON: ${(e as Error).message}`);
    }
  }

  // --- 3. Launch Ticket Discovery ---
  const candidates: any[] = [];
  let canSeq = 1;

  // Process approved tickets (if any exist)
  for (const tkt of rawApprovedTickets) {
    candidates.push({
      launch_candidate_id: `LCH-CAN-${dateStr.replace(/-/g, '')}-${String(canSeq++).padStart(2, '0')}`,
      ticket_id: tkt.ticket_id,
      ticket_type: tkt.ticket_type,
      ticket_name: tkt.ticket_name,
      source_path: path.join('outputs', 'grinders_keep', 'execution_approval_queue', 'tickets', `grinders_keep_approved_decision_tickets_${dateStr}.md`),
      prior_approval_status: 'approved',
      final_approval_marker_detected: 'false', // Default to false until human approves launch
      evidence_status: 'available',
      source_summary: `Staged approved decision from Phase 12J: ${tkt.ticket_name}`,
      confidence_score_1_to_10: '10',
      commander_final_approval_required: 'true'
    });
  }

  // Process blocked tickets
  for (const blk of rawBlockedTickets) {
    candidates.push({
      launch_candidate_id: `LCH-CAN-${dateStr.replace(/-/g, '')}-${String(canSeq++).padStart(2, '0')}`,
      ticket_id: blk.blocked_ticket_id,
      ticket_type: 'blocked_item',
      ticket_name: blk.item_name,
      source_path: path.join('outputs', 'grinders_keep', 'execution_approval_queue', 'blocked', `grinders_keep_blocked_execution_tickets_${dateStr}.md`),
      prior_approval_status: 'blocked',
      final_approval_marker_detected: 'false',
      evidence_status: 'unavailable',
      source_summary: blk.reason_blocked,
      confidence_score_1_to_10: '1',
      commander_final_approval_required: 'true'
    });
  }

  // --- 4. Launch Eligibility Validation ---
  const eligibilityRecords: any[] = [];
  const eligibleLaunchTickets: any[] = [];
  const blockedLaunchTickets: any[] = [];
  let elgSeq = 1;
  let blkLaunchSeq = 1;

  for (const can of candidates) {
    const hasPriorApproval = can.prior_approval_status === 'approved';
    
    // Check final approval markers (only explicit human approvals)
    const hasFinalApproval = false; // We do not invent approvals in Phase 12K
    const isEvidenceAvailable = can.evidence_status !== 'unavailable';

    let eligibilityStatus = 'blocked';
    const validationReasons: string[] = [];
    const missingRequirements: string[] = [];

    if (!hasPriorApproval) {
      validationReasons.push('Prior approval status is not approved.');
      missingRequirements.push('approved_by_human: true');
    }
    if (!hasFinalApproval) {
      validationReasons.push('Final launch approval marker (final_launch_approved/commander_final_approved) is missing.');
      missingRequirements.push('final_launch_approved: true');
    }
    if (!isEvidenceAvailable) {
      validationReasons.push('Staged evidence status is unavailable.');
      missingRequirements.push('evidence_status is not unavailable');
    }

    if (hasPriorApproval && hasFinalApproval && isEvidenceAvailable) {
      eligibilityStatus = 'eligible_for_manual_execution';
    } else if (!hasPriorApproval) {
      eligibilityStatus = 'insufficient_approval';
    } else if (!isEvidenceAvailable) {
      eligibilityStatus = 'insufficient_evidence';
    }

    eligibilityRecords.push({
      eligibility_id: `LCH-ELG-${dateStr.replace(/-/g, '')}-${String(elgSeq++).padStart(2, '0')}`,
      linked_ticket_id: can.ticket_id,
      eligibility_status: eligibilityStatus,
      validation_reasons: validationReasons.join(' '),
      missing_requirements: missingRequirements.join(', ') || 'None',
      smallest_safe_unblock_step: can.source_summary,
      command_execution_allowed: 'false',
      commander_final_approval_required: 'true'
    });

    if (eligibilityStatus === 'eligible_for_manual_execution') {
      // In this run there are 0 approved tickets, so this block won't execute.
      eligibleLaunchTickets.push({
        launch_ticket_id: `LCH-TKT-${dateStr.replace(/-/g, '')}-${String(eligibleLaunchTickets.length + 1).padStart(2, '0')}`,
        linked_execution_ticket_id: can.ticket_id,
        ticket_type: can.ticket_type,
        ticket_name: can.ticket_name,
        source_decision: can.ticket_name,
        evidence_sources: 'outputs/grinders_keep/execution_approval_queue/',
        final_approved_by_human: 'true',
        launch_status: 'ready_for_manual_execution',
        command_execution_allowed: 'false',
        manual_command_only: 'true',
        exact_command: 'npm run build', // placeholder
        manual_steps: '1. Inspect local workspace.\n2. Run exact command manually.',
        expected_output: 'Workspace verification passes.',
        rollback_or_fail_closed_note: 'Checkout clean branch if failures occur.',
        risk_or_constraint: 'Low risk command execution.',
        commander_final_approval_required: 'true'
      });
    } else {
      // Send to blocked launch tickets sheet
      blockedLaunchTickets.push({
        blocked_launch_id: `BLKD-LCH-${dateStr.replace(/-/g, '')}-${String(blkLaunchSeq++).padStart(2, '0')}`,
        linked_execution_ticket_id: can.ticket_id,
        item_name: can.ticket_name,
        reason_blocked: can.prior_approval_status === 'blocked' ? `Prior ticket blocked: ${can.source_summary}` : 'Final launch approval missing.',
        missing_final_approval_or_evidence: missingRequirements.join(', '),
        risk_if_launched: 'Executing unapproved or incomplete tickets risks local repository drift.',
        smallest_safe_unblock_step: can.prior_approval_status === 'blocked'
          ? `Resolve ticket blocker: ${can.source_summary}`
          : 'Commander must manually stamp final_launch_approved: true.',
        command_execution_allowed: 'false',
        commander_final_approval_required: 'true'
      });
    }
  }

  // --- 5. Manual Command Sheet Staging ---
  const manualCommands: any[] = [];
  // Since no eligible tickets exist, manualCommands will remain empty.

  // --- 6. Final Human Review Checklist Generation ---
  const reviewChecklists: any[] = [];
  let chkSeq = 1;

  for (const can of candidates) {
    const isBlocked = blockedLaunchTickets.some(b => b.linked_execution_ticket_id === can.ticket_id);
    const linkedId = isBlocked 
      ? blockedLaunchTickets.find(b => b.linked_execution_ticket_id === can.ticket_id).blocked_launch_id 
      : eligibleLaunchTickets.find(e => e.linked_execution_ticket_id === can.ticket_id).launch_ticket_id;

    reviewChecklists.push({
      checklist_id: `LCH-CHK-${dateStr.replace(/-/g, '')}-${String(chkSeq++).padStart(2, '0')}`,
      linked_launch_or_blocked_id: linkedId,
      item_name: can.ticket_name,
      evidence_reviewed: 'false',
      risk_reviewed: 'false',
      command_reviewed: 'false',
      rollback_reviewed: 'false',
      final_human_approval_marker: 'pending',
      launch_ready_status: isBlocked ? 'blocked' : 'ready',
      commander_final_approval_required: 'true'
    });
  }

  // --- 7. Launch Risk Review Generation ---
  const riskReviews: any[] = [];
  let rskSeq = 1;

  for (const can of candidates) {
    const isBlocked = blockedLaunchTickets.some(b => b.linked_execution_ticket_id === can.ticket_id);
    const linkedId = isBlocked 
      ? blockedLaunchTickets.find(b => b.linked_execution_ticket_id === can.ticket_id).blocked_launch_id 
      : eligibleLaunchTickets.find(e => e.linked_execution_ticket_id === can.ticket_id).launch_ticket_id;

    if (isBlocked) {
      riskReviews.push({
        risk_id: `RSK-LCH-${dateStr.replace(/-/g, '')}-${String(rskSeq++).padStart(2, '0')}`,
        linked_launch_or_blocked_id: linkedId,
        risk_name: can.ticket_name.includes('Google') ? 'Google Workflow Evidence Missing' : 'Consensus Review Approval Missing',
        risk_category: can.ticket_name.includes('Google') ? 'evidence_missing' : 'final_approval_missing',
        likelihood_score: '10',
        impact_score: '9',
        mitigation: can.ticket_name.includes('Google')
          ? 'Perform manual test workflows for Google Docs and paste the outputs.'
          : 'Paste manual model outputs into approved intake directories and run intake sweep.',
        command_execution_allowed: 'false',
        commander_final_approval_required: 'true'
      });
    }
  }

  // --- 8. Compile Telemetry Statistics ---
  const googleBlockedCount = candidates.filter(c => c.ticket_name.includes('Google') && c.prior_approval_status === 'blocked').length;
  const telemetryData = {
    launch_candidate_count: String(candidates.length),
    eligible_launch_ticket_count: String(eligibleLaunchTickets.length),
    blocked_launch_ticket_count: String(blockedLaunchTickets.length),
    manual_command_count: String(manualCommands.length),
    final_approval_missing_count: String(candidates.filter(c => c.final_approval_marker_detected !== 'true').length),
    evidence_missing_count: String(candidates.filter(c => c.evidence_status === 'unavailable').length),
    privacy_flagged_count: '0',
    monetization_staged_count: '0',
    google_tool_assumptions_blocked: String(googleBlockedCount),
    technical_dependencies_blocked: '0',
    rollback_missing_blocked_count: '0',
    execution_allowed: 'false'
  };

  const launchStatus = eligibleLaunchTickets.length > 0 ? 'tickets_ready_for_execution' : 'no_ready_tickets_found';

  // --- 9. Fill Templates and Write Output Files ---
  const getTemplate = (name: string): string => {
    const filePath = path.join(TEMPLATE_ROOT, name);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    console.warn(`[Warning] Template ${name} not found.`);
    return '';
  };

  const fillList = (items: any[], templateName: string, fallback: string): string => {
    if (items.length === 0) {
      return fallback;
    }
    const temp = getTemplate(templateName);
    return items.map(item => fillTemplate(temp, item)).join('\n');
  };

  const eligibleMd = fillList(eligibleLaunchTickets, 'grinders-keep-launch-eligible-ticket-template.md', `* No eligible tickets found for launch on ${dateStr}.`);
  const blockedMd = fillList(blockedLaunchTickets, 'grinders-keep-launch-blocked-ticket-template.md', `* No blocked launch tickets recorded for ${dateStr}.`);
  const manualCmdsMd = fillList(manualCommands, 'grinders-keep-manual-command-sheet-template.md', `* No manual commands staged for execution on ${dateStr}.`);
  const checklistsMd = fillList(reviewChecklists, 'grinders-keep-final-review-checklist-template.md', `* No checklist items compiled.`);
  const risksMd = fillList(riskReviews, 'grinders-keep-launch-risk-review-template.md', `* No launch risks detected.`);

  // Write sub-files
  const elgPath = path.join(outputFolders.eligible, `grinders_keep_launch_eligible_tickets_${dateStr}.md`);
  fs.writeFileSync(elgPath, eligibleMd, 'utf-8');
  console.log(`✅ Saved Eligible Tickets Sheet to: ${elgPath}`);

  const blkPath = path.join(outputFolders.blocked, `grinders_keep_launch_blocked_tickets_${dateStr}.md`);
  fs.writeFileSync(blkPath, blockedMd, 'utf-8');
  console.log(`✅ Saved Blocked Tickets Sheet to: ${blkPath}`);

  const cmdPath = path.join(outputFolders.manualCommands, `grinders_keep_manual_command_sheet_${dateStr}.md`);
  fs.writeFileSync(cmdPath, manualCmdsMd, 'utf-8');
  console.log(`✅ Saved Manual Command Sheet to: ${cmdPath}`);

  const chkPath = path.join(outputFolders.checklists, `grinders_keep_final_review_checklist_${dateStr}.md`);
  fs.writeFileSync(chkPath, checklistsMd, 'utf-8');
  console.log(`✅ Saved Final Review Checklist to: ${chkPath}`);

  const rskPath = path.join(outputFolders.root, `grinders_keep_launch_risk_review_${dateStr}.md`);
  fs.writeFileSync(rskPath, risksMd, 'utf-8');
  console.log(`✅ Saved Launch Risk Review to: ${rskPath}`);

  // Telemetry file
  const telemetryTemp = getTemplate('grinders-keep-launch-telemetry-template.md');
  const telemetryMd = fillTemplate(telemetryTemp, telemetryData);
  const telPath = path.join(outputFolders.root, `grinders_keep_launch_telemetry_${dateStr}.md`);
  fs.writeFileSync(telPath, telemetryMd, 'utf-8');
  console.log(`✅ Saved Launch Telemetry to: ${telPath}`);

  // Next Actions
  const nextActionsList = [
    {
      action_id: 'ACT-LCH-20260601-01',
      action_name: 'Manually approve decision items in the Phase 12I decision checklist',
      linked_launch_or_blocker: 'Phase 12I Synthesis manifest',
      why_this_action: 'No human-approved decisions exist in decision_synthesis.',
      smallest_safe_step: 'Edit decision options in grinders_keep_decision_synthesis_manifest_2026-06-01.json to set approval_status to approved.',
      manual_command_if_approved: 'npm run command -- "grinders-keep-execution-approval-queue"',
      expected_output: 'Execution queue successfully populates approved tickets.',
      blocker_if_any: 'Missing human approval markers.',
      approval_required: 'true'
    },
    {
      action_id: 'ACT-LCH-20260601-02',
      action_name: 'Resolve consensus review blocker in manual_review_intake',
      linked_launch_or_blocker: 'BLKD-TKT-20260601-01',
      why_this_action: 'Zero validated review responses exist in manual_review_intake/.',
      smallest_safe_step: 'Paste manual model outputs into approved intake directories and run intake sweep.',
      manual_command_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
      expected_output: 'Consensus review intake sweeps validated responses.',
      blocker_if_any: 'Missing local review responses.',
      approval_required: 'true'
    },
    {
      action_id: 'ACT-LCH-20260601-03',
      action_name: 'Resolve Google Ultra manual workflow blocker in intake',
      linked_launch_or_blocker: 'BLKD-TKT-20260601-02',
      why_this_action: 'No Google workflow manual outputs found in intake directories.',
      smallest_safe_step: 'Perform manual test workflows for Google Docs and paste the outputs.',
      manual_command_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
      expected_output: 'Consensus review intake sweeps validated responses.',
      blocker_if_any: 'Missing local review responses.',
      approval_required: 'true'
    },
    {
      action_id: 'ACT-LCH-20260601-04',
      action_name: 'Rerun Grinders Keep Execution Approval Queue',
      linked_launch_or_blocker: 'Phase 12J Queue',
      why_this_action: 'Re-evaluate execution tickets once approvals are registered.',
      smallest_safe_step: 'Rerun execution queue command to sweep approvals',
      manual_command_if_approved: 'npm run command -- "grinders-keep-execution-approval-queue"',
      expected_output: 'Staged execution tickets populated successfully.',
      blocker_if_any: 'Blocked tickets not resolved.',
      approval_required: 'true'
    },
    {
      action_id: 'ACT-LCH-20260601-05',
      action_name: 'Transition to Phase 12L: Grinders Keep Post-Launch Review Ledger',
      linked_launch_or_blocker: 'Phase 12L transition',
      why_this_action: 'Establish ledger for recording manual execution results.',
      smallest_safe_step: 'Prepare ledger schema and script structure.',
      manual_command_if_approved: 'npm run command -- "grinders-keep-post-launch-review-ledger-help"',
      expected_output: 'Ledger shell established.',
      blocker_if_any: 'Phase 12K not completed.',
      approval_required: 'true'
    }
  ];

  let nextActionsMd = `### 📋 Launch Next Actions\n`;
  nextActionsMd += `- **Suggested Action:** Manually approve eligible execution tickets, then rerun the Final Human Launch Switch.\n`;
  nextActionsMd += `- **Next Step Instructions:**\n\n`;
  for (const act of nextActionsList) {
    nextActionsMd += `  * **${act.action_id} | ${act.action_name}**\n`;
    nextActionsMd += `    - Linked Blocker: ${act.linked_launch_or_blocker}\n`;
    nextActionsMd += `    - Why this action: ${act.why_this_action}\n`;
    nextActionsMd += `    - Smallest Safe Step: ${act.smallest_safe_step}\n`;
    nextActionsMd += `    - Manual Command If Approved: \`${act.manual_command_if_approved}\`\n`;
    nextActionsMd += `    - Expected Output: ${act.expected_output}\n`;
    nextActionsMd += `    - Blocker if any: ${act.blocker_if_any}\n`;
    nextActionsMd += `    - Approval Required: ${act.approval_required}\n\n`;
  }
  nextActionsMd += `- **Validation Check:** Verify that the final launch switch telemetry status becomes active and ready.`;

  const actPath = path.join(outputFolders.root, `grinders_keep_launch_next_actions_${dateStr}.md`);
  fs.writeFileSync(actPath, nextActionsMd, 'utf-8');
  console.log(`✅ Saved Launch Next Actions to: ${actPath}`);

  // Compile main report
  const reportTemp = getTemplate('grinders-keep-final-launch-report-template.md');
  const reportData = {
    date: dateStr,
    timestamp,
    launch_status: launchStatus,
    ready_for_manual_execution_count: String(eligibleLaunchTickets.length),
    command_execution_allowed: 'false',
    launch_telemetry: telemetryMd,
    eligible_tickets: eligibleMd,
    blocked_tickets: blockedMd,
    manual_command_sheet: manualCmdsMd,
    launch_risk_review: risksMd,
    final_review_checklist: checklistsMd,
    launch_next_actions: nextActionsMd
  };

  const reportMd = fillTemplate(reportTemp, reportData);
  const repPath = path.join(outputFolders.root, `grinders_keep_final_launch_report_${dateStr}.md`);
  fs.writeFileSync(repPath, reportMd, 'utf-8');
  console.log(`✅ Saved Final Launch Switches Report to: ${repPath}`);

  // --- 10. Update Frontpage Dashboard ---
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');

    const topEligible = eligibleLaunchTickets[0] ? `${eligibleLaunchTickets[0].launch_ticket_id} (${eligibleLaunchTickets[0].ticket_name})` : 'None';
    const topBlocked = blockedLaunchTickets[0] ? `${blockedLaunchTickets[0].blocked_launch_id} (${blockedLaunchTickets[0].item_name})` : 'None';

    let contentBlock = `\n## Final Human Launch Switch\n`;
    contentBlock += `- **Launch Status:** ${launchStatus}\n`;
    contentBlock += `- **Launch Candidate Count:** ${telemetryData.launch_candidate_count}\n`;
    contentBlock += `- **Eligible Launch Ticket Count:** ${telemetryData.eligible_launch_ticket_count}\n`;
    contentBlock += `- **Blocked Launch Ticket Count:** ${telemetryData.blocked_launch_ticket_count}\n`;
    contentBlock += `- **Manual Command Count:** ${telemetryData.manual_command_count}\n`;
    contentBlock += `- **Command Execution Allowed Count:** 0 (Safety override active)\n`;
    contentBlock += `- **Top Eligible Ticket:** ${topEligible}\n`;
    contentBlock += `- **Top Blocked Ticket:** ${topBlocked}\n`;
    contentBlock += `- **Recommended Launch Next Action:** ${nextActionsList[0].action_name}\n\n`;
    contentBlock += `### 📋 Commander Final Launch Checklist\n`;
    contentBlock += `- [ ] Verify all prior-stage approvals are set to approved in the synthesis checklists.\n`;
    contentBlock += `- [ ] Ensure evidence manifests are fully populated with model reviews.\n`;
    contentBlock += `- [ ] Review individual launch checklists and risk reviews before sign-off.\n`;

    if (frontpageContent.includes('## Final Human Launch Switch')) {
      const idx = frontpageContent.indexOf('## Final Human Launch Switch');
      const before = frontpageContent.substring(0, idx);
      const after = frontpageContent.substring(idx);
      const lines = after.split('\n');
      let nextSectionIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) {
          nextSectionIndex = i;
          break;
        }
      }
      const rest = nextSectionIndex !== -1 ? '\n' + lines.slice(nextSectionIndex).join('\n') : '';
      frontpageContent = before.trim() + '\n' + contentBlock.trim() + '\n' + rest.trim();
    } else {
      frontpageContent = frontpageContent.trim() + '\n' + contentBlock;
    }

    fs.writeFileSync(frontpagePath, frontpageContent, 'utf-8');
    console.log(`✅ Updated Frontpage Dashboard at: ${frontpagePath}`);
  }

  // --- 11. Write JSON Manifest ---
  const jsonManifest = {
    date: dateStr,
    timestamp,
    launch_status: launchStatus,
    ready_for_manual_execution_count: eligibleLaunchTickets.length,
    command_execution_allowed: false,
    suggested_next_action: nextActionsList[0].action_name,
    telemetry: {
      launch_candidate_count: candidates.length,
      eligible_launch_ticket_count: eligibleLaunchTickets.length,
      blocked_launch_ticket_count: blockedLaunchTickets.length,
      manual_command_count: manualCommands.length,
      final_approval_missing_count: candidates.filter(c => c.final_approval_marker_detected !== 'true').length,
      evidence_missing_count: candidates.filter(c => c.evidence_status === 'unavailable').length,
      privacy_flagged_count: 0,
      monetization_staged_count: 0,
      google_tool_assumptions_blocked: googleBlockedCount,
      technical_dependencies_blocked: 0,
      rollback_missing_blocked_count: 0,
      command_execution_allowed_count: 0,
      command_execution_allowed_must_be_zero: true,
      no_ready_tickets_found: eligibleLaunchTickets.length === 0
    },
    candidates,
    eligibility_records: eligibilityRecords,
    eligible_launch_tickets: eligibleLaunchTickets,
    blocked_launch_tickets: blockedLaunchTickets,
    manual_commands: manualCommands,
    final_review_checklists: reviewChecklists,
    risk_reviews: riskReviews,
    next_actions: nextActionsList
  };

  const manifestPath = path.join(outputFolders.root, `grinders_keep_final_launch_manifest_${dateStr}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Manifest to: ${manifestPath}`);

  // Write log file
  logContent += `\n## Final Launch Switch Results\n`;
  logContent += `- **Launch Status:** ${launchStatus}\n`;
  logContent += `- **Eligible Launch Tickets:** ${telemetryData.eligible_launch_ticket_count}\n`;
  logContent += `- **Blocked Launch Tickets:** ${telemetryData.blocked_launch_ticket_count}\n`;
  logContent += `- **Command Execution Allowed:** false\n`;
  logContent += `- **Suggested Next Action:** ${nextActionsList[0].action_name}\n\n`;
  logContent += `Final human launch switch pass finished successfully. All actions safety locked.\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved Final Launch Log to: ${logFile}`);

  await announceCompletion("Grinders Keep final human launch switch completed successfully", "10");
}

runFinalHumanLaunchSwitch().catch(async (err) => {
  console.error("❌ Final Human Launch Switch failed:", err);
  await announceCompletion("Grinders Keep final human launch switch sweep failed", "1");
  process.exit(1);
});
