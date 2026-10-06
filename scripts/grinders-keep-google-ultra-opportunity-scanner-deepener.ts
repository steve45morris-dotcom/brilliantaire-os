import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  inputConsensusDir,
  inputContentLabDir,
  inputAdaptiveDir,
  inputGapHunterDir,
  outputDir,
  workflowsDir,
  scorecardsDir,
  logsDir,
  templatesDir,
  primarySources,
  REPO_ROOT
} from '../config/grinders-keep-google-ultra-opportunity-scanner-deepener.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runGoogleUltraScanner() {
  const dateStr = getFormattedDate();
  console.log(`🚀 Starting Grinders Keep Google Ultra Opportunity Scanner Deepener v0.1 for ${dateStr}...`);
  await announceIntent("Executing Google Ultra opportunity scanner deepener sweep");

  // Ensure output folders exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(workflowsDir, { recursive: true });
  fs.mkdirSync(scorecardsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const logFile = path.join(logsDir, `grinders_keep_google_ultra_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Google Ultra Scanner Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Audit Check of Telemetry Sources ---
  logContent += `## Ingestion Sources Audit Status\n\n`;
  const auditResults: Record<string, any> = {};

  const sourcePaths = {
    consensusDir: inputConsensusDir,
    consensusReport: path.join(inputConsensusDir, `grinders_keep_consensus_review_report_${dateStr}.md`),
    consensusManifest: path.join(inputConsensusDir, `grinders_keep_consensus_review_manifest_${dateStr}.json`),
    contentLabDir: inputContentLabDir,
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

  // --- 2. Extract Project Needs ---
  console.log('1️⃣ Extracting project needs from local telemetry...');
  const projectNeeds: any[] = [];
  let needId = 1;

  // Load consensus manifest data if available
  let consensusManifestData: any = null;
  if (auditResults.consensusManifest.source_status === 'present') {
    try {
      consensusManifestData = JSON.parse(fs.readFileSync(sourcePaths.consensusManifest, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse consensus manifest JSON: ${(e as Error).message}`);
    }
  }

  // Check if consensus review items exist
  if (consensusManifestData?.review_items?.length > 0) {
    for (const item of consensusManifestData.review_items) {
      projectNeeds.push({
        need_id: `ND-GGL-${dateStr}-${String(needId++).padStart(2, '0')}`,
        need_name: `Consensus Review Audit: ${item.title}`,
        need_type: 'consensus review needs',
        evidence_source: `grinders_keep_consensus_review_manifest_${dateStr}.json`,
        evidence_status: 'available',
        source_summary: item.source_summary || '',
        why_it_matters: 'Commander evaluation requires manual prompts and staging comparisons.',
        risk_or_constraint: 'Model answers must be copied manually to preserve local sandbox boundaries.',
        confidence_score_1_to_10: 9,
        commander_approval_required: true
      });
    }
  }

  // Load content manifest data if available
  let contentLabManifestData: any = null;
  if (auditResults.contentLabManifest.source_status === 'present') {
    try {
      contentLabManifestData = JSON.parse(fs.readFileSync(sourcePaths.contentLabManifest, 'utf-8'));
    } catch (e) {
      console.warn(`[Warning] Failed to parse content lab manifest JSON: ${(e as Error).message}`);
    }
  }

  if (contentLabManifestData?.google_ultra_workflows?.length > 0) {
    for (const item of contentLabManifestData.google_ultra_workflows) {
      projectNeeds.push({
        need_id: `ND-GGL-${dateStr}-${String(needId++).padStart(2, '0')}`,
        need_name: `Google Ultra Idea: ${item.possible_use_case}`,
        need_type: 'Google workflow ideas',
        evidence_source: `grinders_keep_content_lab_manifest_${dateStr}.json`,
        evidence_status: 'available',
        source_summary: item.privacy_or_safety_note || '',
        why_it_matters: 'Staged Google Ultra conceptual flows must be mapped to manual tools.',
        risk_or_constraint: 'Zero live execution to protect environment keys.',
        confidence_score_1_to_10: 8,
        commander_approval_required: true
      });
    }
  }

  // Fallback check
  if (projectNeeds.length === 0) {
    projectNeeds.push({
      need_id: `ND-GGL-${dateStr}-01`,
      need_name: 'Stale Content Staging Clean-up',
      need_type: 'missing source issues',
      evidence_source: 'SYSTEM_STATUS.md',
      evidence_status: 'available',
      source_summary: 'Prior summaries contain empty path references to video script packages.',
      why_it_matters: 'AI agents require exact local path routes to audit reports.',
      risk_or_constraint: 'Verify exact folder paths locally.',
      confidence_score_1_to_10: 7,
      commander_approval_required: true
    });
  }

  // --- 3. Google Tool Map ---
  console.log('2️⃣ Mapping project needs to Google tool categories...');
  const toolMaps: any[] = [];
  let mapId = 1;

  for (const need of projectNeeds) {
    let tool = 'Gemini';
    let useCase = 'Review text concepts and audit commands safety';
    let fit = 'Gemini excels at fast reasoning over local configurations.';
    let boundary = 'Copy manual review prompts only; no API hooks.';
    let safety = 'Ensure prompt does not leak .env keys.';
    let status = 'recommendation_only';

    if (need.need_type === 'Google workflow ideas') {
      tool = 'Google Docs';
      useCase = 'Stage text briefs in clean folders for human publishing';
      fit = 'Provides a secure staging dashboard before publishing copy.';
      boundary = 'Folder is located locally in output directory; manual copy is required.';
      safety = 'Do not enable live sync options.';
      status = 'manual_test_ready';
    }

    toolMaps.push({
      map_id: `MAP-GGL-${dateStr}-${String(mapId++).padStart(2, '0')}`,
      project_need_id: need.need_id,
      suggested_google_tool: tool,
      possible_use_case: useCase,
      why_this_tool_fits: fit,
      local_system_boundary: boundary,
      privacy_or_safety_note: safety,
      recommendation_status: status,
      reason_not_to_use_yet: 'Cloud write gates are restricted in this sandbox configuration.',
      smallest_useful_manual_test: `Manually copy staged report to a local folder and open in browser.`,
      commander_approval_required: true
    });
  }

  // Write tool map output file
  const mapTemplatePath = path.join(templatesDir, 'grinders-keep-google-tool-map-template.md');
  let mapTemplate = '';
  if (fs.existsSync(mapTemplatePath)) {
    mapTemplate = fs.readFileSync(mapTemplatePath, 'utf-8');
  }

  let toolMapContent = `# Staged Google Tool Map - ${dateStr}\n\n`;
  for (const item of toolMaps) {
    let block = mapTemplate || JSON.stringify(item, null, 2);
    for (const [k, v] of Object.entries(item)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    toolMapContent += block + '\n\n---\n\n';
  }
  const toolMapOutPath = path.join(outputDir, `grinders_keep_google_tool_map_${dateStr}.md`);
  fs.writeFileSync(toolMapOutPath, toolMapContent, 'utf-8');

  // --- 4. Write Individual Workflows (8 files) ---
  console.log('3️⃣ Generating manual workflow plans (Gemini, NotebookLM, Flow, Whisk, Veo, Antigravity, Drive/Docs/Sheets, YouTube/Vids)...');

  // Gemini Workflow
  const geminiTemplatePath = path.join(templatesDir, 'grinders-keep-gemini-workflow-template.md');
  let geminiTemplate = '';
  if (fs.existsSync(geminiTemplatePath)) {
    geminiTemplate = fs.readFileSync(geminiTemplatePath, 'utf-8');
  }
  let geminiWorkflow = geminiTemplate
    .replace(/{{workflow_id}}/g, `WKF-GEM-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{manual_prompt_goal}}/g, 'Review staged text narrative and check for Lagos persona rules.')
    .replace(/{{suggested_prompt}}/g, `Verify the following concept: "${projectNeeds[0].source_summary}" against V VN-narrative codes.`)
    .replace(/{{expected_response_format}}/g, 'Structured text with a voice audit checklist.')
    .replace(/{{scoring_criteria}}/g, '1. Persona consistency, 2. Text flow, 3. Visual metaphors.')
    .replace(/{{local_system_boundary}}/g, 'Copy prompt manually to Gemini chat.')
    .replace(/{{warning_against_unverified_claims}}/g, 'Never paste private system paths or keys.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Paste draft into Gemini and verify voice output.');

  const geminiOutPath = path.join(workflowsDir, `grinders_keep_gemini_workflows_${dateStr}.md`);
  fs.writeFileSync(geminiOutPath, geminiWorkflow, 'utf-8');

  // NotebookLM Workflow
  const nlmTemplatePath = path.join(templatesDir, 'grinders-keep-notebooklm-workflow-template.md');
  let nlmTemplate = '';
  if (fs.existsSync(nlmTemplatePath)) {
    nlmTemplate = fs.readFileSync(nlmTemplatePath, 'utf-8');
  }
  let nlmWorkflow = nlmTemplate
    .replace(/{{workflow_id}}/g, `WKF-NLM-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{suggested_source_upload_list}}/g, `- outputs/grinders_keep/content_lab/grinders_keep_content_lab_report_${dateStr}.md\n- SYSTEM_STATUS.md`)
    .replace(/{{manual_question_set}}/g, '1. Verify if the listed missing source files match the Gap Hunter manifest findings.\n2. Confirm the active project counts.')
    .replace(/{{citation_check_goal}}/g, 'Verify all status items have a direct citation in the uploaded markdown files.')
    .replace(/{{expected_response_format}}/g, 'Question followed by exact citation path and text.')
    .replace(/{{local_system_boundary}}/g, 'Source upload must occur via manual web interface.')
    .replace(/{{warning_against_unsupported_claims}}/g, 'Every statement must include a document link.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Upload SYSTEM_STATUS.md to NotebookLM and verify citations.');

  const nlmOutPath = path.join(workflowsDir, `grinders_keep_notebooklm_workflows_${dateStr}.md`);
  fs.writeFileSync(nlmOutPath, nlmWorkflow, 'utf-8');

  // Flow Workflow
  const flowTemplatePath = path.join(templatesDir, 'grinders-keep-flow-workflow-template.md');
  let flowTemplate = '';
  if (fs.existsSync(flowTemplatePath)) {
    flowTemplate = fs.readFileSync(flowTemplatePath, 'utf-8');
  }
  let flowWorkflow = flowTemplate
    .replace(/{{workflow_id}}/g, `WKF-FLW-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{concept_goal}}/g, 'Exploration of strict command routing video concept')
    .replace(/{{scene_or_flow_prompt}}/g, 'Scene 1: Close up of keyboard. Operator types "gap hunter". Screen displays red validation warning and exits with code 1. Narrative voice says: exact name matching is not a bug; it is a parameter.')
    .replace(/{{asset_requirements}}/g, 'Terminal screenshots showing exact-name rejections.')
    .replace(/{{expected_output_type}}/g, '10-15 seconds storyboard video outline.')
    .replace(/{{local_system_boundary}}/g, 'Design recommendations only; no external video renderer calls.')
    .replace(/{{privacy_or_safety_note}}/g, 'Do not show prompt history containing passwords.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Stage video storyboard slide deck locally.');

  const flowOutPath = path.join(workflowsDir, `grinders_keep_flow_workflows_${dateStr}.md`);
  fs.writeFileSync(flowOutPath, flowWorkflow, 'utf-8');

  // Whisk Workflow
  const whiskTemplatePath = path.join(templatesDir, 'grinders-keep-whisk-workflow-template.md');
  let whiskTemplate = '';
  if (fs.existsSync(whiskTemplatePath)) {
    whiskTemplate = fs.readFileSync(whiskTemplatePath, 'utf-8');
  }
  let whiskWorkflow = whiskTemplate
    .replace(/{{workflow_id}}/g, `WKF-WHK-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{visual_goal}}/g, 'Generate cyberpunk supernova visual themes for social posts')
    .replace(/{{prompt_or_reference_need}}/g, 'Supernova neon blue and orange abstract terminal interface, cyberpunk digital mainframe backdrop, cinematic lighting.')
    .replace(/{{expected_output_type}}/g, 'PNG style template reference.')
    .replace(/{{local_system_boundary}}/g, 'Recommendation only; no Whisk API execution.')
    .replace(/{{privacy_or_safety_note}}/g, 'Visual assets must not contain private system diagrams.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Generate theme manually via local image prompt tool.');

  const whiskOutPath = path.join(workflowsDir, `grinders_keep_whisk_workflows_${dateStr}.md`);
  fs.writeFileSync(whiskOutPath, whiskWorkflow, 'utf-8');

  // Veo Workflow
  const veoTemplatePath = path.join(templatesDir, 'grinders-keep-veo-workflow-template.md');
  let veoTemplate = '';
  if (fs.existsSync(veoTemplatePath)) {
    veoTemplate = fs.readFileSync(veoTemplatePath, 'utf-8');
  }
  let veoWorkflow = veoTemplate
    .replace(/{{workflow_id}}/g, `WKF-VEO-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{video_goal}}/g, 'Cinematic representation of agent mesh pipeline')
    .replace(/{{prompt}}/g, 'High contrast visual loop showing glowing neon nodes transferring data package cubes through a virtual pipeline grid.')
    .replace(/{{suggested_duration}}/g, '6')
    .replace(/{{visual_style}}/g, 'Cyberpunk neon realism, dark mode, high cinematic density')
    .replace(/{{local_system_boundary}}/g, 'Manual prompt staging; no Veo model requests.')
    .replace(/{{privacy_or_safety_note}}/g, 'Do not upload coding file hierarchies.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Sketch layout slides manually.');

  const veoOutPath = path.join(workflowsDir, `grinders_keep_veo_workflows_${dateStr}.md`);
  fs.writeFileSync(veoOutPath, veoWorkflow, 'utf-8');

  // Antigravity Workflow
  const antigravityTemplatePath = path.join(templatesDir, 'grinders-keep-antigravity-workflow-template.md');
  let antigravityTemplate = '';
  if (fs.existsSync(antigravityTemplatePath)) {
    antigravityTemplate = fs.readFileSync(antigravityTemplatePath, 'utf-8');
  }
  let antigravityWorkflow = antigravityTemplate
    .replace(/{{workflow_id}}/g, `WKF-AGR-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{coding_goal}}/g, 'Stage next phase commands configuration and test script skeleton.')
    .replace(/{{one_time_prompt}}/g, 'Write a safe testing script that verifies the manual review intake parser gates.')
    .replace(/{{expected_files_or_outputs}}/g, 'tests/grinders_keep/intake_verification.test.ts')
    .replace(/{{exact_command_if_applicable}}/g, 'npm run command -- "grinders-keep-manual-intake"')
    .replace(/{{safety_constraints}}/g, 'Code must not mutate existing SYSTEM_STATUS parameters.')
    .replace(/{{local_system_boundary}}/g, 'Staged only inside developer workspace sandbox.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Run the compiled script against test fixtures.');

  const antigravityOutPath = path.join(workflowsDir, `grinders_keep_antigravity_workflows_${dateStr}.md`);
  fs.writeFileSync(antigravityOutPath, antigravityWorkflow, 'utf-8');

  // Drive, Docs, Sheets Workflow
  const driveTemplatePath = path.join(templatesDir, 'grinders-keep-drive-docs-sheets-workflow-template.md');
  let driveTemplate = '';
  if (fs.existsSync(driveTemplatePath)) {
    driveTemplate = fs.readFileSync(driveTemplatePath, 'utf-8');
  }
  let driveWorkflow = driveTemplate
    .replace(/{{workflow_id}}/g, `WKF-DDS-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{tool_category}}/g, 'Google Docs / Drive')
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{organization_goal}}/g, 'Manually export daily staged briefings into Google Doc folders for archival tracking')
    .replace(/{{suggested_folder_or_doc_structure}}/g, '- Folder: /Sentinel-OS-Archive/\n  - Sub-folder: /2026-06/\n    - Document: GK-Consensus-Review-Report-2026-06-01')
    .replace(/{{suggested_manual_fields}}/g, '1. Date, 2. Integrity score, 3. Top Gap description, 4. Commander Sign-off status.')
    .replace(/{{review_or_tracking_use}}/g, 'Provides a permanent cloud audit log accessible to operator from mobile devices.')
    .replace(/{{local_system_boundary}}/g, 'Copy document text manually; no direct Drive API tokens allowed.')
    .replace(/{{privacy_or_safety_note}}/g, 'Never auto-sync credentials files.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Export a single report manually to Google Docs.');

  const driveOutPath = path.join(workflowsDir, `grinders_keep_drive_docs_sheets_workflows_${dateStr}.md`);
  fs.writeFileSync(driveOutPath, driveWorkflow, 'utf-8');

  // YouTube and Google Vids Workflow
  const youtubeTemplatePath = path.join(templatesDir, 'grinders-keep-youtube-vids-workflow-template.md');
  let youtubeTemplate = '';
  if (fs.existsSync(youtubeTemplatePath)) {
    youtubeTemplate = fs.readFileSync(youtubeTemplatePath, 'utf-8');
  }
  let youtubeWorkflow = youtubeTemplate
    .replace(/{{workflow_id}}/g, `WKF-YTV-${dateStr}-01`)
    .replace(/{{linked_project_need}}/g, projectNeeds[0].need_id)
    .replace(/{{evidence_source}}/g, projectNeeds[0].evidence_source)
    .replace(/{{tool_category}}/g, 'YouTube / Google Vids')
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{video_or_publishing_goal}}/g, 'Draft title options and caption templates for manual uploads of building progress clips.')
    .replace(/{{title_or_outline_suggestion}}/g, 'Title: "Why exact command routing saves terminal pipelines"\nDescription: "An breakdown of why we locked our router to exact name matching."')
    .replace(/{{manual_review_steps}}/g, 'Verify caption details do not reference absolute paths of user directories.')
    .replace(/{{safety_or_claim_check}}/g, 'Strictly state that the video outlines are recommendations and drafts.')
    .replace(/{{local_system_boundary}}/g, 'Manual uploads only via developer account.')
    .replace(/{{smallest_useful_manual_test}}/g, 'Stage script in local drafts folder.');

  const youtubeOutPath = path.join(workflowsDir, `grinders_keep_youtube_vids_workflows_${dateStr}.md`);
  fs.writeFileSync(youtubeOutPath, youtubeWorkflow, 'utf-8');


  // --- 5. Google Ultra Scorecard ---
  console.log('4️⃣ Compiling Google Ultra Scorecard data...');
  const scorecardTemplatePath = path.join(templatesDir, 'grinders-keep-google-ultra-scorecard-template.md');
  let scorecardTemplate = '';
  if (fs.existsSync(scorecardTemplatePath)) {
    scorecardTemplate = fs.readFileSync(scorecardTemplatePath, 'utf-8');
  }

  const scorecardCandidates = [
    {
      rank: 1,
      tool_name: 'NotebookLM',
      linked_project_need: projectNeeds[0].need_id,
      opportunity_type: 'Manual Source-Grounded Document Review',
      project_fit_score_1_to_10: 10,
      ease_of_manual_test_score_1_to_10: 9,
      money_potential_score_1_to_10: 8,
      privacy_risk_score_1_to_10: 2,
      evidence_strength_score_1_to_10: 10,
      recommended_status: 'manual_test_now',
      reason: 'Perfect fit for verifying markdown files integrity without API risk.',
      commander_approval_required: true
    },
    {
      rank: 2,
      tool_name: 'Gemini',
      linked_project_need: projectNeeds[0].need_id,
      opportunity_type: 'Manual Prompt Audit and Wording Polish',
      project_fit_score_1_to_10: 9,
      ease_of_manual_test_score_1_to_10: 10,
      money_potential_score_1_to_10: 8,
      privacy_risk_score_1_to_10: 3,
      evidence_strength_score_1_to_10: 9,
      recommended_status: 'manual_test_now',
      reason: 'High usability for polishing narrative copy and checking router alias parameters.',
      commander_approval_required: true
    },
    {
      rank: 3,
      tool_name: 'Google Docs',
      linked_project_need: projectNeeds[0].need_id,
      opportunity_type: 'Document Archival Tracking',
      project_fit_score_1_to_10: 8,
      ease_of_manual_test_score_1_to_10: 8,
      money_potential_score_1_to_10: 5,
      privacy_risk_score_1_to_10: 2,
      evidence_strength_score_1_to_10: 8,
      recommended_status: 'manual_test_now',
      reason: 'Easy manual copy-paste to maintain local-first containment.',
      commander_approval_required: true
    },
    {
      rank: 4,
      tool_name: 'Veo',
      linked_project_need: projectNeeds[0].need_id,
      opportunity_type: 'Video Generation Concept Staging',
      project_fit_score_1_to_10: 6,
      ease_of_manual_test_score_1_to_10: 4,
      money_potential_score_1_to_10: 7,
      privacy_risk_score_1_to_10: 5,
      evidence_strength_score_1_to_10: 5,
      recommended_status: 'consider_later',
      reason: 'Staged prompts for video creation should await core engine stabilization.',
      commander_approval_required: true
    }
  ];

  let scorecardContent = `# Google Ultra Scorecard - ${dateStr}\n\n`;
  for (const item of scorecardCandidates) {
    let block = scorecardTemplate || JSON.stringify(item, null, 2);
    for (const [k, v] of Object.entries(item)) {
      block = block.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
    scorecardContent += block + '\n\n';
  }
  const scorecardOutPath = path.join(scorecardsDir, `grinders_keep_google_ultra_scorecard_${dateStr}.md`);
  fs.writeFileSync(scorecardOutPath, scorecardContent, 'utf-8');

  // --- 6. Recommended Next Actions ---
  console.log('5️⃣ Formulating Top 5 Recommended next actions...');
  const nextActionsTemplatePath = path.join(templatesDir, 'grinders-keep-google-ultra-next-actions-template.md');
  let nextActionsTemplate = '';
  if (fs.existsSync(nextActionsTemplatePath)) {
    nextActionsTemplate = fs.readFileSync(nextActionsTemplatePath, 'utf-8');
  }

  const nextActions = [
    {
      action_id: `ACT-12G-01`,
      action_name: 'Open NotebookLM and Upload Reports',
      linked_tool_or_workflow: `WKF-NLM-${dateStr}-01`,
      why_this_action: 'Perform manual source-grounded citation audit of system status reports.',
      smallest_safe_step: 'Upload GK-Consensus-Review-Report and verify citation nodes.',
      manual_tool_to_open_if_approved: 'Google NotebookLM Web Dashboard',
      expected_output: 'Grounding citations checklist verified.',
      blocker_if_any: 'None',
      approval_required: true
    },
    {
      action_id: `ACT-12G-02`,
      action_name: 'Manually Stage Google Doc Folder Structure',
      linked_tool_or_workflow: `WKF-DDS-${dateStr}-01`,
      why_this_action: 'Organize cloud-accessible mirror folders for Commander mobile tracking.',
      smallest_safe_step: 'Create manual Doc with GK-Consensus-Review-Report summary details.',
      manual_tool_to_open_if_approved: 'Google Drive Dashboard',
      expected_output: 'Manual doc link staged.',
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
  const nextActionsOutPath = path.join(outputDir, `grinders_keep_google_ultra_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextActionsOutPath, nextActionsContent, 'utf-8');

  // --- 7. Master report ---
  console.log('6️⃣ Writing master Google Ultra Report...');
  const reportTemplatePath = path.join(templatesDir, 'grinders-keep-google-ultra-report-template.md');
  let reportTemplate = '';
  if (fs.existsSync(reportTemplatePath)) {
    reportTemplate = fs.readFileSync(reportTemplatePath, 'utf-8');
  }

  const integrityScore = auditResults.consensusManifest.source_status === 'present' ? 10 : 7;

  let needsBlock = '';
  for (const nd of projectNeeds) {
    needsBlock += `### 📡 Need: ${nd.need_name} (${nd.need_id})\n`;
    needsBlock += `- Type: ${nd.need_type}\n`;
    needsBlock += `- Source: ${nd.evidence_source}\n`;
    needsBlock += `- Source Summary: ${nd.source_summary}\n`;
    needsBlock += `- Why it matters: ${nd.why_it_matters}\n`;
    needsBlock += `- Privacy boundary: ${nd.risk_or_constraint}\n`;
    needsBlock += `- Confidence: ${nd.confidence_score_1_to_10}/10\n\n`;
  }

  let finalReport = reportTemplate
    .replace(/{{date}}/g, dateStr)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{integrity_score}}/g, String(integrityScore))
    .replace(/{{total_needs_count}}/g, String(projectNeeds.length))
    .replace(/{{total_maps_count}}/g, String(toolMaps.length))
    .replace(/{{commander_approval_required}}/g, 'true')
    .replace(/{{project_needs_list}}/g, needsBlock)
    .replace(/{{recommended_next_actions}}/g, nextActionsContent);

  const mainReportOutPath = path.join(outputDir, `grinders_keep_google_ultra_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Google Ultra Report to: ${mainReportOutPath}`);

  // --- 8. Update Frontpage Section ---
  const frontpagePath = path.join(REPO_ROOT, 'outputs', 'grinders_keep', `grinders_keep_frontpage_${dateStr}.md`);
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');

    let contentBlock = `\n## 🚀 Google Ultra Opportunity Scanner Deepener\n`;
    contentBlock += `- **Top Project Need:** ${projectNeeds[0]?.need_name || 'None'}\n`;
    contentBlock += `- **Top Google Tool Opportunity:** ${toolMaps[0]?.suggested_google_tool || 'None'}\n`;
    contentBlock += `- **Top Manual Gemini Workflow:** WKF-GEM-${dateStr}-01\n`;
    contentBlock += `- **Top Manual NotebookLM Workflow:** WKF-NLM-${dateStr}-01\n`;
    contentBlock += `- **Top Manual Creative Video Workflow:** WKF-FLW-${dateStr}-01\n`;
    contentBlock += `- **Top Manual Antigravity Coding Workflow:** WKF-AGR-${dateStr}-01\n`;
    contentBlock += `- **Top Drive/Docs/Sheets Organization Workflow:** WKF-DDS-${dateStr}-01\n`;
    contentBlock += `- **Top YouTube or Google Vids Workflow:** WKF-YTV-${dateStr}-01\n`;
    contentBlock += `- **Google Ultra Scorecard Status:** Mapped (NotebookLM & Gemini rank highest)\n`;
    contentBlock += `- **Recommended Google Ultra Next Action:** ${nextActions[0]?.action_name || 'None'} (\`${nextActions[0]?.manual_tool_to_open_if_approved}\`)\n\n`;
    contentBlock += `### 📝 Commander Google Ultra Review Checklist\n`;
    contentBlock += `- [ ] Open NotebookLM Web Dashboard and upload GK-Consensus-Review-Report.\n`;
    contentBlock += `- [ ] Sign off on the suggested Doc folders structure mapping in Google Drive.\n`;
    contentBlock += `- [ ] Approve manual staging workflows and checklist targets before Phase 12H.\n`;

    if (frontpageContent.includes('## 🚀 Google Ultra Opportunity Scanner Deepener')) {
      const idx = frontpageContent.indexOf('## 🚀 Google Ultra Opportunity Scanner Deepener');
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

  // --- 9. Write JSON Manifest ---
  const jsonManifest = {
    date: dateStr,
    timestamp,
    total_needs_count: projectNeeds.length,
    project_needs: projectNeeds,
    audit_results: auditResults,
    tool_maps: toolMaps,
    workflows: {
      gemini: geminiOutPath,
      notebooklm: nlmOutPath,
      flow: flowOutPath,
      whisk: whiskOutPath,
      veo: veoOutPath,
      antigravity: antigravityOutPath,
      drive_docs_sheets: driveOutPath,
      youtube_vids: youtubeOutPath
    },
    evaluation: {
      scorecard: scorecardOutPath,
      next_actions: nextActionsOutPath
    }
  };

  const jsonManifestPath = path.join(outputDir, `grinders_keep_google_ultra_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved Google Ultra JSON Manifest to: ${jsonManifestPath}`);

  // Update log
  logContent += `\n## Output Generated Files:\n`;
  logContent += `- Summary Report: ${mainReportOutPath}\n`;
  logContent += `- Google Tool Map: ${toolMapOutPath}\n`;
  logContent += `- Gemini Workflows: ${geminiOutPath}\n`;
  logContent += `- NotebookLM Workflows: ${nlmOutPath}\n`;
  logContent += `- Flow Workflows: ${flowOutPath}\n`;
  logContent += `- Whisk Workflows: ${whiskOutPath}\n`;
  logContent += `- Veo Workflows: ${veoOutPath}\n`;
  logContent += `- Antigravity Workflows: ${antigravityOutPath}\n`;
  logContent += `- Drive, Docs, Sheets Workflows: ${driveOutPath}\n`;
  logContent += `- YouTube & Vids Workflows: ${youtubeOutPath}\n`;
  logContent += `- Google Ultra Scorecard: ${scorecardOutPath}\n`;
  logContent += `- Next Actions: ${nextActionsOutPath}\n`;
  logContent += `- JSON Manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved execution log to: ${logFile}`);

  await announceCompletion("Grinders Keep Google Ultra opportunity scanning complete", "10");
}

runGoogleUltraScanner().catch(err => {
  console.error(`Fatal runtime error: ${err}`);
  process.exit(1);
});
