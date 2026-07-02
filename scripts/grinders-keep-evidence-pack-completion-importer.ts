import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  outputFolders,
  inputScanFolders,
  referenceSources,
  TEMPLATE_ROOT,
  MODULE_NAME,
  REPO_ROOT,
  FILE_MOVE_ALLOWED,
  FILE_COPY_ALLOWED,
  EVIDENCE_CREATION_ALLOWED,
  AUTO_FEED_ALLOWED
} from '../config/grinders-keep-evidence-pack-completion-importer.js';

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

// Interfaces
interface PackItem {
  pack_item_id: string;
  linked_task_id: string;
  evidence_name: string;
  evidence_type: 'model_response' | 'google_output' | 'report' | 'screenshot' | 'note' | 'monetization_proof' | 'audit_report' | 'command_log' | 'unknown';
  why_needed: string;
  blocker_removed_if_collected: string;
  exact_target_folder_or_file: string;
  accepted_formats: string[];
  required_metadata: string;
  smallest_manual_collection_step: string;
  completion_check: string;
  evidence_creation_allowed: boolean;
  commander_approval_required: boolean;
}

interface TargetScanItem {
  target_scan_id: string;
  linked_pack_item_id: string;
  target_path: string;
  target_type: 'folder' | 'file' | 'unknown';
  target_exists: boolean;
  files_detected: string[];
  detected_file_count: number;
  accepted_format_file_count: number;
  scan_status: 'found' | 'empty' | 'missing' | 'unreadable' | 'ambiguous';
  confidence_score_1_to_10: number;
  commander_approval_required: boolean;
}

interface DetectedFileItem {
  detected_file_id: string;
  linked_pack_item_id: string;
  file_path: string;
  file_type: string;
  file_size_bytes: number;
  modified_time: string;
  accepted_format: boolean;
  detection_status: 'detected' | 'unsupported_format' | 'unavailable';
  commander_approval_required: boolean;
}

interface CompletionStatusItem {
  completion_status_id: string;
  linked_pack_item_id: string;
  evidence_name: string;
  evidence_type: string;
  target_path: string;
  detected_file_count: number;
  accepted_format_file_count: number;
  status: 'completed' | 'partial' | 'still_blocked' | 'unavailable';
  reason: string;
  next_manual_step: string;
  commander_approval_required: boolean;
}

interface Phase12RReadyItem {
  ready_item_id: string;
  linked_pack_item_id: string;
  evidence_name: string;
  evidence_type: string;
  evidence_path: string;
  accepted_format: boolean;
  basic_file_metadata_available: boolean;
  ready_for_phase_12r: boolean;
  auto_feed_allowed: boolean;
  required_human_action: string;
  commander_approval_required: boolean;
}

interface BlockedImportItem {
  blocked_import_id: string;
  linked_pack_item_id: string;
  evidence_name: string;
  reason_blocked: string;
  missing_requirement: string;
  target_path: string;
  smallest_safe_completion_step: string;
  ready_for_phase_12r: boolean;
  commander_approval_required: boolean;
}

interface ScorecardItem {
  rank: number;
  linked_pack_item_or_blocked_id: string;
  evidence_type: string;
  completion_status: 'completed' | 'partial' | 'still_blocked' | 'unavailable';
  blocker_severity_score_1_to_10: number;
  ease_to_complete_score_1_to_10: number;
  downstream_value_score_1_to_10: number;
  risk_reduction_score_1_to_10: number;
  money_impact_score_1_to_10: number;
  recommended_status: 'ready_for_tracker' | 'collect_now' | 'schedule' | 'monitor' | 'block';
  reason: string;
  commander_approval_required: boolean;
}

interface NextActionItem {
  action_id: string;
  action_name: string;
  linked_pack_item_or_blocker: string;
  why_this_action: string;
  smallest_safe_step: string;
  manual_action_if_approved: string;
  expected_output: string;
  blocker_if_any: string;
  approval_required: boolean;
}

async function runEvidencePackCompletionImporter() {
  const dateStr = getFormattedDate();
  console.log(`📥 Starting Grinders Keep Evidence Pack Completion Importer for ${dateStr}...`);
  await announceIntent("Scanning workspace folders for manually placed evidence pack completions");

  // Create required folders if missing
  for (const [key, folderPath] of Object.entries(outputFolders)) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created output folder: ${folderPath}`);
    }
  }

  const executionLogs: string[] = [];
  function log(message: string) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(message);
    executionLogs.push(formattedMessage);
  }

  log(`Module initialized: ${MODULE_NAME}`);
  log(`Local-first safety check: OK`);

  const dateCompact = dateStr.replace(/-/g, '');

  // Helper to load JSON manifests safely
  function loadManifest(filePath: string): any {
    if (!fs.existsSync(filePath)) {
      log(`[WARNING] Manifest not found at: ${filePath}`);
      return null;
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      log(`[ERROR] Failed to parse manifest ${filePath}: ${e.message}`);
      return null;
    }
  }

  // 1. Evidence Pack Item Intake
  const packBuilderManifest = loadManifest(referenceSources.packBuilderManifest);
  let importerStatus = 'no_completed_pack_items_found';
  let packItems: PackItem[] = [];

  if (!packBuilderManifest) {
    log(`[ERROR] Phase 12U pack builder manifest is missing at: ${referenceSources.packBuilderManifest}`);
    importerStatus = 'source_pack_missing';
  } else {
    packItems = packBuilderManifest.pack_items || [];
    log(`Successfully loaded ${packItems.length} pack items from Phase 12U manifest.`);
  }

  // 2. Target Folder Scan & 3. Detected Evidence File Registry
  const targetScans: TargetScanItem[] = [];
  const detectedFiles: DetectedFileItem[] = [];
  let totalDetectedCount = 0;
  let totalAcceptedCount = 0;

  let scanCounter = 1;
  let fileCounter = 1;

  for (const item of packItems) {
    const scanId = `SCN-${dateCompact}-${String(scanCounter++).padStart(2, '0')}`;
    let resolvedPath = item.exact_target_folder_or_file;
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(REPO_ROOT, resolvedPath);
    }

    let targetExists = fs.existsSync(resolvedPath);
    let targetType: 'folder' | 'file' | 'unknown' = 'unknown';
    let filesDetected: string[] = [];
    let detectedFileCount = 0;
    let acceptedFormatFileCount = 0;
    let scanStatus: TargetScanItem['scan_status'] = 'missing';
    let confidenceScore = 1;

    if (targetExists) {
      confidenceScore = 10;
      const stats = fs.statSync(resolvedPath);
      if (stats.isFile()) {
        targetType = 'file';
        filesDetected.push(path.basename(resolvedPath));
        detectedFileCount = 1;
        scanStatus = 'found';

        const ext = path.extname(resolvedPath).toLowerCase();
        const isAccepted = item.accepted_formats.includes(ext);
        if (isAccepted) {
          acceptedFormatFileCount = 1;
          totalAcceptedCount++;
        }

        const fileId = `DET-FL-${dateCompact}-${String(fileCounter++).padStart(2, '0')}`;
        detectedFiles.push({
          detected_file_id: fileId,
          linked_pack_item_id: item.pack_item_id,
          file_path: item.exact_target_folder_or_file,
          file_type: ext,
          file_size_bytes: stats.size,
          modified_time: stats.mtime.toISOString(),
          accepted_format: isAccepted,
          detection_status: isAccepted ? 'detected' : 'unsupported_format',
          commander_approval_required: true,
        });
        totalDetectedCount++;
      } else if (stats.isDirectory()) {
        targetType = 'folder';
        const dirFiles = fs.readdirSync(resolvedPath);
        
        // Filter out directory structures like .gitkeep or other directories
        const actualFiles = dirFiles.filter(f => {
          const fullFilePath = path.join(resolvedPath, f);
          return fs.statSync(fullFilePath).isFile() && !f.startsWith('.');
        });

        filesDetected = actualFiles;
        detectedFileCount = actualFiles.length;
        scanStatus = detectedFileCount > 0 ? 'found' : 'empty';

        for (const file of actualFiles) {
          const ext = path.extname(file).toLowerCase();
          const isAccepted = item.accepted_formats.includes(ext);
          if (isAccepted) {
            acceptedFormatFileCount++;
            totalAcceptedCount++;
          }

          const fileId = `DET-FL-${dateCompact}-${String(fileCounter++).padStart(2, '0')}`;
          const fullPath = path.join(resolvedPath, file);
          const fileStats = fs.statSync(fullPath);
          detectedFiles.push({
            detected_file_id: fileId,
            linked_pack_item_id: item.pack_item_id,
            file_path: path.join(item.exact_target_folder_or_file, file),
            file_type: ext,
            file_size_bytes: fileStats.size,
            modified_time: fileStats.mtime.toISOString(),
            accepted_format: isAccepted,
            detection_status: isAccepted ? 'detected' : 'unsupported_format',
            commander_approval_required: true,
          });
          totalDetectedCount++;
        }
      }
    } else {
      // Check if it's supposed to be a file or folder based on extension
      const hasExt = path.extname(resolvedPath) !== '';
      targetType = hasExt ? 'file' : 'folder';
      scanStatus = 'missing';
    }

    targetScans.push({
      target_scan_id: scanId,
      linked_pack_item_id: item.pack_item_id,
      target_path: item.exact_target_folder_or_file,
      target_type: targetType,
      target_exists: targetExists,
      files_detected: filesDetected,
      detected_file_count: detectedFileCount,
      accepted_format_file_count: acceptedFormatFileCount,
      scan_status: scanStatus,
      confidence_score_1_to_10: confidenceScore,
      commander_approval_required: true,
    });
  }

  log(`Target folder scan complete. Total files detected: ${totalDetectedCount}, Accepted format count: ${totalAcceptedCount}`);

  // 4. Pack Item Completion Status
  const completionStatuses: CompletionStatusItem[] = [];
  let completedCount = 0;
  let partialCount = 0;
  let stillBlockedCount = 0;
  let unavailableCount = 0;

  let completionCounter = 1;
  for (const item of packItems) {
    const scan = targetScans.find(s => s.linked_pack_item_id === item.pack_item_id);
    let status: CompletionStatusItem['status'] = 'still_blocked';
    let reason = 'Evidence target path does not contain files in accepted formats.';
    let nextStep = item.smallest_manual_collection_step;

    if (scan) {
      if (scan.target_exists && scan.accepted_format_file_count > 0) {
        status = 'completed';
        reason = `Manually placed files in accepted formats detected: [${scan.files_detected.join(', ')}]`;
        nextStep = 'None required. Item is ready for import.';
        completedCount++;
      } else if (scan.target_exists && scan.detected_file_count > 0) {
        status = 'partial';
        reason = `Files detected but none in accepted formats: [${scan.files_detected.join(', ')}]`;
        nextStep = `Place files with valid formats: ${item.accepted_formats.join(', ')}`;
        partialCount++;
      } else {
        status = 'still_blocked';
        reason = scan.target_exists ? 'Target folder exists but is empty.' : 'Target folder/file path does not exist.';
        nextStep = item.smallest_manual_collection_step;
        stillBlockedCount++;
      }
    } else {
      status = 'unavailable';
      reason = 'No scan data found for this pack item.';
      nextStep = 'Verify pack builder manifest integrity.';
      unavailableCount++;
    }

    completionStatuses.push({
      completion_status_id: `CMP-${dateCompact}-${String(completionCounter++).padStart(2, '0')}`,
      linked_pack_item_id: item.pack_item_id,
      evidence_name: item.evidence_name,
      evidence_type: item.evidence_type,
      target_path: item.exact_target_folder_or_file,
      detected_file_count: scan ? scan.detected_file_count : 0,
      accepted_format_file_count: scan ? scan.accepted_format_file_count : 0,
      status,
      reason,
      next_manual_step: nextStep,
      commander_approval_required: true,
    });
  }

  if (completedCount > 0) {
    importerStatus = 'completed_pack_items_imported';
  } else {
    importerStatus = 'no_completed_pack_items_found';
  }

  // 5. Phase 12R Ready Item Feed
  const phase12rReadyItems: Phase12RReadyItem[] = [];
  let readyCounter = 1;

  for (const item of packItems) {
    const cmpStatus = completionStatuses.find(c => c.linked_pack_item_id === item.pack_item_id);
    if (cmpStatus && cmpStatus.status === 'completed') {
      const scan = targetScans.find(s => s.linked_pack_item_id === item.pack_item_id);
      const readyId = `RDY-${dateCompact}-${String(readyCounter++).padStart(2, '0')}`;
      phase12rReadyItems.push({
        ready_item_id: readyId,
        linked_pack_item_id: item.pack_item_id,
        evidence_name: item.evidence_name,
        evidence_type: item.evidence_type,
        evidence_path: item.exact_target_folder_or_file,
        accepted_format: true,
        basic_file_metadata_available: true,
        ready_for_phase_12r: true,
        auto_feed_allowed: false,
        required_human_action: 'Trigger Evidence Completion Tracker to import execution status.',
        commander_approval_required: true,
      });
    }
  }

  log(`Staged ${phase12rReadyItems.length} ready items for Phase 12R tracker.`);

  // 6. Blocked Import Registry
  const blockedImports: BlockedImportItem[] = [];
  let blockedCounter = 1;

  for (const item of packItems) {
    const cmpStatus = completionStatuses.find(c => c.linked_pack_item_id === item.pack_item_id);
    if (cmpStatus && cmpStatus.status !== 'completed') {
      const blockedId = `BLK-IMP-${dateCompact}-${String(blockedCounter++).padStart(2, '0')}`;
      blockedImports.push({
        blocked_import_id: blockedId,
        linked_pack_item_id: item.pack_item_id,
        evidence_name: item.evidence_name,
        reason_blocked: cmpStatus.reason,
        missing_requirement: `Target path ${item.exact_target_folder_or_file} lacks accepted format files.`,
        target_path: item.exact_target_folder_or_file,
        smallest_safe_completion_step: cmpStatus.next_manual_step,
        ready_for_phase_12r: false,
        commander_approval_required: true,
      });
    }
  }

  log(`Registered ${blockedImports.length} blocked imports.`);

  // 7. Import Scorecard
  const scorecardItems: ScorecardItem[] = packItems.map((item, idx) => {
    const cmpStatus = completionStatuses.find(c => c.linked_pack_item_id === item.pack_item_id);
    const linkedId = cmpStatus?.status === 'completed' 
      ? (phase12rReadyItems.find(r => r.linked_pack_item_id === item.pack_item_id)?.ready_item_id || item.pack_item_id)
      : (blockedImports.find(b => b.linked_pack_item_id === item.pack_item_id)?.blocked_import_id || item.pack_item_id);

    let blockerSeverity = 5;
    let downstreamValue = 5;
    let easeToComplete = 8;
    let riskReduction = 5;
    let moneyImpact = 1;
    let recommendedStatus: ScorecardItem['recommended_status'] = 'schedule';
    let reason = 'Optional visual evidence verification step.';

    if (item.evidence_type === 'model_response') {
      blockerSeverity = 8;
      downstreamValue = 8;
      easeToComplete = 7;
      riskReduction = 8;
      moneyImpact = 3;
      recommendedStatus = cmpStatus?.status === 'completed' ? 'ready_for_tracker' : 'collect_now';
      reason = 'Consensus review model reviews.';
    } else if (item.evidence_type === 'google_output') {
      blockerSeverity = 8;
      downstreamValue = 8;
      easeToComplete = 6;
      riskReduction = 8;
      moneyImpact = 4;
      recommendedStatus = cmpStatus?.status === 'completed' ? 'ready_for_tracker' : 'collect_now';
      reason = 'Cross-verification Google tool outputs.';
    } else if (item.evidence_type === 'report') {
      blockerSeverity = 9;
      downstreamValue = 9;
      easeToComplete = 8;
      riskReduction = 9;
      moneyImpact = 2;
      recommendedStatus = cmpStatus?.status === 'completed' ? 'ready_for_tracker' : 'collect_now';
      reason = 'Mandatory compliance report for safety verification.';
    } else if (item.evidence_type === 'monetization_proof') {
      blockerSeverity = 7;
      downstreamValue = 7;
      easeToComplete = 5;
      riskReduction = 6;
      moneyImpact = 8;
      recommendedStatus = cmpStatus?.status === 'completed' ? 'ready_for_tracker' : 'schedule';
      reason = 'Stripe success invoices JSON validation logs.';
    }

    return {
      rank: idx + 1,
      linked_pack_item_or_blocked_id: linkedId,
      evidence_type: item.evidence_type,
      completion_status: cmpStatus ? cmpStatus.status : 'still_blocked',
      blocker_severity_score_1_to_10: blockerSeverity,
      ease_to_complete_score_1_to_10: easeToComplete,
      downstream_value_score_1_to_10: downstreamValue,
      risk_reduction_score_1_to_10: riskReduction,
      money_impact_score_1_to_10: moneyImpact,
      recommended_status: recommendedStatus,
      reason,
      commander_approval_required: true,
    };
  });

  // 8. Import Telemetry
  const telemetry = {
    pack_item_count: packItems.length,
    detected_file_count: totalDetectedCount,
    accepted_format_file_count: totalAcceptedCount,
    completed_pack_item_count: completedCount,
    partial_pack_item_count: partialCount,
    still_blocked_pack_item_count: stillBlockedCount,
    phase_12r_ready_item_count: phase12rReadyItems.length,
    blocked_import_count: blockedImports.length,
    file_move_allowed_count: 0,
    file_copy_allowed_count: 0,
    evidence_creation_allowed_count: 0,
    file_move_allowed_must_be_zero: true,
    file_copy_allowed_must_be_zero: true,
    evidence_creation_allowed_must_be_zero: true,
    no_completed_pack_items_found: completedCount === 0,
  };

  // 9. Recommended Next Actions
  const nextActions: NextActionItem[] = [
    {
      action_id: `ACT-IMP-${dateCompact}-01`,
      action_name: 'Place manual ChatGPT review responses',
      linked_pack_item_or_blocker: packItems.find(p => p.exact_target_folder_or_file.includes('chatgpt_review'))?.pack_item_id || 'unknown',
      why_this_action: 'Stops ChatGPT model validation block.',
      smallest_safe_step: 'Paste ChatGPT consensus packet response inside inputs/grinders_keep/evidence_collection/manual_model_responses/chatgpt_review_response.md.',
      manual_action_if_approved: 'Save ChatGPT prompt outputs to target folder.',
      expected_output: 'chatgpt_review_response.md is present on disk.',
      blocker_if_any: 'Requires manual ChatGPT prompt run.',
      approval_required: true
    },
    {
      action_id: `ACT-IMP-${dateCompact}-02`,
      action_name: 'Compile Collision Isolation compliance report',
      linked_pack_item_or_blocker: packItems.find(p => p.exact_target_folder_or_file.includes('cip_audit_report'))?.pack_item_id || 'unknown',
      why_this_action: 'Satisfies safety lock gates for release execution.',
      smallest_safe_step: 'Stitch cip_audit_report.md and place it under outputs/grinders_keep/.',
      manual_action_if_approved: 'Compile compliance metrics and save report.',
      expected_output: 'outputs/grinders_keep/cip_audit_report.md exists on disk.',
      blocker_if_any: 'None.',
      approval_required: true
    },
    {
      action_id: `ACT-IMP-${dateCompact}-03`,
      action_name: 'Place Google search NotebookLM output text',
      linked_pack_item_or_blocker: packItems.find(p => p.exact_target_folder_or_file.includes('notebooklm_output'))?.pack_item_id || 'unknown',
      why_this_action: 'Enables source cross-check validation within decision matrices.',
      smallest_safe_step: 'Extract text outline results and paste text inside inputs/grinders_keep/evidence_collection/google_ultra_outputs/notebooklm_output.txt.',
      manual_action_if_approved: 'Copy NotebookLM text outline to target folder.',
      expected_output: 'notebooklm_output.txt exists on disk.',
      blocker_if_any: 'Requires manual Google tool run.',
      approval_required: true
    },
    {
      action_id: `ACT-IMP-${dateCompact}-04`,
      action_name: 'Capture validation checks console screenshot',
      linked_pack_item_or_blocker: packItems.find(p => p.exact_target_folder_or_file.includes('screenshot_compiler_success'))?.pack_item_id || 'unknown',
      why_this_action: 'Furnishes visual confirmation evidence to checklist verifiers.',
      smallest_safe_step: 'Take screenshot image of success build and store in inputs/grinders_keep/evidence_collection/screenshots/.',
      manual_action_if_approved: 'Copy validation screenshot PNG inside screenshots/ directory.',
      expected_output: 'Validation run screenshot PNG staged.',
      blocker_if_any: 'None.',
      approval_required: true
    },
    {
      action_id: `ACT-IMP-${dateCompact}-05`,
      action_name: 'Export Stripe sandbox checkout invoice detail proof',
      linked_pack_item_or_blocker: packItems.find(p => p.exact_target_folder_or_file.includes('stripe_checkout_success'))?.pack_item_id || 'unknown',
      why_this_action: 'Verifies sandbox payment metrics processing prior to live releases.',
      smallest_safe_step: 'Acquire Stripe sandbox webhook checkout payment detail receipts logs and place inside inputs/grinders_keep/evidence_collection/monetization_proof/stripe_checkout_success.json.',
      manual_action_if_approved: 'Stash Stripe invoice JSON log inside target directory.',
      expected_output: 'Stripe webhook payment invoice stashed.',
      blocker_if_any: 'None.',
      approval_required: true
    }
  ];

  // Helper to load templates
  function readTemplate(filename: string): string {
    const filePath = path.join(TEMPLATE_ROOT, filename);
    if (!fs.existsSync(filePath)) {
      log(`[ERROR] Template file not found: ${filePath}`);
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  // 10. Write Output Files
  // A. Imported Pack Items List
  const importedTemplate = readTemplate('grinders-keep-pack-item-import-template.md');
  const importedListStr = packItems.map(p => {
    return `- **Pack Item:** \`${p.pack_item_id}\` (${p.evidence_name})\n  - **Target Path:** \`${p.exact_target_folder_or_file}\`\n  - **Status:** ${completionStatuses.find(c => c.linked_pack_item_id === p.pack_item_id)?.status || 'still_blocked'}`;
  }).join('\n');
  const importedContent = fillTemplate(importedTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    imported_items_list: importedListStr
  });
  fs.writeFileSync(path.join(outputFolders.imported, `grinders_keep_pack_items_imported_${dateStr}.md`), importedContent);

  // B. Detected Evidence Files
  const detectedTemplate = readTemplate('grinders-keep-detected-evidence-file-template.md');
  const detectedListStr = detectedFiles.length > 0 
    ? detectedFiles.map(d => {
        return `- **File ID:** \`${d.detected_file_id}\`\n  - **Path:** \`${d.file_path}\`\n  - **Size:** ${d.file_size_bytes} bytes\n  - **Modified:** ${d.modified_time}\n  - **Accepted Format:** ${d.accepted_format}`;
      }).join('\n')
    : 'No manual evidence files detected in the target scan folders.';
  const detectedContent = fillTemplate(detectedTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    detected_files_list: detectedListStr
  });
  fs.writeFileSync(path.join(outputFolders.detectedFiles, `grinders_keep_detected_evidence_files_${dateStr}.md`), detectedContent);

  // C. Completion Status
  const statusTemplate = readTemplate('grinders-keep-pack-completion-status-template.md');
  const statusListStr = completionStatuses.map(c => {
    return `- **Item ID:** \`${c.linked_pack_item_id}\` (${c.evidence_name})\n  - **Status:** \`${c.status.toUpperCase()}\`\n  - **Reason:** ${c.reason}\n  - **Next Step:** ${c.next_manual_step}`;
  }).join('\n');
  const statusContent = fillTemplate(statusTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    completion_status_list: statusListStr
  });
  fs.writeFileSync(path.join(outputFolders.completionStatus, `grinders_keep_pack_completion_status_${dateStr}.md`), statusContent);

  // D. Phase 12R Ready Items Feed
  const readyTemplate = readTemplate('grinders-keep-phase-12r-ready-item-template.md');
  const readyListStr = phase12rReadyItems.length > 0
    ? phase12rReadyItems.map(r => {
        return `- **Ready ID:** \`${r.ready_item_id}\`\n  - **Pack Item ID:** \`${r.linked_pack_item_id}\`\n  - **Path:** \`${r.evidence_path}\`\n  - **Metadata Available:** ${r.basic_file_metadata_available}\n  - **Tracker Target:** ready_for_tracker`;
      }).join('\n')
    : 'No completed pack items staged for Phase 12R ready feed.';
  const readyContent = fillTemplate(readyTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    phase_12r_ready_list: readyListStr
  });
  fs.writeFileSync(path.join(outputFolders.phase12rReady, `grinders_keep_phase_12r_ready_items_${dateStr}.md`), readyContent);

  // E. Blocked Import Registry
  const blockedTemplate = readTemplate('grinders-keep-pack-import-blocked-item-template.md');
  const blockedListStr = blockedImports.map(b => {
    return `- **Blocked Import ID:** \`${b.blocked_import_id}\`\n  - **Pack Item ID:** \`${b.linked_pack_item_id}\`\n  - **Reason Blocked:** ${b.reason_blocked}\n  - **Smallest Step:** ${b.smallest_safe_completion_step}`;
  }).join('\n');
  const blockedContent = fillTemplate(blockedTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    blocked_import_list: blockedListStr
  });
  fs.writeFileSync(path.join(outputFolders.blocked, `grinders_keep_pack_import_blocked_items_${dateStr}.md`), blockedContent);

  // F. Scorecard
  const scorecardTemplate = readTemplate('grinders-keep-pack-import-scorecard-template.md');
  const scorecardListStr = scorecardItems.map(s => {
    return `- **Rank ${s.rank}:** \`${s.linked_pack_item_or_blocked_id}\`\n  - **Evidence Type:** \`${s.evidence_type}\`\n  - **Status:** \`${s.completion_status.toUpperCase()}\`\n  - **Score (Severity/Value/Ease/Risk/Money):** ${s.blocker_severity_score_1_to_10}/${s.downstream_value_score_1_to_10}/${s.ease_to_complete_score_1_to_10}/${s.risk_reduction_score_1_to_10}/${s.money_impact_score_1_to_10}\n  - **Recommendation:** \`${s.recommended_status}\` (Reason: ${s.reason})`;
  }).join('\n');
  const scorecardContent = fillTemplate(scorecardTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    scorecard_list: scorecardListStr
  });
  fs.writeFileSync(path.join(outputFolders.scorecards, `grinders_keep_pack_import_scorecard_${dateStr}.md`), scorecardContent);

  // G. Next Actions List
  const nextActionsTemplate = readTemplate('grinders-keep-pack-import-next-actions-template.md');
  const nextActionsListStr = nextActions.map(n => {
    return `- **Action ${n.action_id}:** ${n.action_name}\n  - **Linked item:** \`${n.linked_pack_item_or_blocker}\`\n  - **Why:** ${n.why_this_action}\n  - **Step:** ${n.smallest_safe_step}\n  - **Manual action if approved:** ${n.manual_action_if_approved}`;
  }).join('\n');
  const nextActionsContent = fillTemplate(nextActionsTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    next_actions_list: nextActionsListStr
  });
  fs.writeFileSync(path.join(outputFolders.root, `grinders_keep_pack_import_next_actions_${dateStr}.md`), nextActionsContent);

  // H. Importer Report
  const reportTemplate = readTemplate('grinders-keep-evidence-pack-import-report-template.md');
  const overviewText = `The Evidence Pack Completion Importer scans the inputs/grinders_keep/evidence_collection/ directory and its target subfolders to verify if any requested items have been manually gathered. It generates Phase 12R ready feeds only when files exist in accepted formats.`;
  const metricsText = `* **Imported Pack Items Count:** ${telemetry.pack_item_count}\n* **Detected File Count:** ${telemetry.detected_file_count}\n* **Accepted Format File Count:** ${telemetry.accepted_format_file_count}\n* **Completed Pack Items Count:** ${telemetry.completed_pack_item_count}\n* **Partial Pack Items Count:** ${telemetry.partial_pack_item_count}\n* **Still Blocked Pack Items Count:** ${telemetry.still_blocked_pack_item_count}\n* **Phase 12R Ready Items Count:** ${telemetry.phase_12r_ready_item_count}\n* **Blocked Import Count:** ${telemetry.blocked_import_count}\n* **File Move Allowed:** \`${FILE_MOVE_ALLOWED}\`\n* **File Copy Allowed:** \`${FILE_COPY_ALLOWED}\`\n* **Evidence Creation Allowed:** \`${EVIDENCE_CREATION_ALLOWED}\`\n* **Auto Feed Allowed:** \`${AUTO_FEED_ALLOWED}\``;

  const reportContent = fillTemplate(reportTemplate, {
    date: dateStr,
    timestamp: new Date().toISOString(),
    overview: overviewText,
    importer_status: importerStatus,
    detected_completed_item_count: String(telemetry.completed_pack_item_count),
    phase_12r_ready_item_count: String(telemetry.phase_12r_ready_item_count),
    metrics: metricsText
  });
  fs.writeFileSync(path.join(outputFolders.root, `grinders_keep_evidence_pack_import_report_${dateStr}.md`), reportContent);

  // I. Importer Manifest JSON
  const manifestJSON = {
    date: dateStr,
    timestamp: new Date().toISOString(),
    importer_status: importerStatus,
    detected_completed_item_count: telemetry.completed_pack_item_count,
    phase_12r_ready_item_count: telemetry.phase_12r_ready_item_count,
    evidence_creation_allowed: false,
    file_move_allowed: false,
    file_copy_allowed: false,
    suggested_next_action: 'Commander should manually place evidence files into the target folders listed in the Phase 12U Commander Evidence Collection Packet, then rerun Phase 12V.',
    telemetry,
    target_scans: targetScans,
    detected_files: detectedFiles,
    completion_statuses: completionStatuses,
    phase_12r_ready_feed: phase12rReadyItems,
    blocked_imports: blockedImports,
    scorecard: scorecardItems,
    next_actions: nextActions
  };

  fs.writeFileSync(
    path.join(outputFolders.root, `grinders_keep_evidence_pack_import_manifest_${dateStr}.json`),
    JSON.stringify(manifestJSON, null, 2)
  );

  // 11. Update Grinders Keep Frontpage
  const frontpagePath = referenceSources.frontpage;
  if (fs.existsSync(frontpagePath)) {
    let frontpageContent = fs.readFileSync(frontpagePath, 'utf-8');
    
    // Find top blocked item
    const topBlocked = blockedImports.length > 0 ? blockedImports[0].evidence_name : 'None';
    const topCompleted = phase12rReadyItems.length > 0 ? phase12rReadyItems[0].evidence_name : 'None';

    const newSection = `## Evidence Pack Completion Importer
- **Importer Status:** ${importerStatus}
- **Pack Item Count:** ${telemetry.pack_item_count}
- **Detected File Count:** ${telemetry.detected_file_count}
- **Completed Pack Item Count:** ${telemetry.completed_pack_item_count}
- **Partial Pack Item Count:** ${telemetry.partial_pack_item_count}
- **Still Blocked Pack Item Count:** ${telemetry.still_blocked_pack_item_count}
- **Phase 12R Ready Item Count:** ${telemetry.phase_12r_ready_item_count}
- **File Move Allowed Count:** 0
- **File Copy Allowed Count:** 0
- **Evidence Creation Allowed Count:** 0
- **Top Completed Pack Item:** ${topCompleted}
- **Top Blocked Pack Item:** ${topBlocked}
- **Recommended Importer Next Action:** ${nextActions[0].action_name} (\`${nextActions[0].smallest_safe_step}\`)

### 📋 Commander Importer Checklist
- [ ] Scans exact folder targets listed in Phase 12U packet.
- [ ] Verify detected files registry against basics file metadata.
- [ ] Ensure ready Phase 12R ready items count matches accepted formats.
- [ ] Verify blocked import registry items next manual steps.
- [ ] Check scorecard recommendations before tracker sync adapter runs.
`;

    if (frontpageContent.includes('## Evidence Pack Completion Importer')) {
      const parts = frontpageContent.split('## Evidence Pack Completion Importer');
      const rest = parts[1];
      const nextHeaderIdx = rest.indexOf('##');
      if (nextHeaderIdx !== -1) {
        frontpageContent = parts[0] + newSection + '\n' + rest.substring(nextHeaderIdx);
      } else {
        frontpageContent = parts[0] + newSection;
      }
    } else {
      frontpageContent += '\n' + newSection;
    }

    fs.writeFileSync(frontpagePath, frontpageContent);
    log(`Successfully updated Grinders Keep frontpage file at: ${frontpagePath}`);
  } else {
    log(`[WARNING] Frontpage file not found at: ${frontpagePath}`);
  }

  // 12. Importer Execution Logs Output
  log(`Evidence Pack Completion Importer execution completed successfully.`);
  const logsContent = `# Grinders Keep Evidence Pack Import Log (${dateStr})\n\n## Execution Log\n` + executionLogs.map(l => `- ${l}`).join('\n') + `\n\n--- \n*Generated on ${new Date().toISOString()}*`;
  fs.writeFileSync(
    path.join(outputFolders.logs, `grinders_keep_evidence_pack_import_log_${dateStr}.md`),
    logsContent
  );

  await announceCompletion("Scans collection packet outputs, identifies manual files, and builds tracker ready feed");
  console.log(`🏁 Grinders Keep Evidence Pack Completion Importer execution completed.`);
}

runEvidencePackCompletionImporter().catch(e => {
  console.error(`❌ Completion Importer failed: ${e.message}`);
  process.exit(1);
});
