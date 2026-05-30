import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PLATFORM_CONFIGS } from '../config/platform-adapters.js';
import { MANUAL_RELEASE_CONFIGS } from '../config/manual-release.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const REPORT_DIR = 'outputs/platform_verification/reports/';
const CHECKLIST_DIR = 'outputs/manual_release/checklists/';
const RUNBOOK_DIR = 'outputs/manual_release/runbooks/';
const STATUS_DIR = 'outputs/manual_release/status/';
const TEMPLATES_DIR = 'templates/manual_release/';

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
  const targetFolder = path.join(REPO_ROOT, folder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  let finalPath = path.join(targetFolder, `${baseName}_${dateStr}.md`);
  if (fs.existsSync(finalPath)) {
    const suffix = getFormattedTimeSuffix();
    finalPath = path.join(targetFolder, `${baseName}_${dateStr}${suffix}.md`);
  }
  return finalPath;
}

function loadTemplate(name: string): string {
  const p = path.join(REPO_ROOT, TEMPLATES_DIR, name);
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
  const folder = path.join(REPO_ROOT, REPORT_DIR);
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

function generateChecklist(): string {
  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'];
  const template = loadTemplate('manual-release-checklist-template.md') || 
    '# Manual Release Checklist: {{CAMPAIGN}}\n- **Platform:** {{PLATFORM}}\n- **Score:** {{READINESS_SCORE}}';

  let consolidatedChecklist = `# 📋 Consolidated Manual Release Checklist: Sporty No Go Take My Soul\n`;
  consolidatedChecklist += `- **Campaign:** Sporty No Go Take My Soul Rollout\n`;
  consolidatedChecklist += `- **Date Compiled:** ${new Date().toISOString()}\n\n`;
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

    const platformChecklist = template
      .replace(/{{CAMPAIGN}}/g, 'Sporty No Go Take My Soul')
      .replace(/{{PLATFORM}}/g, pConfig.platformName)
      .replace(/{{RELEASE_DATE}}/g, getFormattedDate())
      .replace(/{{READINESS_SCORE}}/g, String(score))
      .replace(/{{POSTING_STATUS}}/g, 'PENDING')
      .replace(/{{PACKAGE_PATH}}/g, pkgPath ? path.relative(REPO_ROOT, pkgPath) : 'MISSING')
      .replace(/{{VERIFICATION_REPORT_PATH}}/g, rptPath ? path.relative(REPO_ROOT, rptPath) : 'MISSING')
      .replace(/{{ASSET_NEEDED}}/g, pConfig.requiredAsset)
      .replace(/{{CAMPAIGN_PHRASE}}/g, pConfig.requiredCampaignPhrase)
      .replace(/{{CTA}}/g, pConfig.requiredCTA)
      .replace(/{{COPY_BLOCK}}/g, copyBlock)
      .replace(/{{AFTER_POST_ACTION}}/g, getAfterPostAction(p))
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString());

    consolidatedChecklist += platformChecklist + '\n\n---\n\n';
  });

  const destPath = getUniqueFilePath(CHECKLIST_DIR, 'sporty_manual_release_checklist', getFormattedDate());
  fs.writeFileSync(destPath, consolidatedChecklist, 'utf-8');
  return path.relative(REPO_ROOT, destPath);
}

function generateRunbook(): string {
  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'];
  const template = loadTemplate('platform-copy-paste-template.md') || 
    '### {{PLATFORM}}\n- **Copy Source:** {{COPY_SOURCE}}\n- **Text:**\n{{TEXT_TO_COPY}}';

  let runbook = `# 🛰️ Step-by-Step Manual Release Runbook: Sporty No Go Take My Soul\n\n`;
  runbook += `- **Campaign:** Sporty No Go Take My Soul Rollout\n`;
  runbook += `- **Date Compiled:** ${new Date().toISOString()}\n\n`;
  
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

    const platformSheet = template
      .replace(/{{PLATFORM}}/g, pConfig.platformName)
      .replace(/{{COPY_SOURCE}}/g, pkgPath ? path.relative(REPO_ROOT, pkgPath) : 'MISSING')
      .replace(/{{ASSET_TO_ATTACH}}/g, pConfig.requiredAsset)
      .replace(/{{CTA}}/g, pConfig.requiredCTA)
      .replace(/{{TEXT_TO_COPY}}/g, copyBlock)
      .replace(/{{NOTES}}/g, `Requires posting style: ${pConfig.postingMode}`)
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString());

    runbook += platformSheet + '\n\n---\n\n';
  });

  const destPath = getUniqueFilePath(RUNBOOK_DIR, 'sporty_manual_release_runbook', getFormattedDate());
  fs.writeFileSync(destPath, runbook, 'utf-8');
  return path.relative(REPO_ROOT, destPath);
}

function getLatestChecklistPath(): string {
  const folder = path.join(REPO_ROOT, CHECKLIST_DIR);
  if (!fs.existsSync(folder)) return 'None';
  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith('sporty_manual_release_checklist') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None';
  return path.relative(REPO_ROOT, path.join(folder, files[files.length - 1]));
}

function getLatestRunbookPath(): string {
  const folder = path.join(REPO_ROOT, RUNBOOK_DIR);
  if (!fs.existsSync(folder)) return 'None';
  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith('sporty_manual_release_runbook') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None';
  return path.relative(REPO_ROOT, path.join(folder, files[files.length - 1]));
}

function printStatus() {
  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'];
  const checklistPath = getLatestChecklistPath();
  const runbookPath = getLatestRunbookPath();

  const checklistExists = checklistPath !== 'None';
  const runbookExists = runbookPath !== 'None';

  let missingItems: string[] = [];
  let readyCount = 0;

  console.log("=========================================");
  console.log("🛰️ SPORTY CAMPAIGN RELEASE DIAGNOSTICS");
  console.log("=========================================");
  console.log(`Checklist Path: ${checklistPath}`);
  console.log(`Runbook Path:   ${runbookPath}`);
  console.log("-----------------------------------------");

  platforms.forEach(p => {
    const pkg = getLatestPackage(p);
    const rpt = getLatestReportPath(p);
    const score = parseReadinessScore(rpt);

    console.log(`🔹 ${p.toUpperCase()}:`);
    console.log(`  Package: ${pkg ? '🟢 FOUND (' + path.basename(pkg) + ')' : '🔴 MISSING'}`);
    console.log(`  Report:  ${rpt ? '🟢 FOUND (' + path.basename(rpt) + ')' : '🔴 MISSING'}`);
    console.log(`  Score:   ${score}/100`);

    if (!pkg) missingItems.push(`${p} package`);
    if (!rpt) missingItems.push(`${p} verification report`);
    if (score < 90) missingItems.push(`${p} verification failed (Score: ${score})`);

    if (pkg && rpt && score >= 90) {
      readyCount++;
    }
  });

  console.log("-----------------------------------------");
  const overallReadiness = readyCount === platforms.length ? 'READY FOR MANUAL POSTING' : 'NEEDS ACTION / BLOCKED';
  console.log(`Overall Readiness: ${overallReadiness}`);
  console.log(`Missing Items:     ${missingItems.join(', ') || 'None'}`);
  console.log("=========================================");

  // Write status report to output status file
  const statusTemplate = loadTemplate('release-status-template.md') || 
    '# Release Status Briefing: {{CAMPAIGN}}\n- **Checklist:** {{CHECKLIST_PRESENT}}\n- **Runbook:** {{RUNBOOK_PRESENT}}';
  
  const statusContent = statusTemplate
    .replace(/{{CAMPAIGN}}/g, 'Sporty No Go Take My Soul')
    .replace(/{{CHECKLIST_PRESENT}}/g, checklistExists ? '🟢 YES' : '🔴 NO')
    .replace(/{{RUNBOOK_PRESENT}}/g, runbookExists ? '🟢 YES' : '🔴 NO')
    .replace(/{{PLATFORMS_READY}}/g, `${readyCount}/${platforms.length} Ready`)
    .replace(/{{MISSING_ITEMS}}/g, missingItems.join(', ') || 'None')
    .replace(/{{NEXT_ACTION}}/g, overallReadiness === 'READY FOR MANUAL POSTING' ? 'Proceed with clipboard copy-paste posting runbook.' : 'Resolve missing verification reports/packages.')
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());

  const destPath = getUniqueFilePath(STATUS_DIR, 'sporty_release_status', getFormattedDate());
  fs.writeFileSync(destPath, statusContent, 'utf-8');
}

function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ').toLowerCase().trim().replace(/\s+/g, ' ');

  if (!command) {
    console.error("❌ Error: Missing manual release command.");
    console.log("Use: npm run manual-release-help for details.");
    process.exit(1);
  }

  if (command === 'sporty checklist') {
    const checklistPath = generateChecklist();
    console.log(`✅ Manual release checklist generated: ${checklistPath}`);
  } else if (command === 'sporty runbook') {
    const runbookPath = generateRunbook();
    console.log(`✅ Step-by-step posting runbook generated: ${runbookPath}`);
  } else if (command === 'sporty status') {
    printStatus();
  } else if (command === 'sporty all') {
    console.log("Generating manual release checklist...");
    generateChecklist();
    console.log("Generating step-by-step posting runbook...");
    generateRunbook();
    console.log("Compiling release diagnostics...");
    printStatus();
  } else {
    console.error(`❌ Error: Unknown manual release command: "${args[0]}"`);
    console.log("Use: npm run manual-release-help for details.");
    process.exit(1);
  }
}

main();
