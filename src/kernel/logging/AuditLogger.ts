import { globalEventBus, KernelEvent } from '../events/EventBus.js';

export interface AuditRecord {
  id: string;
  timestamp: string;
  category: 'command' | 'event' | 'error' | 'workflow' | 'memory' | 'plugin' | 'approval';
  action: string;
  actor: string;
  details: string;
}

export class AuditLogger {
  private records: AuditRecord[] = [];

  constructor() {
    // Listen to global event bus wildcard for logging
    globalEventBus.subscribe('*', (event: KernelEvent) => {
      this.logEvent(event);
    });

    // Initial default logs
    this.records.push({
      id: 'aud-1',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      category: 'approval',
      action: 'VNP approved rollout',
      actor: 'System Core',
      details: 'ASR narration assets passed presence preflight checks.'
    });
  }

  public getRecords(): AuditRecord[] {
    return [...this.records];
  }

  public writeRecord(record: Omit<AuditRecord, 'id' | 'timestamp'>): void {
    const fullRecord: AuditRecord = {
      ...record,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.records.unshift(fullRecord);
  }

  private logEvent(event: KernelEvent): void {
    let category: AuditRecord['category'] = 'event';
    let details = JSON.stringify(event.payload);

    if (event.type.startsWith('Command')) {
      category = 'command';
    } else if (event.type.startsWith('Workflow')) {
      category = 'workflow';
    } else if (event.type.startsWith('Memory')) {
      category = 'memory';
    } else if (event.type.startsWith('Plugin')) {
      category = 'plugin';
    } else if (event.type.includes('Failed') || event.type.includes('Error')) {
      category = 'error';
    }

    this.writeRecord({
      category,
      action: event.type,
      actor: event.payload.sender || 'System kernel',
      details
    });
  }
}

export const globalAuditLogger = new AuditLogger();
