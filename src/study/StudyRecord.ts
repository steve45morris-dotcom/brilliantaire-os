import { randomUUID } from 'node:crypto';
import type { StudyRecord, StudySource, StudyStatus } from './StudyTypes.js';

export interface StudyRecordDraft {
  id?: string;
  title: string;
  category: string;
  summary: string;
  what: string;
  why: string;
  whenToUse: string;
  whenNotToUse: string;
  prerequisites?: string[];
  implementationMethod: string;
  verificationMethod: string;
  rollbackMethod: string;
  tradeoffs?: string[];
  risks?: string[];
  evidence?: string[];
  sources?: StudySource[];
  affectedWorkspaces?: string[];
  affectedServices?: string[];
  expectedOutcome: string;
  measurableIndicators?: string[];
  confidence?: number;
  recommendation?: StudyRecord['recommendation'];
  relatedSkillIds?: string[];
  knowledgeNodeIds?: string[];
  reviewer?: string | null;
  reviewedAt?: string | null;
  status?: StudyStatus;
}

export function createStudyRecord(draft: StudyRecordDraft): StudyRecord {
  const now = new Date().toISOString();

  return {
    id: draft.id?.trim() || `study-${randomUUID()}`,
    title: draft.title.trim(),
    category: draft.category.trim(),
    status: draft.status ?? 'proposed',
    summary: draft.summary.trim(),
    what: draft.what.trim(),
    why: draft.why.trim(),
    whenToUse: draft.whenToUse.trim(),
    whenNotToUse: draft.whenNotToUse.trim(),
    prerequisites: normalizeStrings(draft.prerequisites),
    implementationMethod: draft.implementationMethod.trim(),
    verificationMethod: draft.verificationMethod.trim(),
    rollbackMethod: draft.rollbackMethod.trim(),
    tradeoffs: normalizeStrings(draft.tradeoffs),
    risks: normalizeStrings(draft.risks),
    evidence: normalizeStrings(draft.evidence),
    sources: normalizeSources(draft.sources),
    affectedWorkspaces: normalizeStrings(draft.affectedWorkspaces),
    affectedServices: normalizeStrings(draft.affectedServices),
    expectedOutcome: draft.expectedOutcome.trim(),
    measurableIndicators: normalizeStrings(draft.measurableIndicators),
    recommendation: draft.recommendation ?? 'research_more',
    confidence: clampConfidence(draft.confidence ?? 60),
    createdAt: now,
    reviewedAt: draft.reviewedAt ?? null,
    reviewer: draft.reviewer ?? null,
    knowledgeNodeIds: normalizeStrings(draft.knowledgeNodeIds),
    relatedSkillIds: normalizeStrings(draft.relatedSkillIds)
  };
}

export function normalizeStudyRecord(record: StudyRecord): StudyRecord {
  return {
    ...record,
    prerequisites: normalizeStrings(record.prerequisites),
    tradeoffs: normalizeStrings(record.tradeoffs),
    risks: normalizeStrings(record.risks),
    evidence: normalizeStrings(record.evidence),
    sources: normalizeSources(record.sources),
    affectedWorkspaces: normalizeStrings(record.affectedWorkspaces),
    affectedServices: normalizeStrings(record.affectedServices),
    measurableIndicators: normalizeStrings(record.measurableIndicators),
    knowledgeNodeIds: normalizeStrings(record.knowledgeNodeIds),
    relatedSkillIds: normalizeStrings(record.relatedSkillIds),
    confidence: clampConfidence(record.confidence)
  };
}

export function summarizeStudyRecord(record: StudyRecord): string {
  return [
    `Study: ${record.title}`,
    `Category: ${record.category}`,
    `Status: ${record.status}`,
    `Recommendation: ${record.recommendation}`,
    `Summary: ${record.summary}`,
    `What: ${record.what}`,
    `Why: ${record.why}`,
    `When to use: ${record.whenToUse}`,
    `When not to use: ${record.whenNotToUse}`,
    `Expected outcome: ${record.expectedOutcome}`
  ].join('\n');
}

function normalizeStrings(values?: string[]): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  );
}

function normalizeSources(values?: StudySource[]): StudySource[] {
  return (values ?? []).map((source) => ({
    ...source,
    title: source.title.trim(),
    url: source.url.trim(),
    retrievedAt: source.retrievedAt.trim(),
    notes: source.notes?.trim(),
    license: source.license?.trim()
  }));
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}
