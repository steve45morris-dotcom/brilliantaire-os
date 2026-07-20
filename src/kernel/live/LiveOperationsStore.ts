import { OperationEvent, LiveSession, LiveTask, AttentionItem } from './LiveOperationsTypes.js';

export class LiveOperationsStore {
  private sessions: Map<string, LiveSession> = new Map();
  private tasks: Map<string, LiveTask> = new Map();
  private events: OperationEvent[] = [];
  private attentionItems: AttentionItem[] = [];

  public addSession(session: LiveSession): void {
    this.sessions.set(session.id, session);
  }

  public getSession(id: string): LiveSession | undefined {
    return this.sessions.get(id);
  }

  public getSessions(): LiveSession[] {
    return Array.from(this.sessions.values());
  }

  public addTask(task: LiveTask): void {
    this.tasks.set(task.id, task);
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
  }
}

export const globalLiveOperationsStore = new LiveOperationsStore();
