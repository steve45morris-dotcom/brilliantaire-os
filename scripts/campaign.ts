import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { REPO_ROOT } from '../config/paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function handleList() {
  const campaignsPath = path.join(REPO_ROOT, 'CAMPAIGNS.md');
  if (!fs.existsSync(campaignsPath)) {
    console.error("❌ CAMPAIGNS.md not found.");
    process.exit(1);
  }
  const content = fs.readFileSync(campaignsPath, 'utf-8');
  console.log("=========================================");
  console.log("📈 ACTIVE CAMPAIGNS MATRIX");
  console.log("=========================================");
  
  const lines = content.split('\n');
  let tableStarted = false;
  for (const line of lines) {
    if (line.trim().startsWith('|') && line.includes('Campaign Name')) {
      tableStarted = true;
    }
    if (tableStarted) {
      if (!line.trim().startsWith('|')) {
        break;
      }
      console.log(line);
    }
  }
  console.log("=========================================");
}

function handleBrief(campaignKey: string) {
  if (campaignKey !== 'sporty') {
    console.error("❌ Unknown campaign. Only 'sporty' is currently configured.");
    process.exit(1);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'campaign-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Campaign template brief not found.");
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // High fidelity substitutions
  template = template
    .replace(/\{\{CAMPAIGN_NAME\}\}/g, 'Sporty No Go Take My Soul Rollout')
    .replace(/\{\{BRAND\}\}/g, 'Icyflamze / Tree Groove Records')
    .replace(/\{\{GOAL\}\}/g, 'Build pre-release attention through Lagos street challenge, Brilliantier identity, and website early-access coupon strategy.')
    .replace(/\{\{AUDIENCE\}\}/g, 'Street-culture youth (Nigeria / UK / US), indie afrobeats/hip-hop heads, tech-creative developers.')
    .replace(/\{\{CORE_MESSAGE\}\}/g, '"They cannot take your soul. Survival is creation. I build before burning."')
    .replace(/\{\{CAMPAIGN_HOOK\}\}/g, 'A 15-second street dance/lyric challenge synchronized with the pre-chorus beat drop. Mr. 2 Lighter visual signature active.')
    .replace(/\{\{OFFER\}\}/g, 'Pre-save link redirection to a hidden portal offering a 20% discount coupon code for visual merchandise.')
    .replace(/\{\{PLATFORMS\}\}/g, '- **TikTok:** Primary challenge channel.\n- **Instagram:** Reel teasers & behind-the-scenes slides.\n- **Snapchat:** Visual forge lenses.\n- **Facebook:** Community group announcements.\n- **WhatsApp:** Direct peer list distribution.')
    .replace(/\{\{CONTENT_PILLARS\}\}/g, '1. **Lagos Roots:** Raw street dance, survival lyrics, and Lagos cultural references.\n2. **Brilliantier Identity:** High-leverage hustling advice, creative self-belief logs.\n3. **Visual Forge:** Avatar mythology 3D worldbuilding clips.')
    .replace(/\{\{TIMELINE\}\}/g, '- **Week 1:** Launch Lagos street challenge teaser with dance influencers.\n- **Week 2:** Activate the digital pre-save coupon gateway link.\n- **Week 3:** Release day single drops & visual forge premiere.')
    .replace(/\{\{ASSETS_NEEDED\}\}/g, '- 15s pre-save sound file.\n- 3D Avatar visual loop.\n- Merch coupon portal web page.\n- 3 short street interview prompt lists.')
    .replace(/\{\{AGENTS_NEEDED\}\}/g, '- **Creative Revenue Strategist:** Asset monetization.\n- **Prompt Engineer:** Influencer script templates.\n- **Knowledge Librarian:** Obsidian logs ingestion.')
    .replace(/\{\{RISKS\}\}/g, '- *Risk:* Low pre-save conversion.\n- *Mitigation:* Ensure WhatsApp/TikTok groups receive direct copy pointers.')
    .replace(/\{\{SUCCESS_METRICS\}\}/g, '- 5,000 pre-saves compiled.\n- 50 street challenge user-submitted videos.\n- 1,000 discount coupons distributed.')
    .replace(/\{\{NEXT_ACTIONS\}\}/g, '- [ ] Draft street challenge TikTok script.\n- [ ] Deploy pre-save portal HTML page.\n- [ ] Sync brief with Obsidian vault briefs folder.');

  const dateStr = getFormattedDate();
  const destDir = path.join(REPO_ROOT, 'outputs', 'campaigns', 'briefs');
  const finalPath = getSafeWritePath(destDir, `sporty_no_go_take_my_soul_${dateStr}`, '.md');

  fs.writeFileSync(finalPath, template);
  console.log(`✅ Campaign Brief generated: outputs/campaigns/briefs/${path.basename(finalPath)}`);
}

function handleCalendar(campaignKey: string) {
  if (campaignKey !== 'sporty') {
    console.error("❌ Unknown campaign.");
    process.exit(1);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'content-calendar-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Content calendar template not found.");
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace(/\{\{CAMPAIGN_NAME\}\}/g, 'Sporty No Go Take My Soul');

  // Compile 3-weeks rows (TikTok, IG, FB, Snap, WA)
  let rows = '';
  const platforms = ['TikTok', 'Instagram', 'Snapchat', 'WhatsApp', 'Facebook'];
  
  for (let week = 1; week <= 3; week++) {
    for (let day = 1; day <= 7; day++) {
      const dateString = `W${week}D${day}`;
      
      // Post 1: TikTok / Snapchat (Street challenge / Hook conditioning)
      rows += `| ${dateString} | TikTok | Challenge video | Street dancer drop matching the beat hook | Visual avatar drop | Challenge #NoGoTakeMySoul | Scheduled | Pre-release hype | \n`;
      
      // Post 2: Instagram / Facebook (Brilliantier / Identity text)
      rows += `| ${dateString} | Instagram | Reel/Slide | Lagos Roots & Mr. 2 Lighter mindset caption | Image card quote | Link in bio pre-save | Draft | Identity alignment | \n`;
      
      // Post 3: WhatsApp / Platform (Coupon / Conversion drive)
      rows += `| ${dateString} | WhatsApp | Text + Card | Exclusive early coupon code pre-save prompt | Merch visual card | Click portal link | Draft | Merch conversion | \n`;
    }
  }

  template = template.replace(/\{\{CALENDAR_ROWS\}\}/g, rows.trim());

  const dateStr = getFormattedDate();
  const destDir = path.join(REPO_ROOT, 'outputs', 'campaigns', 'content_calendars');
  const finalPath = getSafeWritePath(destDir, `sporty_no_go_take_my_soul_calendar_${dateStr}`, '.md');

  fs.writeFileSync(finalPath, template);
  console.log(`✅ Content Calendar generated: outputs/campaigns/content_calendars/${path.basename(finalPath)}`);
}

function handlePromptPack(campaignKey: string) {
  if (campaignKey !== 'sporty') {
    console.error("❌ Unknown campaign.");
    process.exit(1);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'prompt-pack-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Prompt pack template not found.");
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace(/\{\{PROMPT_PACK_NAME\}\}/g, 'Sporty Rollout Prompt Pack')
    .replace(/\{\{TARGET_PLATFORM\}\}/g, 'Generative Models (Claude, Gemini, Sora, Veo)')
    .replace(/\{\{USE_CASE\}\}/g, 'Generating street interview scripts, visual forge assets, TikTok captions, landing page copy, and WhatsApp promotions.')
    .replace(/\{\{SYSTEM_PROMPT\}\}/g, 'You are the Creative Prompt Architect under the Icyflamze identity stack.\nAlways write in the Lagos-rooted, street-coded, and pressure-educated style.\nEnforce a high-contrast, cyberpunk, neon design voice.')
    .replace(/\{\{USER_PROMPT\}\}/g, 'Draft a 15-second TikTok script for a street interview in Lagos.\n- Topic: Survival and self-belief ("They cannot take your soul").\n- Visual cue: The speaker holds a lighter.\n- Dialogue style: Pidgin/English street slang.\n- Hook: "Who tell you say creative hustle easy?"')
    .replace(/\{\{OUTPUT_REQUIREMENTS\}\}/g, '- Clean markdown structure\n- Split cue details in bold\n-Pidgin/English glossary references')
    .replace(/\{\{QUALITY_CHECKLIST\}\}/g, '- [ ] Raw Pidgin sounds authentic.\n- [ ] Core Mr. 2 Lighter symbolism present.\n- [ ] Zero generic corporate layout.')
    .replace(/\{\{REUSE_NOTES\}\}/g, 'Reuse for any afrobeats pre-release script or street campaign prompt generation.');

  const dateStr = getFormattedDate();
  const destDir = path.join(REPO_ROOT, 'outputs', 'campaigns', 'prompt_packs');
  const finalPath = getSafeWritePath(destDir, `sporty_no_go_take_my_soul_prompt_pack_${dateStr}`, '.md');

  fs.writeFileSync(finalPath, template);
  console.log(`✅ Prompt Pack generated: outputs/campaigns/prompt_packs/${path.basename(finalPath)}`);
}

function handleChecklist(campaignKey: string) {
  if (campaignKey !== 'sporty') {
    console.error("❌ Unknown campaign.");
    process.exit(1);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'campaign-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Checklist template not found.");
    process.exit(1);
  }

  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace(/\{\{CAMPAIGN_NAME\}\}/g, 'Sporty No Go Take My Soul')
    .replace(/\{\{STRATEGY_CHECKLIST\}\}/g, '- [ ] Validate Lagos pre-release timeline details.\n- [ ] Score audience demographics metrics.')
    .replace(/\{\{CREATIVE_CHECKLIST\}\}/g, '- [ ] Export 3D avatar visual loops.\n- [ ] Verify audio track cuts.')
    .replace(/\{\{CAPTIONS_CHECKLIST\}\}/g, '- [ ] Compile Pidgin street hook scripts.\n- [ ] Write conversion promo briefs.')
    .replace(/\{\{VISUALS_CHECKLIST\}\}/g, '- [ ] Generate high-fidelity visual cards for WhatsApp.\n- [ ] Catalog HSL color tokens for the landing page.')
    .replace(/\{\{VIDEO_CHECKLIST\}\}/g, '- [ ] Prompt Sora/Veo for the 15s pre-chorus beat drop avatar background.')
    .replace(/\{\{WEBSITE_CHECKLIST\}\}/g, '- [ ] Verify pre-save portal HTML page.\n- [ ] Configure coupon redemption code routes.')
    .replace(/\{\{AUDIENCE_CHECKLIST\}\}/g, '- [ ] Verify WhatsApp groups links.\n- [ ] Deploy early-access newsletter trigger forms.')
    .replace(/\{\{SCHEDULE_CHECKLIST\}\}/g, '- [ ] Map out TikTok influencers launch schedule.\n- [ ] Load IG reels content calendar.')
    .replace(/\{\{REVIEW_CHECKLIST\}\}/g, '- [ ] Run final structural audit.\n- [ ] Validate project status variables.')
    .replace(/\{\{LAUNCH_CHECKLIST\}\}/g, '- [ ] Run `task validate` check.\n- [ ] Go Live pre-save link.');

  const dateStr = getFormattedDate();
  const destDir = path.join(REPO_ROOT, 'outputs', 'campaigns', 'checklists');
  const finalPath = getSafeWritePath(destDir, `sporty_no_go_take_my_soul_checklist_${dateStr}`, '.md');

  fs.writeFileSync(finalPath, template);
  console.log(`✅ Campaign Checklist generated: outputs/campaigns/checklists/${path.basename(finalPath)}`);
}

function handleCreate() {
  const templatePath = path.join(REPO_ROOT, 'templates', 'campaign-template.md');
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Template brief not found.");
    process.exit(1);
  }
  const content = fs.readFileSync(templatePath, 'utf-8');
  const dateStr = getFormattedDate();
  const destDir = path.join(REPO_ROOT, 'outputs', 'campaigns', 'briefs');
  const finalPath = getSafeWritePath(destDir, `new_campaign_brief_${dateStr}`, '.md');
  
  fs.writeFileSync(finalPath, content);
  console.log(`✅ Staged blank brief template at: outputs/campaigns/briefs/${path.basename(finalPath)}`);
}

function run() {
  let args = process.argv.slice(2);
  if (args.length === 1 && args[0].includes(' ')) {
    args = args[0].split(/\s+/);
  }
  const action = args[0]?.toLowerCase().trim();
  const target = args[1]?.toLowerCase().trim();

  if (!action) {
    console.error("❌ No action provided.");
    process.exit(1);
  }

  switch (action) {
    case 'list':
      handleList();
      break;
    case 'brief':
      handleBrief(target);
      break;
    case 'calendar':
      handleCalendar(target);
      break;
    case 'prompt-pack':
      handlePromptPack(target);
      break;
    case 'checklist':
      handleChecklist(target);
      break;
    case 'create':
      handleCreate();
      break;
    default:
      console.error(`❌ Unknown command: "${action}". Run campaign-help to list commands.`);
      process.exit(1);
  }
}

run();
