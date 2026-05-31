import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { DISTRIBUTION_METRICS_CONFIGS } from '../config/distribution-metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.dirname(__dirname);

const ENTRIES_DIR = 'outputs/distribution_metrics/entries/';
const REPORTS_DIR = 'outputs/distribution_metrics/reports/';
const ARCHIVE_INDEX_DIR = 'outputs/distribution_metrics/archive_index/';
const TEMPLATES_DIR = 'templates/distribution_metrics/';

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

function findLatestFile(dir: string, prefix: string, substring?: string): string {
  const fullDir = path.isAbsolute(dir) ? dir : path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) {
    return `${dir} (directory not found)`;
  }
  const files = fs.readdirSync(fullDir);
  const matching = files
    .filter(f => {
      const matchPrefix = f.toLowerCase().startsWith(prefix.toLowerCase());
      if (substring) {
        return matchPrefix && f.toLowerCase().includes(substring.toLowerCase());
      }
      return matchPrefix;
    })
    .map(f => {
      const fullPath = path.join(fullDir, f);
      const stat = fs.statSync(fullPath);
      return { name: f, path: fullPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (matching.length > 0) {
    return path.relative(REPO_ROOT, matching[0].path);
  }
  return `${path.relative(REPO_ROOT, fullDir)}/${prefix}*[not found]`;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const clean = val.toUpperCase().trim();
  if (clean === 'PENDING' || clean === 'PENDING_LINK' || clean === 'N/A' || clean === 'NONE') return 0;
  const num = parseInt(clean.replace(/,/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function generateEntry(campaign: string, platformKey: string) {
  const config = DISTRIBUTION_METRICS_CONFIGS[platformKey];
  if (!config) {
    console.error(`❌ Error: Unknown platform key "${platformKey}".`);
    process.exit(1);
  }

  const template = loadTemplate('metric-entry-template.md');
  if (!template) {
    console.error('❌ Error: Metric entry template not found.');
    process.exit(1);
  }

  const dateStr = getFormattedDate();
  const pkgFile = findLatestFile(config.packageSourceFolder, `${campaign}_`);
  const rptFile = findLatestFile(config.verificationReportFolder, `${campaign}_${platformKey}_verification`);
  const checklistFile = findLatestFile(config.releaseChecklistFolder, `${campaign}_manual_release_checklist`);

  let postLinkOrNotePath = 'PENDING_LINK';
  if (platformKey === 'obsidian') {
    postLinkOrNotePath = 'AlexanderOSVault/brilliantaire-briefs/sporty_no_go_take_my_soul_brief.md';
  } else if (!config.linkRequired) {
    postLinkOrNotePath = 'N/A (Group Messaging)';
  }

  // Filter out post link / note path and creator notes from generic metrics block
  const metricsFields = config.metricFields.filter(
    f => f !== 'post link' && f !== 'note path' && f !== 'creator notes'
  );
  const metricsContent = metricsFields.map(f => `- **${f}:** PENDING`).join('\n');

  const content = template
    .replace(/{{Campaign}}/g, campaign.toUpperCase())
    .replace(/{{Platform}}/g, config.platformName)
    .replace(/{{PostingDate}}/g, dateStr)
    .replace(/{{PackageUsed}}/g, pkgFile)
    .replace(/{{VerificationReportUsed}}/g, rptFile)
    .replace(/{{ReleaseChecklistUsed}}/g, checklistFile)
    .replace(/{{PostLinkOrNotePath}}/g, postLinkOrNotePath)
    .replace(/{{Metrics}}/g, metricsContent)
    .replace(/{{Status}}/g, 'PENDING')
    .replace(/{{NextAction}}/g, 'Log metrics after manual posting.')
    .replace(/{{CreatorNotes}}/g, 'None');

  const destPath = getUniqueFilePath(ENTRIES_DIR, `${campaign}_${platformKey}_metrics`, dateStr);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Manual metric entry file generated for ${config.platformName}:`);
  console.log(`   ${path.relative(REPO_ROOT, destPath)}`);
}

interface ParsedEntry {
  filePath: string;
  platform: string;
  link: string;
  status: string;
  metrics: Record<string, string>;
}

function parseEntryFiles(campaign: string): ParsedEntry[] {
  const entriesFolder = path.join(REPO_ROOT, ENTRIES_DIR);
  if (!fs.existsSync(entriesFolder)) return [];

  const files = fs.readdirSync(entriesFolder).filter(
    f => f.toLowerCase().startsWith(`${campaign.toLowerCase()}_`) && f.endsWith('.md')
  );

  const parsed: ParsedEntry[] = [];
  for (const f of files) {
    const filePath = path.join(entriesFolder, f);
    const content = fs.readFileSync(filePath, 'utf-8');

    const platformMatch = content.match(/-\s+\*\*Platform:\*\*\s*(.*)/i);
    const platform = platformMatch ? platformMatch[1].trim() : '';

    const linkMatch = content.match(/-\s+\*\*Post Link Or Note Path:\*\*\s*(.*)/i);
    const link = linkMatch ? linkMatch[1].trim() : '';

    const statusMatch = content.match(/-\s+\*\*Status:\*\*\s*(.*)/i);
    const status = statusMatch ? statusMatch[1].trim() : '';

    const lines = content.split('\n');
    let inMetrics = false;
    const metrics: Record<string, string> = {};
    for (const line of lines) {
      if (line.startsWith('## 📈 Metric Fields')) {
        inMetrics = true;
        continue;
      }
      if (line.startsWith('## ') && !line.startsWith('## 📈 Metric Fields')) {
        inMetrics = false;
      }
      if (inMetrics) {
        const match = line.match(/^-\s+\*\*([^*:\n]+)\*\*\s*:\s*(.*)/);
        if (match) {
          metrics[match[1].trim().toLowerCase()] = match[2].trim();
        }
      }
    }

    parsed.push({
      filePath: path.relative(REPO_ROOT, filePath),
      platform,
      link,
      status,
      metrics
    });
  }

  return parsed;
}

function generateReport(campaign: string) {
  const template = loadTemplate('distribution-report-template.md');
  if (!template) {
    console.error('❌ Error: Distribution report template not found.');
    process.exit(1);
  }

  const entries = parseEntryFiles(campaign);
  const dateStr = getFormattedDate();

  const platformsPosted = entries.map(e => e.platform);
  const allPlatforms = Object.keys(DISTRIBUTION_METRICS_CONFIGS).map(
    k => DISTRIBUTION_METRICS_CONFIGS[k].platformName
  );
  const missingMetrics = allPlatforms.filter(p => !platformsPosted.includes(p));

  // Compute metrics totals
  let totalViews = 0;
  let totalLikesReactions = 0;
  let totalCommentsReplies = 0;
  let totalShares = 0;

  const scoreTrackers: { platform: string; score: number; label: string }[] = [];
  const missingLinks: string[] = [];

  for (const entry of entries) {
    const pKey = entry.platform.toLowerCase();
    const config = DISTRIBUTION_METRICS_CONFIGS[pKey];

    const views = parseNumber(entry.metrics['views']);
    const likes = parseNumber(entry.metrics['likes']);
    const reactions = parseNumber(entry.metrics['reactions']);
    const comments = parseNumber(entry.metrics['comments']);
    const replies = parseNumber(entry.metrics['replies']);
    const shares = parseNumber(entry.metrics['shares']);

    totalViews += views;
    totalLikesReactions += (likes + reactions);
    totalCommentsReplies += (comments + replies);
    totalShares += shares;

    if (config) {
      if (config.linkRequired && (entry.link === 'PENDING_LINK' || !entry.link)) {
        missingLinks.push(entry.platform);
      }

      // Determine best platform score representation
      let primaryScore = 0;
      let label = '0 engagement';
      if (views > 0) {
        primaryScore = views;
        label = `${views} views`;
      } else if (likes + reactions > 0) {
        primaryScore = likes + reactions;
        label = `${likes + reactions} reactions`;
      } else if (comments + replies > 0) {
        primaryScore = comments + replies;
        label = `${comments + replies} comments`;
      }
      scoreTrackers.push({ platform: entry.platform, score: primaryScore, label });
    }
  }

  let bestPlatform = 'None';
  let weakestPlatform = 'None';

  const nonZeroScores = scoreTrackers.filter(s => s.score > 0);
  if (nonZeroScores.length > 0) {
    nonZeroScores.sort((a, b) => b.score - a.score);
    bestPlatform = `${nonZeroScores[0].platform} (${nonZeroScores[0].label})`;
    weakestPlatform = `${nonZeroScores[nonZeroScores.length - 1].platform} (${nonZeroScores[nonZeroScores.length - 1].label})`;
  } else if (scoreTrackers.length > 0) {
    bestPlatform = `${scoreTrackers[0].platform} (0 engagement)`;
    weakestPlatform = `${scoreTrackers[scoreTrackers.length - 1].platform} (0 engagement)`;
  }

  const totalsBlock = [
    `- **Total Views:** ${totalViews}`,
    `- **Total Likes/Reactions:** ${totalLikesReactions}`,
    `- **Total Comments/Replies:** ${totalCommentsReplies}`,
    `- **Total Shares:** ${totalShares}`
  ].join('\n');

  let nextAction = 'Run sporty archive-index to bundle campaign artifacts.';
  if (missingMetrics.length > 0) {
    nextAction = 'Create metric entries for remaining platforms.';
  } else if (missingLinks.length > 0) {
    nextAction = 'Update pending platform post links.';
  }

  const content = template
    .replace(/{{Campaign}}/g, campaign.toUpperCase())
    .replace(/{{ReportDate}}/g, dateStr)
    .replace(/{{PlatformsPosted}}/g, platformsPosted.join(', ') || 'None')
    .replace(/{{MissingMetrics}}/g, missingMetrics.join(', ') || 'None')
    .replace(/{{Totals}}/g, totalsBlock)
    .replace(/{{BestPlatform}}/g, bestPlatform)
    .replace(/{{WeakestPlatform}}/g, weakestPlatform)
    .replace(/{{MissingLinks}}/g, missingLinks.join(', ') || 'None')
    .replace(/{{NextAction}}/g, nextAction);

  const destPath = getUniqueFilePath(REPORTS_DIR, `${campaign}_distribution_report`, dateStr);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Consolidated distribution report generated:`);
  console.log(`   ${path.relative(REPO_ROOT, destPath)}`);
}

function getArchiveFilesList(dir: string, prefix: string): string {
  const fullDir = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) {
    return '  *None*';
  }
  const files = fs.readdirSync(fullDir).filter(
    f => f.toLowerCase().startsWith(prefix.toLowerCase()) && f.endsWith('.md')
  );

  if (files.length === 0) {
    return '  *None*';
  }

  return files
    .map(f => {
      const fullPath = path.join(fullDir, f);
      return `- [${f}](file://${fullPath})`;
    })
    .join('\n');
}

function generateArchiveIndex(campaign: string) {
  const template = loadTemplate('archive-index-template.md');
  if (!template) {
    console.error('❌ Error: Archive index template not found.');
    process.exit(1);
  }

  const dateStr = getFormattedDate();

  // Gather packages
  const packagesList: string[] = [];
  for (const key of Object.keys(DISTRIBUTION_METRICS_CONFIGS)) {
    const config = DISTRIBUTION_METRICS_CONFIGS[key];
    const dir = path.join(REPO_ROOT, config.packageSourceFolder);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(
        f => f.toLowerCase().startsWith(`${campaign.toLowerCase()}_`) && f.endsWith('.md')
      );
      files.forEach(f => {
        const fullPath = path.join(dir, f);
        packagesList.push(`- [${f}](file://${fullPath})`);
      });
    }
  }
  const packagesStr = packagesList.length > 0 ? packagesList.join('\n') : '  *None*';

  const verificationReports = getArchiveFilesList('outputs/platform_verification/reports/', campaign);
  const checklists = getArchiveFilesList('outputs/manual_release/checklists/', campaign);
  const runbooks = getArchiveFilesList('outputs/manual_release/runbooks/', campaign);
  const metricEntries = getArchiveFilesList(ENTRIES_DIR, campaign);
  const distributionReports = getArchiveFilesList(REPORTS_DIR, campaign);
  const simulationReports = getArchiveFilesList('outputs/campaigns/simulations/', campaign);
  const schedules = getArchiveFilesList('outputs/campaigns/schedules/', campaign);
  const postingQueues = getArchiveFilesList('outputs/campaigns/posting_queue/', campaign);
  const executionLogs = getArchiveFilesList('outputs/campaigns/execution_logs/', campaign);

  const notes = `Campaign archived successfully on ${dateStr}. All telemetry and artifacts logged locally offline.`;

  const content = template
    .replace(/{{Campaign}}/g, campaign.toUpperCase())
    .replace(/{{ArchiveDate}}/g, dateStr)
    .replace(/{{Packages}}/g, packagesStr)
    .replace(/{{VerificationReports}}/g, verificationReports)
    .replace(/{{ReleaseChecklists}}/g, checklists)
    .replace(/{{ReleaseRunbooks}}/g, runbooks)
    .replace(/{{MetricEntries}}/g, metricEntries)
    .replace(/{{DistributionReports}}/g, distributionReports)
    .replace(/{{SimulationReports}}/g, simulationReports)
    .replace(/{{Schedules}}/g, schedules)
    .replace(/{{PostingQueues}}/g, postingQueues)
    .replace(/{{ExecutionLogs}}/g, executionLogs)
    .replace(/{{Notes}}/g, notes);

  const destPath = getUniqueFilePath(ARCHIVE_INDEX_DIR, `${campaign}_archive_index`, dateStr);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✅ Campaign archive index generated:`);
  console.log(`   ${path.relative(REPO_ROOT, destPath)}`);
}

function getLatestFileInDir(dir: string, prefix: string): string {
  const fullDir = path.join(REPO_ROOT, dir);
  if (!fs.existsSync(fullDir)) return 'None';
  const files = fs.readdirSync(fullDir)
    .filter(f => f.toLowerCase().startsWith(prefix.toLowerCase()) && f.endsWith('.md'))
    .sort();
  if (files.length === 0) return 'None';
  return path.relative(REPO_ROOT, path.join(fullDir, files[files.length - 1]));
}

function printStatus(campaign: string) {
  const entries = parseEntryFiles(campaign);
  const latestReport = getLatestFileInDir(REPORTS_DIR, campaign);
  const latestArchive = getLatestFileInDir(ARCHIVE_INDEX_DIR, campaign);

  const allPlatforms = Object.keys(DISTRIBUTION_METRICS_CONFIGS);
  const missingPlatforms: string[] = [];
  const pendingMetricEntries: string[] = [];

  console.log("=================================================================================");
  console.log(`📊 MANUAL METRICS LOGGING STATUS: ${campaign.toUpperCase()}`);
  console.log("=================================================================================");
  console.log("Metric Entries Present:");

  for (const key of allPlatforms) {
    const config = DISTRIBUTION_METRICS_CONFIGS[key];
    const match = entries.find(e => e.platform.toLowerCase() === key);
    if (match) {
      console.log(`  - ${config.platformName}: 🟢 FOUND (${match.filePath}) [Status: ${match.status}]`);
      if (match.status === 'PENDING') {
        pendingMetricEntries.push(config.platformName);
      }
    } else {
      console.log(`  - ${config.platformName}: 🔴 MISSING`);
      missingPlatforms.push(config.platformName);
    }
  }

  console.log("");
  console.log(`Latest Distribution Report: ${latestReport}`);
  console.log(`Latest Archive Index:       ${latestArchive}`);
  console.log("---------------------------------------------------------------------------------");

  let nextAction = 'Run archive index to catalog campaign files.';
  if (missingPlatforms.length > 0) {
    console.log(`Missing Platforms: ${missingPlatforms.join(', ')}`);
    nextAction = `Generate entry files for: ${missingPlatforms.join(', ')}`;
  } else if (pendingMetricEntries.length > 0) {
    console.log(`Pending Metric Log Entries: ${pendingMetricEntries.join(', ')}`);
    nextAction = `Fill manual performance metrics inside the pending entries.`;
  } else if (latestReport === 'None') {
    nextAction = `Generate consolidated distribution report using '${campaign} report'`;
  }

  console.log(`Next Recommended Action:   ${nextAction}`);
  console.log("=================================================================================");
}

function main() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }

  if (args.length === 0) {
    console.error('❌ Error: Missing command arguments.');
    console.log('💡 Guidance: Use "npm run distribution-metrics-help" for instructions.');
    process.exit(1);
  }

  const campaign = args[0].toLowerCase();
  const command = args[1]?.toLowerCase();
  const subCommand = args[2]?.toLowerCase();

  if (command === 'entry') {
    if (!subCommand) {
      console.error('❌ Error: Platform is required. E.g. "sporty entry youtube"');
      process.exit(1);
    }
    generateEntry(campaign, subCommand);
  } else if (command === 'report') {
    generateReport(campaign);
  } else if (command === 'archive-index') {
    generateArchiveIndex(campaign);
  } else if (command === 'status') {
    printStatus(campaign);
  } else {
    console.error(`❌ Error: Unknown distribution metrics command: "${args.join(' ')}"`);
    console.log('💡 Guidance: Use "npm run distribution-metrics-help" to see available commands.');
    process.exit(1);
  }
}

main();
