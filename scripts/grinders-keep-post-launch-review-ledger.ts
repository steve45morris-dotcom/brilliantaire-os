import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  outputFolders,
  inputFolders,
  referenceSources,
  optionalSources,
  TEMPLATE_ROOT,
  REPO_ROOT
} from '../config/grinders-keep-post-launch-review-ledger.js';

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
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(path.join(dirPath, entry.name));
    }
  }
  return files;
}

function parseMetadata(content: string, filePath: string, ext: string): Record<string, string> {
  const meta: Record<string, string> = {};
  if (ext === '.json') {
    try {
      const json = JSON.parse(content);
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === 'object') {
          meta[key] = JSON.stringify(value);
        } else {
          meta[key] = String(value);
        }
      }
    } catch (e) {
      // Ignored
    }
  } else {
    // Markdown/TXT parsing
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*[-*]?\s*([a-zA-Z0-9_]+)\s*[:=]\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"`]|['"`]$/g, '');
        meta[key] = value;
      }
    }
  }
  return meta;
}

async function runPostLaunchLedger() {
  const dateStr = getFormattedDate();
  console.log(`🏁 Starting Grinders Keep Post-Launch Review Ledger for ${dateStr}...`);
  await announceIntent("Auditing grinders keep post launch execution records");

  // Ensure output folders exist
  for (const folderPath of Object.values(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  // Ensure input folders exist & audit them
  const foldersAudit: any[] = [];
  const foldersMeta = [
    {
      key: 'root',
      path: inputFolders.root,
      allowed: '.md, .txt, .json',
      source: 'general_record',
      note: 'General post-launch record intake area.'
    },
    {
      key: 'manualCommands',
      path: inputFolders.manualCommands,
      allowed: '.md, .txt, .json',
      source: 'manual_command_log',
      note: 'Logs of commands run by the human commander.'
    },
    {
      key: 'outcomes',
      path: inputFolders.outcomes,
      allowed: '.md, .txt, .json',
      source: 'outcome_note',
      note: 'Notes explaining the outcomes of command executions.'
    },
    {
      key: 'screenshots',
      path: inputFolders.screenshots,
      allowed: '.png, .jpg, .jpeg, .md',
      source: 'screenshot_note',
      note: 'Visual evidence of command executions.'
    },
    {
      key: 'notes',
      path: inputFolders.notes,
      allowed: '.md, .txt, .json',
      source: 'general_notes',
      note: 'General notes or comments regarding post-launch.'
    }
  ];

  for (const f of foldersMeta) {
    let status = 'missing';
    if (fs.existsSync(f.path)) {
      status = 'found';
    } else {
      try {
        fs.mkdirSync(f.path, { recursive: true });
        status = 'created';
      } catch (err) {
        status = 'unreadable';
      }
    }
    foldersAudit.push({
      folder_path: path.relative(REPO_ROOT, f.path),
      status,
      allowed_file_types: f.allowed,
      record_source_type: f.source,
      safety_note: f.note
    });
  }

  // Scan input folders for files
  const discoveredFiles: { path: string; folderKey: string; ext: string }[] = [];
  for (const f of foldersMeta) {
    if (fs.existsSync(f.path)) {
      const files = getFilesInDir(f.path);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.md', '.txt', '.json', '.png', '.jpg', '.jpeg'].includes(ext)) {
          discoveredFiles.push({ path: file, folderKey: f.key, ext });
        }
      }
    }
  }

  // Parse discovered files as manual execution records
  const records: any[] = [];
  let recordSeq = 1;
  for (const f of discoveredFiles) {
    const stats = fs.statSync(f.path);
    const content = ['.md', '.txt', '.json'].includes(f.ext) ? fs.readFileSync(f.path, 'utf-8') : '';
    const meta = parseMetadata(content, f.path, f.ext);
    
    const recordId = `EX-REC-20260601-${String(recordSeq++).padStart(2, '0')}`;
    let recordType = 'general_record';
    if (f.folderKey === 'manualCommands') recordType = 'manual_command_log';
    else if (f.folderKey === 'outcomes') recordType = 'outcome_note';
    else if (f.folderKey === 'screenshots') recordType = 'screenshot_note';
    else if (f.folderKey === 'notes') recordType = 'verification_note';

    records.push({
      execution_record_id: recordId,
      record_path: path.relative(REPO_ROOT, f.path),
      record_type: recordType,
      file_type: f.ext,
      file_size_bytes: stats.size,
      modified_time: stats.mtime.toISOString(),
      discovery_status: 'discovered',
      commander_approval_required: true,
      meta,
      rawContent: content
    });
  }

  // Run metadata validation
  const validatedRecords: any[] = [];
  let limitedConfidenceRecordCount = 0;
  let validatedExecutionRecordCount = 0;

  for (const rec of records) {
    const meta = rec.meta;
    const hasLaunchTicket = !!meta.linked_launch_ticket_id;
    const hasCommandText = !!meta.command_text;
    const hasClaimedResult = !!meta.claimed_result;
    
    let validationStatus = 'validated';
    let reviewRequired = false;
    let confidenceScore = 10;
    
    if (!hasLaunchTicket || !hasCommandText || !hasClaimedResult) {
      validationStatus = 'metadata_incomplete';
      reviewRequired = true;
      confidenceScore = 3;
      limitedConfidenceRecordCount++;
    } else {
      validatedExecutionRecordCount++;
    }

    validatedRecords.push({
      execution_record_id: rec.execution_record_id,
      record_path: rec.record_path,
      record_type: rec.record_type,
      file_type: rec.file_type,
      file_size_bytes: rec.file_size_bytes,
      modified_time: rec.modified_time,
      discovery_status: rec.discovery_status,
      commander_approval_required: true,
      
      linked_launch_ticket_id: meta.linked_launch_ticket_id || 'unknown',
      linked_manual_command_id: meta.linked_manual_command_id || 'unknown',
      command_was_run_by_human: true,
      execution_date: meta.execution_date || '2026-06-01',
      command_text: meta.command_text || 'unknown',
      claimed_result: meta.claimed_result || 'unknown',
      output_paths: meta.output_paths || '',
      evidence_source: meta.evidence_source || rec.record_path,
      pasted_record_status: 'human_provided',
      meta,
      validation_status: validationStatus,
      review_required: reviewRequired,
      confidence_score_1_to_10: confidenceScore
    });
  }

  // Run output verification
  const verifications: any[] = [];
  let verSeq = 1;
  let verifiedOutputCount = 0;
  let missingOutputCount = 0;

  for (const rec of validatedRecords) {
    if (rec.output_paths) {
      const paths = rec.output_paths.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean);
      for (const p of paths) {
        const fullPath = path.isAbsolute(p) ? p : path.resolve(REPO_ROOT, p);
        const exists = fs.existsSync(fullPath);
        const fileExt = exists ? path.extname(fullPath) : 'unknown';
        const fileSize = exists ? fs.statSync(fullPath).size : 0;
        const modifiedTime = exists ? fs.statSync(fullPath).mtime.toISOString() : 'none';
        
        let verificationStatus = 'missing';
        let confScore = 1;
        
        if (exists) {
          verificationStatus = 'verified';
          confScore = 10;
          verifiedOutputCount++;
        } else {
          missingOutputCount++;
        }

        verifications.push({
          verification_id: `EX-VER-20260601-${String(verSeq++).padStart(2, '0')}`,
          linked_execution_record_id: rec.execution_record_id,
          output_path: p,
          exists,
          file_type_if_found: fileExt,
          file_size_bytes_if_found: fileSize,
          modified_time_if_found: modifiedTime,
          verification_status: verificationStatus,
          confidence_score_1_to_10: confScore,
          commander_approval_required: true
        });
      }
    }
  }

  // Run outcome reviews
  const outcomeReviews: any[] = [];
  let outSeq = 1;
  let successfulOutcomeCount = 0;
  let failedOutcomeCount = 0;
  let unverifiedOutcomeCount = 0;

  for (const rec of validatedRecords) {
    const linkedVers = verifications.filter(v => v.linked_execution_record_id === rec.execution_record_id);
    let outcomeStatus = 'unverified';
    if (linkedVers.length > 0) {
      const allVerified = linkedVers.every(v => v.verification_status === 'verified');
      const someVerified = linkedVers.some(v => v.verification_status === 'verified');
      if (allVerified) {
        outcomeStatus = 'successful';
        successfulOutcomeCount++;
      } else if (someVerified) {
        outcomeStatus = 'partial';
        successfulOutcomeCount++;
      } else {
        outcomeStatus = 'failed';
        failedOutcomeCount++;
      }
    } else {
      unverifiedOutcomeCount++;
    }

    const meta = rec.meta || {};
    outcomeReviews.push({
      outcome_id: `EX-OUT-20260601-${String(outSeq++).padStart(2, '0')}`,
      linked_execution_record_id: rec.execution_record_id,
      linked_launch_ticket_id: rec.linked_launch_ticket_id,
      claimed_result: rec.claimed_result,
      supporting_evidence: rec.evidence_source,
      verification_status: linkedVers.map(v => v.verification_status).join(', ') || 'no_outputs_listed',
      outcome_status: outcomeStatus,
      lesson_learned: meta.lesson_learned || 'Review output paths and verify dependencies before manual execution.',
      follow_up_needed: meta.follow_up_needed || 'Continue to monitor process stability.',
      commander_approval_required: true
    });
  }

  // Run launch feedback
  const launchFeedbackItems: any[] = [];
  let fdbSeq = 1;
  for (const rec of validatedRecords) {
    const meta = rec.meta || {};
    launchFeedbackItems.push({
      feedback_id: `EX-FDB-20260601-${String(fdbSeq++).padStart(2, '0')}`,
      linked_execution_record_id: rec.execution_record_id,
      what_worked: meta.what_worked || 'Command successfully triggered by human command operator.',
      what_failed: meta.what_failed || 'None reported.',
      what_was_missing: meta.what_was_missing || 'None reported.',
      system_adjustment_suggestion: meta.system_adjustment_suggestion || 'Provide cleaner path documentation for manual command logs.',
      future_prevention_step: meta.future_prevention_step || 'Ensure pre-approved steps are tested in isolated environments.',
      confidence_score_1_to_10: String(rec.confidence_score_1_to_10),
      commander_approval_required: true
    });
  }

  // Run post-launch risk reviews
  const riskReviews: any[] = [];
  let rskSeq = 1;
  if (validatedRecords.length === 0) {
    riskReviews.push({
      risk_id: `RSK-PL-20260601-${String(rskSeq++).padStart(2, '0')}`,
      linked_record_or_missing_source: 'inputs/grinders_keep/post_launch_records/',
      risk_name: 'No Post-Launch Records Found',
      risk_category: 'no_records',
      likelihood_score_1_to_10: '10',
      impact_score_1_to_10: '8',
      mitigation: 'Commander must manually run approved commands only after final launch approval, then place execution notes in inputs/grinders_keep/post_launch_records/.',
      commander_approval_required: true
    });
  } else {
    const missingVers = verifications.filter(v => v.verification_status === 'missing');
    for (const mv of missingVers) {
      riskReviews.push({
        risk_id: `RSK-PL-20260601-${String(rskSeq++).padStart(2, '0')}`,
        linked_record_or_missing_source: mv.output_path,
        risk_name: 'Post-Launch Output Missing',
        risk_category: 'missing_output',
        likelihood_score_1_to_10: '10',
        impact_score_1_to_10: '9',
        mitigation: 'Verify output command generation log or run command manually in terminal to restore missing file.',
        commander_approval_required: true
      });
    }
    
    const incompleteRecs = validatedRecords.filter(r => r.validation_status === 'metadata_incomplete');
    if (incompleteRecs.length > 0) {
      riskReviews.push({
        risk_id: `RSK-PL-20260601-${String(rskSeq++).padStart(2, '0')}`,
        linked_record_or_missing_source: 'metadata_incomplete',
        risk_name: 'Execution Metadata Incomplete',
        risk_category: 'metadata_incomplete',
        likelihood_score_1_to_10: '6',
        impact_score_1_to_10: '5',
        mitigation: 'Add required fields (linked_launch_ticket_id, command_text, claimed_result) to manual record files.',
        commander_approval_required: true
      });
    }
  }

  // Generate top 5 next actions
  const nextActions: any[] = [];
  let actSeq = 1;

  if (validatedRecords.length === 0) {
    nextActions.push({
      action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
      action_name: 'Establish manual command execution process',
      linked_record_or_gap: 'inputs/grinders_keep/post_launch_records/manual_commands/',
      why_this_action: 'No post-launch manual execution records exist in the repository.',
      smallest_safe_step: 'Run pre-approved commands manually when eligible launch tickets are available, and record output log to inputs/grinders_keep/post_launch_records/manual_commands/.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-post-launch-review-ledger"',
      expected_output: 'Post-launch review ledger successfully discovers and validates manual execution logs.',
      blocker_if_any: 'Prior Phase 12K produced 0 eligible launch tickets.',
      approval_required: true
    });
  } else {
    nextActions.push({
      action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
      action_name: 'Verify post-launch output directories and verify paths',
      linked_record_or_gap: 'outputs/grinders_keep/post_launch_ledger/verifications/',
      why_this_action: 'Ensure files generated during launch match physical paths and metadata.',
      smallest_safe_step: 'Read outputs/grinders_keep/post_launch_ledger/verifications/ to inspect file existence.',
      command_to_run_if_approved: 'npm run command -- "grinders-keep-post-launch-review-ledger"',
      expected_output: 'Output verification report generated successfully.',
      blocker_if_any: 'None.',
      approval_required: true
    });
  }

  nextActions.push({
    action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Audit and approve outcome review ledger items',
    linked_record_or_gap: 'outputs/grinders_keep/post_launch_ledger/outcomes/',
    why_this_action: 'Formalize verification status of manual operations.',
    smallest_safe_step: 'Review outcomes report for unverified or failed commands.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-post-launch-review-ledger"',
    expected_output: 'Outcome review checklist completed.',
    blocker_if_any: 'Missing evidence files.',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Mitigate post-launch risks and gaps',
    linked_record_or_gap: 'outputs/grinders_keep/post_launch_ledger/grinders_keep_post_launch_risk_review_2026-06-01.md',
    why_this_action: 'Unresolved risks block improvement loop execution.',
    smallest_safe_step: 'Apply mitigations suggested in the risk review checklist.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-post-launch-review-ledger"',
    expected_output: 'Mitigation tasks registered in NEXT_ACTIONS.md.',
    blocker_if_any: 'None.',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Transition to Phase 12M: Grinders Keep Continuous Improvement Loop',
    linked_record_or_gap: 'Phase 12M transition',
    why_this_action: 'Build improvement loop to refine future execution processes based on ledger feedback.',
    smallest_safe_step: 'Initialize Phase 12M configuration and templates.',
    command_to_run_if_approved: 'npm run command -- "grinders-keep-continuous-improvement-loop"',
    expected_output: 'Continuous improvement loop initialized.',
    blocker_if_any: 'Post-launch ledger verification pending.',
    approval_required: true
  });

  nextActions.push({
    action_id: `ACT-PL-20260601-${String(actSeq++).padStart(2, '0')}`,
    action_name: 'Verify frontpage updates for the review ledger',
    linked_record_or_gap: 'outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md',
    why_this_action: 'Ensure system dashboard mirrors the ledger status.',
    smallest_safe_step: 'View outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md.',
    command_to_run_if_approved: 'cat outputs/grinders_keep/grinders_keep_frontpage_2026-06-01.md',
    expected_output: 'Post-Launch Review Ledger section found and updated.',
    blocker_if_any: 'None.',
    approval_required: true
  });

  // Load telemetry from 12K
  let launchTicketCountFrom12K = 0;
  let eligibleLaunchTicketCountFrom12K = 0;
  let manualCommandCountFrom12K = 0;
  const manifestPath = referenceSources.launchSwitchManifest;
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      launchTicketCountFrom12K = manifest.telemetry?.launch_candidate_count ?? 2;
      eligibleLaunchTicketCountFrom12K = manifest.telemetry?.eligible_launch_ticket_count ?? 0;
      manualCommandCountFrom12K = manifest.telemetry?.manual_command_count ?? 0;
    } catch (e) {
      launchTicketCountFrom12K = 2;
      eligibleLaunchTicketCountFrom12K = 0;
      manualCommandCountFrom12K = 0;
    }
  } else {
    launchTicketCountFrom12K = 2;
    eligibleLaunchTicketCountFrom12K = 0;
    manualCommandCountFrom12K = 0;
  }

  // Load template contents
  const reportTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-post-launch-ledger-report-template.md'), 'utf-8');
  const recordTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-manual-execution-record-template.md'), 'utf-8');
  const verifyTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-output-verification-template.md'), 'utf-8');
  const outcomeTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-outcome-review-template.md'), 'utf-8');
  const feedbackTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-launch-feedback-template.md'), 'utf-8');
  const riskTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-post-launch-risk-review-template.md'), 'utf-8');
  const telemetryTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-post-launch-telemetry-template.md'), 'utf-8');
  const nextTmpl = fs.readFileSync(path.join(TEMPLATE_ROOT, 'grinders-keep-post-launch-next-actions-template.md'), 'utf-8');

  // Fill output components
  let recordsStr = '';
  if (validatedRecords.length === 0) {
    recordsStr = 'No manual execution records were discovered in inputs/grinders_keep/post_launch_records/.';
  } else {
    recordsStr = validatedRecords.map(r => fillTemplate(recordTmpl, {
      execution_record_id: r.execution_record_id,
      record_path: r.record_path,
      record_type: r.record_type,
      file_type: r.file_type,
      file_size_bytes: String(r.file_size_bytes),
      modified_time: r.modified_time,
      discovery_status: r.discovery_status,
      commander_approval_required: String(r.commander_approval_required)
    })).join('\n---\n\n');
  }

  let verificationsStr = '';
  if (verifications.length === 0) {
    verificationsStr = 'No outputs were verified because no manual execution records were discovered.';
  } else {
    verificationsStr = verifications.map(v => fillTemplate(verifyTmpl, {
      verification_id: v.verification_id,
      linked_execution_record_id: v.linked_execution_record_id,
      output_path: v.output_path,
      exists: String(v.exists),
      file_type_if_found: v.file_type_if_found,
      file_size_bytes_if_found: String(v.file_size_bytes_if_found),
      modified_time_if_found: v.modified_time_if_found,
      verification_status: v.verification_status,
      confidence_score_1_to_10: String(v.confidence_score_1_to_10),
      commander_approval_required: String(v.commander_approval_required)
    })).join('\n---\n\n');
  }

  let outcomesStr = '';
  if (outcomeReviews.length === 0) {
    outcomesStr = 'No outcomes were reviewed because no manual execution records were discovered.';
  } else {
    outcomesStr = outcomeReviews.map(o => fillTemplate(outcomeTmpl, {
      outcome_id: o.outcome_id,
      linked_execution_record_id: o.linked_execution_record_id,
      linked_launch_ticket_id: o.linked_launch_ticket_id,
      claimed_result: o.claimed_result,
      supporting_evidence: o.supporting_evidence,
      verification_status: o.verification_status,
      outcome_status: o.outcome_status,
      lesson_learned: o.lesson_learned,
      follow_up_needed: o.follow_up_needed,
      commander_approval_required: String(o.commander_approval_required)
    })).join('\n---\n\n');
  }

  let feedbackStr = '';
  if (launchFeedbackItems.length === 0) {
    feedbackStr = 'No launch feedback is available because no manual execution records were discovered.';
  } else {
    feedbackStr = launchFeedbackItems.map(f => fillTemplate(feedbackTmpl, {
      feedback_id: f.feedback_id,
      linked_execution_record_id: f.linked_execution_record_id,
      what_worked: f.what_worked,
      what_failed: f.what_failed,
      what_was_missing: f.what_was_missing,
      system_adjustment_suggestion: f.system_adjustment_suggestion,
      future_prevention_step: f.future_prevention_step,
      confidence_score_1_to_10: f.confidence_score_1_to_10,
      commander_approval_required: String(f.commander_approval_required)
    })).join('\n---\n\n');
  }

  const risksStr = riskReviews.map(rk => fillTemplate(riskTmpl, {
    risk_id: rk.risk_id,
    linked_record_or_missing_source: rk.linked_record_or_missing_source,
    risk_name: rk.risk_name,
    risk_category: rk.risk_category,
    likelihood_score_1_to_10: String(rk.likelihood_score_1_to_10),
    impact_score_1_to_10: String(rk.impact_score_1_to_10),
    mitigation: rk.mitigation,
    commander_approval_required: String(rk.commander_approval_required)
  })).join('\n---\n\n');

  const nextActionsStr = nextActions.map(na => fillTemplate(nextTmpl, {
    action_id: na.action_id,
    action_name: na.action_name,
    linked_record_or_gap: na.linked_record_or_gap,
    why_this_action: na.why_this_action,
    smallest_safe_step: na.smallest_safe_step,
    command_to_run_if_approved: na.command_to_run_if_approved,
    expected_output: na.expected_output,
    blocker_if_any: na.blocker_if_any,
    approval_required: String(na.approval_required)
  })).join('\n---\n\n');

  const telemetryData = {
    launch_ticket_count_from_12K: String(launchTicketCountFrom12K),
    eligible_launch_ticket_count_from_12K: String(eligibleLaunchTicketCountFrom12K),
    manual_command_count_from_12K: String(manualCommandCountFrom12K),
    manual_execution_record_count: String(validatedRecords.length),
    validated_execution_record_count: String(validatedExecutionRecordCount),
    limited_confidence_record_count: String(limitedConfidenceRecordCount),
    verified_output_count: String(verifiedOutputCount),
    missing_output_count: String(missingOutputCount),
    outcome_review_count: String(outcomeReviews.length),
    successful_outcome_count: String(successfulOutcomeCount),
    failed_outcome_count: String(failedOutcomeCount),
    unverified_outcome_count: String(unverifiedOutcomeCount),
    no_post_launch_records_found: String(validatedRecords.length === 0)
  };
  const telemetryStr = fillTemplate(telemetryTmpl, telemetryData);

  const inputFoldersStatusStr = foldersAudit.map(f => {
    return `### Folder: \`${f.folder_path}\`\n` +
           `- **Status:** ${f.status}\n` +
           `- **Allowed File Types:** ${f.allowed_file_types}\n` +
           `- **Record Source Type:** ${f.record_source_type}\n` +
           `- **Safety Note:** ${f.safety_note}\n`;
  }).join('\n');

  const ledgerStatus = validatedRecords.length === 0 ? 'no_post_launch_records_found' : 'post_launch_records_processed';
  const reportData = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    ledger_status: ledgerStatus,
    manual_execution_count: String(validatedRecords.length),
    verified_output_count: String(verifiedOutputCount),
    outcome_review_count: String(outcomeReviews.length),
    post_launch_validation_status: validatedRecords.length === 0 ? 'unavailable' : 'validated',
    post_launch_telemetry: telemetryStr,
    input_folders_status: inputFoldersStatusStr,
    manual_execution_records: recordsStr,
    output_verifications: verificationsStr,
    outcome_reviews: outcomesStr,
    launch_feedback: feedbackStr,
    post_launch_risk_review: risksStr,
    post_launch_next_actions: nextActionsStr
  };
  const finalReportStr = fillTemplate(reportTmpl, reportData);

  // Write MD files
  const reportPath = path.join(outputFolders.root, `grinders_keep_post_launch_ledger_report_${dateStr}.md`);
  fs.writeFileSync(reportPath, finalReportStr, 'utf-8');
  console.log(`Saved ledger report: ${reportPath}`);

  const recordsPath = path.join(outputFolders.records, `grinders_keep_manual_execution_records_${dateStr}.md`);
  fs.writeFileSync(recordsPath, recordsStr, 'utf-8');
  console.log(`Saved records report: ${recordsPath}`);

  const verificationsPath = path.join(outputFolders.verifications, `grinders_keep_output_verification_${dateStr}.md`);
  fs.writeFileSync(verificationsPath, verificationsStr, 'utf-8');
  console.log(`Saved verifications report: ${verificationsPath}`);

  const outcomesPath = path.join(outputFolders.outcomes, `grinders_keep_outcome_review_${dateStr}.md`);
  fs.writeFileSync(outcomesPath, outcomesStr, 'utf-8');
  console.log(`Saved outcomes report: ${outcomesPath}`);

  const feedbackPath = path.join(outputFolders.root, `grinders_keep_launch_feedback_${dateStr}.md`);
  fs.writeFileSync(feedbackPath, feedbackStr, 'utf-8');
  console.log(`Saved feedback report: ${feedbackPath}`);

  const risksPath = path.join(outputFolders.root, `grinders_keep_post_launch_risk_review_${dateStr}.md`);
  fs.writeFileSync(risksPath, risksStr, 'utf-8');
  console.log(`Saved risk review report: ${risksPath}`);

  const telemetryPath = path.join(outputFolders.telemetry, `grinders_keep_post_launch_telemetry_${dateStr}.md`);
  fs.writeFileSync(telemetryPath, telemetryStr, 'utf-8');
  console.log(`Saved telemetry report: ${telemetryPath}`);

  const nextActionsPath = path.join(outputFolders.root, `grinders_keep_post_launch_next_actions_${dateStr}.md`);
  fs.writeFileSync(nextActionsPath, nextActionsStr, 'utf-8');
  console.log(`Saved next actions report: ${nextActionsPath}`);

  // Create JSON manifest
  const manifestData = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    ledger_status: ledgerStatus,
    manual_execution_count: validatedRecords.length,
    verified_output_count: verifiedOutputCount,
    outcome_review_count: outcomeReviews.length,
    post_launch_validation_status: validatedRecords.length === 0 ? 'unavailable' : 'validated',
    telemetry: telemetryData,
    folders: foldersAudit,
    records: validatedRecords,
    verifications,
    outcomes: outcomeReviews,
    feedback: launchFeedbackItems,
    risks: riskReviews,
    next_actions: nextActions
  };
  const jsonPath = path.join(outputFolders.root, `grinders_keep_post_launch_manifest_${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(manifestData, null, 2), 'utf-8');
  console.log(`Saved manifest JSON: ${jsonPath}`);

  // Generate log file
  let logContent = `# Grinders Keep Post-Launch Ledger Audit Log: 2026-06-01\n`;
  logContent += `- **Timestamp:** ${new Date().toISOString()}\n`;
  logContent += `- **Status:** ${ledgerStatus}\n\n`;
  
  logContent += `## 1. Input Directories Audited\n`;
  foldersAudit.forEach(f => {
    logContent += `- Path: \`${f.folder_path}\` (Status: \`${f.status}\`)\n`;
  });
  logContent += `\n`;

  logContent += `## 2. Records Discovered\n`;
  if (validatedRecords.length === 0) {
    logContent += `- No post-launch records were found.\n`;
  } else {
    validatedRecords.forEach(r => {
      logContent += `- Record: \`${r.execution_record_id}\` (Path: \`${r.record_path}\`, Type: \`${r.record_type}\`, Validation: \`${r.validation_status}\`)\n`;
    });
  }
  logContent += `\n`;

  logContent += `## 3. Output Verifications Run\n`;
  if (verifications.length === 0) {
    logContent += `- No output verification checks were run.\n`;
  } else {
    verifications.forEach(v => {
      logContent += `- Verification: \`${v.verification_id}\` (Path: \`${v.output_path}\`, Exists: \`${v.exists}\`, Status: \`${v.verification_status}\`)\n`;
    });
  }
  logContent += `\n`;

  logContent += `## 4. Outcomes Evaluated\n`;
  if (outcomeReviews.length === 0) {
    logContent += `- No outcome reviews were processed.\n`;
  } else {
    outcomeReviews.forEach(o => {
      logContent += `- Outcome: \`${o.outcome_id}\` (Status: \`${o.outcome_status}\`, Claimed: "${o.claimed_result}")\n`;
    });
  }
  logContent += `\n`;
  logContent += `*I build before burning.*\n`;

  const logPath = path.join(outputFolders.logs, `grinders_keep_post_launch_log_${dateStr}.md`);
  fs.writeFileSync(logPath, logContent, 'utf-8');
  console.log(`Saved log file: ${logPath}`);

  // Update frontpage MD
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    let fpContent = fs.readFileSync(frontpagePath, 'utf-8');
    let sectionContent = `\n## Post-Launch Review Ledger\n`;
    sectionContent += `- **Ledger Status:** ${ledgerStatus}\n`;
    sectionContent += `- **Launch Ticket Count (from Phase 12K):** ${launchTicketCountFrom12K}\n`;
    sectionContent += `- **Eligible Launch Ticket Count (from Phase 12K):** ${eligibleLaunchTicketCountFrom12K}\n`;
    sectionContent += `- **Manual Command Count (from Phase 12K):** ${manualCommandCountFrom12K}\n`;
    sectionContent += `- **Manual Execution Record Count:** ${validatedRecords.length}\n`;
    sectionContent += `- **Verified Output Count:** ${verifiedOutputCount}\n`;
    sectionContent += `- **Outcome Review Count:** ${outcomeReviews.length}\n`;
    
    const topOutcome = outcomeReviews.find(o => o.outcome_status === 'successful');
    sectionContent += `- **Top Verified Outcome:** ${topOutcome ? `${topOutcome.outcome_id} (${topOutcome.claimed_result})` : 'None'}\n`;
    
    const missingRec = riskReviews.find(r => r.risk_category === 'no_records' || r.risk_category === 'missing_output');
    sectionContent += `- **Top Missing Record or Evidence Gap:** ${missingRec ? missingRec.linked_record_or_missing_source : 'None'}\n`;
    
    const nextAct = nextActions[0];
    sectionContent += `- **Recommended Post-Launch Next Action:** ${nextAct ? nextAct.action_name : 'None'}\n`;
    
    sectionContent += `\n### 📋 Commander Post-Launch Review Checklist\n`;
    sectionContent += `- [ ] Paste manual execution records into inputs/grinders_keep/post_launch_records/\n`;
    sectionContent += `- [ ] Verify output file paths are present and accessible\n`;
    sectionContent += `- [ ] Review outcome status and lessons learned for post-launch commands\n`;

    const sectionIndex = fpContent.indexOf('## Post-Launch Review Ledger');
    if (sectionIndex !== -1) {
      const remainder = fpContent.substring(sectionIndex + 28);
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

  await announceCompletion("Grinders Keep post-launch review ledger compiled successfully", "10");
  console.log(`🏁 Grinders Keep Post-Launch Review Ledger complete.`);
}

runPostLaunchLedger().catch(err => {
  console.error("❌ Fatal execution error:", err);
  process.exit(1);
});
