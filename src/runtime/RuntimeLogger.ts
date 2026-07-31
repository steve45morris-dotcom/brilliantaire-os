export interface RuntimeLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: string;
}

export class RuntimeLogger {
  private logs: RuntimeLogEntry[] = [];

  public log(message: string, level: RuntimeLogEntry['level'] = 'info', context = 'Runtime'): void {
    const entry: RuntimeLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
    this.logs.push(entry);
    console.log(`[Supernova ${level.toUpperCase()}] (${context}) ${message}`);
  }

  public getLogs(): RuntimeLogEntry[] {
    return [...this.logs];
  }
}

export const globalRuntimeLogger = new RuntimeLogger();
