import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStudyRecord, normalizeStudyRecord, type StudyRecordDraft } from './StudyRecord.js';
import { scoreStudyRecord, type StudyScoreContext } from './StudyScoring.js';
import { verifyStudyRecord } from './StudyVerification.js';
import type { StudyRecord, StudyStatus } from './StudyTypes.js';
import { globalStudyKnowledgeSync } from './StudyKnowledgeSync.js';
import { INITIAL_STUDY_PACK } from './InitialStudyPack.js';
import { PILOT_SKILL_STUDY_PACK } from './EngineeringPilotStudyPack.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

export const STUDY_DIR = path.join(REPO_ROOT, 'workflows', 'study');
export const STUDY_REGISTRY_FILE = path.join(STUDY_DIR, 'study-registry.json');

interface StudyRegistryState {
  records: StudyRecord[];
}

export class StudyRegistry {
  private records: Map<string, StudyRecord> = new Map();

  constructor(private readonly storagePath: string = STUDY_REGISTRY_FILE) {
    this.ensureStorage();
    this.load();
    const seeds = [...INITIAL_STUDY_PACK, ...PILOT_SKILL_STUDY_PACK];
    const missingSeeds = seeds.filter((record) => !this.records.has(record.id));
    if (missingSeeds.length > 0) {
      missingSeeds.forEach((record) => this.records.set(record.id, normalizeStudyRecord(record)));
      this.save();
    }
  }

  public listRecords(): StudyRecord[] {
    return Array.from(this.records.values());
  }

  public getRecord(id: string): StudyRecord | null {
    return this.records.get(id) ?? null;
  }

  public findByStatus(status: StudyStatus): StudyRecord[] {
    return this.listRecords().filter((record) => record.status === status);
  }

  public findBySkill(skillId: string): StudyRecord[] {
    return this.listRecords().filter((record) => record.relatedSkillIds.includes(skillId));
  }

  public registerRecord(record: StudyRecord): StudyRecord {
    const normalized = normalizeStudyRecord(record);
    this.records.set(normalized.id, normalized);
    this.save();
    return normalized;
  }

  public createRecord(draft: StudyRecordDraft): StudyRecord {
    const record = createStudyRecord(draft);
    return this.registerRecord(record);
  }

  public reviewRecord(id: string, reviewer: string, status: StudyStatus = 'verified'): StudyRecord {
    const current = this.records.get(id);
    if (!current) {
      throw new Error(`Study record ${id} was not found.`);
    }

    const updated = normalizeStudyRecord({
      ...current,
      status,
      reviewedAt: new Date().toISOString(),
      reviewer
    });

    this.records.set(id, updated);
    this.save();
    return updated;
  }

  public scoreRecord(id: string, context: StudyScoreContext = {}) {
    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Study record ${id} was not found.`);
    }

    return scoreStudyRecord(record, context);
  }

  public verifyRecord(id: string) {
    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Study record ${id} was not found.`);
    }

    return verifyStudyRecord(record);
  }

  public syncRecord(id: string) {
    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Study record ${id} was not found.`);
    }

    return globalStudyKnowledgeSync.syncStudyRecord(record);
  }

  private load(): void {
    if (!fs.existsSync(this.storagePath)) {
      this.save();
      return;
    }

    try {
      const payload = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8')) as StudyRegistryState;
      for (const record of payload.records ?? []) {
        const normalized = normalizeStudyRecord(record);
        this.records.set(normalized.id, normalized);
      }
    } catch {
      this.records.clear();
    }
  }

  private save(): void {
    const payload: StudyRegistryState = {
      records: this.listRecords()
    };

    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  private ensureStorage(): void {
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
  }
}

export const globalStudyRegistry = new StudyRegistry();
