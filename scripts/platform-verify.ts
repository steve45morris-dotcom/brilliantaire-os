import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PLATFORM_CONFIGS } from '../config/platform-adapters.js';
import { VERIFICATION_CONFIGS } from '../config/platform-verification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const REPORT_DIR = 'outputs/platform_verification/reports/';
const TEMPLATES_DIR = 'templates/platform_verification/';

const REQUIRED_PHRASE = 'A Brilliantier knows when to cash out.';
const REQUIRED_CTA = 'Join the Brilliantier movement and unlock early access.';

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

function checkFieldPresent(content: string, fieldName: string): boolean {
  const norm = content.toLowerCase();
  switch (fieldName.toLowerCase()) {
    case 'title options': return norm.includes('title options') || norm.includes('title:');
    case 'description': return norm.includes('description');
    case 'pinned comment': return norm.includes('pinned comment');
    case 'upload checklist': return norm.includes('upload & posting checklist') || norm.includes('upload checklist') || norm.includes('checklist');
    case 'cta': return norm.includes('cta:') || norm.includes('cta') || norm.includes('join the brilliantier movement');
    case 'asset needed': return norm.includes('asset needed');
    case 'review status': return norm.includes('review status');
    case 'caption options': return norm.includes('caption options');
    case 'hook line': return norm.includes('hook line');
    case 'on-screen text': return norm.includes('on-screen text') || norm.includes('on-screen');
    case 'posting checklist': return norm.includes('posting checklist') || norm.includes('sync & review checklist') || norm.includes('checklist');
    case 'reel caption': return norm.includes('reel caption');
    case 'carousel caption': return norm.includes('carousel slide ideas') || norm.includes('carousel caption') || norm.includes('carousel slide') || norm.includes('carousel idea');
    case 'story text': return norm.includes('story text');
    case 'page post': return norm.includes('public page post') || norm.includes('page post');
    case 'group post': return norm.includes('community group post') || norm.includes('group post');
    case 'comment reply starter': return norm.includes('comment reply starter');
    case 'group announcement': return norm.includes('group announcement');
    case 'broadcast message': return norm.includes('broadcast message');
    case 'short reminder': return norm.includes('short follow-up reminder') || norm.includes('short reminder');
    case 'campaign note summary': return norm.includes('summary:') || norm.includes('summary');
    case 'next actions': return norm.includes('next actions:');
    case 'tags': return norm.includes('tags:');
    case 'backlink suggestions': return norm.includes('backlink suggestions:');
    default: return norm.includes(fieldName.toLowerCase());
  }
}

function getReadinessStatus(score: number): string {
  if (score >= 90) return 'ready for manual posting';
  if (score >= 75) return 'needs light cleanup';
  if (score >= 50) return 'needs revision';
  return 'blocked';
}

function verifyPackage(platform: string): {
  platformName: string;
  packagePath: string;
  reportPath: string;
  fieldsPresent: string[];
  fieldsMissing: string[];
  ctaPresent: boolean;
  phrasePresent: boolean;
  assetPresent: boolean;
  checklistPresent: boolean;
  statusPresent: boolean;
  score: number;
  status: string;
  nextAction: string;
} {
  const packagePath = getLatestPackage(platform);
  const vConfig = VERIFICATION_CONFIGS[platform];
  const pConfig = PLATFORM_CONFIGS[platform];

  if (!packagePath) {
    throw new Error(`❌ No output package found for ${platform}. Generate it first.`);
  }

  const content = fs.readFileSync(packagePath, 'utf-8');
  const norm = content.toLowerCase();

  const fieldsPresent: string[] = [];
  const fieldsMissing: string[] = [];

  vConfig.requiredFields.forEach(f => {
    if (checkFieldPresent(content, f)) {
      fieldsPresent.push(f);
    } else {
      fieldsMissing.push(f);
    }
  });

  const ctaPresent = norm.includes(REQUIRED_CTA.toLowerCase());
  const phrasePresent = norm.includes(REQUIRED_PHRASE.toLowerCase());
  const assetPresent = norm.includes('asset needed:') && !content.includes('{{ASSET_NEEDED}}');
  const checklistPresent = norm.includes('checklist') || norm.includes('sync & review');
  const statusPresent = norm.includes('review status:') && !content.includes('{{REVIEW_STATUS}}');

  // Compute readiness score
  let score = 0;
  // Fields present: 60 points max
  if (vConfig.requiredFields.length > 0) {
    score += Math.round((fieldsPresent.length / vConfig.requiredFields.length) * 60);
  }
  // Phrase: 15 pts
  if (phrasePresent) score += 15;
  // CTA: 15 pts
  if (ctaPresent) score += 15;
  // Asset Note: 5 pts
  if (assetPresent) score += 5;
  // Review Status: 5 pts
  if (statusPresent) score += 5;

  const status = getReadinessStatus(score);
  let nextAction = '';
  if (status === 'ready for manual posting') {
    nextAction = 'Proceed to manually copy content to destination profile.';
  } else if (status === 'needs light cleanup') {
    nextAction = 'Address missing checklist items or verify asset placeholders before copy-pasting.';
  } else if (status === 'needs revision') {
    nextAction = 'Regenerate package and verify required campaign fields are populated.';
  } else {
    nextAction = 'Critical blocker. Core campaign phrase or CTA link is missing from package.';
  }

  // Load report template
  const template = loadTemplate('platform-verification-report-template.md') ||
    '# Platform Verification Report: {{PLATFORM}}\n- **Score:** {{READINESS_SCORE}}';

  const reportContent = template
    .replace(/{{PLATFORM}}/g, pConfig.name)
    .replace(/{{PACKAGE_PATH}}/g, path.relative(REPO_ROOT, packagePath))
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{FIELDS_PRESENT}}/g, fieldsPresent.map(f => `\`${f}\``).join(', '))
    .replace(/{{FIELDS_MISSING}}/g, fieldsMissing.map(f => `\`${f}\``).join(', ') || 'None')
    .replace(/{{CTA_PRESENT}}/g, ctaPresent ? '🟢 YES' : '🔴 NO')
    .replace(/{{CAMPAIGN_PHRASE_PRESENT}}/g, phrasePresent ? '🟢 YES' : '🔴 NO')
    .replace(/{{ASSET_NOTE_PRESENT}}/g, assetPresent ? '🟢 YES' : '🔴 NO')
    .replace(/{{CHECKLIST_PRESENT}}/g, checklistPresent ? '🟢 YES' : '🔴 NO')
    .replace(/{{STATUS_PRESENT}}/g, statusPresent ? '🟢 YES' : '🔴 NO')
    .replace(/{{READINESS_SCORE}}/g, String(score))
    .replace(/{{READINESS_STATUS}}/g, status.toUpperCase())
    .replace(/{{FINAL_VERDICT}}/g, status === 'ready for manual posting' ? 'VERIFIED_READY' : 'VERIFICATION_FAILED')
    .replace(/{{NEXT_ACTION}}/g, nextAction);

  const reportPath = getUniqueFilePath(REPORT_DIR, `sporty_${platform}_verification`, getFormattedDate());
  fs.writeFileSync(reportPath, reportContent, 'utf-8');

  return {
    platformName: pConfig.name,
    packagePath: path.relative(REPO_ROOT, packagePath),
    reportPath: path.relative(REPO_ROOT, reportPath),
    fieldsPresent,
    fieldsMissing,
    ctaPresent,
    phrasePresent,
    assetPresent,
    checklistPresent,
    statusPresent,
    score,
    status,
    nextAction
  };
}

function checkReportExists(platform: string): boolean {
  const folder = path.join(REPO_ROOT, REPORT_DIR);
  if (!fs.existsSync(folder)) return false;
  const files = fs.readdirSync(folder);
  return files.some(f => f.startsWith(`sporty_${platform}_verification`) && f.endsWith('.md'));
}

function getLatestReportPath(platform: string): string {
  const folder = path.join(REPO_ROOT, REPORT_DIR);
  if (!fs.existsSync(folder)) return 'None Found';
  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith(`sporty_${platform}_verification`) && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None Found';
  return path.relative(REPO_ROOT, path.join(folder, files[files.length - 1]));
}

function getLatestSummaryReportPath(): string {
  const folder = path.join(REPO_ROOT, REPORT_DIR);
  if (!fs.existsSync(folder)) return 'None Found';
  const files = fs.readdirSync(folder)
    .filter(f => f.startsWith('sporty_platform_verification_summary') && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None Found';
  return path.relative(REPO_ROOT, path.join(folder, files[files.length - 1]));
}

function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ').toLowerCase().trim().replace(/\s+/g, ' ');

  if (!command) {
    console.error("❌ Error: Missing verification command.");
    console.log("Use: npm run platform-verify-help for details.");
    process.exit(1);
  }

  const platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'];

  if (platforms.includes(command.replace('sporty ', ''))) {
    const platform = command.replace('sporty ', '');
    try {
      const results = verifyPackage(platform);
      console.log(`✅ Platform verification completed for ${results.platformName}:`);
      console.log(`👉 Score:        ${results.score}/100`);
      console.log(`👉 Status:       ${results.status.toUpperCase()}`);
      console.log(`👉 Report Saved: ${results.reportPath}`);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  } else if (command === 'sporty all') {
    console.log("🔍 Verifying all platform packages...");
    const resultsList: any[] = [];
    let totalScore = 0;

    for (const p of platforms) {
      try {
        const res = verifyPackage(p);
        resultsList.push(res);
        totalScore += res.score;
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    }

    const avgScore = Math.round(totalScore / platforms.length);
    const overallStatus = getReadinessStatus(avgScore);

    // Write Summary Report
    let summary = `# 🛰️ Campaign Platform Verification Summary: Sporty No Go Take My Soul\n\n`;
    summary += `- **Aggregate Readiness Score:** **${avgScore}/100**\n`;
    summary += `- **Overall Campaign Status:** **${overallStatus.toUpperCase()}**\n`;
    summary += `- **Verification Date:** ${new Date().toISOString()}\n\n`;

    summary += `## 📋 Platform Verification Matrix\n\n`;
    summary += `| Platform | Package Checked | Score | Status | Verdict | Next Action |\n`;
    summary += `|---|---|---|---|---|---|\n`;

    resultsList.forEach(r => {
      summary += `| **${r.platformName}** | \`${r.packagePath}\` | **${r.score}** | ${r.status.toUpperCase()} | \`${r.status === 'ready for manual posting' ? 'PASS' : 'WARN'}\` | ${r.nextAction} |\n`;
    });

    summary += `\n---\n*Generated by Brilliantaire OS*\n`;

    const summaryPath = getUniqueFilePath(REPORT_DIR, 'sporty_platform_verification_summary', getFormattedDate());
    fs.writeFileSync(summaryPath, summary, 'utf-8');

    console.log("✅ Multi-platform verification summary generated:");
    console.log(`👉 Summary Path: ${path.relative(REPO_ROOT, summaryPath)}`);
    console.log(`👉 Aggregate Score: ${avgScore}/100 (${overallStatus.toUpperCase()})`);
  } else if (command === 'status sporty') {
    const missingCount = platforms.filter(p => !getLatestPackage(p)).length;
    let sumScore = 0;
    let verifiedCount = 0;

    platforms.forEach(p => {
      const packagePath = getLatestPackage(p);
      if (packagePath) {
        // Mock score verification checks
        try {
          const content = fs.readFileSync(packagePath, 'utf-8');
          const norm = content.toLowerCase();
          const vConfig = VERIFICATION_CONFIGS[p];
          let score = 0;
          let presentCount = vConfig.requiredFields.filter(f => checkFieldPresent(content, f)).length;
          score += Math.round((presentCount / vConfig.requiredFields.length) * 60);
          if (norm.includes(REQUIRED_PHRASE.toLowerCase())) score += 15;
          if (norm.includes(REQUIRED_CTA.toLowerCase())) score += 15;
          if (norm.includes('asset needed:') && !content.includes('{{ASSET_NEEDED}}')) score += 5;
          if (norm.includes('review status:') && !content.includes('{{REVIEW_STATUS}}')) score += 5;
          sumScore += score;
          verifiedCount++;
        } catch {}
      }
    });

    const avgScore = verifiedCount > 0 ? Math.round(sumScore / verifiedCount) : 0;
    const overallStatus = getReadinessStatus(avgScore);

    console.log("=========================================");
    console.log("🛰️ SPORTY CAMPAIGN VERIFICATION STATUS");
    console.log("=========================================");
    console.log(`Summary Report Path:   ${getLatestSummaryReportPath()}`);
    console.log(`Missing Packages Count: ${missingCount}`);
    console.log(`Aggregate Readiness:   ${avgScore}/100 (${overallStatus.toUpperCase()})`);
    console.log("-----------------------------------------");
    console.log("Platform Verification Check Matrix:");
    platforms.forEach(p => {
      const pConfig = PLATFORM_CONFIGS[p];
      console.log(`  🔹 ${pConfig.name}:`);
      console.log(`     Package:  ${getLatestPackage(p) ? '🟢 FOUND' : '🔴 MISSING'}`);
      console.log(`     Report:   ${checkReportExists(p) ? '🟢 FOUND' : '🔴 MISSING'}`);
      console.log(`     Latest:   ${getLatestReportPath(p)}`);
    });
    console.log("-----------------------------------------");
    console.log(`Next Recommended Action:`);
    console.log(`  👉 Check summary reports and prepare clipboard copy-pastes.`);
    console.log("=========================================");
  } else {
    console.error(`❌ Error: Unknown verification command: "${args[0]}"`);
    console.log("Use: npm run platform-verify-help for list of valid options.");
    process.exit(1);
  }
}

main();
