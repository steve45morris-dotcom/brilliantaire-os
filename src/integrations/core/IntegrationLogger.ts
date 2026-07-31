export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const MAX_LOG_ENTRIES = 500;

interface LogEntry {
  level: LogLevel;
  integrationId: string;
  message: string;
  data?: any;
  timestamp: string;
}

export class IntegrationLogger {
  private logs: LogEntry[] = [];

  public log(level: LogLevel, integrationId: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { level, integrationId, message, data, timestamp };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs.shift();
    }

    const prefix = `[${timestamp}][${level.toUpperCase()}][${integrationId}]`;
    if (data !== undefined) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${prefix} ${message}`,
        data
      );
    } else {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${prefix} ${message}`
      );
    }
  }

  public info(integrationId: string, message: string, data?: any): void {
    this.log('info', integrationId, message, data);
  }

  public warn(integrationId: string, message: string, data?: any): void {
    this.log('warn', integrationId, message, data);
  }

  public error(integrationId: string, message: string, data?: any): void {
    this.log('error', integrationId, message, data);
  }

  public getLogs(integrationId?: string): LogEntry[] {
    if (integrationId) {
      return this.logs.filter((e) => e.integrationId === integrationId);
    }
    return [...this.logs];
  }
}

export const globalIntegrationLogger = new IntegrationLogger();
