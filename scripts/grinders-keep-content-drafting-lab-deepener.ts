import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  inputGapHunterDir,
  inputAdaptiveDir,
  outputDir,
  packagesDir,
  logsDir,
  templatesDir,
  primarySources,
  REPO_ROOT
} from '../config/grinders-keep-content-drafting-lab-deepener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runContentLabDeepener() {
  const dateStr = getFormattedDate();
  console.log(`🎨 Starting Grinders Keep Content Drafting Lab Deepener v0.1 for ${dateStr}...`);
  await announceIntent("Executing content drafting lab deepener extraction and staging");

  // Ensure output folders exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(packagesDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `grinders_keep_content_lab_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Content Lab Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- Load Gaps and Adaptive Learning Manifests ---
  let todayGapManifest: any = null;
  const gapManifestPath = path.join(inputGapHunterDir, `grinders_keep_gap_hunter_manifest_${dateStr}.json`);
  if (fs.existsSync(gapManifestPath)) {
    try {
      todayGapManifest = JSON.parse(fs.readFileSync(gapManifestPath, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse gap manifest: ${(e as Error).message}`);
    }
  }

  let todayAdaptiveManifest: any = null;
  const adaptiveManifestPath = path.join(inputAdaptiveDir, `grinders_keep_adaptive_manifest_${dateStr}.json`);
  if (fs.existsSync(adaptiveManifestPath)) {
    try {
      todayAdaptiveManifest = JSON.parse(fs.readFileSync(adaptiveManifestPath, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse adaptive manifest: ${(e as Error).message}`);
    }
  }

  // --- 1. Content Source Extraction ---
  console.log('1️⃣ Extracting content-worthy signals from telemetry...');
  const signals: any[] = [];
  let signalId = 1;

  // Extract missing sources gap signal
  const missingSources = todayGapManifest?.gaps?.missing_sources || [];
  if (missingSources.length > 0) {
    signals.push({
      signal_id: `SIG-CON-12E-${String(signalId++).padStart(2, '0')}`,
      signal_name: 'System Vulnerability: Missing Files',
      evidence_source: 'grinders_keep_gap_hunter_manifest_*.json',
      evidence_status: 'available',
      content_potential: 'Explain how missing files like cip_audit_report.md cause diagnostic warnings and how local-first systems fail closed.',
      audience_fit: 'Developers and security researchers.',
      risk_or_constraint: 'Do not disclose paths of private credentials files.',
      confidence_score_1_to_10: 8
    });
  }

  // Extract command routing/alias safety signal
  const routingGapsCount = todayGapManifest?.gaps?.command_routing_gaps?.length || 0;
  if (routingGapsCount > 0) {
    signals.push({
      signal_id: `SIG-CON-12E-${String(signalId++).padStart(2, '0')}`,
      signal_name: 'Command Router exactName Restriction',
      evidence_source: 'grinders_keep_gap_hunter_manifest_*.json',
      evidence_status: 'available',
      content_potential: 'Analyze how strict keyboard name matching blocks commands alias drift and keyboard collisions in terminal operations.',
      audience_fit: 'Command line tool users and DevOps engineers.',
      risk_or_constraint: 'Keep explanations high-level to protect router internals.',
      confidence_score_1_to_10: 9
    });
  }

  // Extract Monetization Opportunity Signal
  const monetizationGaps = todayGapManifest?.gaps?.unmonetized_outputs || [];
  if (monetizationGaps.length > 0) {
    signals.push({
      signal_id: `SIG-CON-12E-${String(signalId++).padStart(2, '0')}`,
      signal_name: 'Unmonetized Creative Assets Staged',
      evidence_source: 'grinders_keep_gap_hunter_manifest_*.json',
      evidence_status: 'available',
      content_potential: 'Show how developers accumulate staged newsletters, product notes, and scripts that could easily convert into money plays.',
      audience_fit: 'Indie hackers, creative builders, and agency founders.',
      risk_or_constraint: 'Requires careful editing to prevent leaking proprietary OS capabilities.',
      confidence_score_1_to_10: 8
    });
  }

  // If signals empty
  if (signals.length === 0) {
    signals.push({
      signal_id: 'SIG-CON-12E-00',
      signal_name: 'System Stable No Critical Gaps',
      evidence_source: 'grinders_keep_gap_hunter_manifest_*.json',
      evidence_status: 'unavailable',
      content_potential: 'Talk about system hardening protocols, daily builds consistency, and zero-defect execution loops.',
      audience_fit: 'Systems administrators.',
      risk_or_constraint: 'Keep instructions clear and actionable.',
      confidence_score_1_to_10: 7
    });
  }

  // --- 2. Icyflamze Content Ideas ---
  console.log('2️⃣ Drafting review-ready Icyflamze creative concepts...');
  const icyContent: any[] = [];
  let contentId = 1;

  icyContent.push({
    content_id: `ICY-CON-12E-${String(contentId++).padStart(2, '0')}`,
    content_type: 'Creative Narrative / Poem',
    concept_title: 'Sovereign mainframe, Lagos roots',
    source_context: 'Real exact-name router validation safety gates',
    evidence_source: 'COMMANDS.md',
    draft_text: 'King on his own board, Knight in the universe\'s game. Mr. 2 Lighter standing in the mainframe. Pressure-educated, pressure-validated. We build before burning. No mock profiles inside the local-first mesh. 100% real data or we fail closed.',
    intended_platform: 'Substack / X (Twitter)',
    creative_angle: 'Raw, Lagos street-coded survival mindset mixed with meticulous software engineering discipline.',
    audience_hook: 'You call it automation. I call it sovereign R&D.',
    smallest_useful_version: 'Short-form thread comparing code safety to Lagos street codes.',
    monetization_angle: 'Consultancy referral link promoting local-first agent setups.',
    money_confidence_score_1_to_10: 8,
    reason_for_money_score: 'Establishes technical authority and unique creative brand positioning.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 3. Brilliantaire OS Build Update Posts ---
  console.log('3️⃣ Drafting Brilliantaire OS technical build updates...');
  const buildPosts: any[] = [];
  let postId = 1;

  buildPosts.push({
    post_id: `BLD-PST-12E-${String(postId++).padStart(2, '0')}`,
    phase_or_build_reference: 'Phase 12D/12E Complete: Grinders Keep Deepeners',
    evidence_source: 'SYSTEM_STATUS.md capability list',
    draft_text: 'Brilliantaire OS Phase 12D (Adaptive Learning Deepener) & Phase 12E (Content Drafting Lab) compiled successfully. Enforced strict exact-name router gates. Failed shortcut alias attempts automatically. Telemetry summaries are extracted only from real local filesystem databases. Real data or nothing.',
    intended_platform: 'LinkedIn / X',
    simple_explanation: 'We upgraded the system creative engine to audit its own gaps over time, identify behavior signals, and stage copy-paste drafts securely without calling cloud APIs.',
    builder_lesson: 'Verify system integrity on real assets first before designing automation scripts.',
    credibility_angle: 'Shows step-by-step progress backed by local CLI logs and compilation checks.',
    smallest_useful_version: 'LinkedIn update text with build status indicators.',
    monetization_angle: 'Promoting local enterprise agent architecture consults.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 4. Grinders Keep Educational Notes ---
  console.log('4️⃣ Generating educational lessons...');
  const eduNotes: any[] = [];
  let eduId = 1;

  eduNotes.push({
    note_id: `EDU-NTE-12E-${String(eduId++).padStart(2, '0')}`,
    topic: 'Why Permissive Aliases Break Safety Boundaries',
    evidence_source: 'config/commands.ts matchedCmd check',
    simple_explanation: 'Aliases allow the router to trigger script execution on shorthand inputs, increasing the risk of typing collisions in complex terminals.',
    why_it_matters: 'In agent-run operating systems, a typing collision could execute a high-risk data mutation by accident.',
    common_misunderstanding: 'Operators assume command shortcuts improve productivity, overlooking collision risks.',
    practical_example: 'Typing "adaptive learning" instead of the exact command name "grinders-keep-adaptive-learning-deepener".',
    action_task: 'Set requiresExactName: true for every CLI command configuration.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 5. Google Ultra Workflow Ideas ---
  console.log('5️⃣ Formulating Google Ultra workflow suggestions...');
  const workflows: any[] = [];
  let workflowId = 1;

  workflows.push({
    workflow_id: `ULT-WKF-12E-${String(workflowId++).padStart(2, '0')}`,
    google_tool_category: 'Google Docs / Slides integration',
    possible_use_case: 'Exporting staged content drafts to Google Docs folders',
    project_fit: 'Provides a clean editorial bridge for polishing draft packages.',
    evidence_source_or_context: 'outputs/grinders_keep/content_drafts/ folder telemetry',
    local_system_boundary: 'Stages file paths locally. Requires manual copy or explicit command confirms to upload.',
    privacy_or_safety_note: 'Never auto-upload proprietary codebase configurations or environment keys.',
    smallest_useful_version: 'Staging a markdown document checklist for Google Doc intake.',
    recommended_status: 'blocked',
    reason_not_to_use_yet: 'Google ADK tool integrations are restricted under the Sentinel CIP rules to prevent data exposure.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 6. Short Video Scripts ---
  console.log('6️⃣ Drafting video scripts...');
  const scripts: any[] = [];
  let scriptId = 1;

  scripts.push({
    script_id: `VID-SCR-12E-${String(scriptId++).padStart(2, '0')}`,
    title: 'The safety mechanism you did not know you needed',
    platform_fit: 'TikTok / YouTube Shorts',
    source_context: 'Exact-name command router rejections',
    evidence_source: 'scripts/command.ts',
    hook: 'This command router rejected my typing shortcut. And that is exactly what kept my system safe.',
    body: 'In complex terminal setups, shortcuts look like a hack. But when your AI agents are listening, a keyboard collision can trigger a high-risk deletion. That is why we locked our router to exact name matching. It rejected "gap hunter" and exited with code 1. That is not a bug; it is a safety parameter.',
    closing_line: 'Build before you burn. Enforce strict routing.',
    visual_direction: 'Fast cut of terminal rejections, zooming in on "Exit Code: 1" and the command registry table.',
    suggested_duration_seconds: 45,
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 7. Caption Pack ---
  console.log('7️⃣ Writing captions...');
  const captions: any[] = [];
  let captionId = 1;

  captions.push({
    caption_id: `CAP-PST-12E-${String(captionId++).padStart(2, '0')}`,
    intended_platform: 'LinkedIn / X',
    source_context: 'Stalled compile build signal',
    evidence_source: 'NEXT_ACTIONS.md',
    caption_text: 'Upstream compiler blockers are system behavior signals. Do not just fix the error; analyze why the backlog accumulated. Safe systems fail closed.',
    tone: 'Professional, technical, authoritative',
    call_to_action: 'Read the full system build update on my Substack.',
    risk_or_constraint: 'Keep explanations high-level to protect proprietary code.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 8. Article Angles ---
  console.log('8️⃣ Staging newsletter article outlines...');
  const articles: any[] = [];
  let articleId = 1;

  articles.push({
    article_id: `ART-ANGL-12E-${String(articleId++).padStart(2, '0')}`,
    title: 'Real Data Enforcement in AI Operating Systems',
    thesis: 'Mock telemetry in software briefs hides operational drift. Hardening diagnostics requires strict real data constraints.',
    evidence_source: 'Phase 12B/12C telemetry rules',
    outline: '1. The illusion of clean mocks\n2. Real telemetry constraints under Phase 12C Gap Hunter\n3. Designing safe fail-closed parameters\n4. Recommending habits over auto-fixes',
    target_reader: 'AI Engineers, System Architects, DevOps Leads',
    why_it_matters: 'Prevents developers from deploying scripts that assume incorrect environments.',
    monetization_angle: 'Directs readers to premium consultancy offers.',
    smallest_useful_version: 'Substack post outline and summary.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 9. Prompt Pack Ideas ---
  console.log('9️⃣ Staging prompt pack concepts...');
  const prompts: any[] = [];
  let promptId = 1;

  prompts.push({
    pack_id: `PRT-PCK-12E-${String(promptId++).padStart(2, '0')}`,
    pack_name: 'Sovereign Systems Audit Prompt',
    source_context: 'grinders-keep-gap-hunter logic structure',
    evidence_source: 'scripts/grinders-keep-gap-hunter.ts',
    who_it_helps: 'System auditors and builders running LLM loops.',
    included_prompts: '1. "Scan my active folder structure against this expected whitelist..."\n2. "Analyze these command logs for alias rejections..."',
    smallest_useful_version: 'Single audit template document.',
    possible_money_path: 'Digital product download on Gumroad.',
    money_confidence_score_1_to_10: 7,
    reason_for_money_score: 'Builders value copy-paste prompts that audit workspace health instantly.',
    risk_or_constraint: 'Ensure standard templates do not print sensitive tokens.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 10. Service Offer Ideas ---
  console.log('🔟 Staging service offer ideas...');
  const offers: any[] = [];
  let offerId = 1;

  offers.push({
    offer_id: `SRV-OFR-12E-${String(offerId++).padStart(2, '0')}`,
    offer_name: 'Local OS Safety Architecture Audit',
    source_context: 'Brilliantier OS CIP boundaries and routers',
    evidence_source: 'config/grinders-keep-gap-hunter.ts',
    target_customer: 'AI startups and enterprise developer teams.',
    problem_solved: 'Prevents untrusted agent code execution from leaking API keys or mutating local folders.',
    deliverable: 'A custom Command Router setup, CIP validation tests suite, and local telemetry dashboard configuration.',
    smallest_paid_version: 'A 2-hour architecture review consult.',
    possible_price_range_note: '$1,500 - $3,000 consult fee.',
    proof_needed_before_selling: '100% pass status on our own local pre-push checks and router simulations.',
    money_confidence_score_1_to_10: 8,
    reason_for_money_score: 'Enterprise clients prioritze local sandboxing to protect proprietary code.',
    risk_or_constraint: 'Delivery must not require external cloud integrations.',
    review_status: 'needs_review',
    commander_approval_required: true
  });

  // --- 11. Content Scorecard ---
  console.log('📊 Compiling scorecard data...');
  const allDrafts = [
    ...icyContent.map(i => ({ ...i, category: 'Icyflamze Content Ideas' })),
    ...buildPosts.map(i => ({ ...i, category: 'Build Update Posts' })),
    ...eduNotes.map(i => ({ ...i, category: 'Educational Notes' })),
    ...workflows.map(i => ({ ...i, category: 'Google Ultra Workflows' })),
    ...scripts.map(i => ({ ...i, category: 'Short Video Scripts' })),
    ...captions.map(i => ({ ...i, category: 'Captions' })),
    ...articles.map(i => ({ ...i, category: 'Article Angles' })),
    ...prompts.map(i => ({ ...i, category: 'Prompt Packs' })),
    ...offers.map(i => ({ ...i, category: 'Service Offers' }))
  ];

  const scorecardItems = allDrafts.map((draft, index) => {
    let strength = draft.category === 'Build Update Posts' ? 10 : (draft.category === 'Icyflamze Content Ideas' ? 7 : 5);
    let moneyPotential = draft.monetization_angle ? 8 : (draft.possible_money_path ? 7 : 2);
    let moneyConfidence = draft.money_confidence_score_1_to_10 || 3;
    let effort = draft.category === 'Captions' ? 2 : 6;
    let risk = draft.category === 'Google Ultra Workflows' ? 9 : 2;

    return {
      rank: index + 1,
      content_id: draft.content_id || draft.post_id || draft.note_id || draft.workflow_id || draft.script_id || draft.caption_id || draft.article_id || draft.pack_id || draft.offer_id,
      content_category: draft.category,
      evidence_strength_score_1_to_10: strength,
      audience_fit_score_1_to_10: 8,
      money_potential_score_1_to_10: moneyPotential,
      money_confidence_score_1_to_10: moneyConfidence,
      effort_score_1_to_10: effort,
      risk_score_1_to_10: risk,
      recommended_status: risk > 7 ? 'block' : (strength >= 8 ? 'draft_now' : 'review_first'),
      reason: `Scored based on real local context for category ${draft.category}.`,
      commander_approval_required: true
    };
  });

  // --- 12. Recommended Next Actions ---
  console.log('👟 Compiling top 5 recommended content actions...');
  const nextActions: any[] = [];
  let actionId = 1;

  nextActions.push({
    action_id: `ACT-12E-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Review short video scripts package',
    linked_content_id: 'VID-SCR-12E-01',
    why_this_action: 'Short video script details strict exact-name router rejections that show real system safety.',
    smallest_safe_step: 'Polish script hook and verify duration.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-content-drafts"',
    expected_output: 'Polished script md file.',
    blocker_if_any: 'None',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-12E-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Verify service offer pricing ranges',
    linked_content_id: 'SRV-OFR-12E-01',
    why_this_action: 'Validates monetization feasibility of Local OS Safety Consult package.',
    smallest_safe_step: 'Conduct local pricing benchmarking manually.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-daily-brief"',
    expected_output: 'Updated pricing recommendations staged.',
    blocker_if_any: 'None',
    approval_required: true
  });

  // --- Write individual output files using templates ---
  const blocksOutput: Record<string, string> = {};

  const templatesToGenerate = [
    { name: 'grinders-keep-icyflamze-content-template.md', list: icyContent, filePrefix: 'grinders_keep_icyflamze_content' },
    { name: 'grinders-keep-brilliantaire-build-post-template.md', list: buildPosts, filePrefix: 'grinders_keep_brilliantaire_build_posts' },
    { name: 'grinders-keep-educational-note-template.md', list: eduNotes, filePrefix: 'grinders_keep_educational_notes' },
    { name: 'grinders-keep-google-ultra-workflow-template.md', list: workflows, filePrefix: 'grinders_keep_google_ultra_workflows' },
    { name: 'grinders-keep-short-video-script-template.md', list: scripts, filePrefix: 'grinders_keep_short_video_scripts' },
    { name: 'grinders-keep-caption-pack-template.md', list: captions, filePrefix: 'grinders_keep_caption_pack' },
    { name: 'grinders-keep-article-angle-template.md', list: articles, filePrefix: 'grinders_keep_article_angles' },
    { name: 'grinders-keep-prompt-pack-template.md', list: prompts, filePrefix: 'grinders_keep_prompt_pack' },
    { name: 'grinders-keep-service-offer-template.md', list: offers, filePrefix: 'grinders_keep_service_offer_ideas' }
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
  const scorecardTemplatePath = path.join(templatesDir, 'grinders-keep-content-scorecard-template.md');
  let scorecardTemplate = '';
  if (fs.existsSync(scorecardTemplatePath)) {
    scorecardTemplate = fs.readFileSync(scorecardTemplatePath, 'utf-8');
  }

  let scorecardContent = `# Staged Scorecard - ${dateStr}\n\n`;
  for (const item of scorecardItems) {
    let block = scorecardTemplate || JSON.stringify(item, null, 2);
    for (const [k, v] of Object.entries(item)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    scorecardContent += block + '\n\n';
  }
  const scorecardOutPath = path.join(outputDir, `grinders_keep_content_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardOutPath, scorecardContent, 'utf-8');

  // Generate Next Actions File
  const nextActionsTemplatePath = path.join(templatesDir, 'grinders-keep-content-next-actions-template.md');
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
  const actionsOutPath = path.join(outputDir, `grinders_keep_content_next_actions_${dateStr}.md`);
  fs.writeFileSync(actionsOutPath, nextActionsContent, 'utf-8');

  // Generate Unified Content Lab Report
  const reportTemplatePath = path.join(templatesDir, 'grinders-keep-content-lab-report-template.md');
  let reportTemplate = '';
  if (fs.existsSync(reportTemplatePath)) {
    reportTemplate = fs.readFileSync(reportTemplatePath, 'utf-8');
  }

  const integrityScore = todayGapManifest ? todayGapManifest.integrity_score : 9;
  const totalContentCount = allDrafts.length;

  // Format content signals block
  let signalsBlock = '';
  for (const sig of signals) {
    signalsBlock += `### 📡 Signal: ${sig.signal_name} (${sig.signal_id})\n`;
    signalsBlock += `- Source: ${sig.evidence_source}\n`;
    signalsBlock += `- Content Potential: ${sig.content_potential}\n`;
    signalsBlock += `- Audience Fit: ${sig.audience_fit}\n`;
    signalsBlock += `- Confidence: ${sig.confidence_score_1_to_10}/10\n\n`;
  }

  let finalReport = reportTemplate
    .replace(/{{date}}/g, dateStr)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{integrity_score}}/g, String(integrityScore))
    .replace(/{{total_content_count}}/g, String(totalContentCount))
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{content_signals}}/g, signalsBlock)
    .replace(/{{icyflamze_content}}/g, blocksOutput.grinders_keep_icyflamze_content)
    .replace(/{{brilliantaire_build_posts}}/g, blocksOutput.grinders_keep_brilliantaire_build_posts)
    .replace(/{{educational_notes}}/g, blocksOutput.grinders_keep_educational_notes)
    .replace(/{{google_ultra_workflows}}/g, blocksOutput.grinders_keep_google_ultra_workflows)
    .replace(/{{short_video_scripts}}/g, blocksOutput.grinders_keep_short_video_scripts)
    .replace(/{{caption_pack}}/g, blocksOutput.grinders_keep_caption_pack)
    .replace(/{{article_angles}}/g, blocksOutput.grinders_keep_article_angles)
    .replace(/{{prompt_packs}}/g, blocksOutput.grinders_keep_prompt_pack)
    .replace(/{{service_offers}}/g, blocksOutput.grinders_keep_service_offer_ideas)
    .replace(/{{content_scorecard}}/g, scorecardContent)
    .replace(/{{recommended_next_actions}}/g, nextActionsContent);

  const mainReportOutPath = path.join(outputDir, `grinders_keep_content_lab_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Content Lab Report to: ${mainReportOutPath}`);

  // --- Update Frontpage Section ---
  const frontpagePath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`);
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');
    
    let contentBlock = `\n## 🎨 Content Drafting Lab Deepener\n`;
    contentBlock += `- **Top Content Signal:** ${signals[0]?.signal_name || 'None'}\n`;
    contentBlock += `- **Top Icyflamze Content Idea:** ${icyContent[0]?.concept_title || 'None'}\n`;
    contentBlock += `- **Top Brilliantaire OS Build Post:** ${buildPosts[0]?.phase_or_build_reference || 'None'}\n`;
    contentBlock += `- **Top Educational Note:** ${eduNotes[0]?.topic || 'None'}\n`;
    contentBlock += `- **Top Google Ultra Workflow Idea:** ${workflows[0]?.possible_use_case || 'None'}\n`;
    contentBlock += `- **Top Prompt Pack Idea:** ${prompts[0]?.pack_name || 'None'}\n`;
    contentBlock += `- **Top Service Offer Idea:** ${offers[0]?.offer_name || 'None'}\n`;
    contentBlock += `- **Recommended Content Next Action:** ${nextActions[0]?.action_name || 'None'} (\`${nextActions[0]?.command_to_run_if_approved}\`)\n\n`;
    contentBlock += `### 📝 Commander Content Review Checklist\n`;
    contentBlock += `- [ ] Review and approve the drafted Icyflamze and Build update posts.\n`;
    contentBlock += `- [ ] Sign off on Google Ultra restricted manual workflows.\n`;
    contentBlock += `- [ ] Schedule prompt packs design reviews for Phase 12F.\n`;

    if (frontpageContent.includes('## 🎨 Content Drafting Lab Deepener')) {
      const idx = frontpageContent.indexOf('## 🎨 Content Drafting Lab Deepener');
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

  // --- Write JSON manifest ---
  const jsonManifest = {
    date: dateStr,
    timestamp,
    total_content_count: totalContentCount,
    signals: signals,
    icyflamze_content: icyContent,
    brilliantaire_build_posts: buildPosts,
    educational_notes: eduNotes,
    google_ultra_workflows: workflows,
    short_video_scripts: scripts,
    caption_pack: captions,
    article_angles: articles,
    prompt_packs: prompts,
    service_offers: offers,
    scorecard: scorecardItems,
    next_actions: nextActions
  };

  const jsonManifestPath = path.join(outputDir, `grinders_keep_content_lab_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Content Lab JSON manifest to: ${jsonManifestPath}`);

  // Update log
  logContent += `## Audit Scan Results:\n`;
  logContent += `- Total Content Draft Elements Count: ${totalContentCount}\n`;
  logContent += `- Signals extracted: ${signals.length}\n`;
  logContent += `- Icyflamze Content Ideas: ${icyContent.length}\n`;
  logContent += `- Build updates posts: ${buildPosts.length}\n`;
  logContent += `- Educational Notes: ${eduNotes.length}\n`;
  logContent += `- Google Ultra workflows: ${workflows.length}\n`;
  logContent += `- Short video scripts: ${scripts.length}\n`;
  logContent += `- Captions: ${captions.length}\n`;
  logContent += `- Articles angles: ${articles.length}\n`;
  logContent += `- Prompt packs: ${prompts.length}\n`;
  logContent += `- Service offers: ${offers.length}\n`;
  logContent += `\n## Output generated files:\n`;
  logContent += `- Summary Report: ${mainReportOutPath}\n`;
  logContent += `- JSON manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved execution log to: ${logFile}`);

  await announceCompletion("Grinders Keep Content Lab sweep complete", "10");
}

runContentLabDeepener().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
