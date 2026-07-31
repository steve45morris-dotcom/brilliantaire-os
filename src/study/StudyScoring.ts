import type {
  StudyRecord,
  StudyRecommendation,
  StudyScoreBreakdown,
  StudyScoreResult
} from './StudyTypes.js';
import type { StudyVerificationResult } from './StudyTypes.js';

export interface StudyScoreContext {
  verification?: StudyVerificationResult;
  similarRecordCount?: number;
}

export function scoreStudyRecord(
  record: StudyRecord,
  context: StudyScoreContext = {}
): StudyScoreResult {
  const sourceQuality = scoreSourceQuality(record);
  const evidenceDepth = scoreEvidenceDepth(record);
  const applicability = scoreApplicability(record);
  const verificationReadiness = scoreVerificationReadiness(record, context.verification);
  const duplicationRisk = scoreDuplicationRisk(record, context.similarRecordCount ?? 0);
  const maintainability = scoreMaintainability(record);

  const total = Math.round(
    sourceQuality * 0.2 +
      evidenceDepth * 0.2 +
      applicability * 0.15 +
      verificationReadiness * 0.2 +
      duplicationRisk * 0.1 +
      maintainability * 0.15
  );

  const confidence = Math.max(
    0,
    Math.min(100, Math.round((record.confidence + verificationReadiness) / 2))
  );

  return {
    score: total,
    breakdown: {
      sourceQuality,
      evidenceDepth,
      applicability,
      verificationReadiness,
      duplicationRisk,
      maintainability,
      total
    },
    recommendation: resolveRecommendation(total, confidence, context.verification),
    confidence
  };
}

function scoreSourceQuality(record: StudyRecord): number {
  if (record.sources.length === 0) {
    return 0;
  }

  let score = Math.min(100, record.sources.length * 18);

  for (const source of record.sources) {
    if (source.tier === 'tier1') {
      score += 15;
    } else if (source.tier === 'tier2') {
      score += 10;
    } else if (source.tier === 'tier3') {
      score += 5;
    }

    if (source.sourceType === 'official' || source.sourceType === 'primary') {
      score += 4;
    }
  }

  return clamp(score);
}

function scoreEvidenceDepth(record: StudyRecord): number {
  const coverage = record.evidence.length * 14 + record.measurableIndicators.length * 12;
  const tradeoffSignal = Math.min(20, record.tradeoffs.length * 5);
  const riskSignal = Math.min(20, record.risks.length * 4);
  return clamp(coverage + tradeoffSignal + riskSignal);
}

function scoreApplicability(record: StudyRecord): number {
  const scopeSignal =
    Math.min(40, record.affectedWorkspaces.length * 12) +
    Math.min(30, record.affectedServices.length * 10);
  const usefulnessSignal =
    clampLength(record.whenToUse) * 0.25 +
    clampLength(record.whenNotToUse) * 0.2 +
    clampLength(record.summary) * 0.15;
  return clamp(scopeSignal + usefulnessSignal);
}

function scoreVerificationReadiness(
  record: StudyRecord,
  verification?: StudyVerificationResult
): number {
  const base =
    (record.verificationMethod.trim().length > 0 ? 35 : 0) +
    (record.rollbackMethod.trim().length > 0 ? 20 : 0) +
    Math.min(20, record.prerequisites.length * 5) +
    Math.min(15, record.measurableIndicators.length * 5);

  const bonus = verification?.passed ? 10 : 0;
  return clamp(base + bonus);
}

function scoreDuplicationRisk(record: StudyRecord, similarRecordCount: number): number {
  const relatedSignal = Math.min(30, record.relatedSkillIds.length * 8 + record.knowledgeNodeIds.length * 4);
  const duplicateSignal = Math.min(40, similarRecordCount * 12);
  const evidencePenalty = record.evidence.length < 3 ? 15 : 0;
  const sourcePenalty = record.sources.length < 2 ? 15 : 0;
  return clamp(100 - (relatedSignal + duplicateSignal + evidencePenalty + sourcePenalty));
}

function scoreMaintainability(record: StudyRecord): number {
  const claritySignal =
    Math.min(35, clampLength(record.implementationMethod) * 0.1) +
    Math.min(20, clampLength(record.rollbackMethod) * 0.08);
  const lifecycleSignal =
    (record.status === 'verified' || record.status === 'approved' || record.status === 'adopted' ? 20 : 0) +
    (record.reviewedAt ? 10 : 0);
  const evidenceSignal = Math.min(30, record.evidence.length * 6);
  return clamp(claritySignal + lifecycleSignal + evidenceSignal);
}

function resolveRecommendation(
  total: number,
  confidence: number,
  verification?: StudyVerificationResult
): StudyRecommendation {
  if (verification && !verification.passed) {
    return 'research_more';
  }

  if (total >= 85 && confidence >= 75) {
    return 'adopt';
  }

  if (total >= 70) {
    return 'pilot';
  }

  if (total >= 50) {
    return 'watch';
  }

  if (total >= 35) {
    return 'verify';
  }

  return 'reject';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampLength(value: string): number {
  return Math.min(100, value.trim().length);
}
