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
} from '../config/grinders-keep-execution-approval-queue.js';

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

interface DecisionOption {
  decision_id: string;
  decision_name: string;
  decision_type: string;
  evidence_sources: string;
  source_summary: string;
  option_description?: string;
  smallest_safe_step?: string;
  expected_benefit?: string;
  risk_or_constraint?: string;
  blocker_if_any?: string;
  approval_status: string;
  commander_approval_required: boolean;
  commander_approved?: boolean;
  approved_for_execution?: boolean;
}

interface BuildChecklist {
  checklist_id: string;
  linked_decision_id: string;
  build_name: string;
  required_evidence: string;
  command_safety_check: string;
  exact_command_if_available: string;
  source_files_reviewed: string;
  dependency_check: string;
  rollback_or_fail_closed_note: string;
  approval_status: string;
  commander_approval_required: boolean;
}

interface ContentChecklist {
  checklist_id: string;
  linked_decision_id: string;
  content_name: string;
  evidence_source: string;
  claim_check: string;
  audience_fit_check: string;
  platform_fit_check: string;
  monetization_fit_check: string;
  revision_needed: string;
  approval_status: string;
  commander_approval_required: boolean;
}

interface MonetizationExperiment {
  experiment_id: string;
  linked_decision_id: string;
  experiment_name: string;
  evidence_source: string;
  target_customer_or_audience: string;
  offer_or_asset: string;
  smallest_paid_or_value_test: string;
  proof_needed_before_selling: string;
  money_confidence_score_1_to_10: string;
  reason_for_money_score: string;
  risk_or_constraint: string;
  approval_status: string;
  commander_approval_required: boolean;
}

interface BlockedDecision {
  blocked_decision_id: string;
  item_name: string;
  reason_blocked: string;
  missing_evidence: string;
  risk_if_unblocked: string;
  smallest_safe_unblock_step: string;
  approval_status: string;
  commander_approval_required: boolean;
}

async function runExecutionApprovalQueue() {
  const dateStr = getFormattedDate();
  console.log(`🚀 Starting Grinders Keep Execution Approval Queue for ${dateStr}...`);
  await announceIntent("Processing Grinders Keep execution approval queue sweep");

  // Ensure output folders exist
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  const logFile = path.join(outputFolders.logs, `grinders_keep_execution_queue_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Execution Approval Queue Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

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
        impact: 'Reference source telemetry exists for validation checks.',
        suggested_next_action: 'Proceed with queue processing'
      };
      logContent += `- **${key}:** Present (Path: ${filePath})\n`;
    } else {
      referenceAudit[key] = {
        source_status: 'missing',
        evidence_status: 'unavailable',
        confidence_score_1_to_10: 1,
        impact: `Reference source ${key} is missing. Queue processing may be degraded.`,
        suggested_next_action: `Run appropriate generator command to establish ${key}`
      };
      logContent += `- **${key}:** MISSING (Path: ${filePath})\n`;
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

  // --- 2. Load Decision Synthesis manifest ---
  let synthesisManifest: any = null;
  let rawDecisionOptions: DecisionOption[] = [];
  let rawBuildChecklists: BuildChecklist[] = [];
  let rawContentChecklists: ContentChecklist[] = [];
  let rawMonetizationExperiments: MonetizationExperiment[] = [];
  let rawBlockedDecisions: BlockedDecision[] = [];

  if (referenceAudit.decisionSynthesisManifest.source_status === 'present') {
    try {
      const manifestText = fs.readFileSync(referenceSources.decisionSynthesisManifest, 'utf-8');
      synthesisManifest = JSON.parse(manifestText);
      rawDecisionOptions = synthesisManifest.decision_options || [];
      rawBuildChecklists = synthesisManifest.build_checklists || [];
      rawContentChecklists = synthesisManifest.content_checklists || [];
      rawMonetizationExperiments = synthesisManifest.monetization_experiments || [];
      rawBlockedDecisions = synthesisManifest.blocked_decisions || [];
    } catch (e) {
      console.warn(`[Warning] Failed to parse decision synthesis manifest JSON: ${(e as Error).message}`);
    }
  }

  // --- 3. Filter Approved and Blocked Decisions ---
  const approvedDecisions: DecisionOption[] = [];
  const blockedExecutionTickets: any[] = [];
  let blockedSeq = 1;

  for (const opt of rawDecisionOptions) {
    const isApproved =
      opt.approval_status === 'approved' ||
      opt.commander_approved === true ||
      opt.approved_for_execution === true;

    if (isApproved) {
      approvedDecisions.push(opt);
    } else {
      // Send unapproved options to blocked tickets
      blockedExecutionTickets.push({
        blocked_ticket_id: `BLKD-TKT-${dateStr.replace(/-/g, '')}-${String(blockedSeq++).padStart(2, '0')}`,
        linked_decision_id: opt.decision_id,
        item_name: opt.decision_name,
        reason_blocked: 'Approval marker missing.',
        missing_approval_or_evidence: `No human approval status detected. Needs approved_for_execution: true.`,
        risk_if_executed: opt.risk_or_constraint || 'Executing unapproved action might destabilize local workspace.',
        smallest_safe_unblock_step: opt.smallest_safe_step || 'Commander must explicitly approve decision status.',
        execution_allowed: 'false',
        commander_final_approval_required: 'true'
      });
    }
  }

  // Add synthesis blocked decisions to blocked tickets
  for (const blk of rawBlockedDecisions) {
    blockedExecutionTickets.push({
      blocked_ticket_id: `BLKD-TKT-${dateStr.replace(/-/g, '')}-${String(blockedSeq++).padStart(2, '0')}`,
      linked_decision_id: blk.blocked_decision_id,
      item_name: blk.item_name,
      reason_blocked: blk.reason_blocked,
      missing_approval_or_evidence: blk.missing_evidence,
      risk_if_executed: blk.risk_if_unblocked,
      smallest_safe_unblock_step: blk.smallest_safe_unblock_step,
      execution_allowed: 'false',
      commander_final_approval_required: 'true'
    });
  }

  // --- 4. Ticket Generation for Approved Decisions ---
  const approvedDecisionTickets: any[] = [];
  const buildExecutionTickets: any[] = [];
  const contentExecutionTickets: any[] = [];
  const monetizationExecutionTickets: any[] = [];
  const googleWorkflowTickets: any[] = [];

  let tktSeq = 1;
  let bldSeq = 1;
  let cntSeq = 1;
  let monSeq = 1;
  let gglSeq = 1;

  for (const opt of approvedDecisions) {
    // 1. Approved Decision Ticket
    const ticketId = `TKT-DEC-${dateStr.replace(/-/g, '')}-${String(tktSeq++).padStart(2, '0')}`;
    approvedDecisionTickets.push({
      ticket_id: ticketId,
      linked_decision_id: opt.decision_id,
      ticket_type: opt.decision_type,
      ticket_name: opt.decision_name,
      source_decision: opt.decision_name,
      evidence_sources: opt.evidence_sources,
      approved_by_human: 'true',
      execution_allowed: 'false',
      execution_status: 'staged_only',
      exact_command_if_available: opt.decision_type === 'build' ? 'npm run build' : 'N/A',
      smallest_safe_step: opt.smallest_safe_step || 'Verify locally',
      expected_output: opt.expected_benefit || 'Staged output reviewable in workspace',
      rollback_or_fail_closed_note: 'Restore previous workspace state via Git checkouts.',
      risk_or_constraint: opt.risk_or_constraint || 'None',
      commander_final_approval_required: 'true'
    });

    // 2. Build tickets
    if (opt.decision_type === 'build') {
      const checklists = rawBuildChecklists.filter(chk => chk.linked_decision_id === opt.decision_id);
      if (checklists.length > 0) {
        for (const chk of checklists) {
          buildExecutionTickets.push({
            build_ticket_id: `TKT-BLD-${dateStr.replace(/-/g, '')}-${String(bldSeq++).padStart(2, '0')}`,
            linked_decision_id: opt.decision_id,
            build_name: chk.build_name,
            exact_command_if_available: chk.exact_command_if_available || 'npm run build',
            required_files: chk.source_files_reviewed,
            safety_checks: chk.command_safety_check,
            non_destructive_plan: 'Execute build command only; do not commit changes to registry.',
            expected_outputs: chk.dependency_check || 'Clean compilation output without errors.',
            blocked_if_missing: chk.required_evidence,
            execution_allowed: 'false',
            commander_final_approval_required: 'true'
          });
        }
      } else {
        // Fallback build ticket
        buildExecutionTickets.push({
          build_ticket_id: `TKT-BLD-${dateStr.replace(/-/g, '')}-${String(bldSeq++).padStart(2, '0')}`,
          linked_decision_id: opt.decision_id,
          build_name: opt.decision_name,
          exact_command_if_available: 'npm run build',
          required_files: 'config/commands.ts, package.json',
          safety_checks: 'Check build exits with code 0',
          non_destructive_plan: 'Execute build command only; do not commit changes to registry.',
          expected_outputs: 'Clean tsc build.',
          blocked_if_missing: opt.evidence_sources,
          execution_allowed: 'false',
          commander_final_approval_required: 'true'
        });
      }
    }

    // 3. Content tickets
    if (opt.decision_type === 'content') {
      const checklists = rawContentChecklists.filter(chk => chk.linked_decision_id === opt.decision_id);
      if (checklists.length > 0) {
        for (const chk of checklists) {
          contentExecutionTickets.push({
            content_ticket_id: `TKT-CNT-${dateStr.replace(/-/g, '')}-${String(cntSeq++).padStart(2, '0')}`,
            linked_decision_id: opt.decision_id,
            content_name: chk.content_name,
            content_type: 'post',
            source_evidence: chk.evidence_source,
            review_required_before_posting: 'true',
            platform_if_known: chk.platform_fit_check || 'YouTube/Substack',
            draft_path_if_available: 'outputs/grinders_keep/content_lab/',
            claim_check_required: 'true',
            publishing_allowed: 'false',
            commander_final_approval_required: 'true'
          });
        }
      } else {
        contentExecutionTickets.push({
          content_ticket_id: `TKT-CNT-${dateStr.replace(/-/g, '')}-${String(cntSeq++).padStart(2, '0')}`,
          linked_decision_id: opt.decision_id,
          content_name: opt.decision_name,
          content_type: 'post',
          source_evidence: opt.evidence_sources,
          review_required_before_posting: 'true',
          platform_if_known: 'Unknown platform',
          draft_path_if_available: 'N/A',
          claim_check_required: 'true',
          publishing_allowed: 'false',
          commander_final_approval_required: 'true'
        });
      }
    }

    // 4. Monetization tickets
    if (opt.decision_type === 'monetization') {
      const experiments = rawMonetizationExperiments.filter(chk => chk.linked_decision_id === opt.decision_id);
      if (experiments.length > 0) {
        for (const exp of experiments) {
          monetizationExecutionTickets.push({
            money_ticket_id: `TKT-MON-${dateStr.replace(/-/g, '')}-${String(monSeq++).padStart(2, '0')}`,
            linked_decision_id: opt.decision_id,
            experiment_name: exp.experiment_name,
            target_customer_or_audience: exp.target_customer_or_audience,
            offer_or_asset: exp.offer_or_asset,
            smallest_paid_or_value_test: exp.smallest_paid_or_value_test,
            proof_needed_before_selling: exp.proof_needed_before_selling,
            money_confidence_score_1_to_10: exp.money_confidence_score_1_to_10,
            risk_or_constraint: exp.risk_or_constraint,
            selling_allowed: 'false',
            commander_final_approval_required: 'true'
          });
        }
      } else {
        monetizationExecutionTickets.push({
          money_ticket_id: `TKT-MON-${dateStr.replace(/-/g, '')}-${String(monSeq++).padStart(2, '0')}`,
          linked_decision_id: opt.decision_id,
          experiment_name: opt.decision_name,
          target_customer_or_audience: 'General audience',
          offer_or_asset: 'OS features/services',
          smallest_paid_or_value_test: 'Manual landing page test',
          proof_needed_before_selling: 'Manual signups count',
          money_confidence_score_1_to_10: '5',
          risk_or_constraint: 'Zero live stripe integration',
          selling_allowed: 'false',
          commander_final_approval_required: 'true'
        });
      }
    }

    // 5. Google workflow tickets
    if (opt.decision_type === 'google_workflow') {
      googleWorkflowTickets.push({
        google_ticket_id: `TKT-GGL-${dateStr.replace(/-/g, '')}-${String(gglSeq++).padStart(2, '0')}`,
        linked_decision_id: opt.decision_id,
        tool_category: 'Google Tool Workflow',
        manual_tool_to_open_if_approved: opt.decision_name,
        local_source_context: opt.evidence_sources,
        manual_steps: opt.smallest_safe_step || 'Stage changes locally',
        expected_output: opt.expected_benefit || 'Google Docs updated manually',
        privacy_or_safety_note: 'Do not publish credentials or run automated uploads.',
        upload_allowed: 'false',
        publishing_allowed: 'false',
        commander_final_approval_required: 'true'
      });
    }
  }

  // --- 5. Generate Scorecard ---
  const scorecardItems: any[] = [];
  let rankSeq = 1;

  // Add approved tickets to scorecard
  for (const tkt of approvedDecisionTickets) {
    scorecardItems.push({
      rank: String(rankSeq++),
      ticket_or_blocked_id: tkt.ticket_id,
      ticket_type: tkt.ticket_type,
      approval_strength_score_1_to_10: '10',
      evidence_strength_score_1_to_10: '9',
      execution_safety_score_1_to_10: '9',
      money_impact_score_1_to_10: '7',
      risk_score_1_to_10: '2',
      effort_score_1_to_10: '3',
      recommended_status: 'ready_for_final_review',
      reason: 'Human-approved decision option exists with validated local evidence.',
      commander_final_approval_required: 'true'
    });
  }

  // Add blocked tickets to scorecard
  for (const blk of blockedExecutionTickets) {
    scorecardItems.push({
      rank: String(rankSeq++),
      ticket_or_blocked_id: blk.blocked_ticket_id,
      ticket_type: 'blocked_item',
      approval_strength_score_1_to_10: '1',
      evidence_strength_score_1_to_10: '1',
      execution_safety_score_1_to_10: '1',
      money_impact_score_1_to_10: '1',
      risk_score_1_to_10: '9',
      effort_score_1_to_10: '1',
      recommended_status: 'blocked',
      reason: blk.reason_blocked,
      commander_final_approval_required: 'true'
    });
  }

  // --- 6. Generate Risk Review ---
  const riskItems: any[] = [];
  let rskSeq = 1;

  for (const tkt of approvedDecisionTickets) {
    riskItems.push({
      risk_id: `RSK-EXE-${dateStr.replace(/-/g, '')}-${String(rskSeq++).padStart(2, '0')}`,
      linked_ticket_or_blocked_id: tkt.ticket_id,
      risk_name: 'Staged Command Execution Safety',
      risk_category: 'command_safety',
      likelihood_score_1_to_10: '3',
      impact_score_1_to_10: '6',
      mitigation: 'Commander must manually inspect build plans and run script commands directly.',
      commander_final_approval_required: 'true'
    });
  }

  for (const blk of blockedExecutionTickets) {
    riskItems.push({
      risk_id: `RSK-EXE-${dateStr.replace(/-/g, '')}-${String(rskSeq++).padStart(2, '0')}`,
      linked_ticket_or_blocked_id: blk.blocked_ticket_id,
      risk_name: blk.item_name.includes('Google') ? 'Google Workflow Evidence Missing' : 'Consensus Review Approval Missing',
      risk_category: blk.item_name.includes('Google') ? 'evidence_missing' : 'approval_missing',
      likelihood_score_1_to_10: '10',
      impact_score_1_to_10: '8',
      mitigation: blk.smallest_safe_unblock_step,
      commander_final_approval_required: 'true'
    });
  }

  // --- 7. Generate Next Actions ---
  const nextActionsList: any[] = [];
  let actSeq = 1;

  if (approvedDecisions.length === 0) {
    nextActionsList.push({
      action_id: `ACT-EXE-${dateStr.replace(/-/g, '')}-${String(actSeq++).padStart(2, '0')}`,
      action_name: 'Manually approve decision items in the Phase 12I decision checklist',
      linked_ticket_or_blocker: 'Phase 12I Synthesis manifest',
      why_this_action: 'No human-approved decisions exist in decision_synthesis.',
      smallest_safe_step: 'Edit decision options in grinders_keep_decision_synthesis_manifest_2026-06-01.json to set approval_status to approved.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-execution-approval-queue"',
      expected_output: 'Execution queue successfully populates approved tickets.',
      blocker_if_any: 'Missing human approval markers.',
      approval_required: 'true'
    });
  } else {
    nextActionsList.push({
      action_id: `ACT-EXE-${dateStr.replace(/-/g, '')}-${String(actSeq++).padStart(2, '0')}`,
      action_name: 'Commander manual review of staged execution tickets',
      linked_ticket_or_blocker: approvedDecisionTickets[0].ticket_id,
      why_this_action: 'Perform safety checklist checks on the staged build/content scripts.',
      smallest_safe_step: `Inspect outputs/grinders_keep/execution_approval_queue/tickets/`,
      command_to_run_if_approved: 'N/A - Manual review only',
      expected_output: 'Commander stamps launch checklists ready for execution.',
      blocker_if_any: 'None',
      approval_required: 'true'
    });
  }

  // Add blocked tickets next steps
  for (const blk of blockedExecutionTickets) {
    if (actSeq > 5) break;
    nextActionsList.push({
      action_id: `ACT-EXE-${dateStr.replace(/-/g, '')}-${String(actSeq++).padStart(2, '0')}`,
      action_name: `Resolve blocker for: ${blk.item_name}`,
      linked_ticket_or_blocker: blk.blocked_ticket_id,
      why_this_action: blk.reason_blocked,
      smallest_safe_step: blk.smallest_safe_unblock_step,
      command_to_run_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
      expected_output: 'Consensus review intake sweeps validated responses.',
      blocker_if_any: 'Missing local review responses.',
      approval_required: 'true'
    });
  }

  // Fill in remaining top 5 actions
  const defaultActions = [
    {
      name: 'Verify codebase compiler builds cleanly',
      step: 'Run build command',
      cmd: 'npm run build',
      out: 'Webpack/tsc compile success'
    },
    {
      name: 'Transition to Phase 12K: Final Human Launch Switch',
      step: 'Create launch switch script scaffold',
      cmd: 'npm run command -- "grinders-keep-final-human-launch-switch-help"',
      out: 'Scaffold created'
    }
  ];

  for (const d of defaultActions) {
    if (nextActionsList.length >= 5) break;
    nextActionsList.push({
      action_id: `ACT-EXE-${dateStr.replace(/-/g, '')}-${String(actSeq++).padStart(2, '0')}`,
      action_name: d.name,
      linked_ticket_or_blocker: 'System stability',
      why_this_action: 'Ensure system integrations compile cleanly before moving forward.',
      smallest_safe_step: d.step,
      command_to_run_if_approved: d.cmd,
      expected_output: d.out,
      blocker_if_any: 'None',
      approval_required: 'true'
    });
  }

  // --- 8. Telemetry Data Compilation ---
  const telemetryData = {
    approved_decision_count: approvedDecisions.length,
    blocked_decision_count: blockedExecutionTickets.length,
    execution_ticket_count: approvedDecisionTickets.length + buildExecutionTickets.length + contentExecutionTickets.length + monetizationExecutionTickets.length + googleWorkflowTickets.length,
    build_ticket_count: buildExecutionTickets.length,
    content_ticket_count: contentExecutionTickets.length,
    monetization_ticket_count: monetizationExecutionTickets.length,
    google_workflow_ticket_count: googleWorkflowTickets.length,
    execution_allowed_count: 0,
    execution_allowed_must_be_zero: true,
    no_approved_decisions_found: approvedDecisions.length === 0
  };

  const queueStatus = telemetryData.no_approved_decisions_found ? 'no_approved_decisions_found' : 'approved_decisions_discovered';

  // --- 9. Fill Templates and Write Output Files ---

  // Helper template fillers
  const getTemplate = (name: string): string => {
    const filePath = path.join(TEMPLATE_ROOT, name);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    console.warn(`[Warning] Template ${name} not found.`);
    return '';
  };

  const fillTicketList = (tickets: any[], templateName: string): string => {
    if (tickets.length === 0) {
      return `* No tickets staged of this category for ${dateStr}.`;
    }
    const temp = getTemplate(templateName);
    return tickets.map(tkt => fillTemplate(temp, tkt)).join('\n');
  };

  // Staged tickets
  const approvedDecisionTicketsMd = fillTicketList(approvedDecisionTickets, 'grinders-keep-approved-decision-ticket-template.md');
  const buildExecutionTicketsMd = fillTicketList(buildExecutionTickets, 'grinders-keep-build-execution-ticket-template.md');
  const contentExecutionTicketsMd = fillTicketList(contentExecutionTickets, 'grinders-keep-content-execution-ticket-template.md');
  const monetizationExecutionTicketsMd = fillTicketList(monetizationExecutionTickets, 'grinders-keep-monetization-execution-ticket-template.md');
  const googleWorkflowTicketsMd = fillTicketList(googleWorkflowTickets, 'grinders-keep-google-workflow-ticket-template.md');
  const blockedExecutionTicketsMd = fillTicketList(blockedExecutionTickets, 'grinders-keep-blocked-execution-ticket-template.md');

  // Scorecards, risks, next actions
  const scorecardTemp = getTemplate('grinders-keep-execution-readiness-scorecard-template.md');
  const scorecardMd = scorecardItems.map(sc => fillTemplate(scorecardTemp, sc)).join('\n');

  const riskTemp = getTemplate('grinders-keep-execution-risk-review-template.md');
  const riskMd = riskItems.map(rsk => fillTemplate(riskTemp, rsk)).join('\n');

  const actionTemp = getTemplate('grinders-keep-execution-next-actions-template.md');
  const actionsMd = nextActionsList.map(act => fillTemplate(actionTemp, act)).join('\n');

  // Write tickets files
  const tktPath = path.join(outputFolders.tickets, `grinders_keep_approved_decision_tickets_${dateStr}.md`);
  fs.writeFileSync(tktPath, approvedDecisionTicketsMd, 'utf-8');
  console.log(`✅ Saved Approved Decision Tickets to: ${tktPath}`);

  const bldPath = path.join(outputFolders.tickets, `grinders_keep_build_execution_tickets_${dateStr}.md`);
  fs.writeFileSync(bldPath, buildExecutionTicketsMd, 'utf-8');
  console.log(`✅ Saved Build Execution Tickets to: ${bldPath}`);

  const cntPath = path.join(outputFolders.tickets, `grinders_keep_content_execution_tickets_${dateStr}.md`);
  fs.writeFileSync(cntPath, contentExecutionTicketsMd, 'utf-8');
  console.log(`✅ Saved Content Execution Tickets to: ${cntPath}`);

  const monPath = path.join(outputFolders.tickets, `grinders_keep_monetization_execution_tickets_${dateStr}.md`);
  fs.writeFileSync(monPath, monetizationExecutionTicketsMd, 'utf-8');
  console.log(`✅ Saved Monetization Execution Tickets to: ${monPath}`);

  const gglPath = path.join(outputFolders.tickets, `grinders_keep_google_workflow_tickets_${dateStr}.md`);
  fs.writeFileSync(gglPath, googleWorkflowTicketsMd, 'utf-8');
  console.log(`✅ Saved Google Workflow Tickets to: ${gglPath}`);

  const blkPath = path.join(outputFolders.blocked, `grinders_keep_blocked_execution_tickets_${dateStr}.md`);
  fs.writeFileSync(blkPath, blockedExecutionTicketsMd, 'utf-8');
  console.log(`✅ Saved Blocked Execution Tickets to: ${blkPath}`);

  const scPath = path.join(outputFolders.scorecards, `grinders_keep_execution_readiness_scorecard_${dateStr}.md`);
  fs.writeFileSync(scPath, scorecardMd, 'utf-8');
  console.log(`✅ Saved Execution Scorecard to: ${scPath}`);

  const rskPath = path.join(outputFolders.root, `grinders_keep_execution_risk_review_${dateStr}.md`);
  fs.writeFileSync(rskPath, riskMd, 'utf-8');
  console.log(`✅ Saved Execution Risk Review to: ${rskPath}`);

  const actPath = path.join(outputFolders.root, `grinders_keep_execution_next_actions_${dateStr}.md`);
  fs.writeFileSync(actPath, actionsMd, 'utf-8');
  console.log(`✅ Saved Execution Next Actions to: ${actPath}`);

  // Discovered Approved Decisions summary string
  const discoveredApprovedDecisionsMd = approvedDecisions.length > 0
    ? approvedDecisions.map(opt => `- **ID:** ${opt.decision_id} | **Name:** ${opt.decision_name} | **Type:** ${opt.decision_type}`).join('\n')
    : '* No approved decisions discovered in Phase 12I manifest.*';

  // Compiling telemetry block
  let telemetryMd = `### Telemetry Statistics:\n`;
  telemetryMd += `- Approved Decisions Count: ${telemetryData.approved_decision_count}\n`;
  telemetryMd += `- Blocked Decisions Count: ${telemetryData.blocked_decision_count}\n`;
  telemetryMd += `- Execution Ticket Count: ${telemetryData.execution_ticket_count}\n`;
  telemetryMd += `- Build Execution Tickets: ${telemetryData.build_ticket_count}\n`;
  telemetryMd += `- Content Execution Tickets: ${telemetryData.content_ticket_count}\n`;
  telemetryMd += `- Monetization Execution Tickets: ${telemetryData.monetization_ticket_count}\n`;
  telemetryMd += `- Google Workflow Tickets: ${telemetryData.google_workflow_ticket_count}\n`;
  telemetryMd += `- Execution Allowed Count: ${telemetryData.execution_allowed_count} (Safety enforced)\n`;

  // Main report compilation
  const reportTemp = getTemplate('grinders-keep-execution-queue-report-template.md');
  const reportData = {
    date: dateStr,
    timestamp,
    queue_status: queueStatus,
    executable_ticket_count: String(telemetryData.execution_ticket_count),
    execution_allowed: 'false',
    queue_telemetry: telemetryMd,
    discovered_approved_decisions: discoveredApprovedDecisionsMd,
    approved_decision_tickets: approvedDecisionTicketsMd,
    build_execution_tickets: buildExecutionTicketsMd,
    content_execution_tickets: contentExecutionTicketsMd,
    monetization_execution_tickets: monetizationExecutionTicketsMd,
    google_workflow_tickets: googleWorkflowTicketsMd,
    blocked_execution_tickets: blockedExecutionTicketsMd,
    execution_readiness_scorecard: scorecardMd,
    execution_risk_review: riskMd,
    recommended_next_actions: actionsMd
  };

  const reportMd = fillTemplate(reportTemp, reportData);
  const repPath = path.join(outputFolders.root, `grinders_keep_execution_queue_report_${dateStr}.md`);
  fs.writeFileSync(repPath, reportMd, 'utf-8');
  console.log(`✅ Saved Execution Queue Report to: ${repPath}`);

  // --- 10. Update Frontpage Dashboard ---
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');

    const topReady = approvedDecisionTickets[0] ? `${approvedDecisionTickets[0].ticket_id} (${approvedDecisionTickets[0].ticket_name})` : 'None';
    const topBlocked = blockedExecutionTickets[0] ? `${blockedExecutionTickets[0].blocked_ticket_id} (${blockedExecutionTickets[0].item_name})` : 'None';

    let contentBlock = `\n## Execution Approval Queue\n`;
    contentBlock += `- **Queue Status:** ${queueStatus}\n`;
    contentBlock += `- **Approved Decision Count:** ${telemetryData.approved_decision_count}\n`;
    contentBlock += `- **Execution Ticket Count:** ${telemetryData.execution_ticket_count}\n`;
    contentBlock += `- **Blocked Execution Count:** ${telemetryData.blocked_decision_count}\n`;
    contentBlock += `- **Build Tickets Count:** ${telemetryData.build_ticket_count}\n`;
    contentBlock += `- **Content Tickets Count:** ${telemetryData.content_ticket_count}\n`;
    contentBlock += `- **Monetization Tickets Count:** ${telemetryData.monetization_ticket_count}\n`;
    contentBlock += `- **Google Workflow Tickets Count:** ${telemetryData.google_workflow_ticket_count}\n`;
    contentBlock += `- **Execution Allowed Count:** 0 (Safety override active)\n`;
    contentBlock += `- **Top Ready-For-Review Ticket:** ${topReady}\n`;
    contentBlock += `- **Top Blocked Ticket:** ${topBlocked}\n`;
    contentBlock += `- **Recommended Queue Next Action:** ${nextActionsList[0].action_name}\n\n`;
    contentBlock += `### 📋 Commander Final Review Checklist\n`;
    contentBlock += `- [ ] Verify execution readiness scorecard weights.\n`;
    contentBlock += `- [ ] Inspect staged build, content, monetization, and Google tool execution tickets.\n`;
    contentBlock += `- [ ] Acknowledge risk mitigation plans before moving to Phase 12K.\n`;

    if (frontpageContent.includes('## Execution Approval Queue')) {
      const idx = frontpageContent.indexOf('## Execution Approval Queue');
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
    queue_status: queueStatus,
    suggested_next_action: nextActionsList[0].action_name,
    telemetry: telemetryData,
    discovered_approved_decisions: approvedDecisions.map(opt => ({
      approved_decision_id: opt.decision_id,
      decision_name: opt.decision_name,
      decision_type: opt.decision_type,
      source_path: opt.evidence_sources,
      approval_marker_detected: opt.approval_status === 'approved' ? 'approval_status: approved' : 'commander_approved: true',
      approval_status: opt.approval_status,
      evidence_status: 'available',
      source_summary: opt.source_summary,
      confidence_score_1_to_10: 10,
      commander_approval_required: true
    })),
    approved_decision_tickets: approvedDecisionTickets,
    build_execution_tickets: buildExecutionTickets,
    content_execution_tickets: contentExecutionTickets,
    monetization_execution_tickets: monetizationExecutionTickets,
    google_workflow_tickets: googleWorkflowTickets,
    blocked_execution_tickets: blockedExecutionTickets,
    scorecards: scorecardItems,
    risks: riskItems,
    next_actions: nextActionsList
  };

  const manifestPath = path.join(outputFolders.root, `grinders_keep_execution_queue_manifest_${dateStr}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Manifest to: ${manifestPath}`);

  // Write log file
  logContent += `\n## Execution Results\n`;
  logContent += `- **Queue Status:** ${queueStatus}\n`;
  logContent += `- **Staged Execution Tickets:** ${telemetryData.execution_ticket_count}\n`;
  logContent += `- **Staged Blocked Tickets:** ${telemetryData.blocked_decision_count}\n`;
  logContent += `- **Execution Allowed:** false\n`;
  logContent += `- **Suggested Next Action:** ${nextActionsList[0].action_name}\n\n`;
  logContent += `Execution queue pass finished successfully. All actions safety locked.\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved Execution Log to: ${logFile}`);

  await announceCompletion("Grinders Keep execution approval queue sweep completed successfully", "10");
}

runExecutionApprovalQueue().catch(async (err) => {
  console.error("❌ Execution queue failed:", err);
  await announceCompletion("Grinders Keep execution approval queue sweep failed", "1");
  process.exit(1);
});
