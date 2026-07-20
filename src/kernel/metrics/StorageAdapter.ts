import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryRecord {
  timestamp: string;
  type: string;
  payload: any;
}

export class FileStorageAdapter {
  private filePath = '/Users/alexanderanthony/.gemini/telemetry/telemetry_db.jsonl';

  constructor() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public setFilePath(p: string): void {
    this.filePath = p;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public append(record: TelemetryRecord): void {
    fs.appendFileSync(this.filePath, JSON.stringify(record) + '\n', 'utf-8');
  }

  public read(): TelemetryRecord[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const content = fs.readFileSync(this.filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        try {
          return JSON.parse(line) as TelemetryRecord;
        } catch (e) {
          return null;
        }
      })
      .filter((r): r is TelemetryRecord => r !== null);
  }

  public writeAll(records: TelemetryRecord[]): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = records.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(this.filePath, content, 'utf-8');
  }
}

export const globalStorageAdapter = new FileStorageAdapter();
