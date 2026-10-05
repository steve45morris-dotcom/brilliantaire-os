import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { inputFiles, outputDirectories } from '../config/grinders-keep-core-brief-engine.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function runContentDrafts() {
  const dateStr = getFormattedDate();
  console.log(`📝 Running Grinders Keep Smart Content Drafting Layer v0.1 for ${dateStr} (Real Data Mode)...`);
  await announceIntent("Drafting content from real system context");

  // Parse real data safely
  let currentPhase = 'Phase 12B: Grinders Keep Core Brief Engine Plus — COMPLETE';
  if (fs.existsSync(inputFiles.systemStatus)) {
    const statusContent = fs.readFileSync(inputFiles.systemStatus, 'utf-8');
    const phaseMatch = statusContent.match(/-\s+\*\*Current Phase:\*\*\s*(.*)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
    }
  }

  let icyflamzeNextAction = 'Refine lyric flow & integrate campaign brief prompts';
  if (fs.existsSync(inputFiles.projects)) {
    const projectsContent = fs.readFileSync(inputFiles.projects, 'utf-8');
    const lines = projectsContent.split('\n');
    for (const line of lines) {
      if (line.includes('Icyflamze') && line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 6) {
          icyflamzeNextAction = parts[5];
        }
      }
    }
  }

  let pendingAction = 'Build Registry Health Monitor';
  if (fs.existsSync(inputFiles.nextActions)) {
    const nextActionsContent = fs.readFileSync(inputFiles.nextActions, 'utf-8');
    const lines = nextActionsContent.split('\n');
    const match = lines.find(line => line.includes('- [ ]') && !line.includes('Phase 12B'));
    if (match) {
      pendingAction = match.replace(/-\s*\[\s*\]\s*/, '').trim();
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'grinders-keep-content-draft-template.md');
  let templateContent = '';
  if (fs.existsSync(templatePath)) {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  }

  // 1. One Icyflamze content idea
  const draft1 = {
    content_id: 'CD-ICY-001-REAL',
    content_type: 'short_video_script',
    source_context: `Icyflamze next action in PROJECTS.md: "${icyflamzeNextAction}"`,
    draft_text: `[Music: Low sub bass hits, neon lights flicker]
Speaker: "Knights move differently on the board. King status is earned in the silence, not the hype. Real action gets completed in the shadows of the workspace. Next move: ${icyflamzeNextAction}."`,
    intended_platform: 'TikTok / YouTube Shorts',
    smallest_useful_version: '15-second narration block highlighting the next action',
    review_status: 'needs_review',
    monetization_angle: 'Build brand presence and drive audience engagement to premium release channels.',
    money_confidence_score_1_to_10: 8,
    reason_for_money_score: 'Direct brand value translation from structured developer workflow storytelling.',
    next_action: 'Confirm and record voice packet in recordings/ folder.'
  };

  // 2. One Brilliantaire OS build update post
  const draft2 = {
    content_id: 'CD-BUILD-002-REAL',
    content_type: 'caption',
    source_context: `Current system status currentPhase: "${currentPhase}"`,
    draft_text: `System Update: Brilliantaire OS is executing ${currentPhase}. Skeletal build v0.1 has compiled successfully. Staging local-only R&D briefings with exact command validations.`,
    intended_platform: 'X / Twitter',
    smallest_useful_version: 'Text update showing build status and exact-name commands list',
    review_status: 'needs_review',
    monetization_angle: 'Showcase structural OS integrity to build developer trust for custom consulting integrations.',
    money_confidence_score_1_to_10: 7,
    reason_for_money_score: 'SaaS build transparency is highly correlated with enterprise developer interest.',
    next_action: 'Stage write command to obsidian.'
  };

  // 3. One Grinders Keep educational note
  const draft3 = {
    content_id: 'CD-EDU-003-REAL',
    content_type: 'daily_note',
    source_context: 'No Hype Rule and Kill List local enforcement guidelines',
    draft_text: 'Sovereignty is subtraction. In Grinders Keep, we do not build because it is cool. Every suggestion must include a strongest reason not to build yet, and every daily brief includes a feature to pause, block, or delete. If you cannot outline why you should wait, you do not understand the risk.',
    intended_platform: 'Obsidian Vault / Newsletter',
    smallest_useful_version: 'Educational markdown note indexed under briefs/',
    review_status: 'needs_review',
    monetization_angle: 'Premium subscriber content for productivity architecture newsletter.',
    money_confidence_score_1_to_10: 6,
    reason_for_money_score: 'High value workflows attract premium sub stack subscriptions.',
    next_action: 'Verify formatting alignment with SYSTEM_STATUS.md.'
  };

  // 4. One Google Ultra workflow idea
  const draft4 = {
    content_id: 'CD-ULTRA-004-REAL',
    content_type: 'article_angle',
    source_context: 'Local response intelligence indexing and manual Google tool integration',
    draft_text: 'Leveraging Gemini/NotebookLM Workspace Mapping: Stage local index markdown files dynamically, then manually load the folder into your NotebookLM or Gemini Workspace for strategic query parsing, preserving total data isolation.',
    intended_platform: 'Medium / Substack',
    smallest_useful_version: 'Workflow blueprint detailing manual data mapping boundaries',
    review_status: 'needs_review',
    monetization_angle: 'Consulting packages detailing secure local-first AI workspace designs.',
    money_confidence_score_1_to_10: 8,
    reason_for_money_score: 'Enterprise customers pay premium rates for secure, privacy-first workflow blueprints.',
    next_action: 'Draft and review manual checklist.'
  };

  // 5. One prompt for future build execution
  const draft5 = {
    content_id: 'CD-PROMPT-005-REAL',
    content_type: 'build_prompt',
    source_context: `Pending next action in NEXT_ACTIONS.md: "${pendingAction}"`,
    draft_text: `Design a TypeScript implementation script for the pending action: "${pendingAction}". Ensure strict local-first safety, require confirmation switches, output markdown check reports, and perform error handling for missing folders.`,
    intended_platform: 'Local IDE / Subagent System',
    smallest_useful_version: 'Structured build prompt mapping parameters to CLI execution',
    review_status: 'needs_review',
    monetization_angle: 'Improves internal dev velocity, reducing overall coding time and resource costs.',
    money_confidence_score_1_to_10: 9,
    reason_for_money_score: 'Direct operational efficiency gains reduce project engineering expenditures.',
    next_action: 'Stage for execution in the next project milestone.'
  };

  const drafts = [draft1, draft2, draft3, draft4, draft5];
  let finalOutput = `# Grinders Keep Content Drafts - ${dateStr}\n\n`;

  for (const d of drafts) {
    let entry = templateContent;
    if (!entry) {
      entry = `# 📝 Smart Content Draft: [{{content_type}}] {{content_id}}\n- **Content ID:** {{content_id}}\n...`;
    }

    entry = entry
      .replace(/{{content_id}}/g, d.content_id)
      .replace(/{{content_type}}/g, d.content_type)
      .replace(/{{source_context}}/g, d.source_context)
      .replace(/{{draft_text}}/g, d.draft_text)
      .replace(/{{intended_platform}}/g, d.intended_platform)
      .replace(/{{smallest_useful_version}}/g, d.smallest_useful_version)
      .replace(/{{review_status}}/g, d.review_status)
      .replace(/{{monetization_angle}}/g, d.monetization_angle)
      .replace(/{{money_confidence_score_1_to_10}}/g, String(d.money_confidence_score_1_to_10))
      .replace(/{{reason_for_money_score}}/g, d.reason_for_money_score)
      .replace(/{{next_action}}/g, d.next_action)
      .replace(/{{commander_approval_required}}/g, 'true');

    finalOutput += entry + '\n\n---\n\n';
  }

  // Ensure output directory exists
  fs.mkdirSync(outputDirectories.contentDrafts, { recursive: true });
  const outputFile = path.join(outputDirectories.contentDrafts, `grinders_keep_content_drafts_${dateStr}.md`);
  fs.writeFileSync(outputFile, finalOutput, 'utf-8');

  console.log(`✅ Saved content drafts output to: ${outputFile}`);
  await announceCompletion("Smart content drafts generation complete", "10");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runContentDrafts().catch(err => {
    console.error(`❌ Error in Content Drafts: ${err}`);
    process.exit(1);
  });
}
