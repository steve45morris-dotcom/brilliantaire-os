export interface ConnectorHealth {
  status: 'healthy' | 'unhealthy' | 'disconnected';
  latency_ms: number;
  last_sync?: string;
  error_rate: number;
}

export interface Connector {
  id: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  health(): Promise<ConnectorHealth>;
  sync(): Promise<boolean>;
  importData(params?: any): Promise<any>;
  exportData(data: any): Promise<boolean>;
}

export class GoogleCalendarConnector implements Connector {
  id = 'google-calendar';
  private connected = false;

  async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<boolean> {
    this.connected = false;
    return true;
  }

  async health(): Promise<ConnectorHealth> {
    return {
      status: this.connected ? 'healthy' : 'disconnected',
      latency_ms: 120,
      last_sync: new Date().toISOString(),
      error_rate: 0.0
    };
  }

  async sync(): Promise<boolean> {
    return true;
  }

  async importData(): Promise<any> {
    return [
      { id: 'cal-event-1', title: 'Weekly Core Alignment', startTime: '10:00', endTime: '11:00', isImmutable: true },
      { id: 'cal-event-2', title: 'Sync Call', startTime: '14:00', endTime: '14:30', isImmutable: true }
    ];
  }

  async exportData(): Promise<boolean> {
    return true;
  }
}

export class ObsidianConnector implements Connector {
  id = 'obsidian';
  private connected = false;

  async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<boolean> {
    this.connected = false;
    return true;
  }

  async health(): Promise<ConnectorHealth> {
    return {
      status: this.connected ? 'healthy' : 'disconnected',
      latency_ms: 80,
      last_sync: new Date().toISOString(),
      error_rate: 0.0
    };
  }

  async sync(): Promise<boolean> {
    return true;
  }

  async importData(): Promise<any> {
    return [
      { note_id: 'note-1', title: 'IcyOS Specs Roadmap', filepath: '/obsidian/IcyOS.md' },
      { note_id: 'note-2', title: 'Lagos Creative Bible', filepath: '/obsidian/LagosBible.md' }
    ];
  }

  async exportData(): Promise<boolean> {
    return true;
  }
}
