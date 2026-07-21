import { getDB } from '../db.js';

export interface GoalItem {
  id: string;
  title: string;
  project: string;
  status: 'pending' | 'in_progress' | 'completed';
}

const DEFAULT_GOALS: GoalItem[] = [
  { id: 'goal-1', title: 'Implement OSK Core Runtime', project: 'The One System', status: 'completed' },
  { id: 'goal-2', title: 'Establish Live Data Adapters', project: 'The One System', status: 'in_progress' }
];

export class GoalManager {
  private goals: GoalItem[] = [];

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS executive_goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        project TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const initialRows = db.prepare(`SELECT * FROM executive_goals`).all() as any[];

    if (initialRows.length === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO executive_goals (id, title, project, status)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET title = excluded.title, project = excluded.project, status = excluded.status
      `);
      for (const goal of DEFAULT_GOALS) {
        insertStmt.run(goal.id, goal.title, goal.project, goal.status);
      }
    }

    // Unconditionally load existing records from SQLite database so both winning and losing processes hydrate from DB rows
    const rows = db.prepare(`SELECT * FROM executive_goals`).all() as any[];
    this.goals = rows.map(r => ({
      id: r.id,
      title: r.title,
      project: r.project,
      status: r.status as any
    }));
  }

  public getGoals(): GoalItem[] {
    return [...this.goals];
  }

  public addGoal(title: string, project: string): GoalItem {
    const item: GoalItem = {
      id: `goal-${Date.now()}`,
      title,
      project,
      status: 'pending'
    };
    this.goals.push(item);

    const db = getDB();
    db.prepare(`
      INSERT INTO executive_goals (id, title, project, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, project = excluded.project, status = excluded.status
    `).run(item.id, item.title, item.project, item.status);

    return item;
  }

  public updateGoalStatus(id: string, status: GoalItem['status']): void {
    const goal = this.goals.find(g => g.id === id);
    if (goal) {
      goal.status = status;
      const db = getDB();
      db.prepare(`UPDATE executive_goals SET status = ? WHERE id = ?`).run(status, id);
    }
  }
}

export const globalGoalManager = new GoalManager();
