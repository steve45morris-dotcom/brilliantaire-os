import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.dirname(__dirname);

// Directories
const SCHEDULES_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'schedules');
const QUEUE_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'posting_queue');
const LOGS_DIR = path.join(REPO_ROOT, 'outputs', 'campaigns', 'execution_logs');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'templates', 'scheduler');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  const dateStr = getFormattedDate();
  const originalPath = path.join(dir, `${baseName}_${dateStr}${ext}`);
  if (!fs.existsSync(originalPath)) {
    return originalPath;
  }
  
  // File exists, append time suffix _HHMMSS
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return path.join(dir, `${baseName}_${dateStr}_${hh}${mm}${ss}${ext}`);
}

function ensureDirectories() {
  [SCHEDULES_DIR, QUEUE_DIR, LOGS_DIR, TEMPLATES_DIR].forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });
}

function getTemplate(templateName: string): string {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return '';
}

function createSportySchedule() {
  ensureDirectories();
  const destPath = getSafeWritePath(SCHEDULES_DIR, 'sporty_no_go_take_my_soul_schedule', '.md');

  console.log(`📅 Creating 21-Day Schedule for Sporty Rollout...`);

  const platforms = ['TikTok', 'Instagram', 'Facebook', 'Snapchat', 'WhatsApp'];
  const times = ['Morning (09:00 - 12:00)', 'Afternoon (13:00 - 16:00)', 'Evening (18:00 - 21:00)'];

  let content = `# 📅 21-Day Sporty Rollout Campaign Schedule\n\n`;
  content += `> **Campaign:** Sporty No Go Take My Soul  
> **Brand Phrase:** *A Brilliantier knows when to cash out.*  
> **Target Platforms:** TikTok, Instagram, Facebook, Snapchat, WhatsApp  
> **Frequency:** 3 Posts Per Day\n\n`;

  content += `| Day | Time Block | Platform | Content Type | Focus / Hook | CTA & Reminders | Notes |\n`;
  content += `|---|---|---|---|---|---|---|\n`;

  for (let day = 1; day <= 21; day++) {
    // Post 1: TikTok - Street challenge content with hook conditioning
    content += `| Day ${day} | ${times[0]} | TikTok | Street Challenge Video | Street challenge content & hook conditioning | Early access link in bio | Capturing local street vibes |\n`;

    // Post 2: Instagram/Snapchat/Facebook - Brilliantier identity content
    const p2 = platforms[(day + 1) % platforms.length];
    content += `| Day ${day} | ${times[1]} | ${p2} | Identity Post | Brilliantier identity content. Phrase: "A Brilliantier knows when to cash out." | Visit official site | High contrast cyberpunk graphics |\n`;

    // Post 3: WhatsApp/Facebook/Snapchat - website coupon early-access reminders
    const p3 = platforms[(day + 2) % platforms.length];
    content += `| Day ${day} | ${times[2]} | ${p3} | Early Access Promo | Website coupon early-access reminders | Use coupon code: SPORTY21 | Direct broadcast to lists |\n`;
  }

  fs.writeFileSync(destPath, content);
  console.log(`✅ Schedule saved to: ${destPath}`);
}

function queueSporty() {
  ensureDirectories();
  const destPath = getSafeWritePath(QUEUE_DIR, 'sporty_no_go_take_my_soul_queue', '.md');
  const dateStr = getFormattedDate();

  console.log(`📋 Generating Daily Posting Queue for Sporty Rollout...`);

  const templateStr = getTemplate('daily-posting-queue-template.md');
  const platforms = ['TikTok', 'Instagram', 'Facebook', 'Snapchat', 'WhatsApp'];
  const times = ['09:00 - 12:00', '13:00 - 16:00', '18:00 - 21:00'];

  let content = `# 📋 Daily Posting Queue: Sporty Rollout\n\n`;
  content += `Generated on: ${dateStr}\n\n`;

  for (let i = 0; i < 3; i++) {
    const platform = platforms[i % platforms.length];
    const timeBlock = times[i];
    
    let itemContent = templateStr;
    if (!itemContent) {
      // Fallback if template is empty
      itemContent = `### Post Queue Item ${i + 1}\n` +
        `- **Date:** {{DATE}}\n` +
        `- **Time Block:** {{TIME_BLOCK}}\n` +
        `- **Platform:** {{PLATFORM}}\n` +
        `- **Post Type:** {{POST_TYPE}}\n` +
        `- **Asset Needed:** {{ASSET_NEEDED}}\n` +
        `- **Caption Angle:** {{CAPTION_ANGLE}}\n` +
        `- **CTA:** {{CTA}}\n` +
        `- **Status:** {{STATUS}}\n` +
        `- **Owner Agent:** {{OWNER_AGENT}}\n`;
    }

    // Populate template fields
    let postType = '';
    let asset = '';
    let caption = '';
    let cta = '';
    
    if (i === 0) {
      postType = 'Street Challenge Clip';
      asset = 'sporty_street_challenge_take_1.mp4';
      caption = 'Testing Lagos street knowledge on the Sporty track!';
      cta = 'Comment your answer below!';
    } else if (i === 1) {
      postType = 'Brilliantier Lyric Poster';
      asset = 'brilliantier_soul_quote_design.png';
      caption = 'Survival and creation in the game. A Brilliantier knows when to cash out.';
      cta = 'Listen to the full track now.';
    } else {
      postType = 'Coupon Discount Promo';
      asset = 'sporty_early_coupon_banner.jpg';
      caption = 'Early access is live! Claim your custom coupon before anyone else.';
      cta = 'Use coupon SPORTY21 at checkout.';
    }

    itemContent = itemContent
      .replace('{{DATE}}', dateStr)
      .replace('{{TIME_BLOCK}}', timeBlock)
      .replace('{{PLATFORM}}', platform)
      .replace('{{POST_TYPE}}', postType)
      .replace('{{ASSET_NEEDED}}', asset)
      .replace('{{CAPTION_ANGLE}}', caption)
      .replace('{{CTA}}', cta)
      .replace('{{STATUS}}', 'DRAFT')
      .replace('{{OWNER_AGENT}}', 'Creative Revenue Strategist')
      .replace('{{NOTES}}', `Staged draft for sporty rollout.`);

    content += itemContent + `\n---\n\n`;
  }

  fs.writeFileSync(destPath, content);
  console.log(`✅ Posting Queue saved to: ${destPath}`);
}

function logSporty() {
  ensureDirectories();
  const destPath = getSafeWritePath(LOGS_DIR, 'sporty_no_go_take_my_soul_execution_log', '.md');
  const dateStr = getFormattedDate();

  console.log(`📝 Generating Campaign Execution Log for Sporty Rollout...`);

  const templateStr = getTemplate('execution-log-template.md');
  const platforms = ['TikTok', 'Instagram', 'Facebook'];

  let content = `# 📝 Campaign Execution Log: Sporty Rollout\n\n`;
  content += `Generated on: ${dateStr}\n\n`;

  for (let i = 0; i < 3; i++) {
    let logItem = templateStr;
    if (!logItem) {
      logItem = `### Log Item ${i + 1}\n` +
        `- **Date:** {{DATE}}\n` +
        `- **Platform:** {{PLATFORM}}\n` +
        `- **Planned Action:** {{PLANNED_ACTION}}\n` +
        `- **Completed:** {{COMPLETED}}\n` +
        `- **Link:** {{LINK}}\n` +
        `- **Result:** {{RESULT}}\n` +
        `- **Issue:** {{ISSUE}}\n` +
        `- **Next Action:** {{NEXT_ACTION}}\n`;
    }

    let planned = '';
    if (i === 0) planned = 'Post Street Challenge clip to TikTok';
    else if (i === 1) planned = 'Share Brilliantier identity quote on Instagram';
    else planned = 'Broadcast early access coupon to Facebook page';

    logItem = logItem
      .replace('{{DATE}}', dateStr)
      .replace('{{PLATFORM}}', platforms[i % platforms.length])
      .replace('{{PLANNED_ACTION}}', planned)
      .replace('{{COMPLETED}}', 'PENDING')
      .replace('{{LINK}}', 'N/A')
      .replace('{{RESULT}}', 'N/A')
      .replace('{{ISSUE}}', 'None')
      .replace('{{NEXT_ACTION}}', 'Awaiting manual publish step');

    content += logItem + `\n---\n\n`;
  }

  fs.writeFileSync(destPath, content);
  console.log(`✅ Execution Log saved to: ${destPath}`);
}

function statusSporty() {
  ensureDirectories();
  console.log(`=========================================`);
  console.log(`🔍 CAMPAIGN SCHEDULER STATUS REPORT`);
  console.log(`=========================================`);

  const schedules = fs.readdirSync(SCHEDULES_DIR).filter(f => f.startsWith('sporty_'));
  const queues = fs.readdirSync(QUEUE_DIR).filter(f => f.startsWith('sporty_'));
  const logs = fs.readdirSync(LOGS_DIR).filter(f => f.startsWith('sporty_'));

  const schedExists = schedules.length > 0;
  const qExists = queues.length > 0;
  const logExists = logs.length > 0;

  console.log(`Schedule Exists:     ${schedExists ? '✅ YES' : '❌ NO'}`);
  console.log(`Queue Exists:        ${qExists ? '✅ YES' : '❌ NO'}`);
  console.log(`Execution Log Exs.:  ${logExists ? '✅ YES' : '❌ NO'}`);
  console.log(`-----------------------------------------`);

  if (schedExists) {
    console.log(`Latest Schedule:     ${schedules[schedules.length - 1]}`);
  }
  if (qExists) {
    console.log(`Latest Queue:        ${queues[queues.length - 1]}`);
  }
  if (logExists) {
    console.log(`Latest Exec. Log:    ${logs[logs.length - 1]}`);
  }
  console.log(`-----------------------------------------`);
  console.log(`Next Recommended Action:`);
  if (!schedExists) {
    console.log(`  👉 Run "npm run campaign-scheduler -- create sporty" to build the 21-day schedule.`);
  } else if (!qExists) {
    console.log(`  👉 Run "npm run campaign-scheduler -- queue sporty" to build the posting queue.`);
  } else if (!logExists) {
    console.log(`  👉 Run "npm run campaign-scheduler -- log sporty" to create the execution log.`);
  } else {
    console.log(`  👉 All drafts generated! Perform manual review of the generated files.`);
  }
  console.log(`=========================================`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    // Print help
    console.log("Usage: npm run campaign-scheduler -- [command]");
    console.log("Available commands: create sporty, queue sporty, log sporty, status sporty, help");
    process.exit(0);
  }

  switch (command.toLowerCase().trim()) {
    case 'create sporty':
      createSportySchedule();
      break;
    case 'queue sporty':
      queueSporty();
      break;
    case 'log sporty':
      logSporty();
      break;
    case 'status sporty':
      statusSporty();
      break;
    default:
      console.error(`❌ Unknown command: "${command}"`);
      console.log("Available commands: create sporty, queue sporty, log sporty, status sporty, help");
      process.exit(1);
  }
}

main();
