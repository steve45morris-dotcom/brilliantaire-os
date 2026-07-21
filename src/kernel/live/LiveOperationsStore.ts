import { OperationEvent, LiveSession, LiveTask, AttentionItem } from './LiveOperationsTypes.js';
import { getDB } from '../../db.js';

export class LiveOperationsStore {
  private sessions: Map<string, LiveSession> = new Map();
  private tasks: Map<string, LiveTask> = new Map();
  private events: OperationEvent[] = [];
  private attentionItems: AttentionItem[] = [];

  constructor() {
    this.initPersistence();
  }

  private initPersistence(): void {
    const db = getDB();
    db.exec(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        project_id TEXT NOT NULL,
        details_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS live_tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT,
        description TEXT,
        status TEXT NOT NULL,
        project_id TEXT NOT NULL,
        started_at DATETIME,
        ended_at DATETIME
      );
    `);

    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN name TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN description TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN started_at DATETIME;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN ended_at DATETIME;`); } catch {}

    const sessionRows = db.prepare(`SELECT * FROM live_sessions`).all() as any[];
    for (const r of sessionRows) {
      this.sessions.set(r.id, {
        id: r.id,
        type: r.type,
        status: r.status,
        projectId: r.project_id,
        ...JSON.parse(r.details_json || '{}')
      });
    }

    const taskRows = db.prepare(`SELECT * FROM live_tasks`).all() as any[];
    for (const r of taskRows) {
      this.tasks.set(r.id, {
        id: r.id,
        sessionId: r.session_id,
        type: r.type,
        name: r.name || r.description || 'unnamed-task',
        status: r.status,
        projectId: r.project_id,
        startedAt: r.started_at || new Date().toISOString(),
        endedAt: r.ended_at || null,
        durationMs: 0,
        progress: r.status === 'completed' ? 100 : 0,
        attentionRequired: false,
        lastEventId: 'evt-init'
      });
    }
  }

  public addSession(session: LiveSession): void {
    this.sessions.set(session.id, session);

    const db = getDB();
    db.prepare(`
      INSERT INTO live_sessions (id, type, status, project_id, details_json)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET type = excluded.type, status = excluded.status, project_id = excluded.project_id, details_json = excluded.details_json
    `).run(session.id, session.type, session.status, session.projectId, JSON.stringify(session));
  }

  public getSession(id: string): LiveSession | undefined {
    return this.sessions.get(id);
  }

  public getSessions(): LiveSession[] {
    return Array.from(this.sessions.values());
  }

  public addTask(task: LiveTask): void {
    this.tasks.set(task.id, task);

    const taskName = task.name || (task as any).description || 'unnamed-task';

    const db = getDB();
    db.prepare(`
      INSERT INTO live_tasks (id, session_id, type, name, description, status, project_id, started_at, ended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, status = excluded.status, ended_at = excluded.ended_at
    `).run(
      task.id,
      task.sessionId,
      task.type,
      taskName,
      taskName,
      task.status,
      task.projectId,
      task.startedAt || new Date().toISOString(),
      task.endedAt || null
    );
  }

  public getTask(id: string): LiveTask | undefined {
    return this.tasks.get(id);
  }

  public getTasks(): LiveTask[] {
    return Array.from(this.tasks.values());
  }

  public addEvent(event: OperationEvent): void {
    this.events.push(event);
    if (this.events.length > 200) {
      this.events.shift();
    }
  }

  public getEvents(): OperationEvent[] {
    return [...this.events];
  }

  public addAttentionItem(item: AttentionItem): void {
    this.attentionItems.push(item);
  }

  public getAttentionItems(): AttentionItem[] {
    return [...this.attentionItems];
  }

  public clear(): void {
    this.sessions.clear();
    this.tasks.clear();
    this.events = [];
    this.attentionItems = [];

    const db = getDB();
    db.exec(`DELETE FROM live_sessions; DELETE FROM live_tasks;`);
  }
}

export const globalLiveOperationsStore = new LiveOperationsStore();
