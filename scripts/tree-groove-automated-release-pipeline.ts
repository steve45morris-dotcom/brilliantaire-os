import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PLATFORM_CONFIGS } from '../config/platform-adapters.js';
import { MANUAL_RELEASE_CONFIGS } from '../config/manual-release.js';
import { announceIntent, announceCompletion } from './vnp.js';
import {
  safetyConfigs,
  outputFolders,
  MODULE_NAME
} from '../config/tree-groove-automated-release-pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFormattedTimeSuffix(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `_${hh}${mm}${ss}`;
}

function getUniqueFilePath(folder: string, baseName: string, dateStr: string): string {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  let finalPath = path.join(folder, `${baseName}_${dateStr}.md`);
  if (fs.existsSync(finalPath)) {
    const suffix = getFormattedTimeSuffix();
    finalPath = path.join(folder, `${baseName}_${dateStr}${suffix}.md`);
  }
  return finalPath;
}

function loadTemplate(relativeDir: string, name: string): string {
  const p = path.join(REPO_ROOT, relativeDir, name);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

function getLatestPackage(platform: string): string {
  const adapterConfig = PLATFORM_CONFIGS[platform];
  if (!adapterConfig) return '';
  const folder = path.join(REPO_ROOT, adapterConfig.outputFolder);
  if (!fs.existsSync(folder)) return '';

  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith(`sporty_${platform}_package`) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) return '';
  return path.join(folder, files[files.length - 1]);
}

function getLatestReportPath(platform: string): string {
  const folder = path.join(REPO_ROOT, 'outputs/platform_verification/reports/');
  if (!fs.existsSync(folder)) return '';
  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith(`sporty_${platform}_verification`) && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return '';
  return path.join(folder, files[files.length - 1]);
}

function parseReadinessScore(reportPath: string): number {
  if (!reportPath || !fs.existsSync(reportPath)) return 0;
  const content = fs.readFileSync(reportPath, 'utf-8');
  const match = content.match(/Readiness Score.*?\*\*(\d+)\/100\*\*/i);
  return match ? parseInt(match[1]) : 0;
}

function extractCopyBlock(platform: string, content: string): string {
  const lines = content.split('\n');
  const startIndex = lines.findIndex(l => l.includes('## 📝') || l.includes('## Content Details') || l.includes('## Metadata') || l.includes('## Content') || l.includes('## Details'));
  const endIndex = lines.findIndex((l, idx) => idx > startIndex && l.trim() === '---');
  
  if (startIndex !== -1 && endIndex !== -1) {
    return lines.slice(startIndex, endIndex).join('\n').trim();
  }
  return content;
}

function getAfterPostAction(platform: string): string {
  switch (platform) {
    case 'youtube': return 'Verify video plays cleanly at 1080p+, double-check description links, pin comment.';
    case 'tiktok': return 'Check link in bio sticker is active, watch sound sync.';
    case 'instagram': return 'Confirm Reel plays, verify carousel swipe transitions, check bio CTA link.';
    case 'facebook': return 'Verify CTA link is clickable, pin post to top of Page.';
    case 'whatsapp': return 'Check broadcast messages are delivered, answer early inquiries.';
    case 'obsidian': return 'Check backlink paths in vault, link to live published platform post URLs.';
    default: return 'Confirm live link is recorded.';
  }
}

async function runAutomatedReleasePipeline() {
  const dateStr = getFormattedDate();
  console.log(`📡 Starting ${MODULE_NAME} for ${dateStr}...`);
  await announceIntent("Building automated release pipeline integration for Tree Groove Records");

  // Create folders
  for (const folder of Object.values(outputFolders)) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  const logFile = path.join(outputFolders.logs, `tree_groove_release_pipeline_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  let logContent = `# ${MODULE_NAME} Execution Log: ${dateStr}\n- **Timestamp:** ${timestamp}\n\n`;

  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'];
  const packagesFound: string[] = [];
  const reportsFound: string[] = [];
  let totalScore = 0;
  let readyCount = 0;

  let matrixRows = '| Platform | Package Present | Report Present | Score | Status |\n|---|---|---|---|---|\n';

  platforms.forEach(p => {
    const pkg = getLatestPackage(p);
    const rpt = getLatestReportPath(p);
    const score = parseReadinessScore(rpt);
    
    totalScore += score;
    const isReady = pkg && rpt && score >= 90;
    if (isReady) readyCount++;

    if (pkg) packagesFound.push(pkg);
    if (rpt) reportsFound.push(rpt);

    matrixRows += `| ${p.toUpperCase()} | ${pkg ? '🟢 YES' : '🔴 NO'} | ${rpt ? '🟢 YES' : '🔴 NO'} | ${score}/100 | ${isReady ? 'READY' : 'ACTION REQUIRED'} |\n`;
  });

  const avgScore = totalScore / platforms.length;
  const overallReadiness = readyCount === platforms.length ? 'READY FOR MANUAL POSTING' : 'NEEDS ACTION / BLOCKED';
  const safetyStatus = Object.values(safetyConfigs).every(v => v === false) ? '🟢 COMPLIANT (manual locks active)' : '🔴 ALARM';

  // 1. Generate Proposal
  const tplProposal = loadTemplate('templates/manual_release', 'tree-groove-release-pipeline-proposal-template.md');
  const proposalContent = tplProposal
    .replace(/{{CAMPAIGN}}/g, 'Sporty No Go Take My Soul')
    .replace('{{PROPOSAL_DATE}}', dateStr)
    .replace('{{OVERALL_READINESS}}', overallReadiness)
    .replace('{{AVG_SCORE}}', avgScore.toFixed(1))
    .replace('{{SAFETY_STATUS}}', safetyStatus)
    .replace('{{SOURCE_ARTIFACTS}}', `Platform adapters output folders & checklists`)
    .replace('{{PLATFORM_MATRIX}}', matrixRows)
    .replace('{{TIMESTAMP}}', timestamp);

  const proposalPath = getUniqueFilePath(outputFolders.proposals, 'sporty_release_proposal', dateStr);
  fs.writeFileSync(proposalPath, proposalContent, 'utf-8');
  console.log(`✅ Release proposal written to: ${proposalPath}`);

  // 2. Generate Checklist
  const tplChecklist = loadTemplate('templates/manual_release', 'manual-release-checklist-template.md') || 
    '# Manual Release Checklist: {{CAMPAIGN}}\n- **Platform:** {{PLATFORM}}\n- **Score:** {{READINESS_SCORE}}';

  let consolidatedChecklist = `# 📋 Consolidated Manual Release Checklist: Sporty No Go Take My Soul\n`;
  consolidatedChecklist += `- **Campaign:** Sporty No Go Take My Soul Rollout\n`;
  consolidatedChecklist += `- **Date Compiled:** ${timestamp}\n\n`;
  consolidatedChecklist += `This checklist covers the manual release checks for all platforms. Validate each section before copy-pasting.\n\n---\n\n`;

  platforms.forEach(p => {
    const pConfig = MANUAL_RELEASE_CONFIGS[p];
    const pkgPath = getLatestPackage(p);
    const rptPath = getLatestReportPath(p);
    const score = parseReadinessScore(rptPath);
    
    let copyBlock = 'No copy block found.';
    if (pkgPath && fs.existsSync(pkgPath)) {
      copyBlock = extractCopyBlock(p, fs.readFileSync(pkgPath, 'utf-8'));
    }

    const platformChecklist = tplChecklist
      .replace(/{{CAMPAIGN}}/g, 'Sporty No Go Take My Soul')
      .replace(/{{PLATFORM}}/g, pConfig.platformName)
      .replace(/{{RELEASE_DATE}}/g, dateStr)
      .replace(/{{READINESS_SCORE}}/g, String(score))
      .replace(/{{POSTING_STATUS}}/g, 'PENDING')
      .replace(/{{PACKAGE_PATH}}/g, pkgPath ? path.relative(REPO_ROOT, pkgPath) : 'MISSING')
      .replace(/{{VERIFICATION_REPORT_PATH}}/g, rptPath ? path.relative(REPO_ROOT, rptPath) : 'MISSING')
      .replace(/{{ASSET_NEEDED}}/g, pConfig.requiredAsset)
      .replace(/{{CAMPAIGN_PHRASE}}/g, pConfig.requiredCampaignPhrase)
      .replace(/{{CTA}}/g, pConfig.requiredCTA)
      .replace(/{{COPY_BLOCK}}/g, copyBlock)
      .replace(/{{AFTER_POST_ACTION}}/g, getAfterPostAction(p))
      .replace(/{{TIMESTAMP}}/g, timestamp);

    consolidatedChecklist += platformChecklist + '\n\n---\n\n';
  });

  const checklistPath = getUniqueFilePath(outputFolders.checklists, 'sporty_release_checklist', dateStr);
  fs.writeFileSync(checklistPath, consolidatedChecklist, 'utf-8');
  console.log(`✅ Consolidated checklist written to: ${checklistPath}`);

  // 3. Generate Runbook
  const tplRunbook = loadTemplate('templates/manual_release', 'platform-copy-paste-template.md') || 
    '### {{PLATFORM}}\n- **Copy Source:** {{COPY_SOURCE}}\n- **Text:**\n{{TEXT_TO_COPY}}';

  let runbook = `# 🛰️ Step-by-Step Manual Release Runbook: Sporty No Go Take My Soul\n\n`;
  runbook += `- **Campaign:** Sporty No Go Take My Soul Rollout\n`;
  runbook += `- **Date Compiled:** ${timestamp}\n\n`;
  
  runbook += `## 🛡️ Pre-Post Checklists\n`;
  runbook += `- [ ] Verify you are logged into the official creator profiles (avoid posting to wrong accounts)\n`;
  runbook += `- [ ] Confirm master video and image assets are downloaded locally\n`;
  runbook += `- [ ] Double check all CTA links match the whitelist target\n\n`;

  runbook += `## 📅 Chronological Posting Order\n`;
  runbook += `1. **YouTube** (Teaser launch triggers rollout)\n`;
  runbook += `2. **TikTok** (Viral short-form snippet)\n`;
  runbook += `3. **Instagram** (Reel cross-posting & Story Link)\n`;
  runbook += `4. **Facebook** (Page version & Community group version)\n`;
  runbook += `5. **WhatsApp** (Broadcast list announce)\n`;
  runbook += `6. **Obsidian** (Campaign index log update)\n\n`;

  runbook += `--- \n\n## 🚀 Step-by-Step Posting Sheets\n\n`;

  platforms.forEach(p => {
    const pConfig = MANUAL_RELEASE_CONFIGS[p];
    const pkgPath = getLatestPackage(p);
    let copyBlock = 'No copy block found.';
    if (pkgPath && fs.existsSync(pkgPath)) {
      copyBlock = extractCopyBlock(p, fs.readFileSync(pkgPath, 'utf-8'));
    }

    const platformSheet = tplRunbook
      .replace(/{{PLATFORM}}/g, pConfig.platformName)
      .replace(/{{COPY_SOURCE}}/g, pkgPath ? path.relative(REPO_ROOT, pkgPath) : 'MISSING')
      .replace(/{{ASSET_TO_ATTACH}}/g, pConfig.requiredAsset)
      .replace(/{{CTA}}/g, pConfig.requiredCTA)
      .replace(/{{TEXT_TO_COPY}}/g, copyBlock)
      .replace(/{{NOTES}}/g, `Requires posting style: ${pConfig.postingMode}`)
      .replace(/{{TIMESTAMP}}/g, timestamp);

    runbook += platformSheet + '\n\n---\n\n';
  });

  const runbookPath = getUniqueFilePath(outputFolders.runbooks, 'sporty_release_runbook', dateStr);
  fs.writeFileSync(runbookPath, runbook, 'utf-8');
  console.log(`✅ Chronological runbook written to: ${runbookPath}`);

  // 4. Generate Status Report
  const tplStatus = loadTemplate('templates/manual_release', 'release-status-template.md') || 
    '# Release Status Briefing: {{CAMPAIGN}}\n- **Checklist:** {{CHECKLIST_PRESENT}}\n- **Runbook:** {{RUNBOOK_PRESENT}}';

  const statusContent = tplStatus
    .replace(/{{CAMPAIGN}}/g, 'Sporty No Go Take My Soul')
    .replace(/{{CHECKLIST_PRESENT}}/g, '🟢 YES')
    .replace(/{{RUNBOOK_PRESENT}}/g, '🟢 YES')
    .replace(/{{PLATFORMS_READY}}/g, `${readyCount}/${platforms.length} Ready`)
    .replace(/{{MISSING_ITEMS}}/g, readyCount === platforms.length ? 'None' : 'Platform packages below threshold')
    .replace(/{{NEXT_ACTION}}/g, overallReadiness === 'READY FOR MANUAL POSTING' ? 'Proceed with clipboard copy-paste posting runbook.' : 'Resolve missing verification reports/packages.')
    .replace(/{{TIMESTAMP}}/g, timestamp);

  const statusPath = getUniqueFilePath(outputFolders.root, 'sporty_release_status', dateStr);
  fs.writeFileSync(statusPath, statusContent, 'utf-8');

  // 5. Generate Manifest
  const manifest = {
    compiledAt: timestamp,
    module: MODULE_NAME,
    campaign: 'Sporty No Go Take My Soul',
    readiness: overallReadiness,
    averageVerificationScore: avgScore,
    safetyCompliance: safetyStatus,
    filesGenerated: {
      proposal: path.relative(REPO_ROOT, proposalPath),
      checklist: path.relative(REPO_ROOT, checklistPath),
      runbook: path.relative(REPO_ROOT, runbookPath),
      status: path.relative(REPO_ROOT, statusPath)
    },
    packagesChecked: packagesFound.map(p => path.relative(REPO_ROOT, p)),
    reportsChecked: reportsFound.map(r => path.relative(REPO_ROOT, r))
  };

  const manifestPath = path.join(outputFolders.root, `tree_groove_release_manifest_${dateStr}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Telemetry manifest written to: ${manifestPath}`);

  // Log completion
  logContent += `## Release Pipeline Summary\n`;
  logContent += `- **Readiness:** ${overallReadiness}\n`;
  logContent += `- **Average Score:** ${avgScore.toFixed(1)}/100\n`;
  logContent += `- **Safety compliance:** ${safetyStatus}\n`;
  logContent += `- **Proposal Path:** ${proposalPath}\n`;
  logContent += `- **Checklist Path:** ${checklistPath}\n`;
  logContent += `- **Runbook Path:** ${runbookPath}\n\n`;
  logContent += `Release integration completed successfully.`;
  fs.writeFileSync(logFile, logContent, 'utf-8');

  await announceCompletion("Tree Groove Records automated release pipeline integration complete", "100");
  console.log("✅ Automated Release Pipeline integration complete.");
}

runAutomatedReleasePipeline().catch(err => {
  console.error("❌ Fatal execution error:", err);
  process.exit(1);
});
