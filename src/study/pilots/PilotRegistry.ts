import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePilotRecord } from './PilotRecord.js';
import type { PilotRecord, PilotStatus } from './PilotTypes.js';
import { ENGINEERING_PILOT_RECORDS } from './InitialPilotPack.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
export const PILOT_REGISTRY_FILE = path.join(REPO_ROOT, 'workflows', 'study', 'pilot-registry.json');

const TRANSITIONS: Record<PilotStatus, PilotStatus[]> = {
  planned: ['ready', 'rejected', 'archived'],
  ready: ['running', 'blocked', 'rejected', 'archived'],
  running: ['blocked', 'verifying', 'rejected'],
  blocked: ['ready', 'running', 'rejected', 'archived'],
  verifying: ['running', 'measured', 'rejected'],
  measured: ['completed', 'running', 'rejected'],
  completed: ['archived'],
  rejected: ['archived'],
  archived: []
};

export class PilotRegistry {
  private records = new Map<string, PilotRecord>();

  constructor(
    private readonly storagePath: string = PILOT_REGISTRY_FILE,
    seeds: PilotRecord[] = []
  ) {
    this.load();
    if (this.records.size === 0) {
      seeds.forEach((record) => this.records.set(record.id, normalizePilotRecord(record)));
      this.save();
    }
  }

  public list(): PilotRecord[] {
    return Array.from(this.records.values()).map((record) => structuredClone(record));
  }

  public get(id: string): PilotRecord | null {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  public register(record: PilotRecord): PilotRecord {
    const normalized = normalizePilotRecord(record);
    this.records.set(normalized.id, normalized);
    this.save();
    return structuredClone(normalized);
  }

  public update(id: string, update: (record: PilotRecord) => PilotRecord): PilotRecord {
    const current = this.require(id);
    const next = normalizePilotRecord(update(structuredClone(current)));
    this.records.set(id, next);
    this.save();
    return structuredClone(next);
  }

  public transition(id: string, status: PilotStatus): PilotRecord {
    return this.update(id, (record) => {
      if (!TRANSITIONS[record.status].includes(status)) {
        throw new Error(`Invalid pilot status transition: ${record.status} -> ${status}.`);
      }
      record.status = status;
      return record;
    });
  }

  private require(id: string): PilotRecord {
    const record = this.records.get(id);
    if (!record) throw new Error(`Pilot ${id} was not found.`);
    return record;
  }

  private load(): void {
    if (!fs.existsSync(this.storagePath)) return;
    const payload = JSON.parse(fs.readFileSync(this.storagePath, 'utf8')) as { records?: PilotRecord[] };
    for (const record of payload.records ?? []) this.records.set(record.id, normalizePilotRecord(record));
  }

  private save(): void {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify({ records: this.list() }, null, 2), 'utf8');
  }
}

export const globalPilotRegistry = new PilotRegistry(PILOT_REGISTRY_FILE, ENGINEERING_PILOT_RECORDS);
