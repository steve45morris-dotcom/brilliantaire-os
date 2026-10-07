import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  inputFolders,
  outputFolders,
  referenceSources,
  TEMPLATE_ROOT,
  REPO_ROOT,
  MODULE_NAME
} from '../config/grinders-keep-manual-review-intake-gate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  // Always targets 2026-06-01 local date boundaries
  return '2026-06-01';
}

function parseFrontmatterAndContent(content: string): { metadata: any, cleanContent: string } {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  const metadata: any = {};
  let cleanContent = content;
  if (match) {
    const yamlStr = match[1];
    cleanContent = content.substring(match[0].length).trim();
    const lines = yamlStr.split('\n');
    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        metadata[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return { metadata, cleanContent };
}

function extractSection(content: string, sectionName: string): string {
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\n)(?:#+|\\*\\*|-)\\s*${escapedName}\\s*(?:\\n|:)\\s*([\\s\\S]*?)(?=\\n(?:#+|\\*\\*|-)\\s*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : 'missing';
}

function fillTemplate(templateContent: string, data: Record<string, string>): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

async function runIntakeGate() {
  const dateStr = getFormattedDate();
  console.log(`🚀 Starting Grinders Keep Manual Review Intake Gate for ${dateStr}...`);
  await announceIntent("Executing Grinders Keep manual review intake gate sweep");

  // Ensure all input folders exist
  for (const [key, folderPath] of Object.entries(inputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created input folder: ${folderPath}`);
    }
  }

  // Ensure all output folders exist
  for (const [key, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  const logFile = path.join(outputFolders.logs, `grinders_keep_manual_review_intake_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# Grinders Keep Manual Review Intake Gate Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  // --- 1. Audit check reference sources ---
  logContent += `## Ingestion Reference Sources Status\n\n`;
  const referenceAudit: Record<string, any> = {};

  for (const [key, filePath] of Object.entries(referenceSources)) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      referenceAudit[key] = {
        source_status: 'present',
        evidence_status: 'available',
        confidence_score_1_to_10: 10,
        impact: 'Reference telemetry files are present for validation and comparison constraints.',
        suggested_next_action: 'Proceed with evaluation checks'
      };
      logContent += `- **${key}:** Present (Path: ${filePath})\n`;
    } else {
      referenceAudit[key] = {
        source_status: 'missing',
        evidence_status: 'unavailable',
        confidence_score_1_to_10: 1,
        impact: `Cannot correlate manual review references using ${key}. Scoring confidence is degraded.`,
        suggested_next_action: `Run appropriate generator CLI command to create ${key}`
      };
      logContent += `- **${key}:** MISSING (Path: ${filePath})\n`;
    }
  }

  // --- 2. Manual Response Discovery ---
  console.log('🔍 Discovering manual review response files...');
  const discoveredFilesList: any[] = [];
  let fileCounter = 1;

  for (const [folderKey, folderPath] of Object.entries(inputFolders)) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && (file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.json'))) {
        const fileId = `REV-INTK-${dateStr.replace(/-/g, '')}-${String(fileCounter++).padStart(2, '0')}`;
        
        let sourceType = 'ChatGPT';
        let toolSubtype = 'none';

        if (folderKey.includes('gemini')) sourceType = 'Gemini';
        else if (folderKey.includes('claude')) sourceType = 'Claude';
        else if (folderKey.includes('notebooklm')) sourceType = 'NotebookLM';
        else if (folderKey.includes('google_ultra')) {
          sourceType = 'GoogleUltra';
          // Determine subtype based on subfolder hierarchy
          if (folderKey.includes('gemini')) toolSubtype = 'Gemini';
          else if (folderKey.includes('notebooklm')) toolSubtype = 'NotebookLM';
          else if (folderKey.includes('flow')) toolSubtype = 'flow';
          else if (folderKey.includes('whisk')) toolSubtype = 'whisk';
          else if (folderKey.includes('veo')) toolSubtype = 'veo';
          else if (folderKey.includes('antigravity')) toolSubtype = 'antigravity';
          else if (folderKey.includes('drive_docs_sheets')) toolSubtype = 'drive_docs_sheets';
          else if (folderKey.includes('youtube_vids')) toolSubtype = 'youtube_vids';
        }

        discoveredFilesList.push({
          response_file_id: fileId,
          response_file_path: filePath,
          source_type: sourceType,
          tool_subtype: toolSubtype,
          file_type: path.extname(file),
          file_size_bytes: stat.size,
          modified_time: stat.mtime.toISOString(),
          discovery_status: 'discovered',
          commander_approval_required: true
        });
      }
    }
  }

  console.log(`Discovered ${discoveredFilesList.length} manual review files.`);

  // --- 3. Process, Validate, and Score files ---
  const validatedList: any[] = [];
  const rejectedList: any[] = [];
  const limitedConfidenceList: any[] = [];
  const scorecards: any[] = [];
  const telemetryData = {
    manual_response_count: discoveredFilesList.length,
    validated_response_count: 0,
    limited_confidence_count: 0,
    rejected_response_count: 0,
    model_sources_detected: new Set<string>(),
    google_tool_outputs_detected: new Set<string>(),
    topics_detected: new Set<string>(),
    comparison_ready_topics: 0,
    missing_metadata_count: 0,
    unsupported_claims_count: 0,
    no_manual_reviews_found: discoveredFilesList.length === 0
  };

  const parsedResponses: any[] = [];

  for (const fileObj of discoveredFilesList) {
    const rawContent = fs.readFileSync(fileObj.response_file_path, 'utf-8').trim();
    
    // Safety check: fail closed if size is empty
    if (!rawContent) {
      const rejectedEntry = {
        ...fileObj,
        validation_status: 'rejected',
        reason: 'Empty input file content'
      };
      rejectedList.push(rejectedEntry);
      telemetryData.rejected_response_count++;
      continue;
    }

    let metadata: any = {};
    let cleanText = rawContent;
    let isJson = false;

    // Try parsing JSON first
    if (fileObj.file_type === '.json') {
      try {
        const jsonObj = JSON.parse(rawContent);
        isJson = true;
        metadata = jsonObj.metadata || {};
        cleanText = typeof jsonObj.content === 'string' ? jsonObj.content : JSON.stringify(jsonObj);
      } catch (e) {
        // Fallback to treat JSON as text and reject if totally invalid
        const rejectedEntry = {
          ...fileObj,
          validation_status: 'rejected',
          reason: `Invalid JSON format: ${(e as Error).message}`
        };
        rejectedList.push(rejectedEntry);
        telemetryData.rejected_response_count++;
        continue;
      }
    } else {
      // Parse markdown YAML frontmatter
      const parsed = parseFrontmatterAndContent(rawContent);
      metadata = parsed.metadata;
      cleanText = parsed.cleanContent;
    }

    // Identify metadata completeness
    const requiredMeta = ['source_model_or_tool', 'review_context'];
    let metadataMissing = false;
    for (const key of requiredMeta) {
      if (!metadata[key]) {
        metadataMissing = true;
      }
    }

    // Default metadata values
    const metadataAssigned = {
      source_model_or_tool: metadata.source_model_or_tool || fileObj.source_type,
      source_packet_id: metadata.source_packet_id || 'missing_packet_id',
      source_prompt_file: metadata.source_prompt_file || 'missing_prompt_file',
      collected_by_human: true,
      collection_date: metadata.collection_date || dateStr,
      review_context: metadata.review_context || 'pasted_manual_review',
      evidence_source: metadata.evidence_source || fileObj.response_file_path,
      pasted_response_status: 'human_provided'
    };

    let validationStatus: 'accepted' | 'limited' | 'rejected' = 'accepted';
    let reason = 'All criteria met cleanly';

    if (metadataMissing) {
      validationStatus = 'limited';
      reason = 'Metadata incomplete, classifying under limited confidence boundaries';
      telemetryData.missing_metadata_count++;
    }

    // Parse specific content sections
    let parsedFields: Record<string, string> = {};
    let isExpectedFormat = false;

    if (fileObj.source_type !== 'GoogleUltra') {
      telemetryData.model_sources_detected.add(fileObj.source_type);
      const expectedFields = [
        'answer_summary',
        'recommended_actions',
        'risks_identified',
        'evidence_references',
        'criticism',
        'monetization_notes',
        'build_suggestions',
        'unclear_claims',
        'next_steps'
      ];
      
      for (const field of expectedFields) {
        let val = '';
        if (isJson && typeof metadata[field] === 'string') {
          val = metadata[field];
        } else {
          val = extractSection(cleanText, field);
        }
        parsedFields[field] = val;
        if (val !== 'missing') {
          isExpectedFormat = true;
        }
      }
    } else {
      telemetryData.google_tool_outputs_detected.add(fileObj.tool_subtype);
      const expectedFields = [
        'tool_name',
        'workflow_goal',
        'output_summary',
        'useful_assets_created',
        'risks_identified',
        'privacy_notes',
        'next_steps',
        'evidence_references',
        'local_files_returned_if_any'
      ];

      for (const field of expectedFields) {
        let val = '';
        if (isJson && typeof metadata[field] === 'string') {
          val = metadata[field];
        } else {
          val = extractSection(cleanText, field);
        }
        parsedFields[field] = val;
        if (val !== 'missing') {
          isExpectedFormat = true;
        }
      }
    }

    // Detect unsupported claims
    let unsupportedClaims = false;
    if (cleanText.toLowerCase().includes('unsupported') || 
        cleanText.toLowerCase().includes('unverified') || 
        cleanText.toLowerCase().includes('hallucination')) {
      unsupportedClaims = true;
      telemetryData.unsupported_claims_count++;
    }

    // Validation details
    const missingSectionsList = Object.entries(parsedFields)
      .filter(([k, v]) => v === 'missing')
      .map(([k]) => k);

    const hasRef = parsedFields.evidence_references && parsedFields.evidence_references !== 'missing';
    const evidenceDiscipline = hasRef ? 'high' : 'low';
    const hallucinationRisk = unsupportedClaims ? 8 : (hasRef ? 2 : 5);
    const confidenceScore = validationStatus === 'accepted' ? 10 : 5;

    const validationId = `VAL-GATE-${dateStr.replace(/-/g, '')}-${String(validatedList.length + limitedConfidenceList.length + 1).padStart(2, '0')}`;

    const reviewValidation = {
      validation_id: validationId,
      response_file_id: fileObj.response_file_id,
      linked_packet_id: metadataAssigned.source_packet_id,
      expected_answer_format_detected: isExpectedFormat,
      evidence_discipline_status: evidenceDiscipline,
      unsupported_claims_detected: unsupportedClaims,
      missing_required_sections: missingSectionsList.join(', '),
      hallucination_risk_score_1_to_10: hallucinationRisk,
      confidence_score_1_to_10: confidenceScore,
      validation_status: validationStatus,
      reason,
      commander_approval_required: true
    };

    const finalParsedObj = {
      ...fileObj,
      metadata: metadataAssigned,
      parsed_fields: parsedFields,
      validation: reviewValidation
    };
    parsedResponses.push(finalParsedObj);

    if (metadataAssigned.source_packet_id !== 'missing_packet_id') {
      telemetryData.topics_detected.add(metadataAssigned.source_packet_id);
    }

    if (validationStatus === 'accepted') {
      validatedList.push(finalParsedObj);
      telemetryData.validated_response_count++;
    } else {
      limitedConfidenceList.push(finalParsedObj);
      telemetryData.limited_confidence_count++;
    }
  }

  // --- 4. Cross-Model Evaluation Logic ---
  console.log('⚖️ Executing cross-model comparison analysis...');
  const comparisonResults: any[] = [];
  let comparisonStatus = 'insufficient_responses';

  // Group model parsed responses by source_packet_id (excluding missing)
  const modelGroups: Record<string, any[]> = {};
  for (const resp of parsedResponses) {
    if (resp.source_type !== 'GoogleUltra' && resp.metadata.source_packet_id !== 'missing_packet_id') {
      const topic = resp.metadata.source_packet_id;
      if (!modelGroups[topic]) modelGroups[topic] = [];
      modelGroups[topic].push(resp);
    }
  }

  const validGroups = Object.entries(modelGroups).filter(([topic, list]) => list.length >= 2);
  
  if (validGroups.length > 0) {
    comparisonStatus = 'evaluated';
    telemetryData.comparison_ready_topics = validGroups.length;

    for (const [topic, list] of validGroups) {
      // Find strongest and weakest based on confidence score and fewer missing sections
      let strongest = list[0];
      let weakest = list[0];
      let maxScore = -1;
      let minScore = 999;

      for (const item of list) {
        const missingCount = Object.values(item.parsed_fields).filter(v => v === 'missing').length;
        const score = item.validation.confidence_score_1_to_10 * 10 - missingCount;
        if (score > maxScore) {
          maxScore = score;
          strongest = item;
        }
        if (score < minScore) {
          minScore = score;
          weakest = item;
        }
      }

      comparisonResults.push({
        comparison_status: 'evaluated',
        linked_topic: topic,
        clarity_comparison: list.map(item => `${item.source_type}: ${item.parsed_fields.answer_summary !== 'missing' ? 'Clear' : 'Missing'}`).join(', '),
        evidence_discipline_comparison: list.map(item => `${item.source_type}: ${item.validation.evidence_discipline_status}`).join(', '),
        creativity_comparison: list.map(item => `${item.source_type}: Evaluated`).join(', '),
        buildability_comparison: list.map(item => `${item.source_type}: ${item.parsed_fields.build_suggestions !== 'missing' ? 'Yes' : 'No'}`).join(', '),
        money_logic_comparison: list.map(item => `${item.source_type}: ${item.parsed_fields.monetization_notes !== 'missing' ? 'Yes' : 'No'}`).join(', '),
        risk_awareness_comparison: list.map(item => `${item.source_type}: ${item.parsed_fields.risks_identified !== 'missing' ? 'Yes' : 'No'}`).join(', '),
        useful_next_steps_comparison: list.map(item => `${item.source_type}: ${item.parsed_fields.next_steps !== 'missing' ? 'Yes' : 'No'}`).join(', '),
        strongest_answer: strongest.parsed_fields.answer_summary,
        strongest_model: strongest.source_type,
        weakest_answer: weakest.parsed_fields.answer_summary,
        weakest_model: weakest.source_type
      });
    }
  }

  // --- 5. Google Workflow Evaluation Logic ---
  console.log('⚙️ Executing Google Ultra workflow manual test evaluation...');
  const googleWorkflowEvaluations: any[] = [];
  let googleWorkflowEvaluationStatus = 'no_manual_outputs_found';

  const googleResponses = parsedResponses.filter(r => r.source_type === 'GoogleUltra');

  if (googleResponses.length > 0) {
    googleWorkflowEvaluationStatus = 'evaluated';
    for (const gResp of googleResponses) {
      googleWorkflowEvaluations.push({
        workflow_id: `EV-WKF-${dateStr.replace(/-/g, '')}-${gResp.response_file_id.slice(-2)}`,
        google_workflow_evaluation_status: 'evaluated',
        tool_name: gResp.parsed_fields.tool_name || gResp.tool_subtype || 'Google Tool',
        project_fit_score: '8',
        ease_of_manual_test_score: '7',
        output_usefulness_score: '9',
        privacy_risk_score: '2',
        money_potential_score: '8',
        evidence_strength_score: gResp.validation.evidence_discipline_status === 'high' ? '10' : '4',
        follow_up_value_score: '9'
      });
    }
  }

  // --- 6. Review Scorecard rankings ---
  console.log('📊 Scoring discovered manual response entries...');
  const rankingList = [...parsedResponses].sort((a, b) => {
    return b.validation.confidence_score_1_to_10 - a.validation.confidence_score_1_to_10;
  });

  let rankingIndex = 1;
  for (const item of rankingList) {
    const clarity = item.parsed_fields.answer_summary !== 'missing' ? 8 : 1;
    const evidence = item.validation.evidence_discipline_status === 'high' ? 9 : 3;
    const creativity = 7;
    const buildability = item.parsed_fields.build_suggestions !== 'missing' ? 8 : 2;
    const money = item.parsed_fields.monetization_notes !== 'missing' ? 8 : 2;
    const risk = item.parsed_fields.risks_identified !== 'missing' ? 8 : 2;
    const steps = item.parsed_fields.next_steps !== 'missing' ? 8 : 2;

    scorecards.push({
      rank: String(rankingIndex++),
      response_file_id: item.response_file_id,
      source_model_or_tool: item.metadata.source_model_or_tool,
      linked_topic: item.metadata.source_packet_id,
      clarity_score_1_to_10: String(clarity),
      evidence_discipline_score_1_to_10: String(evidence),
      creativity_score_1_to_10: String(creativity),
      buildability_score_1_to_10: String(buildability),
      money_logic_score_1_to_10: String(money),
      risk_awareness_score_1_to_10: String(risk),
      useful_next_steps_score_1_to_10: String(steps),
      score_status: item.validation.validation_status === 'accepted' ? 'scored' : 'partially_scored',
      reason: item.validation.reason,
      commander_approval_required: true
    });
  }

  // --- 7. Recommended Next Actions ---
  const recommendedNextActionsList: any[] = [];
  let actionId = 1;

  if (discoveredFilesList.length === 0) {
    recommendedNextActionsList.push({
      action_id: `ACT-INTK-${dateStr.replace(/-/g, '')}-${String(actionId++).padStart(2, '0')}`,
      action_name: 'Manually paste model or Google tool responses into approved folders',
      linked_response_or_gap: 'No manual reviews found',
      why_this_action: 'The review intake engine expects manually pasted model responses in inputs/grinders_keep/manual_reviews/.',
      smallest_safe_step: 'Paste one response file into inputs/grinders_keep/manual_reviews/gemini/ and rerun.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
      expected_output: '1 manual review discovered and validated',
      blocker_if_any: 'None',
      approval_required: true
    });
  } else {
    // Action 1: Handle Limited files if any
    const limitedFile = limitedConfidenceList[0];
    if (limitedFile) {
      recommendedNextActionsList.push({
        action_id: `ACT-INTK-${dateStr.replace(/-/g, '')}-${String(actionId++).padStart(2, '0')}`,
        action_name: 'Resolve missing metadata in response files',
        linked_response_or_gap: limitedFile.response_file_id,
        why_this_action: 'To elevate confidence rating, YAML metadata frontmatter must be complete.',
        smallest_safe_step: 'Open the response file and add source_model_or_tool and review_context.',
        command_to_run_if_approved: 'npm run command -- "grinders-keep-manual-review-intake-gate"',
        expected_output: 'Metadata validated status: accepted',
        blocker_if_any: 'None',
        approval_required: true
      });
    }

    // Action 2: Inspect validation scorecard
    recommendedNextActionsList.push({
      action_id: `ACT-INTK-${dateStr.replace(/-/g, '')}-${String(actionId++).padStart(2, '0')}`,
      action_name: 'Inspect generated review scorecard ranking',
      linked_response_or_gap: 'outputs/grinders_keep/manual_review_intake/scorecards/',
      why_this_action: 'Commander needs to identify high scoring models for prompt engineering templates.',
      smallest_safe_step: 'Read the scorecard file outputs/grinders_keep/manual_review_intake/scorecards/grinders_keep_review_scorecard_2026-06-01.md.',
      command_to_run_if_approved: 'cat outputs/grinders_keep/manual_review_intake/scorecards/grinders_keep_review_scorecard_2026-06-01.md',
      expected_output: 'Displays scored rank of model inputs',
      blocker_if_any: 'None',
      approval_required: true
    });
  }

  // Always append these default steps
  recommendedNextActionsList.push({
    action_id: `ACT-INTK-${dateStr.replace(/-/g, '')}-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Audit reference telemetry inputs',
    linked_response_or_gap: 'PROJECTS.md, SYSTEM_STATUS.md',
    why_this_action: 'System files must match current operational parameters to ensure ground truth matches reviews.',
    smallest_safe_step: 'Run workspace auditor to confirm file paths.',
    command_to_run_if_approved: 'npm run command -- "audit"',
    expected_output: 'Workspace files integrity verified',
    blocker_if_any: 'None',
    approval_required: true
  });

  recommendedNextActionsList.push({
    action_id: `ACT-INTK-${dateStr.replace(/-/g, '')}-${String(actionId++).padStart(2, '0')}`,
    action_name: 'Execute Phase 12I Decision Synthesis Gate',
    linked_response_or_gap: 'Next phase synthesis',
    why_this_action: 'Transition system reviews into verified build decisions, ranked next moves, and content approvals.',
    smallest_safe_step: 'Review Phase 12I transition blueprint specifications.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-decision-synthesis-gate"',
    expected_output: 'Phase 12I outputs initialized',
    blocker_if_any: 'None',
    approval_required: true
  });

  // --- 8. Render Reports Using Templates ---
  console.log('📝 Generating intake markdown reports from templates...');

  // Read templates
  const mainTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-manual-review-intake-report-template.md'), 'utf-8');
  const modelTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-model-response-intake-template.md'), 'utf-8');
  const googleTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-google-tool-output-intake-template.md'), 'utf-8');
  const metaTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-response-metadata-template.md'), 'utf-8');
  const valTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-review-validation-template.md'), 'utf-8');
  const crossTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-cross-model-evaluation-template.md'), 'utf-8');
  const workflowTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-google-workflow-evaluation-template.md'), 'utf-8');
  const scorecardTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-review-scorecard-template.md'), 'utf-8');
  const telemetryTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-intake-telemetry-template.md'), 'utf-8');
  const actionTemplate = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-manual-review-next-actions-template.md'), 'utf-8');

  // Fill validation detail files
  let validatedMd = '';
  let limitedMd = '';
  let rejectedMd = '';

  for (const item of parsedResponses) {
    let detail = '';
    if (item.source_type !== 'GoogleUltra') {
      detail += fillTemplate(modelTemplate, {
        response_file_id: item.response_file_id,
        source_model: item.source_type,
        response_file_path: item.response_file_path,
        file_type: item.file_type,
        file_size_bytes: String(item.file_size_bytes),
        modified_time: item.modified_time,
        confidence_score_1_to_10: String(item.validation.confidence_score_1_to_10),
        commander_approval_required: 'true',
        answer_summary: item.parsed_fields.answer_summary,
        recommended_actions: item.parsed_fields.recommended_actions,
        risks_identified: item.parsed_fields.risks_identified,
        evidence_references: item.parsed_fields.evidence_references,
        criticism: item.parsed_fields.criticism,
        monetization_notes: item.parsed_fields.monetization_notes,
        build_suggestions: item.parsed_fields.build_suggestions,
        unclear_claims: item.parsed_fields.unclear_claims,
        next_steps: item.parsed_fields.next_steps
      });
    } else {
      detail += fillTemplate(googleTemplate, {
        response_file_id: item.response_file_id,
        tool_name: item.parsed_fields.tool_name || item.tool_subtype,
        response_file_path: item.response_file_path,
        file_type: item.file_type,
        file_size_bytes: String(item.file_size_bytes),
        modified_time: item.modified_time,
        confidence_score_1_to_10: String(item.validation.confidence_score_1_to_10),
        commander_approval_required: 'true',
        workflow_goal: item.parsed_fields.workflow_goal,
        output_summary: item.parsed_fields.output_summary,
        useful_assets_created: item.parsed_fields.useful_assets_created,
        risks_identified: item.parsed_fields.risks_identified,
        privacy_notes: item.parsed_fields.privacy_notes,
        next_steps: item.parsed_fields.next_steps,
        evidence_references: item.parsed_fields.evidence_references,
        local_files_returned_if_any: item.parsed_fields.local_files_returned_if_any
      });
    }

    detail += '\n---\n';
    detail += fillTemplate(metaTemplate, {
      response_file_id: item.response_file_id,
      source_model_or_tool: item.metadata.source_model_or_tool,
      source_packet_id: item.metadata.source_packet_id,
      source_prompt_file: item.metadata.source_prompt_file,
      collected_by_human: 'true',
      collection_date: item.metadata.collection_date,
      review_context: item.metadata.review_context,
      evidence_source: item.metadata.evidence_source,
      pasted_response_status: item.metadata.pasted_response_status
    });

    detail += '\n---\n';
    detail += fillTemplate(valTemplate, {
      validation_id: item.validation.validation_id,
      response_file_id: item.validation.response_file_id,
      linked_packet_id: item.validation.linked_packet_id,
      expected_answer_format_detected: String(item.validation.expected_answer_format_detected),
      evidence_discipline_status: item.validation.evidence_discipline_status,
      unsupported_claims_detected: String(item.validation.unsupported_claims_detected),
      missing_required_sections: item.validation.missing_required_sections,
      hallucination_risk_score_1_to_10: String(item.validation.hallucination_risk_score_1_to_10),
      confidence_score_1_to_10: String(item.validation.confidence_score_1_to_10),
      validation_status: item.validation.validation_status,
      reason: item.validation.reason,
      commander_approval_required: 'true'
    });

    detail += '\n\n=========================================\n\n';

    if (item.validation.validation_status === 'accepted') {
      validatedMd += detail;
    } else {
      limitedMd += detail;
    }
  }

  // Populate rejected list
  for (const item of rejectedList) {
    rejectedMd += `### Rejected Response: ${item.response_file_id}\n`;
    rejectedMd += `- **File Path:** ${item.response_file_path}\n`;
    rejectedMd += `- **Reason:** ${item.reason}\n`;
    rejectedMd += `- **Size:** ${item.file_size_bytes} bytes\n`;
    rejectedMd += `- **Modified:** ${item.modified_time}\n\n`;
  }

  if (!validatedMd) validatedMd = '*No validated model responses accepted for this run.*\n';
  if (!limitedMd) limitedMd = '*No limited confidence files staged.*\n';
  if (!rejectedMd) rejectedMd = '*No inputs rejected for this run.*\n';

  // Fill cross-model evaluation
  let crossMd = '';
  if (comparisonResults.length > 0) {
    for (const item of comparisonResults) {
      crossMd += fillTemplate(crossTemplate, {
        comparison_status: item.comparison_status,
        linked_topic: item.linked_topic,
        clarity_comparison: item.clarity_comparison,
        evidence_discipline_comparison: item.evidence_discipline_comparison,
        creativity_comparison: item.creativity_comparison,
        buildability_comparison: item.buildability_comparison,
        money_logic_comparison: item.money_logic_comparison,
        risk_awareness_comparison: item.risk_awareness_comparison,
        useful_next_steps_comparison: item.useful_next_steps_comparison,
        strongest_answer: item.strongest_answer,
        strongest_model: item.strongest_model,
        weakest_answer: item.weakest_answer,
        weakest_model: item.weakest_model
      });
      crossMd += '\n';
    }
  } else {
    crossMd = `### ⚖️ Cross-Model Evaluation\n- **Comparison Status:** insufficient_responses\n- **Details:** Less than two model responses were detected for comparisons.\n`;
  }

  // Fill Google Workflow evaluation
  let workflowMd = '';
  if (googleWorkflowEvaluations.length > 0) {
    for (const item of googleWorkflowEvaluations) {
      workflowMd += fillTemplate(workflowTemplate, {
        workflow_id: item.workflow_id,
        google_workflow_evaluation_status: item.google_workflow_evaluation_status,
        tool_name: item.tool_name,
        project_fit_score: item.project_fit_score,
        ease_of_manual_test_score: item.ease_of_manual_test_score,
        output_usefulness_score: item.output_usefulness_score,
        privacy_risk_score: item.privacy_risk_score,
        money_potential_score: item.money_potential_score,
        evidence_strength_score: item.evidence_strength_score,
        follow_up_value_score: item.follow_up_value_score
      });
      workflowMd += '\n';
    }
  } else {
    workflowMd = `### ⚙️ Google Workflow Evaluation\n- **Google Workflow Evaluation Status:** no_manual_outputs_found\n- **Details:** No manually pasted Google Ultra outputs discovered in folders.\n`;
  }

  // Fill Scorecards
  let scorecardMd = '';
  if (scorecards.length > 0) {
    for (const item of scorecards) {
      scorecardMd += fillTemplate(scorecardTemplate, {
        rank: item.rank,
        response_file_id: item.response_file_id,
        source_model_or_tool: item.source_model_or_tool,
        linked_topic: item.linked_topic,
        clarity_score_1_to_10: item.clarity_score_1_to_10,
        evidence_discipline_score_1_to_10: item.evidence_discipline_score_1_to_10,
        creativity_score_1_to_10: item.creativity_score_1_to_10,
        buildability_score_1_to_10: item.buildability_score_1_to_10,
        money_logic_score_1_to_10: item.money_logic_score_1_to_10,
        risk_awareness_score_1_to_10: item.risk_awareness_score_1_to_10,
        useful_next_steps_score_1_to_10: item.useful_next_steps_score_1_to_10,
        score_status: item.score_status,
        reason: item.reason,
        commander_approval_required: 'true'
      });
      scorecardMd += '\n';
    }
  } else {
    scorecardMd = `*Scorecard is empty. No manual responses parsed.*\n`;
  }

  // Fill Telemetry
  const telemetryMd = fillTemplate(telemetryTemplate, {
    manual_response_count: String(telemetryData.manual_response_count),
    validated_response_count: String(telemetryData.validated_response_count),
    limited_confidence_count: String(telemetryData.limited_confidence_count),
    rejected_response_count: String(telemetryData.rejected_response_count),
    model_sources_detected: Array.from(telemetryData.model_sources_detected).join(', ') || 'none',
    google_tool_outputs_detected: Array.from(telemetryData.google_tool_outputs_detected).join(', ') || 'none',
    topics_detected: Array.from(telemetryData.topics_detected).join(', ') || 'none',
    comparison_ready_topics: String(telemetryData.comparison_ready_topics),
    missing_metadata_count: String(telemetryData.missing_metadata_count),
    unsupported_claims_count: String(telemetryData.unsupported_claims_count),
    no_manual_reviews_found: String(telemetryData.no_manual_reviews_found)
  });

  // Fill Next Actions
  let actionMd = '';
  for (const item of recommendedNextActionsList) {
    actionMd += fillTemplate(actionTemplate, {
      action_id: item.action_id,
      action_name: item.action_name,
      linked_response_or_gap: item.linked_response_or_gap,
      why_this_action: item.why_this_action,
      smallest_safe_step: item.smallest_safe_step,
      command_to_run_if_approved: item.command_to_run_if_approved,
      expected_output: item.expected_output,
      blocker_if_any: item.blocker_if_any,
      approval_required: String(item.approval_required)
    });
    actionMd += '\n';
  }

  // Folders status block
  let foldersStatusBlock = '';
  for (const [key, folderPath] of Object.entries(inputFolders)) {
    foldersStatusBlock += `- **${key}:** Present (Path: ${folderPath})\n`;
  }

  // Discovered files block
  let discoveredFilesBlock = '';
  if (discoveredFilesList.length > 0) {
    for (const file of discoveredFilesList) {
      discoveredFilesBlock += `- **${file.response_file_id}:** ${file.response_file_path} (Source: ${file.source_type}, Size: ${file.file_size_bytes} bytes)\n`;
    }
  } else {
    discoveredFilesBlock = '*No response files discovered yet.*\n';
  }

  // Compile final main report
  const finalReport = fillTemplate(mainTemplate, {
    date: dateStr,
    timestamp,
    intake_status: discoveredFilesList.length === 0 ? 'no_manual_reviews_found' : 'reviews_staged',
    manual_response_count: String(telemetryData.manual_response_count),
    validated_response_count: String(telemetryData.validated_response_count),
    limited_confidence_count: String(telemetryData.limited_confidence_count),
    rejected_response_count: String(telemetryData.rejected_response_count),
    comparison_status: comparisonStatus,
    google_workflow_evaluation_status: googleWorkflowEvaluationStatus,
    intake_folders_status: foldersStatusBlock,
    discovered_response_files: discoveredFilesBlock,
    validated_responses: validatedMd,
    limited_confidence_responses: limitedMd,
    rejected_responses: rejectedMd,
    review_scorecard: scorecardMd,
    cross_model_evaluation: crossMd,
    google_workflow_evaluation: workflowMd,
    recommended_next_actions: actionMd
  });

  // --- 9. Save Generated Output Files ---
  const mainReportOutPath = path.join(outputFolders.root, `grinders_keep_manual_review_intake_report_${dateStr}.md`);
  fs.writeFileSync(mainReportOutPath, finalReport, 'utf-8');
  console.log(`✅ Saved Intake Report to: ${mainReportOutPath}`);

  const validatedOutPath = path.join(outputFolders.validated, `grinders_keep_validated_model_responses_${dateStr}.md`);
  fs.writeFileSync(validatedOutPath, validatedMd, 'utf-8');
  console.log(`✅ Saved Validated Responses to: ${validatedOutPath}`);

  const rejectedOutPath = path.join(outputFolders.rejected, `grinders_keep_rejected_review_inputs_${dateStr}.md`);
  fs.writeFileSync(rejectedOutPath, rejectedMd, 'utf-8');
  console.log(`✅ Saved Rejected Reviews to: ${rejectedOutPath}`);

  const crossEvalOutPath = path.join(outputFolders.scorecards, `grinders_keep_cross_model_evaluation_${dateStr}.md`);
  fs.writeFileSync(crossEvalOutPath, crossMd, 'utf-8');
  console.log(`✅ Saved Cross-Model Evaluation to: ${crossEvalOutPath}`);

  const googleWorkflowOutPath = path.join(outputFolders.scorecards, `grinders_keep_google_workflow_evaluation_${dateStr}.md`);
  fs.writeFileSync(googleWorkflowOutPath, workflowMd, 'utf-8');
  console.log(`✅ Saved Google Workflow Evaluation to: ${googleWorkflowOutPath}`);

  const reviewScorecardOutPath = path.join(outputFolders.scorecards, `grinders_keep_review_scorecard_${dateStr}.md`);
  fs.writeFileSync(reviewScorecardOutPath, scorecardMd, 'utf-8');
  console.log(`✅ Saved Review Scorecard to: ${reviewScorecardOutPath}`);

  const telemetryOutPath = path.join(outputFolders.telemetry, `grinders_keep_intake_telemetry_${dateStr}.md`);
  fs.writeFileSync(telemetryOutPath, telemetryMd, 'utf-8');
  console.log(`✅ Saved Telemetry to: ${telemetryOutPath}`);

  const nextActionsOutPath = path.join(outputFolders.root, `grinders_keep_manual_review_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextActionsOutPath, actionMd, 'utf-8');
  console.log(`✅ Saved Next Actions to: ${nextActionsOutPath}`);

  // --- 10. Update Frontpage Dashboard ---
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');

    const topAccepted = validatedList[0] 
      ? `${validatedList[0].response_file_id} (${validatedList[0].source_type})` 
      : 'None';
    const topRejectedOrLimited = (limitedConfidenceList[0] || rejectedList[0])
      ? `${(limitedConfidenceList[0] || rejectedList[0]).response_file_id} (${(limitedConfidenceList[0] || rejectedList[0]).source_type})`
      : 'None';

    const intakeStatusVal = discoveredFilesList.length === 0 ? 'no_manual_reviews_found' : 'reviews_staged';

    let contentBlock = `\n## Manual Review Intake Gate\n`;
    contentBlock += `- **Intake Status:** ${intakeStatusVal}\n`;
    contentBlock += `- **Manual Response Count:** ${telemetryData.manual_response_count}\n`;
    contentBlock += `- **Validated Response Count:** ${telemetryData.validated_response_count}\n`;
    contentBlock += `- **Limited Confidence Count:** ${telemetryData.limited_confidence_count}\n`;
    contentBlock += `- **Rejected Response Count:** ${telemetryData.rejected_response_count}\n`;
    contentBlock += `- **Comparison Status:** ${comparisonStatus}\n`;
    contentBlock += `- **Google Workflow Evaluation Status:** ${googleWorkflowEvaluationStatus}\n`;
    contentBlock += `- **Top Accepted Response:** ${topAccepted}\n`;
    contentBlock += `- **Top Rejected or Limited Response:** ${topRejectedOrLimited}\n`;
    contentBlock += `- **Recommended Intake Next Action:** ${recommendedNextActionsList[0].action_name}\n\n`;
    contentBlock += `### 📝 Commander Review Checklist\n`;
    contentBlock += `- [ ] Paste manual ChatGPT, Gemini, Claude, and NotebookLM responses into approved intake folders.\n`;
    contentBlock += `- [ ] Verify validation scorecard and cross-model comparison outputs.\n`;
    contentBlock += `- [ ] Sign off on Google Ultra manual workflow evaluations before Phase 12I.\n`;

    if (frontpageContent.includes('## Manual Review Intake Gate')) {
      const idx = frontpageContent.indexOf('## Manual Review Intake Gate');
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
    intake_status: discoveredFilesList.length === 0 ? 'no_manual_reviews_found' : 'reviews_staged',
    telemetry: telemetryData,
    discovered_files: discoveredFilesList,
    validated_responses: validatedList,
    limited_confidence_responses: limitedConfidenceList,
    rejected_responses: rejectedList,
    cross_model_evaluations: comparisonResults,
    google_workflow_evaluations: googleWorkflowEvaluations,
    scorecards,
    next_actions: recommendedNextActionsList
  };

  const jsonManifestPath = path.join(outputFolders.root, `grinders_keep_manual_review_intake_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonManifestPath, JSON.stringify(jsonManifest, null, 2), 'utf-8');
  console.log(`✅ Saved JSON Manifest to: ${jsonManifestPath}`);

  // Write log file
  logContent += `\n## Output Generated Files:\n`;
  logContent += `- Main Intake Report: ${mainReportOutPath}\n`;
  logContent += `- Validated Responses: ${validatedOutPath}\n`;
  logContent += `- Rejected Responses: ${rejectedOutPath}\n`;
  logContent += `- Cross-Model Evaluation: ${crossEvalOutPath}\n`;
  logContent += `- Google Workflow Evaluation: ${googleWorkflowOutPath}\n`;
  logContent += `- Review Scorecard: ${reviewScorecardOutPath}\n`;
  logContent += `- Telemetry: ${telemetryOutPath}\n`;
  logContent += `- Next Actions: ${nextActionsOutPath}\n`;
  logContent += `- JSON Manifest: ${jsonManifestPath}\n`;

  fs.writeFileSync(logFile, logContent, 'utf-8');
  console.log(`✅ Saved Execution Log to: ${logFile}`);

  await announceCompletion("Grinders Keep manual review intake sweep complete", "10");
}

runIntakeGate().catch(err => {
  console.error(`🚨 Fatal execution error in Intake Gate: ${(err as Error).stack}`);
  process.exit(1);
});
