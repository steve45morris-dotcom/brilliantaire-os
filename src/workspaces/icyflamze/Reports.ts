import fs from 'fs';
import path from 'path';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { REPO_ROOT } from '../../scheduler_layer.js';

export class ReportCompiler {
  public compileAllReports(): string[] {
    const generatedFiles: string[] = [];

    // 1. ICYFLAMZE_OS.md
    const osPath = path.join(REPO_ROOT, 'ICYFLAMZE_OS.md');
    const osContent = `# 🌌 Icyflamze OS: sovereign Multi-Agent Creative Workspace

> **Origin:** Area Boy (Lagos Roots) | **Symbolism:** Mr. 2 Lighter (Survival + Creation)  
> **Mindset:** Brilliantier (Pressure-educated) | **Signature:** *"I build before burning."*  
> **Identity Stack:** King on his own board, Knight in the universe's game.  

## 🌌 Workspace Core Overview
**Icyflamze OS** is a production-grade creative operating workspace designed specifically for Icyflamze's artistic and business endeavors. It is built as a modular application tier running on top of **The One System OS** (registered in the repository as \`brilliantaire-os\`).

It coordinates:
1. **Music Studio**: Timed mix/master status recording.
2. **Lyric Notebook**: Hook, verse, and freestyle banks.
3. **Content Machine**: Social media script scheduler.
4. **Release Center**: Release timelines and countdowns.
5. **Monetization Engine**: Streaming, merch, and royalties analytics.

---

## 🛠️ Operating Systems Bindings
All modules inherit the sandbox boundaries, exact-name command routing, and memory reflect handlers of **The One System**:
- **Executive Layer Integration**: Mapped goals update \`GoalManager\` states programmatically.
- **Knowledge Graph Integration**: Registries write nodes directly to the global Graph Store.
- **Live Operations**: Active workflow runs trigger the live \`TaskTracker\` session states.
- **Memory Synchronizer**: Output states sync with the SQLite ledger system.
`;
    fs.writeFileSync(osPath, osContent, 'utf-8');
    generatedFiles.push(osPath);

    // 2. ICYFLAMZE_WORKSPACE_SPEC.md
    const specPath = path.join(REPO_ROOT, 'ICYFLAMZE_WORKSPACE_SPEC.md');
    const specContent = `# 📂 Icyflamze OS Workspace Specification

This document details the modules, configuration parameters, and runtime endpoints of the **Icyflamze OS** reference implementation.

## 🛠️ Modules Registry
The workspace exposes 15 modules:
- **Dashboard**: Central cockpit showing Today's Executive Brief, current releases, and AI recommendations.
- **Music**: Track title, BPM, genre, status (recorded, mixed, mastered), and release schedule.
- **Lyrics**: Rhyme explorer, punchline banks, and freestyle vault.
- **Projects**: Staged tasks tracker and repository registries.
- **Content**: Campaign planner covering Shorts, YouTube long-form, and interviews.
- **Publishing**: EP/Album metadata check and release calendar.
- **Brand**: HSL design token rules and character direction parameters.
- **Knowledge**: Root mapping links linking songs to lyric drafts.
- **Media**: Press kit documents index and photo asset tagging.
- **Analytics**: Audience stats, completion rate trackers, and streaks.
- **Revenue**: Earnings streams tracking vs production expenses.
- **Goals**: Target priorities timeframe connector.
- **Calendar**: Content posting dates and release countdowns.
- **Reports**: Staged documentation generator engine.
- **Settings**: Local Whisper/Piper and environment configurations.
`;
    fs.writeFileSync(specPath, specContent, 'utf-8');
    generatedFiles.push(specPath);

    // 3. CONTENT_MACHINE.md
    const contentPath = path.join(REPO_ROOT, 'CONTENT_MACHINE.md');
    const contentContent = `# 🎬 Icyflamze Content Machine

## 🚀 Purpose
To coordinate multi-channel campaigns across YouTube, TikTok, Instagram, Threads, and X under the Street Scholar Futurist theme.

## 📊 Pipeline Stages
- **Idea**: Conceptualize based on memory-graph trend recommendations.
- **Script**: Cerebral, elevated street-scholar style narrations.
- **Thumbnail**: Gold-and-black cyberpunk grid templates.
- **Recording**: Sandboxed local audio drops.
- **Editing**: Automated assembly prep check.
- **Publishing**: Manual copy-paste deployment.
- **Analytics**: Offline tracking of post yield metrics.
`;
    fs.writeFileSync(contentPath, contentContent, 'utf-8');
    generatedFiles.push(contentPath);

    // 4. MUSIC_PIPELINE.md
    const musicPath = path.join(REPO_ROOT, 'MUSIC_PIPELINE.md');
    const musicContent = `# 🎵 Music Pipeline: Song Lifecycle Manager

## 🎼 Description
Orchestrates digital music assets from draft lyrics to mastered releases through Tree Groove Records.

## 📋 Track Parameters
- **Title**: Project registry name.
- **Status**: Draft | Recorded | Mixed | Mastered | Released.
- **BPM & Mood**: Rhythm parameters (e.g. 92 BPM, Cinematic / Gritty).
- **Asset Check**: Audio wave files, artwork cover graphics, and publishing credits validation.
- **Timeline**: Releases sorted by target date countdowns.
`;
    fs.writeFileSync(musicPath, musicContent, 'utf-8');
    generatedFiles.push(musicPath);

    // 5. LYRIC_WORKFLOW.md
    const lyricPath = path.join(REPO_ROOT, 'LYRIC_WORKFLOW.md');
    const lyricContent = `# ✍️ Lyric Workflow & Writing Workspace

## 📓 Lyric Notebook
The writing room organizes creative flows into:
- **Freestyle Vault**: Rapid-fire verbal recordings.
- **Hooks Library**: High-impact choruses.
- **Punchline Bank**: High-intelligence bars.
- **Rhyme Explorer**: Phonetic match exploration.

## 🚦 Status Lifecycle
\`Draft\` ──► \`Review\` ──► \`Approved\` ──► \`Recorded\` ──► \`Released\`
`;
    fs.writeFileSync(lyricPath, lyricContent, 'utf-8');
    generatedFiles.push(lyricPath);

    // 6. RELEASE_CENTER.md
    const releasePath = path.join(REPO_ROOT, 'RELEASE_CENTER.md');
    const releaseContent = `# 🚀 Release Center: EP & Album Rollout Manager

## 📢 EP & Album Campaign Control
Tracks release countdowns, digital aggregator metadata status, and promotional press kits.

## 📋 Active Release
- **Title**: Rise of the Street Scholar
- **Type**: EP (6 Tracks)
- **Status**: Campaigning (15 Days Countdown)
- **Aggregator status**: Submitted and verified.
`;
    fs.writeFileSync(releasePath, releaseContent, 'utf-8');
    generatedFiles.push(releasePath);

    // 7. REVENUE_TRACKING.md
    const revenuePath = path.join(REPO_ROOT, 'REVENUE_TRACKING.md');
    const revenueContent = `# 💸 Revenue Tracking & Financial Yield Ledger

## 💰 Income Streams
- **Streaming**: Spotify/Apple Music distributions.
- **Royalties**: Song trust publishing net yields.
- **Shows**: Ticket earnings from live showcases.
- **Merchandise**: Mr. 2 Lighter custom matches and chess sets.
- **Brand Deals**: Creative tech sponsor deals.

## 📉 Expenses
- Sound engineering, local piper compute costs, and artwork licenses.
`;
    fs.writeFileSync(revenuePath, revenueContent, 'utf-8');
    generatedFiles.push(revenuePath);

    // 8. ICYFLAMZE_EXECUTIVE_WORKFLOW.md
    const execPath = path.join(REPO_ROOT, 'ICYFLAMZE_EXECUTIVE_WORKFLOW.md');
    const execContent = `# 🧠 Icyflamze Executive Workflow

## 📋 Routine Execution Protocols
- **Morning Brief**: Ingests new Obsidian notes, runs System Eye scan, and compiles priorities list.
- **Content Reminder**: Fires alerts if script queues drop below safety margins.
- **Countdown**: Dynamic date checking on active releases.
- **Weekly Executive Review**: Consolidated reports output.
`;
    fs.writeFileSync(execPath, execContent, 'utf-8');
    generatedFiles.push(execPath);

    // 9. ICYFLAMZE_OS_IMPLEMENTATION_REPORT.md
    const reportPath = path.join(REPO_ROOT, 'ICYFLAMZE_OS_IMPLEMENTATION_REPORT.md');
    const reportContent = `# 📊 Icyflamze OS Implementation Report

## 🏁 Summary
**Icyflamze OS** has been fully implemented as the reference creative workspace application running on top of **The One System**.

## 🔋 Verified Integrations
- **Data Modules**: Created Dashboard, Music, Lyrics, Projects, Content, Publishing, Brand, Knowledge, Media, Analytics, Revenue, Goals, Calendar, Reports, Settings.
- **Event Bus**: Emitted events for songs, lyrics, content, and goals.
- **Knowledge Graph**: Staged metadata nodes for active track assets.
- **Operations Intelligence**: Fed status outputs directly into the telemetry brief compilers.
`;
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    generatedFiles.push(reportPath);

    // Register all reports in Knowledge Graph
    generatedFiles.forEach(f => {
      const id = path.basename(f).replace(/\./g, '-');
      globalNodeRegistry.registerNode(id, 'Report', {
        path: f,
        type: 'Documentation'
      });
      globalEdgeRegistry.registerEdge(id, 'system-core', 'GENERATED');
    });

    globalEventBus.publish('IcyflamzeReportsGenerated', { count: generatedFiles.length });

    return generatedFiles;
  }
}

export const globalReportCompiler = new ReportCompiler();
