import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PLATFORM_CONFIGS } from '../config/platform-adapters.js';

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

function loadTemplate(platform: string): string {
  const templatePath = path.join(REPO_ROOT, 'templates', 'platform_adapters', `${platform}-template.md`);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf-8');
  }
  return '';
}

// Data store for Sporty campaign content
const SPORTY_CAMPAIGN = {
  name: 'Sporty No Go Take My Soul',
  brand: 'Icyflamze / Tree Groove Records',
  phrase: 'A Brilliantier knows when to cash out.',
  cta: 'Join the Brilliantier movement and unlock early access.',
  assetNeeded: 'Sporty Rollout Master Video Assets (cyberpunk styling)',
  reviewStatus: 'Draft / Pending Final Audio Master',
};

// Generation methods
function generateYouTube(): string {
  const template = loadTemplate('youtube');
  if (!template) throw new Error('YouTube template not found');

  const titleOptions = [
    '- Option 1: Icyflamze - Sporty No Go Take My Soul (Official Audio Teaser)',
    '- Option 2: How to Cash Out: The Philosophy of a Brilliantier | Icyflamze',
    '- Option 3: Sporty No Go Take My Soul - Cyberpunk Street Rollout (Official Teaser)'
  ].join('\n');

  const description = [
    "The official rollout for 'Sporty No Go Take My Soul' by Icyflamze, presented by Tree Groove Records.",
    "",
    "A Brilliantier knows when to cash out. Under pressure, we build. We don't burn.",
    "Lagos roots meets cybernetic street strategy.",
    "",
    "Listen to the teaser, subscribe to the channel, and unlock exclusive early access below.",
    "",
    "Early Access: https://brilliantaire.io/sporty",
    "",
    "#Icyflamze #Brilliantier #TreeGrooveRecords #Sporty"
  ].join('\n');

  const pinnedComment = "💬 Drop your thoughts on the new rollout below. Unlock early download access here: https://brilliantaire.io/sporty";

  const checklist = [
    "- [ ] Set video visibility to Unlisted for final QA review",
    "- [ ] Upload custom high-contrast neon thumbnail artwork",
    "- [ ] Paste description text, tags, and link",
    "- [ ] Pin the comment and heart it",
    "- [ ] Verify audio stream quality at 320kbps"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{TITLE_OPTIONS}}/g, titleOptions)
    .replace(/{{DESCRIPTION}}/g, description)
    .replace(/{{PINNED_COMMENT}}/g, pinnedComment)
    .replace(/{{UPLOAD_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function generateTikTok(): string {
  const template = loadTemplate('tiktok');
  if (!template) throw new Error('TikTok template not found');

  const captionOptions = [
    '1. A Brilliantier knows when to cash out. Pressure makes diamonds, but strategy builds empires. #Sporty #Brilliantier #Icyflamze',
    '2. Under pressure we build, before burning. Sporty No Go Take My Soul is dropping soon. #NewMusic #LagosRoots #Cyberpunk',
    '3. They wanted a show, so we built the board. King on my own board, knight in the game. #AreaBoy #IndependentLabel',
    '4. Surviving the pressure of Lagos streets with two lighters and a vision. #Lagos #Mr2Lighter #Brilliantaire',
    '5. Early access link in bio. Join the movement before the rollout catches fire. #IndependentArtist #StreetCore'
  ].map(line => `- ${line}`).join('\n');

  const checklist = [
    "- [ ] Select official audio sound snippet from TikTok library",
    "- [ ] Set audio track volume at +3dB and mic track at +0dB",
    "- [ ] Add visual hook text in the top third of the frame",
    "- [ ] Paste chosen caption and tag @TreeGrooveRecords",
    "- [ ] Add link in bio overlay sticker"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{HOOK_LINE}}/g, 'They thought we would burn, but we built first.')
    .replace(/{{ON_SCREEN_TEXT}}/g, 'POV: When you are pressure-educated in the heart of Lagos and you know exactly when to cash out.')
    .replace(/{{SOUND_NOTE}}/g, "Use official sound: 'Icyflamze - Sporty (Rollout Mix)'.")
    .replace(/{{CAPTION_OPTIONS}}/g, captionOptions)
    .replace(/{{POSTING_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function generateInstagram(): string {
  const template = loadTemplate('instagram');
  if (!template) throw new Error('Instagram template not found');

  const reelCaption = [
    "Surviving the pressure is an art. Evolving is a strategy. A Brilliantier knows when to cash out.",
    "'Sporty No Go Take My Soul' official campaign rollout starts now.",
    "",
    "Visuals by Tree Groove Records.",
    "",
    "👉 Link in bio to join the movement and unlock early access.",
    "",
    "#Icyflamze #Brilliantier #TreeGrooveRecords #InstaReel #NewSingle"
  ].join('\n');

  const carouselIdea = [
    '- Slide 1: High-contrast title: "King on my own board, Knight in the universe\'s game."',
    '- Slide 2: Lagos roots meets cybernetic strategy.',
    '- Slide 3: Mindset definition: Survival + Creation = Mr. 2 Lighter.',
    '- Slide 4: Swipe to unlock early access link details.'
  ].join('\n');

  const storyText = [
    "Pressure-educated.",
    "Survival is step one. Creation is step two.",
    "Tap link in bio to unlock the Sporty rollout."
  ].join('\n');

  const checklist = [
    "- [ ] Select Reel cover image from design-taste library",
    "- [ ] Align carousel aspect ratio to 4:5 (1080x1350px)",
    "- [ ] Share Reel to main profile feed",
    "- [ ] Update Bio link to point to early access gate page",
    "- [ ] Add link sticker to Story post"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{VISUAL_NOTE}}/g, 'Instagram Reel: 9:16 high-contrast neon styling. Carousel: Dark mode cyberpunk slides with HSL gradient accents.')
    .replace(/{{REEL_CAPTION}}/g, reelCaption)
    .replace(/{{CAROUSEL_IDEA}}/g, carouselIdea)
    .replace(/{{STORY_TEXT}}/g, storyText)
    .replace(/{{POSTING_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function generateFacebook(): string {
  const template = loadTemplate('facebook');
  if (!template) throw new Error('Facebook template not found');

  const pagePost = [
    "Pressure builds cities. Design builds futures. Icyflamze's new rollout campaign for 'Sporty No Go Take My Soul' is live.",
    "",
    "As a Brilliantier, you don't react—you build before burning.",
    "Watch the rollout teaser and join the movement for early access benefits.",
    "",
    "CTA: Claim early access: https://brilliantaire.io/sporty"
  ].join('\n');

  const groupPost = [
    "To the Brilliantier community: The rollout for 'Sporty No Go Take My Soul' has officially launched under Tree Groove Records. We build before burning.",
    "Join the conversation, listen to the new leak, and get early download access details.",
    "",
    "CTA: Access details here: https://brilliantaire.io/sporty"
  ].join('\n');

  const reply = "Thanks for the support. We are building the future of independent label strategy. A Brilliantier knows when to cash out.";

  const checklist = [
    "- [ ] Pin the page announcement post to the top of the feed",
    "- [ ] Set link preview card graphic to high-contrast logo",
    "- [ ] Share to ProfBetGeng and label community subgroups",
    "- [ ] Check link tracking tags inside CTA links"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{VISUAL_NOTE}}/g, 'Facebook Link Post: Banner style high-contrast artwork (1200x630px).')
    .replace(/{{PAGE_POST}}/g, pagePost)
    .replace(/{{GROUP_POST}}/g, groupPost)
    .replace(/{{COMMENT_REPLY_STARTER}}/g, reply)
    .replace(/{{POSTING_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function generateWhatsApp(): string {
  const template = loadTemplate('whatsapp');
  if (!template) throw new Error('whatsapp');

  const groupAnnouncement = [
    "🚀 *ROLLOUT ALERT:* 'Sporty No Go Take My Soul' is officially live.",
    "A *Brilliantier* knows when to cash out.",
    "",
    "Watch the teaser and join the early access list now: https://brilliantaire.io/sporty"
  ].join('\n');

  const broadcastMessage = [
    "Yo, Icyflamze here. Just dropped the posting package details for 'Sporty'.",
    "A Brilliantier knows when to cash out.",
    "Check the link and claim your early access: https://brilliantaire.io/sporty"
  ].join('\n');

  const shortReminder = "Quick heads up: Early access closes soon. Don't miss out on the Brilliantier rollout. https://brilliantaire.io/sporty";

  const checklist = [
    "- [ ] Send broadcast to labeled 'VIP Members' and 'Release List'",
    "- [ ] Post teaser banner image in the Tree Groove group chat",
    "- [ ] Set WhatsApp Status (24hr) with link sticker to early access page",
    "- [ ] Pin reminder post inside the community announcement board"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{GROUP_ANNOUNCEMENT}}/g, groupAnnouncement)
    .replace(/{{BROADCAST_MESSAGE}}/g, broadcastMessage)
    .replace(/{{SHORT_REMINDER}}/g, shortReminder)
    .replace(/{{POSTING_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function generateObsidian(): string {
  const template = loadTemplate('obsidian');
  if (!template) throw new Error('Obsidian template not found');

  const summary = "Marketing asset generation for 'Sporty No Go Take My Soul'. Tracks manual copy-paste packages across YouTube, TikTok, Instagram, Facebook, and WhatsApp.";

  const nextActions = [
    '- [ ] Distribute manual posting packages to channel coordinators',
    '- [ ] Monitor comments and collect sentiment reports',
    '- [ ] Update live dashboard metrics'
  ].join('\n');

  const tags = '`#campaign/sporty` `#rollout/active` `#label/treegroove`';
  const backlinks = '[[Sporty Campaign Main Brief]], [[Tree Groove Records Hub]], [[Brilliantier OS Launch Checklist]]';

  const checklist = [
    "- [ ] Import generated package markdown files to vault database",
    "- [ ] Link this note to the main Project Status Board",
    "- [ ] Verify links inside vault graph view"
  ].join('\n');

  return template
    .replace(/{{CAMPAIGN_NAME}}/g, SPORTY_CAMPAIGN.name)
    .replace(/{{BRAND}}/g, SPORTY_CAMPAIGN.brand)
    .replace(/{{CAMPAIGN_PHRASE}}/g, SPORTY_CAMPAIGN.phrase)
    .replace(/{{CORE_CTA}}/g, SPORTY_CAMPAIGN.cta)
    .replace(/{{ASSET_NEEDED}}/g, SPORTY_CAMPAIGN.assetNeeded)
    .replace(/{{REVIEW_STATUS}}/g, SPORTY_CAMPAIGN.reviewStatus)
    .replace(/{{CAMPAIGN_NOTE_SUMMARY}}/g, summary)
    .replace(/{{NEXT_ACTIONS}}/g, nextActions)
    .replace(/{{TAGS}}/g, tags)
    .replace(/{{BACKLINK_SUGGESTIONS}}/g, backlinks)
    .replace(/{{POSTING_CHECKLIST}}/g, checklist)
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());
}

function writePackage(platform: string, content: string): string {
  const config = PLATFORM_CONFIGS[platform];
  const dateStr = getFormattedDate();
  const filePath = getUniqueFilePath(config.outputFolder, `sporty_${platform}_package`, dateStr);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function checkPackageExists(platform: string): boolean {
  const config = PLATFORM_CONFIGS[platform];
  const targetFolder = path.join(REPO_ROOT, config.outputFolder);
  if (!fs.existsSync(targetFolder)) return false;

  const files = fs.readdirSync(targetFolder);
  return files.some(f => f.startsWith(`sporty_${platform}_package`) && f.endsWith('.md'));
}

function getLatestPackagePath(platform: string): string {
  const config = PLATFORM_CONFIGS[platform];
  const targetFolder = path.join(REPO_ROOT, config.outputFolder);
  if (!fs.existsSync(targetFolder)) return 'None Found';

  const files = fs.readdirSync(targetFolder)
    .filter(f => f.startsWith(`sporty_${platform}_package`) && f.endsWith('.md'))
    .sort();

  if (files.length === 0) return 'None Found';
  return path.relative(REPO_ROOT, path.join(targetFolder, files[files.length - 1]));
}

function main() {
  const args = process.argv.slice(2);
  const command = args.join(' ').toLowerCase().trim().replace(/\s+/g, ' ');

  if (!command) {
    console.error("❌ Error: Missing command.");
    console.log("Use: npm run platform-adapter-help for details.");
    process.exit(1);
  }

  const dateStr = getFormattedDate();

  if (command === 'sporty youtube') {
    const content = generateYouTube();
    const dest = writePackage('youtube', content);
    console.log(`✅ YouTube package generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty tiktok') {
    const content = generateTikTok();
    const dest = writePackage('tiktok', content);
    console.log(`✅ TikTok package generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty instagram') {
    const content = generateInstagram();
    const dest = writePackage('instagram', content);
    console.log(`✅ Instagram package generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty facebook') {
    const content = generateFacebook();
    const dest = writePackage('facebook', content);
    console.log(`✅ Facebook package generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty whatsapp') {
    const content = generateWhatsApp();
    const dest = writePackage('whatsapp', content);
    console.log(`✅ WhatsApp package generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty obsidian') {
    const content = generateObsidian();
    const dest = writePackage('obsidian', content);
    console.log(`✅ Obsidian campaign note generated successfully:`);
    console.log(`👉 ${path.relative(REPO_ROOT, dest)}`);
  } else if (command === 'sporty all') {
    const youtubeDest = writePackage('youtube', generateYouTube());
    const tiktokDest = writePackage('tiktok', generateTikTok());
    const instagramDest = writePackage('instagram', generateInstagram());
    const facebookDest = writePackage('facebook', generateFacebook());
    const whatsappDest = writePackage('whatsapp', generateWhatsApp());
    const obsidianDest = writePackage('obsidian', generateObsidian());

    console.log("✅ All six platform posting packages generated successfully:");
    console.log(`👉 ${path.relative(REPO_ROOT, youtubeDest)}`);
    console.log(`👉 ${path.relative(REPO_ROOT, tiktokDest)}`);
    console.log(`👉 ${path.relative(REPO_ROOT, instagramDest)}`);
    console.log(`👉 ${path.relative(REPO_ROOT, facebookDest)}`);
    console.log(`👉 ${path.relative(REPO_ROOT, whatsappDest)}`);
    console.log(`👉 ${path.relative(REPO_ROOT, obsidianDest)}`);
  } else if (command === 'status sporty') {
    console.log("=========================================");
    console.log("🛰️ SPORTY CAMPAIGN posting PACKAGE STATUS");
    console.log("=========================================");
    console.log(`YouTube Package Generated:   ${checkPackageExists('youtube') ? '🟢 YES' : '🔴 NO'}`);
    console.log(`TikTok Package Generated:    ${checkPackageExists('tiktok') ? '🟢 YES' : '🔴 NO'}`);
    console.log(`Instagram Package Generated: ${checkPackageExists('instagram') ? '🟢 YES' : '🔴 NO'}`);
    console.log(`Facebook Package Generated:  ${checkPackageExists('facebook') ? '🟢 YES' : '🔴 NO'}`);
    console.log(`WhatsApp Package Generated:  ${checkPackageExists('whatsapp') ? '🟢 YES' : '🔴 NO'}`);
    console.log(`Obsidian Note Generated:    ${checkPackageExists('obsidian') ? '🟢 YES' : '🔴 NO'}`);
    console.log("-----------------------------------------");
    console.log("Latest Generated Paths:");
    console.log(`  📹 YouTube:   ${getLatestPackagePath('youtube')}`);
    console.log(`  🎵 TikTok:    ${getLatestPackagePath('tiktok')}`);
    console.log(`  📸 Instagram: ${getLatestPackagePath('instagram')}`);
    console.log(`  👥 Facebook:  ${getLatestPackagePath('facebook')}`);
    console.log(`  💬 WhatsApp:  ${getLatestPackagePath('whatsapp')}`);
    console.log(`  📓 Obsidian:  ${getLatestPackagePath('obsidian')}`);
    console.log("-----------------------------------------");

    let action = '';
    const missing = ['youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'obsidian'].filter(p => !checkPackageExists(p));
    if (missing.length > 0) {
      action = `Generate packages for missing platforms using: npm run platform-adapter -- "sporty all"`;
    } else {
      action = `Verify and review content packages inside outputs/platform_adapters/ for rollout.`;
    }
    console.log(`Next Recommended Action:\n  👉 ${action}`);
    console.log("=========================================");
  } else {
    console.error(`❌ Error: Unknown command parameter "${command}"`);
    console.log("Use: npm run platform-adapter-help for options.");
    process.exit(1);
  }
}

main();
