import { WorkspaceDataRecord } from './WorkspaceTypes.js';
import { mockWorkspacesData } from './WorkspaceData.js';
import { resolveWorkspaceBySlug } from './WorkspaceSlug.js';
import { globalSongManager } from './icyflamze/Music.js';
import { globalContentMachine } from './icyflamze/Content.js';
import { globalRevenueCenter } from './icyflamze/Revenue.js';
import { globalGoalConnector } from './icyflamze/Goals.js';
import { globalIcyflamzeDashboard } from './icyflamze/Dashboard.js';
import { getDB } from '../db.js';

export class WorkspaceRegistry {
  private workspaces: Map<string, WorkspaceDataRecord> = new Map();

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS custom_workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        tag TEXT NOT NULL,
        overview TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const initialRows = db.prepare(`SELECT * FROM custom_workspaces`).all() as any[];

    if (initialRows.length === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO custom_workspaces (id, name, description, tag, overview, data_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `);

      Object.entries(mockWorkspacesData).forEach(([id, data]) => {
        insertStmt.run(id, data.name, data.description, data.tag, data.overview, JSON.stringify(data));
      });
    }

    // Unconditionally load existing records from SQLite database so both winning and losing processes hydrate from DB rows
    const rows = db.prepare(`SELECT * FROM custom_workspaces`).all() as any[];
    this.workspaces.clear();
    for (const r of rows) {
      this.workspaces.set(r.id, JSON.parse(r.data_json));
    }
  }

  public registerWorkspace(workspace: WorkspaceDataRecord): void {
    this.workspaces.set(workspace.id, workspace);

    const db = getDB();
    db.prepare(`
      INSERT INTO custom_workspaces (id, name, description, tag, overview, data_json)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, tag = excluded.tag, overview = excluded.overview, data_json = excluded.data_json
    `).run(
      workspace.id,
      workspace.name,
      workspace.description,
      workspace.tag,
      workspace.overview,
      JSON.stringify(workspace)
    );
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
