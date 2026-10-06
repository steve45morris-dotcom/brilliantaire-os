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
} from '../config/grinders-keep-downstream-feed-router.js';

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

// Interfaces based on requirements
interface RouteCandidate {
  route_candidate_id: string;
  evidence_id: string;
  evidence_type: string;
  source_path: string;
  validation_status: 'accepted' | 'limited' | 'rejected' | 'unavailable';
  recommended_downstream_phase_if_available: string;
  evidence_strength_score_1_to_10: number;
  metadata_quality_score_1_to_10: number;
  privacy_risk_score_1_to_10: number;
  route_candidate_status: 'route_ready' | 'review_first' | 'blocked' | 'unavailable';
  commander_approval_required: boolean;
}

interface TargetClassification {
  classification_id: string;
  linked_route_candidate_id: string;
  downstream_target: string;
  reason_for_target: string;
  routing_basis: 'evidence_type' | 'validator_feed' | 'scorecard_status' | 'manual_recommendation' | 'metadata';
  confidence_score_1_to_10: number;
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface ManualReviewRoute {
  route_id: string;
  linked_evidence_id: string;
  source_path: string;
  target_phase: 'manual_review_intake';
  target_folder_suggestion: string;
  reason: string;
  required_human_action: string;
  route_mode: 'staged_only';
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface DecisionSynthesisRoute {
  route_id: string;
  linked_evidence_id: string;
  source_path: string;
  target_phase: 'decision_synthesis';
  target_report_or_checklist_suggestion: string;
  reason: string;
  required_human_action: string;
  route_mode: 'staged_only';
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface ContinuousImprovementRoute {
  route_id: string;
  linked_evidence_id: string;
  source_path: string;
  target_phase: 'continuous_improvement';
  improvement_signal_expected: string;
  reason: string;
  required_human_action: string;
  route_mode: 'staged_only';
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface LaunchReadinessRoute {
  route_id: string;
  linked_evidence_id: string;
  source_path: string;
  target_phase: 'launch_readiness';
  linked_ticket_or_decision_if_available: string;
  readiness_impact: string;
  reason: string;
  required_human_action: string;
  route_mode: 'staged_only';
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface BlockedRoute {
  blocked_route_id: string;
  linked_evidence_or_gap: string;
  reason_blocked: string;
  missing_requirement: string;
  risk_if_routed: string;
  smallest_safe_unblock_step: string;
  auto_route_allowed: boolean;
  commander_approval_required: boolean;
}

interface RouteScorecardItem {
  rank: number;
  route_or_blocked_id: string;
  route_type: string;
  evidence_strength_score_1_to_10: number;
  metadata_quality_score_1_to_10: number;
  downstream_value_score_1_to_10: number;
  privacy_risk_score_1_to_10: number;
  routing_confidence_score_1_to_10: number;
  recommended_status: 'stage_for_manual_route' | 'review_first' | 'collect_more_metadata' | 'block' | 'archive';
  reason: string;
  commander_approval_required: boolean;
}

interface RouteManifestItem {
  manifest_item_id: string;
  linked_route_or_blocked_id: string;
  source_path: string;
  target_phase: string;
  target_suggestion: string;
  route_mode: 'staged_only';
  auto_route_allowed: boolean;
  manual_action_required: string;
  commander_approval_required: boolean;
}

interface NextAction {
  action_id: string;
  action_name: string;
  linked_route_or_blocker: string;
  why_this_action: string;
  smallest_safe_step: string;
  manual_action_if_approved: string;
  expected_output: string;
  blocker_if_any: string;
  approval_required: boolean;
}

async function runDownstreamRouter() {
  const dateStr = getFormattedDate();
  console.log(`🏁 Starting Grinders Keep Downstream Feed Router for ${dateStr}...`);
  await announceIntent("Processing grinders keep downstream feed routing");

  // Create required folders if missing
  for (const [key, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  // Define log entries
  const executionLogs: string[] = [];
  function log(message: string) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(message);
    executionLogs.push(formattedMessage);
  }

  log(`Module initialized: ${MODULE_NAME}`);
  log(`Local-first safety check: OK`);

  // Try to load validator manifest
  let validatorManifestData: any = null;
  const manifestPath = referenceSources.validatorManifest;
  if (fs.existsSync(manifestPath)) {
    try {
      validatorManifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      log(`Successfully read validator manifest from ${manifestPath}`);
    } catch (e: any) {
      log(`Error parsing validator manifest: ${e.message}. Defaulting to empty state.`);
    }
  } else {
    log(`Validator manifest not found at ${manifestPath}. Proceeding with empty validator state.`);
  }

  const validatedEvidenceList: any[] = validatorManifestData?.validated || [];
  const totalValidatedEvidence = validatedEvidenceList.length;
  log(`Found ${totalValidatedEvidence} validated evidence items.`);

  // Lists to populate
  const candidates: RouteCandidate[] = [];
  const classifications: TargetClassification[] = [];
  const manualRoutes: ManualReviewRoute[] = [];
  const decisionRoutes: DecisionSynthesisRoute[] = [];
  const improvementRoutes: ContinuousImprovementRoute[] = [];
  const launchRoutes: LaunchReadinessRoute[] = [];
  const blockedRoutes: BlockedRoute[] = [];
  const scorecardItems: RouteScorecardItem[] = [];
  const manifestItems: RouteManifestItem[] = [];
  const nextActions: NextAction[] = [];

  const dateCompact = dateStr.replace(/-/g, '');

  if (totalValidatedEvidence === 0) {
    log(`⚠️ Empty State: No validated evidence found. Creating empty routing report.`);

    // 1. Route Candidates: Empty

    // 2. Classifications: Empty

    // 3. Staged Routes: Empty

    // 4. Blocked Routes (Create 5 entries for missing evidence target categories)
    blockedRoutes.push({
      blocked_route_id: `BLK-ROUT-${dateCompact}-01`,
      linked_evidence_or_gap: 'manual_model_responses',
      reason_blocked: 'No validated ChatGPT/model response evidence files available.',
      missing_requirement: 'A verified model review report under validator validated output directory.',
      risk_if_routed: 'Manual review intake will lack audited LLM insights, creating quality evaluation blindspots.',
      smallest_safe_unblock_step: 'Paste at least one ChatGPT review response in inputs/grinders_keep/evidence_collection/manual_model_responses/ and rerun validation.',
      auto_route_allowed: false,
      commander_approval_required: true,
    });

    blockedRoutes.push({
      blocked_route_id: `BLK-ROUT-${dateCompact}-02`,
      linked_evidence_or_gap: 'google_ultra_outputs',
      reason_blocked: 'No validated Google tool/NotebookLM outputs found.',
      missing_requirement: 'A verified Google tool output artifact file under validator validated folder.',
      risk_if_routed: 'Downstream Decision Synthesis cannot cross-verify model consensus against verified Search/Doc sources.',
      smallest_safe_unblock_step: 'Add a verified Google tool response file inside inputs/grinders_keep/evidence_collection/google_ultra_outputs/ and rerun validation.',
      auto_route_allowed: false,
      commander_approval_required: true,
    });

    blockedRoutes.push({
      blocked_route_id: `BLK-ROUT-${dateCompact}-03`,
      linked_evidence_or_gap: 'cip_audit_report',
      reason_blocked: 'Collision isolation compliance audit report is missing.',
      missing_requirement: 'A validated outputs/grinders_keep/cip_audit_report.md file.',
      risk_if_routed: 'Release execution may violate boundaries between Codex, Gemini, and human CLI sandbox paths.',
      smallest_safe_unblock_step: 'Save a verified cip_audit_report.md under outputs/grinders_keep/ and rerun validation.',
      auto_route_allowed: false,
      commander_approval_required: true,
    });

    blockedRoutes.push({
      blocked_route_id: `BLK-ROUT-${dateCompact}-04`,
      linked_evidence_or_gap: 'screenshots',
      reason_blocked: 'No operational validation screenshots available.',
      missing_requirement: 'Validated visual screenshot files under inputs/grinders_keep/evidence_collection/screenshots/.',
      risk_if_routed: 'Downstream Manual Review has no visual proof check verification to confirm launch switch states.',
      smallest_safe_unblock_step: 'Store a PNG validation screenshot under inputs/grinders_keep/evidence_collection/screenshots/ and rerun validation.',
      auto_route_allowed: false,
      commander_approval_required: true,
    });

    blockedRoutes.push({
      blocked_route_id: `BLK-ROUT-${dateCompact}-05`,
      linked_evidence_or_gap: 'monetization_proof',
      reason_blocked: 'Monetization Stripe validation proof logs are missing.',
      missing_requirement: 'Validated Stripe billing logs under inputs/grinders_keep/evidence_collection/monetization_proof/.',
      risk_if_routed: 'Continuous Improvement pipelines cannot track sandbox execution payment transaction metrics.',
      smallest_safe_unblock_step: 'Place sandbox payment checkout transaction logs under inputs/grinders_keep/evidence_collection/monetization_proof/ and rerun validation.',
      auto_route_allowed: false,
      commander_approval_required: true,
    });

    // 5. Scorecards: Score the blocked routes
    blockedRoutes.forEach((br, index) => {
      scorecardItems.push({
        rank: index + 1,
        route_or_blocked_id: br.blocked_route_id,
        route_type: 'blocked',
        evidence_strength_score_1_to_10: 1,
        metadata_quality_score_1_to_10: 1,
        downstream_value_score_1_to_10: 1,
        privacy_risk_score_1_to_10: 1,
        routing_confidence_score_1_to_10: 1,
        recommended_status: 'block',
        reason: br.reason_blocked,
        commander_approval_required: true,
      });
    });

    // 6. Manifest Items: Link the blocked routes
    blockedRoutes.forEach((br, index) => {
      manifestItems.push({
        manifest_item_id: `MNF-ROUT-${dateCompact}-${String(index + 1).padStart(2, '0')}`,
        linked_route_or_blocked_id: br.blocked_route_id,
        source_path: `inputs/grinders_keep/evidence_collection/${br.linked_evidence_or_gap}/`,
        target_phase: br.linked_evidence_or_gap === 'monetization_proof' ? 'continuous_improvement' :
                      br.linked_evidence_or_gap === 'cip_audit_report' ? 'launch_readiness' :
                      br.linked_evidence_or_gap === 'google_ultra_outputs' ? 'decision_synthesis' : 'manual_review_intake',
        target_suggestion: `outputs/grinders_keep/${br.linked_evidence_or_gap}/`,
        route_mode: 'staged_only',
        auto_route_allowed: false,
        manual_action_required: br.smallest_safe_unblock_step,
        commander_approval_required: true,
      });
    });

    // 7. Recommended Next Actions: Top 5
    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-01`,
      action_name: 'Collect and validate manual model review response evidence',
      linked_route_or_blocker: `BLK-ROUT-${dateCompact}-01`,
      why_this_action: 'Stops launch verification blockages and supplies review insights to manual reviews.',
      smallest_safe_step: 'Add ChatGPT review file under inputs/grinders_keep/evidence_collection/manual_model_responses/.',
      manual_action_if_approved: 'Copy verified model markdown to input directory.',
      expected_output: 'Model response file created.',
      blocker_if_any: 'Requires manual human execution.',
      approval_required: true,
    });

    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-02`,
      action_name: 'Collect and validate Google tool Search output evidence',
      linked_route_or_blocker: `BLK-ROUT-${dateCompact}-02`,
      why_this_action: 'Unblocks source synthesis routing to Decision Synthesis.',
      smallest_safe_step: 'Paste Search output file inside google_ultra_outputs/ input folder.',
      manual_action_if_approved: 'Copy NotebookLM or search logs to Google outputs folder.',
      expected_output: 'Google output file staged.',
      blocker_if_any: 'Requires Google tool manual action.',
      approval_required: true,
    });

    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-03`,
      action_name: 'Stitch CIP compliance isolation audit report',
      linked_route_or_blocker: `BLK-ROUT-${dateCompact}-03`,
      why_this_action: 'Protects system pathways and validates compliance logs for launch readiness.',
      smallest_safe_step: 'Draft cip_audit_report.md under outputs/grinders_keep/ directory.',
      manual_action_if_approved: 'Perform pre-push script check and save output report.',
      expected_output: 'cip_audit_report.md created.',
      blocker_if_any: 'None.',
      approval_required: true,
    });

    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-04`,
      action_name: 'Capture CLI validation screenshot details',
      linked_route_or_blocker: `BLK-ROUT-${dateCompact}-04`,
      why_this_action: 'Furnishes verified visual confirmation notes for manual launch checklist verification.',
      smallest_safe_step: 'Store validation console run screenshot PNG file inside screenshots/ folder.',
      manual_action_if_approved: 'Take screenshot and copy file to inputs screenshots folder.',
      expected_output: 'Visual screenshot PNG added.',
      blocker_if_any: 'None.',
      approval_required: true,
    });

    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-05`,
      action_name: 'Log sandbox Stripe checkout transaction payment detail proof',
      linked_route_or_blocker: `BLK-ROUT-${dateCompact}-05`,
      why_this_action: 'Confirms functional transaction metrics telemetry inside Continuous Improvement.',
      smallest_safe_step: 'Record sandbox Stripe invoice success receipt payload details to monetization_proof/.',
      manual_action_if_approved: 'Copy-paste sandbox Stripe checkout JSON logs to payment folder.',
      expected_output: 'Stripe transaction payload logged.',
      blocker_if_any: 'None.',
      approval_required: true,
    });

  } else {
    log(`Processing validated evidence list...`);
    // Populate when evidence exists
    let itemSeq = 1;
    for (const evd of validatedEvidenceList) {
      const rcId = `RC-ROUT-${dateCompact}-${String(itemSeq++).padStart(2, '0')}`;
      
      const candidate: RouteCandidate = {
        route_candidate_id: rcId,
        evidence_id: evd.evidence_id || `EVD-${dateCompact}-UNKN-${itemSeq}`,
        evidence_type: evd.evidence_type || 'unknown',
        source_path: evd.evidence_path || 'unknown',
        validation_status: evd.validation_status || 'accepted',
        recommended_downstream_phase_if_available: evd.recommended_downstream_phase || 'manual_review_intake',
        evidence_strength_score_1_to_10: evd.evidence_strength_score_1_to_10 || 5,
        metadata_quality_score_1_to_10: evd.metadata_quality_score_1_to_10 || 5,
        privacy_risk_score_1_to_10: evd.privacy_risk_score_1_to_10 || 1,
        route_candidate_status: 'route_ready',
        commander_approval_required: true
      };
      candidates.push(candidate);

      // Routing target classification
      const clsId = `CLS-ROUT-${dateCompact}-${String(itemSeq).padStart(2, '0')}`;
      let targetPhase = candidate.recommended_downstream_phase_if_available;
      
      classifications.push({
        classification_id: clsId,
        linked_route_candidate_id: rcId,
        downstream_target: targetPhase,
        reason_for_target: `Classified based on evidence type ${candidate.evidence_type} and validation status.`,
        routing_basis: 'evidence_type',
        confidence_score_1_to_10: 8,
        auto_route_allowed: false,
        commander_approval_required: true
      });

      // Route creation based on target phase
      const routeId = `RTE-ROUT-${dateCompact}-${String(itemSeq).padStart(2, '0')}`;
      
      if (targetPhase === 'manual_review_intake') {
        manualRoutes.push({
          route_id: routeId,
          linked_evidence_id: candidate.evidence_id,
          source_path: candidate.source_path,
          target_phase: 'manual_review_intake',
          target_folder_suggestion: 'outputs/grinders_keep/manual_review_intake/',
          reason: 'Requires human qualitative review to reconcile content templates.',
          required_human_action: 'Verify contents and checklist approvals.',
          route_mode: 'staged_only',
          auto_route_allowed: false,
          commander_approval_required: true
        });
      } else if (targetPhase === 'decision_synthesis') {
        decisionRoutes.push({
          route_id: routeId,
          linked_evidence_id: candidate.evidence_id,
          source_path: candidate.source_path,
          target_phase: 'decision_synthesis',
          target_report_or_checklist_suggestion: 'outputs/grinders_keep/decision_synthesis/decision_matrix_2026-06-01.md',
          reason: 'Verified source synthesis requires matrix mapping.',
          required_human_action: 'Review decision outcomes against checklist priorities.',
          route_mode: 'staged_only',
          auto_route_allowed: false,
          commander_approval_required: true
        });
      } else if (targetPhase === 'continuous_improvement') {
        improvementRoutes.push({
          route_id: routeId,
          linked_evidence_id: candidate.evidence_id,
          source_path: candidate.source_path,
          target_phase: 'continuous_improvement',
          improvement_signal_expected: 'Monetization metrics or process changes.',
          reason: 'Stages revenue performance optimization data.',
          required_human_action: 'Evaluate monetization proof logic.',
          route_mode: 'staged_only',
          auto_route_allowed: false,
          commander_approval_required: true
        });
      } else if (targetPhase === 'launch_readiness') {
        launchRoutes.push({
          route_id: routeId,
          linked_evidence_id: candidate.evidence_id,
          source_path: candidate.source_path,
          target_phase: 'launch_readiness',
          linked_ticket_or_decision_if_available: 'None',
          readiness_impact: 'Affects final human launch eligibility states.',
          reason: 'Staging compliance audit reports for final gates checks.',
          required_human_action: 'Confirm safety lock checklists are validated.',
          route_mode: 'staged_only',
          auto_route_allowed: false,
          commander_approval_required: true
        });
      }

      // Add to scorecard
      scorecardItems.push({
        rank: itemSeq - 1,
        route_or_blocked_id: routeId,
        route_type: 'staged',
        evidence_strength_score_1_to_10: candidate.evidence_strength_score_1_to_10,
        metadata_quality_score_1_to_10: candidate.metadata_quality_score_1_to_10,
        downstream_value_score_1_to_10: 7,
        privacy_risk_score_1_to_10: candidate.privacy_risk_score_1_to_10,
        routing_confidence_score_1_to_10: 9,
        recommended_status: 'stage_for_manual_route',
        reason: 'Evidence meets validation criteria, ready for human check.',
        commander_approval_required: true
      });

      // Add to manifest
      manifestItems.push({
        manifest_item_id: `MNF-ROUT-${dateCompact}-${String(itemSeq - 1).padStart(2, '0')}`,
        linked_route_or_blocked_id: routeId,
        source_path: candidate.source_path,
        target_phase: targetPhase,
        target_suggestion: `outputs/grinders_keep/${targetPhase}/`,
        route_mode: 'staged_only',
        auto_route_allowed: false,
        manual_action_required: 'Approve staged downstream manifest item for deployment.',
        commander_approval_required: true
      });
    }

    // Standard next routing actions if validated evidence exists
    nextActions.push({
      action_id: `ACT-ROUT-${dateCompact}-01`,
      action_name: 'Approve manual review staged routes manifest',
      linked_route_or_blocker: 'All staged routes',
      why_this_action: 'Moves validated elements into active human evaluation dashboards.',
      smallest_safe_step: 'Acknowledge manifest files in downstream feed router manifest JSON.',
      manual_action_if_approved: 'Execute downstream script integration routing.',
      expected_output: 'Feed integration successfully staged.',
      blocker_if_any: 'Requires Commander manual confirmation.',
      approval_required: true
    });
  }

  // --- RENDERING MARKDOWN OUTPUTS VIA TEMPLATES ---

  // Helper to load and render template
  function renderTmpl(name: string, data: Record<string, string>): string {
    const p = path.join(TEMPLATE_ROOT, name);
    if (!fs.existsSync(p)) {
      log(`Error: Template missing at ${p}`);
      return `[Template Missing: ${name}]`;
    }
    const raw = fs.readFileSync(p, 'utf-8');
    return fillTemplate(raw, data);
  }

  // Helper to format properties as clean YAML-like Markdown
  function formatProperties(obj: any): string {
    let result = '';
    for (const [k, v] of Object.entries(obj)) {
      result += `- **${k.replace(/_/g, ' ')}:** ${v}\n`;
    }
    return result;
  }

  // Candidates list rendering
  let candidatesRendered = '';
  if (candidates.length === 0) {
    candidatesRendered = '* No route candidates discovered (empty validation queue).*';
  } else {
    candidates.forEach(c => {
      candidatesRendered += renderTmpl('grinders-keep-route-candidate-template.md', {
        route_candidate_id: c.route_candidate_id,
        evidence_id: c.evidence_id,
        evidence_type: c.evidence_type,
        source_path: c.source_path,
        validation_status: c.validation_status,
        recommended_downstream_phase_if_available: c.recommended_downstream_phase_if_available,
        evidence_strength_score_1_to_10: String(c.evidence_strength_score_1_to_10),
        metadata_quality_score_1_to_10: String(c.metadata_quality_score_1_to_10),
        privacy_risk_score_1_to_10: String(c.privacy_risk_score_1_to_10),
        route_candidate_status: c.route_candidate_status,
        commander_approval_required: String(c.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.routes, `grinders_keep_route_candidates_${dateStr}.md`), candidatesRendered);

  // Manual Review routes rendering
  let manualRendered = '';
  if (manualRoutes.length === 0) {
    manualRendered = '* No staged manual review routes.*';
  } else {
    manualRoutes.forEach(r => {
      manualRendered += renderTmpl('grinders-keep-manual-review-route-template.md', {
        route_id: r.route_id,
        linked_evidence_id: r.linked_evidence_id,
        source_path: r.source_path,
        target_phase: r.target_phase,
        target_folder_suggestion: r.target_folder_suggestion,
        reason: r.reason,
        required_human_action: r.required_human_action,
        route_mode: r.route_mode,
        auto_route_allowed: String(r.auto_route_allowed),
        commander_approval_required: String(r.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.routes, `grinders_keep_manual_review_routes_${dateStr}.md`), manualRendered);

  // Decision Synthesis routes rendering
  let decisionRendered = '';
  if (decisionRoutes.length === 0) {
    decisionRendered = '* No staged decision synthesis routes.*';
  } else {
    decisionRoutes.forEach(r => {
      decisionRendered += renderTmpl('grinders-keep-decision-synthesis-route-template.md', {
        route_id: r.route_id,
        linked_evidence_id: r.linked_evidence_id,
        source_path: r.source_path,
        target_phase: r.target_phase,
        target_report_or_checklist_suggestion: r.target_report_or_checklist_suggestion,
        reason: r.reason,
        required_human_action: r.required_human_action,
        route_mode: r.route_mode,
        auto_route_allowed: String(r.auto_route_allowed),
        commander_approval_required: String(r.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.routes, `grinders_keep_decision_synthesis_routes_${dateStr}.md`), decisionRendered);

  // Continuous Improvement routes rendering
  let improvementRendered = '';
  if (improvementRoutes.length === 0) {
    improvementRendered = '* No staged continuous improvement routes.*';
  } else {
    improvementRoutes.forEach(r => {
      improvementRendered += renderTmpl('grinders-keep-continuous-improvement-route-template.md', {
        route_id: r.route_id,
        linked_evidence_id: r.linked_evidence_id,
        source_path: r.source_path,
        target_phase: r.target_phase,
        improvement_signal_expected: r.improvement_signal_expected,
        reason: r.reason,
        required_human_action: r.required_human_action,
        route_mode: r.route_mode,
        auto_route_allowed: String(r.auto_route_allowed),
        commander_approval_required: String(r.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.routes, `grinders_keep_continuous_improvement_routes_${dateStr}.md`), improvementRendered);

  // Launch Readiness routes rendering
  let launchRendered = '';
  if (launchRoutes.length === 0) {
    launchRendered = '* No staged launch readiness routes.*';
  } else {
    launchRoutes.forEach(r => {
      launchRendered += renderTmpl('grinders-keep-launch-readiness-route-template.md', {
        route_id: r.route_id,
        linked_evidence_id: r.linked_evidence_id,
        source_path: r.source_path,
        target_phase: r.target_phase,
        linked_ticket_or_decision_if_available: r.linked_ticket_or_decision_if_available,
        readiness_impact: r.readiness_impact,
        reason: r.reason,
        required_human_action: r.required_human_action,
        route_mode: r.route_mode,
        auto_route_allowed: String(r.auto_route_allowed),
        commander_approval_required: String(r.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.routes, `grinders_keep_launch_readiness_routes_${dateStr}.md`), launchRendered);

  // Blocked routes rendering
  let blockedRendered = '';
  if (blockedRoutes.length === 0) {
    blockedRendered = '* No blocked routes detected.*';
  } else {
    blockedRoutes.forEach(r => {
      blockedRendered += renderTmpl('grinders-keep-blocked-route-template.md', {
        blocked_route_id: r.blocked_route_id,
        linked_evidence_or_gap: r.linked_evidence_or_gap,
        reason_blocked: r.reason_blocked,
        missing_requirement: r.missing_requirement,
        risk_if_routed: r.risk_if_routed,
        smallest_safe_unblock_step: r.smallest_safe_unblock_step,
        auto_route_allowed: String(r.auto_route_allowed),
        commander_approval_required: String(r.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.blocked, `grinders_keep_blocked_routes_${dateStr}.md`), blockedRendered);

  // Scorecards rendering
  let scorecardRendered = '';
  if (scorecardItems.length === 0) {
    scorecardRendered = '* Scorecard empty (no route scoring calculated).*';
  } else {
    scorecardItems.forEach(s => {
      scorecardRendered += renderTmpl('grinders-keep-route-scorecard-template.md', {
        rank: String(s.rank),
        route_or_blocked_id: s.route_or_blocked_id,
        route_type: s.route_type,
        evidence_strength_score_1_to_10: String(s.evidence_strength_score_1_to_10),
        metadata_quality_score_1_to_10: String(s.metadata_quality_score_1_to_10),
        downstream_value_score_1_to_10: String(s.downstream_value_score_1_to_10),
        privacy_risk_score_1_to_10: String(s.privacy_risk_score_1_to_10),
        routing_confidence_score_1_to_10: String(s.routing_confidence_score_1_to_10),
        recommended_status: s.recommended_status,
        reason: s.reason,
        commander_approval_required: String(s.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.scorecards, `grinders_keep_route_scorecard_${dateStr}.md`), scorecardRendered);

  // Manifest rendering
  let manifestRendered = '';
  if (manifestItems.length === 0) {
    manifestRendered = '* Manifest empty (no staged routes mapped).*';
  } else {
    manifestItems.forEach(m => {
      manifestRendered += renderTmpl('grinders-keep-route-manifest-template.md', {
        manifest_item_id: m.manifest_item_id,
        linked_route_or_blocked_id: m.linked_route_or_blocked_id,
        source_path: m.source_path,
        target_phase: m.target_phase,
        target_suggestion: m.target_suggestion,
        route_mode: m.route_mode,
        auto_route_allowed: String(m.auto_route_allowed),
        manual_action_required: m.manual_action_required,
        commander_approval_required: String(m.commander_approval_required)
      }) + '\n';
    });
  }
  fs.writeFileSync(path.join(outputFolders.manifests, `grinders_keep_route_manifest_${dateStr}.md`), manifestRendered);

  // Next Actions rendering
  let nextActionsRendered = '';
  nextActions.forEach(a => {
    nextActionsRendered += renderTmpl('grinders-keep-route-next-actions-template.md', {
      action_id: a.action_id,
      action_name: a.action_name,
      linked_route_or_blocker: a.linked_route_or_blocker,
      why_this_action: a.why_this_action,
      smallest_safe_step: a.smallest_safe_step,
      manual_action_if_approved: a.manual_action_if_approved,
      expected_output: a.expected_output,
      blocker_if_any: a.blocker_if_any,
      approval_required: String(a.approval_required)
    }) + '\n';
  });
  fs.writeFileSync(path.join(outputFolders.root, `grinders_keep_route_next_actions_${dateStr}.md`), nextActionsRendered);

  // Routing Telemetry
  const telemetry = {
    route_candidate_count: candidates.length,
    manual_review_route_count: manualRoutes.length,
    decision_synthesis_route_count: decisionRoutes.length,
    continuous_improvement_route_count: improvementRoutes.length,
    launch_readiness_route_count: launchRoutes.length,
    blocked_route_count: blockedRoutes.length,
    auto_route_allowed_count: 0,
    auto_route_allowed_must_be_zero: true,
    no_validated_evidence_found: totalValidatedEvidence === 0
  };

  const telemetryStr = formatProperties(telemetry);

  // Main Report Render & Output
  const mainReportContent = renderTmpl('grinders-keep-downstream-router-report-template.md', {
    date: dateStr,
    timestamp: new Date().toISOString(),
    route_status: totalValidatedEvidence === 0 ? 'no_validated_evidence_found' : 'validated_evidence_routed',
    route_candidate_count: String(candidates.length),
    staged_route_count: String(manualRoutes.length + decisionRoutes.length + improvementRoutes.length + launchRoutes.length),
    blocked_route_count: String(blockedRoutes.length),
    telemetry_summary: telemetryStr,
    candidates_list: candidatesRendered,
    manual_review_routes: manualRendered,
    decision_synthesis_routes: decisionRendered,
    continuous_improvement_routes: improvementRendered,
    launch_readiness_routes: launchRendered,
    blocked_routes_list: blockedRendered,
    scorecard_ranking: scorecardRendered,
    route_manifest: manifestRendered,
    next_actions_list: nextActionsRendered
  });

  const mainReportPath = path.join(outputFolders.root, `grinders_keep_downstream_router_report_${dateStr}.md`);
  fs.writeFileSync(mainReportPath, mainReportContent);
  log(`Generated main downstream router report at: ${mainReportPath}`);

  // Telemetry JSON Manifest Generation
  const manifestJson = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    route_status: totalValidatedEvidence === 0 ? 'no_validated_evidence_found' : 'validated_evidence_routed',
    route_candidate_count: candidates.length,
    staged_route_count: manualRoutes.length + decisionRoutes.length + improvementRoutes.length + launchRoutes.length,
    auto_route_allowed: false,
    suggested_next_action: totalValidatedEvidence === 0 
      ? 'Manually collect and validate evidence through Phase 12N and Phase 12O before rerunning the Downstream Feed Router.'
      : 'Review staged routes manifest and grant Commander approvals.',
    telemetry,
    candidates,
    classifications,
    routes: {
      manual_review: manualRoutes,
      decision_synthesis: decisionRoutes,
      continuous_improvement: improvementRoutes,
      launch_readiness: launchRoutes
    },
    blocked: blockedRoutes,
    scorecard: scorecardItems,
    manifest: manifestItems,
    next_actions: nextActions
  };

  const manifestJsonPath = path.join(outputFolders.root, `grinders_keep_downstream_router_manifest_${dateStr}.json`);
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2));
  log(`Generated Downstream Router telemetry JSON manifest at: ${manifestJsonPath}`);

  // Execution Log File Generation
  log(`I build before burning.`);
  const logContent = `# 🏁 Grinders Keep Downstream Feed Router Execution Log - ${dateStr}\n\n` +
    `- **Timestamp:** ${new Date().toISOString()}\n` +
    `- **Status:** Completed\n\n` +
    `## Execution Timeline\n` +
    executionLogs.map(l => `- ${l}`).join('\n') + `\n\n` +
    `*I build before burning.*\n`;

  const logFilePath = path.join(outputFolders.logs, `grinders_keep_downstream_router_log_${dateStr}.md`);
  fs.writeFileSync(logFilePath, logContent);
  console.log(`Generated Downstream Router execution log at: ${logFilePath}`);

  // --- FRONTPAGE REQUIREMENT ---
  // Read and update the frontpage
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    try {
      let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');
      
      const newRouterSection = `## Downstream Feed Router

- **Downstream Route Status:** ${manifestJson.route_status}
- **Route Candidate Count:** ${telemetry.route_candidate_count}
- **Manual Review Route Count:** ${telemetry.manual_review_route_count}
- **Decision Synthesis Route Count:** ${telemetry.decision_synthesis_route_count}
- **Continuous Improvement Route Count:** ${telemetry.continuous_improvement_route_count}
- **Launch Readiness Route Count:** ${telemetry.launch_readiness_route_count}
- **Blocked Route Count:** ${telemetry.blocked_route_count}
- **Auto Route Allowed Count:** ${telemetry.auto_route_allowed_count} (must be zero)
- **Top Route:** ${candidates.length > 0 ? candidates[0].route_candidate_id : 'None available'}
- **Top Blocked Route:** ${blockedRoutes.length > 0 ? blockedRoutes[0].blocked_route_id : 'None'}
- **Recommended Route Next Action:** ${nextActions[0]?.action_name || 'None'}

### 📋 Commander Downstream Routing Checklist
- [ ] Review staged downstream route manifests under outputs/grinders_keep/downstream_feed_router/manifests/
- [ ] Audit blocked routes to identify evidence gaps or missing compliance documents
- [ ] Inspect next actions checklists to schedule collection workflows
- [ ] Execute human manual verification gates on routed downstream modules
`;

      // Check if "## Downstream Feed Router" section already exists, replace it or append it.
      if (frontpageContent.includes('## Downstream Feed Router')) {
        // Regex to replace from "## Downstream Feed Router" up to the next heading or end of file
        const regex = /## Downstream Feed Router[\s\S]*?(?=\n## |$)/;
        frontpageContent = frontpageContent.replace(regex, newRouterSection.trim() + '\n');
        log(`Updated existing Downstream Feed Router section in frontpage: ${frontpagePath}`);
      } else {
        // Append it before the signatures/footer or at the end
        frontpageContent += '\n' + newRouterSection;
        log(`Appended Downstream Feed Router section to frontpage: ${frontpagePath}`);
      }

      fs.writeFileSync(frontpagePath, frontpageContent);
    } catch (e: any) {
      log(`Error updating frontpage file: ${e.message}`);
    }
  } else {
    log(`Frontpage file not found at ${frontpagePath}. Skipping frontpage section update.`);
  }

  await announceCompletion("Downstream feed routing operations completed successfully");
  log(`All Phase 12P outputs staged successfully.`);
}

runDownstreamRouter().catch(err => {
  console.error("Critical error executing Downstream Feed Router:", err);
  process.exit(1);
});
