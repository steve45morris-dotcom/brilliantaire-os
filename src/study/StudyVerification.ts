import type { StudyRecord, StudyVerificationCheck, StudyVerificationResult } from './StudyTypes.js';

const REQUIRED_TEXT_FIELDS: Array<keyof Pick<
  StudyRecord,
  | 'title'
  | 'category'
  | 'summary'
  | 'what'
  | 'why'
  | 'whenToUse'
  | 'whenNotToUse'
  | 'implementationMethod'
  | 'verificationMethod'
  | 'rollbackMethod'
  | 'expectedOutcome'
>> = [
  'title',
  'category',
  'summary',
  'what',
  'why',
  'whenToUse',
  'whenNotToUse',
  'implementationMethod',
  'verificationMethod',
  'rollbackMethod',
  'expectedOutcome'
];

const REQUIRED_ARRAY_FIELDS: Array<keyof Pick<
  StudyRecord,
  | 'prerequisites'
  | 'tradeoffs'
  | 'risks'
  | 'evidence'
  | 'sources'
  | 'affectedWorkspaces'
  | 'affectedServices'
  | 'measurableIndicators'
  | 'relatedSkillIds'
>> = [
  'prerequisites',
  'tradeoffs',
  'risks',
  'evidence',
  'sources',
  'affectedWorkspaces',
  'affectedServices',
  'measurableIndicators',
  'relatedSkillIds'
];

export function verifyStudyRecord(record: StudyRecord): StudyVerificationResult {
  const checks: StudyVerificationCheck[] = [];
  const missingFields: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_TEXT_FIELDS) {
    const passed = record[field].trim().length > 0;
    checks.push({
      name: `field:${field}`,
      passed,
      reason: passed ? undefined : `${field} is required.`
    });

    if (!passed) {
      missingFields.push(field);
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    const passed = record[field].length > 0;
    checks.push({
      name: `collection:${field}`,
      passed,
      reason: passed ? undefined : `${field} must contain at least one entry.`
    });

    if (!passed) {
      missingFields.push(field);
    }
  }

  const sourceTier1Count = record.sources.filter((source) => source.tier === 'tier1').length;
  const sourceTier4Count = record.sources.filter((source) => source.tier === 'tier4').length;

  checks.push({
    name: 'source-coverage',
    passed: record.sources.length >= 2,
    reason: record.sources.length >= 2 ? undefined : 'At least two sources are required for systematic study.'
  });

  checks.push({
    name: 'primary-source-presence',
    passed: sourceTier1Count > 0,
    reason: sourceTier1Count > 0 ? undefined : 'At least one tier1 source is required.'
  });

  checks.push({
    name: 'low-confidence-source-detection',
    passed: sourceTier4Count === 0,
    reason: sourceTier4Count === 0 ? undefined : 'Tier4-only evidence requires additional verification.'
  });

  if (record.sources.length < 2) {
    blockers.push('Study does not yet have enough source coverage.');
  }

  if (sourceTier1Count === 0) {
    blockers.push('No tier1 source has been attached.');
  }

  if (record.verificationMethod.trim().length === 0) {
    blockers.push('Verification method is missing.');
  }

  if (record.rollbackMethod.trim().length === 0) {
    warnings.push('Rollback method is missing.');
  }

  if (record.relatedSkillIds.length === 0) {
    warnings.push('No related skills are mapped to this study record.');
  }

  if (record.confidence < 50) {
    warnings.push('Confidence is below the preferred floor for adoption.');
  }

  return {
    passed: blockers.length === 0 && missingFields.length === 0,
    checks,
    missingFields,
    blockers,
    warnings
  };
}
