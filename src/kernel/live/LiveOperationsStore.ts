import { OperationEvent, LiveSession, LiveTask, AttentionItem } from './LiveOperationsTypes.js';
import { getDB } from '../../db.js';
import { AgentExecutionState, isAgentExecutionEvent, projectAgentExecutionStates, sanitizeAgentExecutionState } from './AgentExecutionTelemetry.js';

export class LiveOperationsStore {
  private sessions: Map<string, LiveSession> = new Map();
  private tasks: Map<string, LiveTask> = new Map();
  private events: OperationEvent[] = [];
  private attentionItems: AttentionItem[] = [];
  private executionStates: Map<string, AgentExecutionState> = new Map();

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
        ended_at DATETIME,
        duration_ms INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        attention_required INTEGER DEFAULT 0,
        last_event_id TEXT,
        details_json TEXT
      );
      CREATE TABLE IF NOT EXISTS live_execution_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT 0,
        event_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS live_execution_states (
        execution_key TEXT PRIMARY KEY,
        updated_at TEXT NOT NULL,
        state_json TEXT NOT NULL
      );
    `);

    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN name TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN description TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN started_at DATETIME;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN ended_at DATETIME;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN duration_ms INTEGER DEFAULT 0;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN progress INTEGER DEFAULT 0;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN attention_required INTEGER DEFAULT 0;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN last_event_id TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_tasks ADD COLUMN details_json TEXT;`); } catch {}
    try { db.exec(`ALTER TABLE live_execution_events ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;`); } catch {}

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
      const parsedDetails = r.details_json ? JSON.parse(r.details_json) : {};
      this.tasks.set(r.id, {
        id: r.id,
        sessionId: r.session_id,
        type: r.type,
        name: r.name || r.description || 'unnamed-task',
        status: r.status,
        projectId: r.project_id,
        startedAt: r.started_at || new Date().toISOString(),
        endedAt: r.ended_at || null,
        durationMs: r.duration_ms ?? parsedDetails.durationMs ?? 0,
        progress: r.progress ?? parsedDetails.progress ?? (r.status === 'completed' ? 100 : 0),
        attentionRequired: Boolean(r.attention_required ?? parsedDetails.attentionRequired ?? false),
        lastEventId: r.last_event_id || parsedDetails.lastEventId || 'evt-init',
        ...parsedDetails
      });
    }

    const eventRows = db.prepare(`SELECT event_json FROM live_execution_events ORDER BY created_at DESC LIMIT 200`).all() as Array<{ event_json: string }>;
    for (const row of eventRows.reverse()) {
      try { this.events.push(JSON.parse(row.event_json)); } catch {}
    }
    const stateRows = db.prepare(`SELECT execution_key, state_json FROM live_execution_states ORDER BY updated_at DESC LIMIT 500`).all() as Array<{ execution_key: string; state_json: string }>;
    for (const row of stateRows) {
      try {
        const state = sanitizeAgentExecutionState(JSON.parse(row.state_json));
        if (state) this.executionStates.set(row.execution_key, state);
      } catch {}
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
      INSERT INTO live_tasks (id, session_id, type, name, description, status, project_id, started_at, ended_at, duration_ms, progress, attention_required, last_event_id, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        status = excluded.status,
        ended_at = excluded.ended_at,
        duration_ms = excluded.duration_ms,
        progress = excluded.progress,
        attention_required = excluded.attention_required,
        last_event_id = excluded.last_event_id,
        details_json = excluded.details_json
    `).run(
      task.id,
      task.sessionId,
      task.type,
      taskName,
      taskName,
      task.status,
      task.projectId,
      task.startedAt || new Date().toISOString(),
      task.endedAt || null,
      task.durationMs || 0,
      task.progress || 0,
      task.attentionRequired ? 1 : 0,
      task.lastEventId || 'evt-init',
      JSON.stringify(task)
    );
  }

  public getTask(id: string): LiveTask | undefined {
    return this.tasks.get(id);
  }

  public getTasks(): LiveTask[] {
    return Array.from(this.tasks.values());
  }

  public addEvent(event: OperationEvent): void {
    if (this.events.some((existing) => existing.id === event.id)) return;
    if (isAgentExecutionEvent(event.type) && getDB().prepare(`SELECT 1 FROM live_execution_events WHERE id = ?`).get(event.id)) return;
    this.events.push(event);
    if (this.events.length > 200) {
      this.events.shift();
    }
    if (isAgentExecutionEvent(event.type)) {
      const db = getDB();
      const transaction = db.transaction(() => {
        db.prepare(`INSERT INTO live_execution_events (id, timestamp, created_at, event_json) VALUES (?, ?, ?, ?)`)
          .run(event.id, event.timestamp, Date.now(), JSON.stringify(event));
        db.prepare(`DELETE FROM live_execution_events WHERE id NOT IN (SELECT id FROM live_execution_events ORDER BY created_at DESC LIMIT 1000)`).run();
        const eventData = event.data as Record<string, unknown>;
        const eventKey = `${eventData.agentId}:${eventData.missionId || ''}:${eventData.taskId || ''}`;
        const projected = projectAgentExecutionStates(this.events).find((state) => `${state.agentId}:${state.missionId || ''}:${state.taskId || ''}` === eventKey);
        if (projected) {
          const existing = this.executionStates.get(eventKey);
          const definedProjection = Object.fromEntries(Object.entries(projected).filter(([, value]) => value !== undefined)) as Partial<AgentExecutionState>;
          const state = existing ? {
            ...existing,
            ...definedProjection,
            status: projected.status === 'queued' ? existing.status : projected.status
          } as AgentExecutionState : projected;
          if (event.type === 'capability.verification.completed' && eventData.verified === true) state.blockedReason = undefined;
          this.executionStates.set(eventKey, state);
          db.prepare(`INSERT OR REPLACE INTO live_execution_states (execution_key, updated_at, state_json) VALUES (?, ?, ?)`)
            .run(eventKey, state.updatedAt, JSON.stringify(state));
        }
        db.prepare(`DELETE FROM live_execution_states WHERE execution_key NOT IN (SELECT execution_key FROM live_execution_states ORDER BY updated_at DESC LIMIT 500)`).run();
        const retained = new Set((db.prepare(`SELECT execution_key FROM live_execution_states`).all() as Array<{ execution_key: string }>).map((row) => row.execution_key));
        for (const key of this.executionStates.keys()) if (!retained.has(key)) this.executionStates.delete(key);
      });
      transaction();
    }
  }

  public getEvents(): OperationEvent[] {
    return [...this.events];
  }

  public getAgentExecutionStates(): AgentExecutionState[] {
    return [...this.executionStates.values()];
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
    this.executionStates.clear();

    const db = getDB();
    db.exec(`DELETE FROM live_sessions; DELETE FROM live_tasks; DELETE FROM live_execution_events; DELETE FROM live_execution_states;`);
  }
}

export const globalLiveOperationsStore = new LiveOperationsStore();
