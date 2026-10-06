import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  inputContentLabDir,
  inputAdaptiveDir,
  inputGapHunterDir,
  outputDir,
  packetsDir,
  scorecardsDir,
  logsDir,
  templatesDir,
  primarySources,
  REPO_ROOT
} from '../config/grinders-keep-consensus-review-packet-deepener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runConsensusReviewPacketDeepener() {
  const dateStr = getFormattedDate();
  console.log(`🧠 Starting Grinders Keep Consensus Review Packet Deepener v0.1 for ${dateStr}...`);
  await announceIntent("Executing consensus review packet deepener packaging and staging");

  // Ensure output folders exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(packetsDir, { recursive: true });
  fs.mkdirSync(scorecardsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `grinders_keep_consensus_review_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Consensus Review Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Audit Check of Primary Sources ---
  logContent += `## Telemetry Sources Audit Status\n\n`;
  const auditResults: Record<string, any> = {};

  const sourcePaths = {
    contentLabDir: inputContentLabDir,
    contentLabReport: path.join(inputContentLabDir, `grinders_keep_content_lab_report_${dateStr}.md`),
    contentLabManifest: path.join(inputContentLabDir, `grinders_keep_content_lab_manifest_${dateStr}.json`),
    adaptiveDir: inputAdaptiveDir,
    gapHunterDir: inputGapHunterDir,
    systemStatus: primarySources.systemStatus,
    projects: primarySources.projects,
    nextActions: primarySources.nextActions,
    commands: primarySources.commands,
    readme: primarySources.readme,
    schedulerStatus: primarySources.schedulerStatus,
    frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`)
  };

  for (const [key, filePath] of Object.entries(sourcePaths)) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      auditResults[key] = {
        source_status: 'present',
        evidence_status: 'available',
        confidence_score_1_to_10: 10,
        impact: 'High availability of real workspace telemetry',
        suggested_next_action: 'Proceed with ingestion'
      };
      logContent += `- **${key}:** Present (Path: ${filePath})\n`;
    } else {
      auditResults[key] = {
        source_status: 'missing',
        evidence_status: 'unavailable',
        confidence_score_1_to_10: 1,
        impact: `Cannot extract ${key} context, falling back to minimal report boundaries`,
        suggested_next_action: `Run appropriate generator CLI command for ${key}`
      };
      logContent += `- **${key}:** MISSING (Path: ${filePath})\n`;
    }
  }

  // --- 2. Extract Review Items ---
  console.log('1️⃣ Extracting review-worthy items from telemetry...');
  const reviewItems: any[] = [];
  let reviewItemId = 1;

  // Ingest content lab manifest data if available
  let contentLabManifestData: any = null;
  if (auditResults.contentLabManifest.source_status === 'present') {
    try {
      contentLabManifestData = JSON.parse(fs.readFileSync(sourcePaths.contentLabManifest, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse content lab manifest JSON: ${(e as Error).message}`);
    }
  }

  // Extract from Content Lab manifest if present
  if (contentLabManifestData) {
    if (contentLabManifestData.icyflamze_content?.length > 0) {
      for (const item of contentLabManifestData.icyflamze_content) {
        reviewItems.push({
          review_item_id: `REV-ITM-12F-${String(reviewItemId++).padStart(2, '0')}`,
          item_type: 'Icyflamze Content Idea',
          title: item.concept_title || 'Untitled Concept',
          evidence_source: `grinders_keep_content_lab_manifest_${dateStr}.json`,
          evidence_status: 'available',
          source_summary: item.draft_text || '',
          reason_for_review: 'Evaluate artistic voice compliance and narrative alignment with Lagos roots.',
          risk_or_constraint: 'Keep brand boundaries protected.',
          confidence_score_1_to_10: item.money_confidence_score_1_to_10 || 8,
          commander_approval_required: true
        });
      }
    }

    if (contentLabManifestData.service_offers?.length > 0) {
      for (const item of contentLabManifestData.service_offers) {
        reviewItems.push({
          review_item_id: `REV-ITM-12F-${String(reviewItemId++).padStart(2, '0')}`,
          item_type: 'Service Offer Idea',
          title: item.offer_name || 'Untitled Offer',
          evidence_source: `grinders_keep_content_lab_manifest_${dateStr}.json`,
          evidence_status: 'available',
          source_summary: item.deliverable || '',
          reason_for_review: 'Validate consult pricing ranges and local sandboxing feasibility before launch.',
          risk_or_constraint: 'Do not disclose private API secrets.',
          confidence_score_1_to_10: item.money_confidence_score_1_to_10 || 7,
          commander_approval_required: true
        });
      }
    }

    if (contentLabManifestData.google_ultra_workflows?.length > 0) {
      for (const item of contentLabManifestData.google_ultra_workflows) {
        reviewItems.push({
          review_item_id: `REV-ITM-12F-${String(reviewItemId++).padStart(2, '0')}`,
          item_type: 'Google Ultra Workflow Idea',
          title: item.possible_use_case || 'Untitled Workflow',
          evidence_source: `grinders_keep_content_lab_manifest_${dateStr}.json`,
          evidence_status: 'available',
          source_summary: item.privacy_or_safety_note || '',
          reason_for_review: 'Enforce security isolation guidelines and define manual bridge controls.',
          risk_or_constraint: 'Zero live execution allowed; must remain design-only.',
          confidence_score_1_to_10: 9,
          commander_approval_required: true
        });
      }
    }
  }

  // Fallback / missing items validation check
  if (reviewItems.length === 0) {
    reviewItems.push({
      review_item_id: `REV-ITM-12F-01`,
      item_type: 'System Status Audit Check',
      title: 'Missing Staged Content Lab Telemetry',
      evidence_source: `grinders_keep_content_lab_manifest_${dateStr}.json`,
      evidence_status: 'unavailable',
      source_summary: 'Source content lab manifest is missing or empty.',
      reason_for_review: 'Diagnose upstream script execution boundaries.',
      risk_or_constraint: 'Audit loop is in fallback state.',
      confidence_score_1_to_10: 1,
      commander_approval_required: true
    });
  }

  // --- 3. ChatGPT Review Packet ---
  console.log('2️⃣ Generating ChatGPT Review Prompt and Packet...');
  const chatgptTemplatePath = path.join(templatesDir, 'grinders-keep-chatgpt-review-packet-template.md');
  let chatgptTemplate = '';
  if (fs.existsSync(chatgptTemplatePath)) {
    chatgptTemplate = fs.readFileSync(chatgptTemplatePath, 'utf-8');
  }

  let chatgptQuestions = '- Question 1: How well do the staged Icyflamze content concepts express the Lagos-rooted, sovereign mindset?\n- Question 2: Are the proposed service offer proof requirements sufficiently rigorous?';
  let chatgptContext = JSON.stringify(reviewItems.filter(i => i.item_type !== 'Google Ultra Workflow Idea'), null, 2);

  let chatgptPacket = chatgptTemplate
    .replace(/{{packet_id}}/g, `PKT-GPT-12F-${dateStr}`)
    .replace(/{{model_target}}/g, 'ChatGPT')
    .replace(/{{purpose}}/g, 'Evaluate conceptual design, wording quality, and narrative alignment.')
    .replace(/{{evidence_sources}}/g, `grinders_keep_content_lab_manifest_${dateStr}.json`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{questions_to_answer}}/g, chatgptQuestions)
    .replace(/{{source_context}}/g, chatgptContext);

  const chatgptOutPath = path.join(packetsDir, `grinders_keep_chatgpt_review_packet_${dateStr}.md`);
  fs.writeFileSync(chatgptOutPath, chatgptPacket, 'utf-8');

  // --- 4. Gemini Review Packet ---
  console.log('3️⃣ Generating Gemini Review Prompt and Packet...');
  const geminiTemplatePath = path.join(templatesDir, 'grinders-keep-gemini-review-packet-template.md');
  let geminiTemplate = '';
  if (fs.existsSync(geminiTemplatePath)) {
    geminiTemplate = fs.readFileSync(geminiTemplatePath, 'utf-8');
  }

  let geminiQuestions = '- Question 1: Review the manual bridge workflow ideas for Google Docs. Are there any local directory leakage risks?\n- Question 2: Detail the manual test validation steps needed before any Google integrations.';
  let geminiContext = JSON.stringify(reviewItems.filter(i => i.item_type === 'Google Ultra Workflow Idea' || i.item_type === 'Service Offer Idea'), null, 2);

  let geminiPacket = geminiTemplate
    .replace(/{{packet_id}}/g, `PKT-GEM-12F-${dateStr}`)
    .replace(/{{model_target}}/g, 'Gemini')
    .replace(/{{purpose}}/g, 'Audit Google Ultra workflow proposals and ensure zero live execution.')
    .replace(/{{evidence_sources}}/g, `grinders_keep_content_lab_manifest_${dateStr}.json`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{questions_to_answer}}/g, geminiQuestions)
    .replace(/{{source_context}}/g, geminiContext);

  const geminiOutPath = path.join(packetsDir, `grinders_keep_gemini_review_packet_${dateStr}.md`);
  fs.writeFileSync(geminiOutPath, geminiPacket, 'utf-8');

  // --- 5. Claude Review Packet ---
  console.log('4️⃣ Generating Claude Review Prompt and Packet...');
  const claudeTemplatePath = path.join(templatesDir, 'grinders-keep-claude-review-packet-template.md');
  let claudeTemplate = '';
  if (fs.existsSync(claudeTemplatePath)) {
    claudeTemplate = fs.readFileSync(claudeTemplatePath, 'utf-8');
  }

  let claudeQuestions = '- Question 1: Check the command router registration structure. Does it prevent shorthand aliases?\n- Question 2: Review the sandbox rules. Are there files generated that violate BOUNDARY_RULES.md?';
  let claudeContext = `SYSTEM STATUS: ${fs.existsSync(primarySources.systemStatus) ? 'Available' : 'Missing'}\nCOMMANDS REGISTRY: ${fs.existsSync(primarySources.commands) ? 'Available' : 'Missing'}\nREVIEW ITEMS:\n` + JSON.stringify(reviewItems, null, 2);

  let claudePacket = claudeTemplate
    .replace(/{{packet_id}}/g, `PKT-CLD-12F-${dateStr}`)
    .replace(/{{model_target}}/g, 'Claude')
    .replace(/{{purpose}}/g, 'Critique code architecture boundaries and verify command router exact-name restrictions.')
    .replace(/{{evidence_sources}}/g, `grinders_keep_content_lab_manifest_${dateStr}.json, SYSTEM_STATUS.md, COMMANDS.md`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{questions_to_answer}}/g, claudeQuestions)
    .replace(/{{source_context}}/g, claudeContext);

  const claudeOutPath = path.join(packetsDir, `grinders_keep_claude_review_packet_${dateStr}.md`);
  fs.writeFileSync(claudeOutPath, claudePacket, 'utf-8');

  // --- 6. NotebookLM Review Packet ---
  console.log('5️⃣ Generating NotebookLM Review Prompt and Packet...');
  const notebooklmTemplatePath = path.join(templatesDir, 'grinders-keep-notebooklm-review-packet-template.md');
  let notebooklmTemplate = '';
  if (fs.existsSync(notebooklmTemplatePath)) {
    notebooklmTemplate = fs.readFileSync(notebooklmTemplatePath, 'utf-8');
  }

  let notebooklmQuestions = '- Question 1: Verify if the listed missing source files match the Gap Hunter manifest findings.\n- Question 2: Confirm the system version and active projects matches exactly.';
  let notebooklmContext = `FRONT-PAGE: ${fs.existsSync(sourcePaths.frontpage) ? 'Available' : 'Missing'}\nGAP MANIFEST: ${fs.existsSync(path.join(inputGapHunterDir, `grinders_keep_gap_hunter_manifest_${dateStr}.json`)) ? 'Available' : 'Missing'}`;

  let notebooklmPacket = notebooklmTemplate
    .replace(/{{packet_id}}/g, `PKT-NLM-12F-${dateStr}`)
    .replace(/{{model_target}}/g, 'NotebookLM')
    .replace(/{{purpose}}/g, 'Verify source grounding, citations, and identify discrepancies in telemetry metrics.')
    .replace(/{{evidence_sources}}/g, `grinders_keep_frontpage_${dateStr}.md, grinders_keep_gap_hunter_manifest_${dateStr}.json`)
    .replace(/{{source_upload_list}}/g, `- outputs/grinders_keep/grinders_keep_frontpage_${dateStr}.md\n- outputs/grinders_keep/gap_hunter/grinders_keep_gap_hunter_manifest_${dateStr}.json\n- SYSTEM_STATUS.md`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{questions_to_answer}}/g, notebooklmQuestions)
    .replace(/{{source_context}}/g, notebooklmContext);

  const notebooklmOutPath = path.join(packetsDir, `grinders_keep_notebooklm_review_packet_${dateStr}.md`);
  fs.writeFileSync(notebooklmOutPath, notebooklmPacket, 'utf-8');

  // --- 7. Domain Specific Packets ---
  console.log('6️⃣ Generating Domain Specific Context Packets...');

  // Content review packet
  const contentTemplatePath = path.join(templatesDir, 'grinders-keep-content-review-packet-template.md');
  let contentTemplate = '';
  if (fs.existsSync(contentTemplatePath)) {
    contentTemplate = fs.readFileSync(contentTemplatePath, 'utf-8');
  }
  let contentPacket = contentTemplate
    .replace(/{{content_packet_id}}/g, `DOM-CON-12F-${dateStr}`)
    .replace(/{{content_items_included}}/g, 'Icyflamze Content Idea, Video Script Draft, Caption Pack')
    .replace(/{{evidence_sources}}/g, `grinders_keep_content_lab_report_${dateStr}.md`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{draft_details}}/g, JSON.stringify(reviewItems.filter(i => i.item_type === 'Icyflamze Content Idea'), null, 2));

  const contentOutPath = path.join(packetsDir, `grinders_keep_content_review_packet_${dateStr}.md`);
  fs.writeFileSync(contentOutPath, contentPacket, 'utf-8');

  // Build review packet
  const buildTemplatePath = path.join(templatesDir, 'grinders-keep-build-review-packet-template.md');
  let buildTemplate = '';
  if (fs.existsSync(buildTemplatePath)) {
    buildTemplate = fs.readFileSync(buildTemplatePath, 'utf-8');
  }
  let buildPacket = buildTemplate
    .replace(/{{build_packet_id}}/g, `DOM-BLD-12F-${dateStr}`)
    .replace(/{{build_items_included}}/g, 'Command Router Exact-Name Gating Integration, TypeScript compiler refactoring')
    .replace(/{{evidence_sources}}/g, 'SYSTEM_STATUS.md, COMMANDS.md')
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{build_details}}/g, '- Proposal: Refactor Command Router logic in scripts/command.ts to enforce exact command matching\n- Boundary check: 100% sandboxed');

  const buildOutPath = path.join(packetsDir, `grinders_keep_build_review_packet_${dateStr}.md`);
  fs.writeFileSync(buildOutPath, buildPacket, 'utf-8');

  // Monetization review packet
  const monetizationTemplatePath = path.join(templatesDir, 'grinders-keep-monetization-review-packet-template.md');
  let monetizationTemplate = '';
  if (fs.existsSync(monetizationTemplatePath)) {
    monetizationTemplate = fs.readFileSync(monetizationTemplatePath, 'utf-8');
  }
  let monetizationPacket = monetizationTemplate
    .replace(/{{monetization_packet_id}}/g, `DOM-MON-12F-${dateStr}`)
    .replace(/{{monetization_items_included}}/g, 'Local OS Safety Architecture Audit, Sovereign Prompt Pack digital download')
    .replace(/{{evidence_sources}}/g, `grinders_keep_content_lab_manifest_${dateStr}.json`)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{monetization_details}}/g, JSON.stringify(reviewItems.filter(i => i.item_type === 'Service Offer Idea'), null, 2));

  const monetizationOutPath = path.join(packetsDir, `grinders_keep_monetization_review_packet_${dateStr}.md`);
  fs.writeFileSync(monetizationOutPath, monetizationPacket, 'utf-8');

  // Google Ultra review packet
  const googleTemplatePath = path.join(templatesDir, 'grinders-keep-google-ultra-review-packet-template.md');
  let googleTemplate = '';
  if (fs.existsSync(googleTemplatePath)) {
    googleTemplate = fs.readFileSync(googleTemplatePath, 'utf-8');
  }
  let googlePacket = googleTemplate
    .replace(/{{google_packet_id}}/g, `DOM-GGL-12F-${dateStr}`)
    .replace(/{{google_ultra_items_included}}/g, 'Staged content drafts export to manual Google Docs intakes')
    .replace(/{{evidence_sources_or_context}}/g, 'outputs/grinders_keep/content_lab/')
    .replace(/{{tool_categories}}/g, 'Google Docs, Drive')
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{google_ultra_details}}/g, JSON.stringify(reviewItems.filter(i => i.item_type === 'Google Ultra Workflow Idea'), null, 2));

  const googleOutPath = path.join(packetsDir, `grinders_keep_google_ultra_review_packet_${dateStr}.md`);
  fs.writeFileSync(googleOutPath, googlePacket, 'utf-8');

  // --- 8. Scorecard & Decision Matrix ---
  console.log('7️⃣ Writing Cross-Model Scorecard and Decision Matrix...');
  const scorecardTemplatePath = path.join(templatesDir, 'grinders-keep-cross-model-scorecard-template.md');
  let scorecardTemplate = '';
  if (fs.existsSync(scorecardTemplatePath)) {
    scorecardTemplate = fs.readFileSync(scorecardTemplatePath, 'utf-8');
  }
  let scorecardContent = scorecardTemplate.replace(/{{date}}/g, dateStr);
  const scorecardOutPath = path.join(scorecardsDir, `grinders_keep_cross_model_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardOutPath, scorecardContent, 'utf-8');

  // Decision Matrix
  const matrixTemplatePath = path.join(templatesDir, 'grinders-keep-decision-matrix-template.md');
  let matrixTemplate = '';
  if (fs.existsSync(matrixTemplatePath)) {
    matrixTemplate = fs.readFileSync(matrixTemplatePath, 'utf-8');
  }

  const decisionCandidates = [
    {
      decision_id: `DEC-12F-01`,
      decision_name: 'Enforce Command Router Exact-Name Gating Globally',
      source_context: 'Detected command shortcuts in terminals causing risk parameters to drift.',
      evidence_source: 'COMMANDS.md',
      pros: 'Prevents typing collisions, blocks command shortcuts automatically.',
      cons: 'Requires full exact names typing, increasing user typing load slightly.',
      risks: 'Operators typing aliases will be blocked and see instructions.',
      smallest_safe_step: 'Set requiresExactName: true for all low-risk console scripts in config/commands.ts.',
      approval_status: 'pending_human_review',
      commander_approval_required: true
    },
    {
      decision_id: `DEC-12F-02`,
      decision_name: 'Stage R&D outputs path mapping cleanup',
      source_context: 'Observed blank path reference in prior Phase 12E summaries.',
      evidence_source: 'SYSTEM_STATUS.md',
      pros: 'Ensures absolute local path routing is used by AI agents.',
      cons: 'Breaks references in stale documentation backups.',
      risks: 'None.',
      smallest_safe_step: 'Update index to scan outputs/grinders_keep/content_lab/ explicitly.',
      approval_status: 'pending_human_review',
      commander_approval_required: true
    }
  ];

  let matrixContent = `# Staged Decision Matrix - ${dateStr}\n\n`;
  for (const item of decisionCandidates) {
    let block = matrixTemplate || JSON.stringify(item, null, 2);
    for (const [k, v] of Object.entries(item)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    matrixContent += block + '\n\n';
  }
  const matrixOutPath = path.join(scorecardsDir, `grinders_keep_decision_matrix_${dateStr}.md`);
  fs.writeFileSync(matrixOutPath, matrixContent, 'utf-8');

  // --- 9. Consensus Next Actions ---
  console.log('8️⃣ Writing Consensus Next Actions...');
  const nextActionsTemplatePath = path.join(templatesDir, 'grinders-keep-consensus-next-actions-template.md');
  let nextActionsTemplate = '';
  if (fs.existsSync(nextActionsTemplatePath)) {
    nextActionsTemplate = fs.readFileSync(nextActionsTemplatePath, 'utf-8');
  }

  const nextActions = [
    {
      action_id: `ACT-12F-01`,
      action_name: 'Review staged ChatGPT review packet',
      linked_packet_id: `PKT-GPT-12F-${dateStr}`,
      why_this_action: 'Assess conceptual model feedback on content drafts quality.',
      smallest_safe_step: 'Copy human-ready prompt into ChatGPT console manually.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-content-drafts"',
      expected_output: 'Scorecard feedback collected.',
      blocker_if_any: 'None',
      approval_required: true
    },
    {
      action_id: `ACT-12F-02`,
      action_name: 'Run Gemini manual workflow evaluation',
      linked_packet_id: `PKT-GEM-12F-${dateStr}`,
      why_this_action: 'Audit Google Ultra workflow opportunities against system boundary rules.',
      smallest_safe_step: 'Confirm zero-execution parameters for manual Google Doc bridge.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-daily-brief"',
      expected_output: 'Gemini workflow review staged.',
      blocker_if_any: 'None',
      approval_required: true
    }
  ];

  let nextActionsContent = `# Staged Next Actions - ${dateStr}\n\n`;
  for (const action of nextActions) {
    let block = nextActionsTemplate || JSON.stringify(action, null, 2);
    for (const [k, v] of Object.entries(action)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    nextActionsContent += block + '\n\n';
  }
  const nextActionsOutPath = path.join(outputDir, `grinders_keep_consensus_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextActionsOutPath, nextActionsContent, 'utf-8');

  // --- 10. Master Report ---
  console.log('9️⃣ Writing master Consensus Review Report...');
  const reportTemplatePath = path.join(templatesDir, 'grinders-keep-consensus-review-report-template.md');
  let reportTemplate = '';
  if (fs.existsSync(reportTemplatePath)) {
    reportTemplate = fs.readFileSync(reportTemplatePath, 'utf-8');
  }

  const integrityScore = auditResults.contentLabManifest.source_status === 'present' ? 10 : 7;
  const totalReviewCount = reviewItems.length;

  let signalsBlock = '';
  for (const itm of reviewItems) {
    signalsBlock += `### 📡 Review Item: ${itm.title} (${itm.review_item_id})\n`;
    signalsBlock += `- Type: ${itm.item_type}\n`;
    signalsBlock += `- Evidence Source: ${itm.evidence_source}\n`;
    signalsBlock += `- Source Summary: ${itm.source_summary}\n`;
    signalsBlock += `- Reason for Review: ${itm.reason_for_review}\n`;
    signalsBlock += `- Risk Constraint: ${itm.risk_or_constraint}\n`;
    signalsBlock += `- Confidence Score: ${itm.confidence_score_1_to_10}/10\n\n`;
  }

  let finalReport = reportTemplate
    .replace(/{{date}}/g, dateStr)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{integrity_score}}/g, String(integrityScore))
    .replace(/{{total_review_count}}/g, String(totalReviewCount))
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{review_telemetry_signals}}/g, signalsBlock)
    .replace(/{{recommended_next_actions}}/g, nextActionsContent);

  const mainReportOutPath = path.join(outputDir, `grinders_keep_consensus_review_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Consensus Review Report to: ${mainReportOutPath}`);

  // --- 11. Update Frontpage Section ---
  const frontpagePath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`);
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');

    let contentBlock = `\n## 🧠 Consensus Review Packet Deepener\n`;
    contentBlock += `- **Top Review Item:** ${reviewItems[0]?.title || 'None'}\n`;
    contentBlock += `- **Packets Generated:** ChatGPT, Gemini, Claude, NotebookLM\n`;
    contentBlock += `- **Model Targets Staged:** ChatGPT, Gemini, Claude, NotebookLM\n`;
    contentBlock += `- **Top Content Packet:** DOM-CON-12F-${dateStr}\n`;
    contentBlock += `- **Top Build Packet:** DOM-BLD-12F-${dateStr}\n`;
    contentBlock += `- **Top Monetization Packet:** DOM-MON-12F-${dateStr}\n`;
    contentBlock += `- **Top Google Ultra Packet:** DOM-GGL-12F-${dateStr}\n`;
    contentBlock += `- **Cross-Model Scorecard Status:** Staged (Blank evaluations generated)\n`;
    contentBlock += `- **Recommended Consensus Next Action:** ${nextActions[0]?.action_name || 'None'} (\`${nextActions[0]?.command_to_run_if_approved}\`)\n\n`;
    contentBlock += `### 📝 Commander Consensus Review Checklist\n`;
    contentBlock += `- [ ] Copy and paste staged prompts into ChatGPT, Gemini, Claude, and NotebookLM.\n`;
    contentBlock += `- [ ] Review the blank Cross-Model Scorecard evaluation layout.\n`;
    contentBlock += `- [ ] Sign off on Decision Matrix staged candidates before Phase 12G.\n`;

    if (frontpageContent.includes('## 🧠 Consensus Review Packet Deepener')) {
      const idx = frontpageContent.indexOf('## 🧠 Consensus Review Packet Deepener');
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
    console.log(`✅ Updated Frontpage at: ${frontpagePath}`);
  }

  // --- 12. Write JSON Manifest ---
  const jsonManifest = {
    date: dateStr,
    timestamp,
    total_review_count: totalReviewCount,
    review_items: reviewItems,
    audit_results: auditResults,
    packets: {
      chatgpt: chatgptOutPath,
      gemini: geminiOutPath,
      claude: claudeOutPath,
      notebooklm: notebooklmOutPath,
      content: contentOutPath,
      build: buildOutPath,
      monetization: monetizationOutPath,
      google_ultra: googleOutPath
    },
    evaluation: {
      scorecard: scorecardOutPath,
      matrix: matrixOutPath
    },
    next_actions: nextActions
  };

  const jsonManifestPath = path.join(outputDir, `grinders_keep_consensus_review_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Consensus JSON Manifest to: ${jsonManifestPath}`);

  // Update log
  logContent += `\n## Output Generated Files:\n`;
  logContent += `- Summary Report: ${mainReportOutPath}\n`;
  logContent += `- ChatGPT Prompt: ${chatgptOutPath}\n`;
  logContent += `- Gemini Prompt: ${geminiOutPath}\n`;
  logContent += `- Claude Prompt: ${claudeOutPath}\n`;
  logContent += `- NotebookLM Prompt: ${notebooklmOutPath}\n`;
  logContent += `- Content Packet: ${contentOutPath}\n`;
  logContent += `- Build Packet: ${buildOutPath}\n`;
  logContent += `- Monetization Packet: ${monetizationOutPath}\n`;
  logContent += `- Google Ultra Packet: ${googleOutPath}\n`;
  logContent += `- Cross-Model Scorecard: ${scorecardOutPath}\n`;
  logContent += `- Decision Matrix: ${matrixOutPath}\n`;
  logContent += `- Next Actions: ${nextActionsOutPath}\n`;
  logContent += `- JSON Manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved execution log to: ${logFile}`);

  await announceCompletion("Grinders Keep Consensus Review staging complete", "10");
}

runConsensusReviewPacketDeepener().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
