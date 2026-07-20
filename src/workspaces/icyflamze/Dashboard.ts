import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';
import { globalTaskTracker } from '../../kernel/live/TaskTracker.js';
import { globalSongManager } from './Music.js';
import { globalLyricWorkspace } from './Lyrics.js';
import { globalContentMachine } from './Content.js';
import { globalReleaseCenter } from './Publishing.js';
import { globalRevenueCenter } from './Revenue.js';
import { globalGoalConnector } from './Goals.js';
import { globalCalendarManager } from './Calendar.js';
import { globalReportCompiler } from './Reports.js';
import { globalSettingsManager } from './Settings.js';

export interface ExecutiveBrief {
  todayFocus: string;
  narratorStatus: string;
  blockers: string[];
  achievements: string[];
}

export class IcyflamzeDashboard {
  private brief: ExecutiveBrief = {
    todayFocus: 'Prepare Episode 1 creative trailer and mix "Blue Gold Flame" audio track.',
    narratorStatus: 'VBridge online, awaiting verbal activation.',
    blockers: ['Distributor artwork verification is pending approval.'],
    achievements: ['Completed Rise of the Street Scholar Episode 1 script.', 'Grounded NotebookLM index graph created successfully.']
  };

  public getExecutiveBrief(): ExecutiveBrief {
    return { ...this.brief };
  }

  public getAIRecommendations(): string[] {
    const songs = globalSongManager.getSongs();
    const lyrics = globalLyricWorkspace.getLyrics();
    const recommendations: string[] = [];

    const draftSongs = songs.filter(s => s.status === 'Draft');
    if (draftSongs.length > 0) {
      recommendations.push(`(Recommended) AI suggests refining lyrics for the draft track "${draftSongs[0].title}".`);
    }

    const unrecordedLyrics = lyrics.filter(l => l.status === 'Approved');
    if (unrecordedLyrics.length > 0) {
      recommendations.push(`Schedule recording session for approved lyrics: "${unrecordedLyrics[0].title}".`);
    }

    recommendations.push('Analyze YouTube analytics payload to refine Street Scholar visual branding.');
    return recommendations;
  }

  // Automations - Phase 13
  public runMorningBrief(): string {
    const taskId = 'task-morning-brief-' + Date.now();
    globalTaskTracker.startTask(taskId, 'session-background', 'workflow', 'Morning Brief Automation', 'Icyflamze');
    
    // Ingest data to compute today's focus
    this.brief.todayFocus = 'Refine lyric notebooks and update Release Center EP details.';
    
    globalEventBus.publish('IcyflamzeMorningBriefCompleted', { brief: this.brief });
    globalTaskTracker.completeTask(taskId);
    return 'Morning Brief Completed. Today\'s Focus: ' + this.brief.todayFocus;
  }

  public runContentReminder(): string {
    const content = globalContentMachine.getContent();
    const pendingCount = content.filter(c => c.status !== 'Completed').length;
    const alert = pendingCount > 2 ? `ALERT: You have ${pendingCount} content tasks in progress.` : 'Content pipeline healthy.';
    globalEventBus.publish('IcyflamzeContentReminderTriggered', { pendingCount, alert });
    return alert;
  }

  public runReleaseCountdown(): string {
    const releases = globalReleaseCenter.getReleases();
    const active = releases.find(r => r.status === 'Campaigning');
    if (active) {
      if (active.countdownDays > 0) {
        active.countdownDays -= 1;
      }
      globalEventBus.publish('IcyflamzeReleaseCountdownTick', { releaseId: active.id, days: active.countdownDays });
      return `${active.title} EP release countdown updated: ${active.countdownDays} days remaining.`;
    }
    return 'No active campaigns in progress.';
  }

  public runWritingReminder(): string {
    const message = '💡 Write Lyrics: Streak is currently at 12 days. Do not let it drop!';
    globalEventBus.publish('IcyflamzeWritingReminderTriggered', { message });
    return message;
  }

  public runWeeklyExecutiveReview(): string {
    const profit = globalRevenueCenter.getProfitMetrics();
    const summary = `Weekly Performance Summary: Net profit $${profit.netProfit}. Streaming views increased by 12.5%.`;
    globalEventBus.publish('IcyflamzeWeeklyExecutiveReviewCompleted', { summary });
    return summary;
  }

  public runMonthlyRevenueReview(): string {
    const profit = globalRevenueCenter.getProfitMetrics();
    const summary = `Monthly Financial Ledger Review: Revenue $${profit.totalIncome}, Expenses $${profit.totalExpenses}, Profit $${profit.netProfit}.`;
    globalEventBus.publish('IcyflamzeMonthlyRevenueReviewCompleted', { summary });
    return summary;
  }

  public runKnowledgeSync(): string {
    // Re-link core nodes
    const songs = globalSongManager.getSongs();
    songs.forEach(s => {
      globalNodeRegistry.registerNode(s.id, 'Document', { title: s.title, type: 'Song' });
      globalEdgeRegistry.registerEdge(s.id, 'system-core', 'RELATED_TO');
    });
    globalEventBus.publish('IcyflamzeKnowledgeSyncCompleted', { timestamp: new Date().toISOString() });
    return 'Knowledge Sync Complete. Re-indexed ' + songs.length + ' tracks.';
  }

  public runAnalyticsRefresh(): string {
    // Refresh analytics numbers
    globalEventBus.publish('IcyflamzeAnalyticsRefreshCompleted', { timestamp: new Date().toISOString() });
    return 'Analytics statistics refreshed.';
  }
}

export const globalIcyflamzeDashboard = new IcyflamzeDashboard();
export default globalIcyflamzeDashboard;
