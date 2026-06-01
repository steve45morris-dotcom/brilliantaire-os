import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  APPROVAL_GATE_ONLY,
  ALLOW_FILE_DELETION,
  ALLOW_FILE_MOVEMENT,
  ALLOW_SOURCE_MODIFICATION,
  REQUIRE_MANUAL_REVIEW,
  REQUIRE_APPROVAL_BEFORE_QUARANTINE,
  inputFolders,
  outputFolders,
  APPROVAL_CATEGORIES,
  DO_NOT_TOUCH_PATTERNS,
  REPO_ROOT
} from '../config/cleanup-approval.js';

const NOW = new Date('2026-06-01T11:38:55-07:00');

interface StagedCandidate {
  candidate: string;
  duplicateGroup: string;
  reason: string;
  confidence: string;
  proposedAction: string;
  category: string;
  eligible: boolean;
  riskLevel: string;
  requiredApproval: boolean;
  nextAction: string;
  doNotTouch: boolean;
}

function ensureDirectories() {
  Object.values(outputFolders).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function getFormattedDate(date: Date = NOW): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLatestFile(dir: string, pattern: RegExp): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const matched = files
    .filter(f => pattern.test(f))
    .map(f => ({ name: f, fullPath: path.join(dir, f), stat: fs.statSync(path.join(dir, f)) }))
    .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
  return matched.length > 0 ? matched[0].fullPath : null;
}

function matchesDoNotTouch(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return DO_NOT_TOUCH_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return normalized.includes('/' + pattern) || normalized.startsWith(pattern);
    } else {
      return normalized.endsWith('/' + pattern) || normalized === pattern;
    }
  });
}

// Write operation audit log
function writeAuditLog(subcommand: string, outcome: string, candidatesCount: number) {
  const logDir = outputFolders.logs;
  const dateStr = getFormattedDate();
  const logFile = path.join(logDir, `cleanup_approval_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();

  let entry = `## [${timestamp}] Subcommand Executed: "${subcommand}"\n`;
  entry += `- **Staging Gate Mode:** \`Read-Only Staging Gate\`\n`;
  entry += `- **Outcome Status:** \`${outcome}\`\n`;
  entry += `- **Candidates Impacted:** \`${candidatesCount}\`\n`;
  entry += `\n---\n\n`;

  fs.appendFileSync(logFile, entry);
}

// Parse reports and build unified candidates list
function loadAndClassifyCandidates(): {
  candidates: StagedCandidate[];
  duplicateGroupsReviewed: string[];
  missingSources: string[];
} {
  const candidates: StagedCandidate[] = [];
  const missingSources: string[] = [];
  const duplicateGroupsReviewed: string[] = [];

  const latestScanReport = getLatestFile(inputFolders.reports, /duplicate_scan_report_(\d{4}-\d{2}-\d{2})/);
  const latestQuarantineIndex = getLatestFile(inputFolders.quarantineIndex, /cleanup_quarantine_index_(\d{4}-\d{2}-\d{2})/);
  const latestReviewList = getLatestFile(inputFolders.reviewLists, /cleanup_review_list_(\d{4}-\d{2}-\d{2})/);

  if (!latestScanReport) missingSources.push('latest scan report (reports/duplicate_scan_report_YYYY-MM-DD.md)');
  if (!latestQuarantineIndex) missingSources.push('latest quarantine index (quarantine_index/cleanup_quarantine_index_YYYY-MM-DD.md)');
  if (!latestReviewList) missingSources.push('latest review list (review_lists/cleanup_review_list_YYYY-MM-DD.md)');

  if (missingSources.length > 0) {
    return { candidates, duplicateGroupsReviewed, missingSources };
  }

  // Parse groups from scan report
  try {
    const scanContent = fs.readFileSync(latestScanReport!, 'utf-8');
    const matches = scanContent.match(/### Group \d+: [^\n]+/g);
    if (matches) {
      duplicateGroupsReviewed.push(...matches.map(m => m.replace(/### Group \d+: /, '').trim()));
    }
  } catch (err) {
    missingSources.push('error parsing duplicate groups from scan report');
  }

  // Parse index
  let indexRows: { candidate: string; reason: string; risk: string; recommendation: string }[] = [];
  try {
    const indexContent = fs.readFileSync(latestQuarantineIndex!, 'utf-8');
    const lines = indexContent.split('\n');
    const lineRegex = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;
    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        indexRows.push({
          candidate: match[1].trim(),
          reason: match[3].trim(),
          risk: match[4].trim(),
          recommendation: match[5].trim()
        });
      }
    }
  } catch (err) {
    missingSources.push('error parsing quarantine index');
  }

  // Parse review list
  let reviewItems: { candidate: string; confidence: string; category: string; action: string; reason: string; doNotTouch: boolean }[] = [];
  try {
    const reviewContent = fs.readFileSync(latestReviewList!, 'utf-8');
    const lines = reviewContent.split('\n');
    let currentConfidence = 'Low';
    const lineRegex = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;
    const shortLineRegex = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;

    for (const line of lines) {
      if (line.includes('## 👥 High Confidence Candidates')) {
        currentConfidence = 'High';
        continue;
      }
      if (line.includes('## 👥 Low Confidence Candidates')) {
        currentConfidence = 'Low';
        continue;
      }
      if (line.includes('## ⛔ Do-Not-Touch Files')) {
        currentConfidence = 'Critical';
        continue;
      }

      const match = line.match(lineRegex) || line.match(shortLineRegex);
      if (match) {
        const candidate = match[1].trim();
        const confidence = match[3] ? match[3].trim() : currentConfidence;
        const category = match[4] ? match[4].trim() : '';
        const action = match[5] ? match[5].trim() : '';
        const reason = match[6] ? match[6].trim() : '';
        const doNotTouch = match[7] ? match[7].trim().toLowerCase().includes('yes') : (currentConfidence === 'Critical');

        reviewItems.push({
          candidate,
          confidence,
          category,
          action,
          reason,
          doNotTouch
        });
      }
    }
  } catch (err) {
    missingSources.push('error parsing review list');
  }

  // Map and classify
  indexRows.forEach(row => {
    const rev = reviewItems.find(r => r.candidate === row.candidate);
    const isDoNotTouch = matchesDoNotTouch(row.candidate) || (rev?.doNotTouch ?? false);

    let category = APPROVAL_CATEGORIES.NEEDS_MANUAL_REVIEW;
    let eligible = false;
    let riskLevel = row.risk;
    let requiredApproval = REQUIRE_APPROVAL_BEFORE_QUARANTINE;
    let nextAction = 'Needs manual inspection.';
    let confidence = rev?.confidence ?? 'Low';
    let proposedAction = rev?.action ?? 'Hold for review';
    let duplicateGroup = 'Unknown Group';

    // Find duplicate group from index reason
    // Reason contains: "Timestamp variant of newer file [x]"
    const groupMatch = row.reason.match(/variant of newer file \[([^\]]+)\]/);
    if (groupMatch) {
      duplicateGroup = groupMatch[1];
    }

    if (isDoNotTouch) {
      category = APPROVAL_CATEGORIES.DO_NOT_TOUCH;
      eligible = false;
      riskLevel = 'Critical';
      requiredApproval = false;
      proposedAction = 'Do Not Touch';
      nextAction = 'Protected system target. Retain in place.';
    } else if (confidence === 'High') {
      category = APPROVAL_CATEGORIES.APPROVE_FOR_QUARANTINE;
      eligible = true;
      riskLevel = 'Low';
      nextAction = 'Stage for quarantine approval.';
    } else if (confidence === 'Low') {
      category = APPROVAL_CATEGORIES.LOW_CONFIDENCE_DUPLICATE;
      eligible = false;
      riskLevel = 'Medium';
      nextAction = 'Confirm variant importance before quarantine.';
    }

    if (row.reason.toLowerCase().includes('orphan')) {
      category = APPROVAL_CATEGORIES.ORPHAN_CANDIDATE;
      riskLevel = 'Medium';
      nextAction = 'Verify missing source files before clearing.';
    }

    candidates.push({
      candidate: row.candidate,
      duplicateGroup,
      reason: row.reason,
      confidence,
      proposedAction,
      category,
      eligible,
      riskLevel,
      requiredApproval,
      nextAction,
      doNotTouch: isDoNotTouch
    });
  });

  return { candidates, duplicateGroupsReviewed, missingSources };
}

// 1. Classify command logic
function handleClassify(
  candidates: StagedCandidate[],
  groups: string[],
  missing: string[],
  dateStr: string
) {
  const templatePath = path.join(outputFolders.templates, 'quarantine-eligibility-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Format eligibility list
  let eligibleRows = candidates.map(c => {
    return `| [${c.candidate}](file://${path.join(REPO_ROOT, c.candidate)}) | ${c.eligible ? 'Yes' : 'No'} | ${c.reason} | ${c.riskLevel} | ${c.requiredApproval ? 'Yes' : 'No'} | ${c.nextAction} |`;
  }).join('\n');

  if (!eligibleRows) {
    if (missing.length > 0) {
      eligibleRows = `| *source_status: missing* | *evidence_status: unavailable* | *confidence_score_1_to_10: 1* | High | N/A | Missing index source files. Rerun duplicate-cleanup first. |`;
    } else {
      eligibleRows = `| None | N/A | No files processed | N/A | N/A | N/A |`;
    }
  }

  // Format final report
  let reportContent = `# 🔍 Cleanup Classification Report
**Report Date:** ${dateStr}

## 👥 Duplicate Groups Reviewed
${groups.length > 0 ? groups.map(g => `- \`${g}\``).join('\n') : '*No duplicate groups identified.*'}

## 📂 Candidate Counts
- **High-Confidence Candidates:** ${candidates.filter(c => c.confidence === 'High').length}
- **Low-Confidence Candidates:** ${candidates.filter(c => c.confidence === 'Low').length}
- **Do-Not-Touch Candidates:** ${candidates.filter(c => c.doNotTouch).length}
- **Quarantine-Eligible Candidates:** ${candidates.filter(c => c.eligible).length}
- **Candidates Needing Manual Review:** ${candidates.filter(c => c.category === APPROVAL_CATEGORIES.NEEDS_MANUAL_REVIEW || c.category === APPROVAL_CATEGORIES.LOW_CONFIDENCE_DUPLICATE).length}

---

## 🔒 Quarantine Eligibility Verification
${template.replace('{{AUDIT_DATE}}', dateStr).replace('{{QUARANTINE_ELIGIBILITY_ROWS}}', eligibleRows)}

---

## ⚠️ Risk Notes
1. **Approval Gate Only:** Direct file deletion is completely disabled. No files were deleted or moved.
2. **Protected Integrity:** Protected files like command routers, system configurations, and git directories are automatically classified as Do-Not-Touch.

## 🚀 Next Action
Review the staged approval list to confirm manual quarantine permissions.
`;

  const outPath = path.join(outputFolders.reports, `cleanup_classification_report_${dateStr}.md`);
  fs.writeFileSync(outPath, reportContent);
  console.log(`✅ Classification report generated: [cleanup_classification_report_${dateStr}.md](file://${outPath})`);
  writeAuditLog('classify', 'Success', candidates.length);
}

// 2. Approval List command logic
function handleApprovalList(candidates: StagedCandidate[], missing: string[], dateStr: string) {
  const templatePath = path.join(outputFolders.templates, 'approval-matrix-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  let rows = candidates.map(c => {
    return `| [${c.candidate}](file://${path.join(REPO_ROOT, c.candidate)}) | ${c.duplicateGroup} | ${c.reason} | ${c.confidence} | ${c.proposedAction} | [ ] Approve | ${c.nextAction} |`;
  }).join('\n');

  if (!rows) {
    if (missing.length > 0) {
      rows = `| *source_status: missing* | *evidence_status: unavailable* | *confidence_score_1_to_10: 1* | High | N/A | [ ] Blocked | Missing index source files |`;
    } else {
      rows = `| None | N/A | N/A | N/A | N/A | [ ] | N/A |`;
    }
  }

  template = template
    .replace('{{STAGING_DATE}}', dateStr)
    .replace('{{TOTAL_STAGED}}', String(candidates.length))
    .replace('{{APPROVAL_MATRIX_ROWS}}', rows);

  const outPath = path.join(outputFolders.approvalLists, `cleanup_approval_list_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Approval list generated: [cleanup_approval_list_${dateStr}.md](file://${outPath})`);
  writeAuditLog('approval-list', 'Success', candidates.length);
}

// 3. Do Not Touch command logic
function handleDoNotTouch(candidates: StagedCandidate[], missing: string[], dateStr: string) {
  const templatePath = path.join(outputFolders.templates, 'do-not-touch-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  // Load custom do-not-touch items
  const protectedItems = candidates.filter(c => c.doNotTouch);
  
  // Format general protection registry table including standard patterns
  const standardProtectedRows = DO_NOT_TOUCH_PATTERNS.map(pattern => {
    return `| \`${pattern}\` | Protected system file or folder | Critical system breakdown / merge failure | Retain in place, modifications blocked |`;
  }).join('\n');

  const customProtectedRows = protectedItems.map(c => {
    return `| [${c.candidate}](file://${path.join(REPO_ROOT, c.candidate)}) | Staged candidate matching protection rules | Potential system failure | Retain in place, cleanup blocked |`;
  }).join('\n');

  const allRows = [standardProtectedRows, customProtectedRows].filter(Boolean).join('\n');

  template = template
    .replace('{{GENERATION_DATE}}', dateStr)
    .replace('{{PROTECTED_RULES_COUNT}}', String(DO_NOT_TOUCH_PATTERNS.length + protectedItems.length))
    .replace('{{DO_NOT_TOUCH_ROWS}}', allRows);

  const outPath = path.join(outputFolders.doNotTouch, `cleanup_do_not_touch_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Do-Not-Touch list generated: [cleanup_do_not_touch_${dateStr}.md](file://${outPath})`);
  writeAuditLog('do-not-touch', 'Success', protectedItems.length);
}

// 4. Summary command logic
function handleSummary(candidates: StagedCandidate[], groupsCount: number, missing: string[], dateStr: string) {
  const templatePath = path.join(outputFolders.templates, 'approval-summary-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  let template = fs.readFileSync(templatePath, 'utf8');

  const approved = candidates.filter(c => c.eligible).length;
  const manual = candidates.filter(c => c.category === APPROVAL_CATEGORIES.NEEDS_MANUAL_REVIEW || c.category === APPROVAL_CATEGORIES.LOW_CONFIDENCE_DUPLICATE).length;
  const protectedCount = candidates.filter(c => c.doNotTouch).length;
  const lowConf = candidates.filter(c => c.confidence === 'Low').length;
  
  const isReady = approved > 0 && missing.length === 0 ? 'READY (Staging Complete)' : 'BLOCKED (Verify inputs)';
  const nextPhase = 'Phase 12C: Quarantine Execution Staging';

  template = template
    .replace('{{REPORT_DATE}}', dateStr)
    .replace('{{TOTAL_DUPLICATE_GROUPS}}', String(groupsCount))
    .replace('{{APPROVED_CANDIDATES_COUNT}}', String(approved))
    .replace('{{MANUAL_REVIEW_COUNT}}', String(manual))
    .replace('{{DO_NOT_TOUCH_COUNT}}', String(protectedCount))
    .replace('{{LOW_CONFIDENCE_COUNT}}', String(lowConf))
    .replace('{{QUARANTINE_READINESS}}', isReady)
    .replace('{{NEXT_PHASE}}', nextPhase);

  const outPath = path.join(outputFolders.reports, `cleanup_approval_summary_${dateStr}.md`);
  fs.writeFileSync(outPath, template);
  console.log(`✅ Approval summary generated: [cleanup_approval_summary_${dateStr}.md](file://${outPath})`);
  writeAuditLog('summary', 'Success', candidates.length);
}

// 5. Status command logic
function handleStatus(candidates: StagedCandidate[], groupsCount: number, missing: string[], dateStr: string) {
  ensureDirectories();

  function getLatestDisplayFile(dir: string, pattern: RegExp): string {
    const filepath = getLatestFile(dir, pattern);
    if (filepath) {
      return `[${path.basename(filepath)}](file://${filepath})`;
    }
    return 'None (Run command first)';
  }

  const latestClassify = getLatestDisplayFile(outputFolders.reports, /^cleanup_classification_report_/);
  const latestApprovalList = getLatestDisplayFile(outputFolders.approvalLists, /^cleanup_approval_list_/);
  const latestDoNotTouch = getLatestDisplayFile(outputFolders.doNotTouch, /^cleanup_do_not_touch_/);
  const latestSummary = getLatestDisplayFile(outputFolders.reports, /^cleanup_approval_summary_/);

  const approved = candidates.filter(c => c.eligible).length;
  const manual = candidates.filter(c => c.category === APPROVAL_CATEGORIES.NEEDS_MANUAL_REVIEW || c.category === APPROVAL_CATEGORIES.LOW_CONFIDENCE_DUPLICATE).length;
  const protectedCount = candidates.filter(c => c.doNotTouch).length;
  const isReady = approved > 0 && missing.length === 0 ? 'READY' : 'BLOCKED';

  console.log("\n=========================================");
  console.log("🛡️ CLEANUP APPROVAL GATE STATUS");
  console.log("=========================================");
  console.log(`- Latest Classification: ${latestClassify}`);
  console.log(`- Latest Approval List:  ${latestApprovalList}`);
  console.log(`- Latest Do Not Touch:   ${latestDoNotTouch}`);
  console.log(`- Latest Summary:        ${latestSummary}`);
  console.log(`- Approval Candidates:   ${approved}`);
  console.log(`- Manual Review Count:   ${manual}`);
  console.log(`- Do Not Touch Count:    ${protectedCount}`);
  console.log(`- Quarantine Readiness:  ${isReady}`);
  console.log(`- Next Recommended Action: Review approval checklist before executing quarantine move.`);
  console.log("=========================================");
}

async function main() {
  ensureDirectories();
  const args = process.argv.slice(2);
  const command = (args[0] || 'help').toLowerCase();

  const { candidates, duplicateGroupsReviewed, missingSources } = loadAndClassifyCandidates();
  const dateStr = getFormattedDate();

  if (missingSources.length > 0) {
    console.warn(`⚠️ Warning: Missing report resources: ${missingSources.join(', ')}`);
    console.warn(`💡 Try running duplicate-cleanup scan/stale reports first.`);
  }

  switch (command) {
    case 'classify':
      handleClassify(candidates, duplicateGroupsReviewed, missingSources, dateStr);
      break;
    case 'approval-list':
      handleApprovalList(candidates, missingSources, dateStr);
      break;
    case 'do-not-touch':
      handleDoNotTouch(candidates, missingSources, dateStr);
      break;
    case 'summary':
      handleSummary(candidates, duplicateGroupsReviewed.length, missingSources, dateStr);
      break;
    case 'status':
      handleStatus(candidates, duplicateGroupsReviewed.length, missingSources, dateStr);
      break;
    case 'help':
    default:
      console.log(`💡 Note: Try 'npm run cleanup-approval-help' for documentation.\n`);
      handleStatus(candidates, duplicateGroupsReviewed.length, missingSources, dateStr);
      break;
  }
}

main().catch(err => {
  console.error("❌ Execution error in Cleanup Approval:", err);
  process.exit(1);
});
