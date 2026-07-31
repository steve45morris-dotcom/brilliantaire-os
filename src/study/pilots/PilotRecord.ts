import type { PilotRecord, PilotRecordDraft } from './PilotTypes.js';

const REQUIRED_TEXT_FIELDS = [
  'id',
  'skillId',
  'title',
  'workspace',
  'realTask',
  'objective',
  'whyThisPilot',
  'whenApplied',
  'expectedOutcome',
  'reviewer'
] as const;

export function normalizePilotRecord(record: PilotRecord): PilotRecord {
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!record[field]?.trim()) {
      throw new Error(`Pilot ${field} is required.`);
    }
  }

  if (!record.baseline?.commit) throw new Error('Pilot baseline commit is required.');
  if (!record.procedure?.length) throw new Error('Pilot procedure is required.');
  if (!record.successMetrics?.length) throw new Error('Pilot success metrics are required.');
  if (!record.failureConditions?.length) throw new Error('Pilot failure conditions are required.');
  if (!record.rollbackPlan?.length) throw new Error('Pilot rollback plan is required.');

  return structuredClone(record);
}

export function createPilotRecord(draft: PilotRecordDraft): PilotRecord {
  return normalizePilotRecord({
    ...draft,
    status: draft.status ?? 'planned',
    startedAt: draft.startedAt ?? null,
    completedAt: draft.completedAt ?? null,
    evidence: draft.evidence ?? [],
    verificationResult: draft.verificationResult ?? null,
    measuredOutcome: draft.measuredOutcome ?? null,
    lessons: draft.lessons ?? [],
    maturityDecision: draft.maturityDecision ?? null
  });
}
