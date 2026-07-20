import { WorkspaceDataRecord } from './WorkspaceTypes.js';
import { mockWorkspacesData } from './WorkspaceData.js';
import { resolveWorkspaceBySlug } from './WorkspaceSlug.js';
import { globalSongManager } from './icyflamze/Music.js';
import { globalContentMachine } from './icyflamze/Content.js';
import { globalRevenueCenter } from './icyflamze/Revenue.js';
import { globalGoalConnector } from './icyflamze/Goals.js';
import { globalIcyflamzeDashboard } from './icyflamze/Dashboard.js';

export class WorkspaceRegistry {
  private workspaces: Map<string, WorkspaceDataRecord> = new Map();

  constructor() {
    // Populate with mock data
    Object.entries(mockWorkspacesData).forEach(([id, data]) => {
      this.workspaces.set(id, data);
    });
  }

  public getWorkspace(id: string): WorkspaceDataRecord | null {
    const key = resolveWorkspaceBySlug(id);
    if (key === 'icyflamze') {
      const profit = globalRevenueCenter.getProfitMetrics();
      const brief = globalIcyflamzeDashboard.getExecutiveBrief();
      const recommendations = globalIcyflamzeDashboard.getAIRecommendations();
      const recentActivity = [
        ...globalSongManager.getSongs().map(s => ({ timestamp: new Date().toISOString(), activity: `Song: ${s.title} is currently ${s.status}.` })),
        ...globalContentMachine.getContent().map(c => ({ timestamp: new Date().toISOString(), activity: `Content: ${c.title} is currently ${c.status}.` })),
        ...globalGoalConnector.getGoals().map(g => ({ timestamp: new Date().toISOString(), activity: `Goal: ${g.title} is ${g.status}.` }))
      ].slice(0, 5);

      return {
        id: 'icyflamze',
        name: 'Icyflamze Studio',
        description: 'Rollout coordinator, lyric staging, and ad tracking portal.',
        tag: 'Creator OS',
        overview: `Branding and content engine for Tree Groove releases. Focus: ${brief.todayFocus}`,
        goals: globalGoalConnector.getGoals().map(g => ({ id: g.id, title: g.title, status: g.status })),
        workflows: [
          { id: 'icy-w1', name: 'Morning Brief Ingestion', status: 'idle' },
          { id: 'icy-w2', name: 'Release Countdown Sync', status: 'idle' },
          { id: 'icy-w3', name: 'Content Reminder Audit', status: 'idle' },
          { id: 'icy-w4', name: 'Weekly Executive Review', status: 'idle' }
        ],
        recommendedActions: recommendations,
        knowledgeLinks: [
          { label: 'Creative IP Bible', url: 'file:///Users/alexanderanthony/ICYFLAMZE_CORE_SEASON_1_IP_BIBLE.md' },
          { label: 'Content Machine Spec', url: 'file:///Users/alexanderanthony/ICYFLAMZE_CONTENT_MACHINE_SPEC.md' },
          { label: 'Workspace Spec', url: 'file:///Users/alexanderanthony/ICYFLAMZE_WORKSPACE_SPEC.md' }
        ],
        revenueStatus: `$${profit.totalIncome.toLocaleString()} Income / $${profit.totalExpenses.toLocaleString()} Expenses (Net: $${profit.netProfit.toLocaleString()})`,
        recentActivity,
        reports: [
          'ICYFLAMZE_OS.md',
          'ICYFLAMZE_WORKSPACE_SPEC.md',
          'CONTENT_MACHINE.md',
          'MUSIC_PIPELINE.md',
          'LYRIC_WORKFLOW.md',
          'RELEASE_CENTER.md',
          'REVENUE_TRACKING.md',
          'ICYFLAMZE_EXECUTIVE_WORKFLOW.md',
          'ICYFLAMZE_OS_IMPLEMENTATION_REPORT.md'
        ]
      };
    }
    return this.workspaces.get(key) || null;
  }

  public listWorkspaces(): WorkspaceDataRecord[] {
    const list = Array.from(this.workspaces.values());
    return list.map(w => this.getWorkspace(w.id) || w);
  }
}

export const globalWorkspaceRegistry = new WorkspaceRegistry();

