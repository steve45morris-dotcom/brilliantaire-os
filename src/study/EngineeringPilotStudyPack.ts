import { createStudyRecord } from './StudyRecord.js';

interface PilotStudyBlueprint {
  id: string;
  skillId: string;
  title: string;
  category: string;
  what: string;
  why: string;
  whenToUse: string;
  method: string;
  verification: string;
  rollback: string;
  indicators: string[];
  sourceTitle: string;
  sourceUrl: string;
}

const BLUEPRINTS: PilotStudyBlueprint[] = [
  {
    id: 'study-pilot-change-impact-analysis', skillId: 'engineering-change-impact-analysis', title: 'Change Impact Analysis', category: 'governance',
    what: 'A pre-change prediction of affected files, contracts, routes, tests, documentation, dependencies, and rollback boundaries.',
    why: 'It reduces unplanned blast radius and makes implementation variance measurable.',
    whenToUse: 'Before any change that crosses module, route, model, workflow, or documentation boundaries.',
    method: 'Capture baseline, enumerate predicted impacts, implement inside the boundary, then compare predicted and actual scope.',
    verification: 'Measure prediction accuracy, unexpected files, rework, defects prevented, and documented variance.',
    rollback: 'Restore only predicted pilot-owned files and verify unrelated state is unchanged.',
    indicators: ['Impact prediction accuracy', 'Unexpected files changed', 'Implementation variance'],
    sourceTitle: 'Google Engineering Practices', sourceUrl: 'https://google.github.io/eng-practices/'
  },
  {
    id: 'study-pilot-production-readiness-review', skillId: 'engineering-production-readiness-review', title: 'Production Readiness Review', category: 'release',
    what: 'An evidence-based review of route, action, fallback, accessibility, mobile, observability, security, testing, recovery, and ownership readiness.',
    why: 'It finds release risks before approval and prevents a checklist score from hiding blockers.',
    whenToUse: 'After a functional slice is complete and before production approval.',
    method: 'Exercise each readiness area, classify findings, resolve risks, rescore, and withhold approval while blockers remain.',
    verification: 'Record findings, before/after score, resolutions, escaped defects, and release decision.',
    rollback: 'Restore the previous verified artifact or disable the slice using its documented recovery path.',
    indicators: ['Blockers found', 'Blockers resolved', 'Readiness score change'],
    sourceTitle: 'AWS Well-Architected Framework', sourceUrl: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html'
  },
  {
    id: 'study-pilot-effective-troubleshooting', skillId: 'engineering-effective-troubleshooting', title: 'Effective Troubleshooting', category: 'incident',
    what: 'A hypothesis-driven method that separates symptoms from causes and verifies the smallest valid fix.',
    why: 'It reduces false leads, random edits, and recurrence risk.',
    whenToUse: 'When a real defect or controlled failure can be reproduced safely.',
    method: 'State symptom, gather evidence, rank hypotheses, test the cheapest safe hypothesis, isolate cause, fix minimally, and add regression protection.',
    verification: 'Record isolation time, tested hypotheses, false leads, confidence, regression test, and recurrence risk.',
    rollback: 'Reverse only the smallest fix and confirm the original symptom returns in a safe fixture if required.',
    indicators: ['Time to isolate', 'Root-cause confidence', 'Regression tests added'],
    sourceTitle: 'Google SRE Book', sourceUrl: 'https://sre.google/sre-book/table-of-contents/'
  },
  {
    id: 'study-pilot-documentation-drift-detection', skillId: 'engineering-documentation-drift-detection', title: 'Documentation Drift Detection', category: 'documentation',
    what: 'A structured comparison of documented routes, commands, paths, statuses, links, components, test counts, and preview instructions against implementation.',
    why: 'It keeps operator guidance aligned with the live system and makes false positives measurable.',
    whenToUse: 'After implementation surfaces stabilize and before release or documentation certification.',
    method: 'Define authoritative source maps, parse structured sources, report differences, calibrate false positives, and require approval before governance edits.',
    verification: 'Measure real drift, resolved items, false positives, unresolved items, coverage, and time saved.',
    rollback: 'Disable the detector or revert only report configuration; never auto-edit governance documents.',
    indicators: ['Real drift items', 'False-positive rate', 'Detection coverage'],
    sourceTitle: 'Microsoft Engineering Playbook', sourceUrl: 'https://microsoft.github.io/code-with-engineering-playbook/'
  },
  {
    id: 'study-pilot-automated-testing-rollback', skillId: 'engineering-automated-testing-and-rollback', title: 'Automated Testing and Rollback', category: 'testing',
    what: 'A coupled test-first and recovery practice that proves both forward behavior and restoration of the previous state.',
    why: 'It catches defects before completion and proves a change can retreat without damaging unrelated work.',
    whenToUse: 'For contained changes with identifiable files, automated gates, and a reversible boundary.',
    method: 'Define tests and rollback first, observe red, implement to green, reverse the change, build, preserve unrelated state, reapply, and reverify.',
    verification: 'Record failures caught, rollback success and duration, restored files, unrelated-state checksum, builds, and reapplication.',
    rollback: 'Use path-scoped patches or exact copies; prohibit destructive broad reset commands.',
    indicators: ['Rollback success', 'Unrelated files preserved', 'Failures caught before merge'],
    sourceTitle: 'GitHub Actions Documentation', sourceUrl: 'https://docs.github.com/actions'
  }
];

export const PILOT_SKILL_STUDY_PACK = BLUEPRINTS.map((blueprint) => createStudyRecord({
  id: blueprint.id,
  title: blueprint.title,
  category: blueprint.category,
  status: 'verified',
  summary: `${blueprint.title} studied for the engineering skill pilot sprint.`,
  what: blueprint.what,
  why: blueprint.why,
  whenToUse: blueprint.whenToUse,
  whenNotToUse: 'Do not use it as ceremony, as a substitute for evidence, or outside an approved safe boundary.',
  prerequisites: ['Real task or approved safe fixture', 'Named owner and reviewer', 'Measurable outcome', 'Rollback or disable path'],
  implementationMethod: blueprint.method,
  verificationMethod: blueprint.verification,
  rollbackMethod: blueprint.rollback,
  tradeoffs: ['Adds deliberate evidence work', 'Reduces avoidable rework and operational uncertainty'],
  risks: ['Checklist behavior without real evidence', 'False confidence from narrow tests', 'Unreviewed scope expansion'],
  evidence: ['Engineering skill readiness audit', 'Measured pilot report', 'Automated verification results'],
  sources: [{
    title: blueprint.sourceTitle,
    url: blueprint.sourceUrl,
    tier: 'tier1',
    retrievedAt: '2026-07-12T00:00:00.000Z',
    sourceType: 'official'
  }],
  affectedWorkspaces: ['icyflamze'],
  affectedServices: ['study', 'skills', 'live-operations', 'dashboard'],
  expectedOutcome: `A measured ${blueprint.title} pilot with an explicit maturity decision.`,
  measurableIndicators: blueprint.indicators,
  recommendation: 'pilot',
  confidence: 90,
  reviewer: 'OS Architect',
  relatedSkillIds: [blueprint.skillId],
  knowledgeNodeIds: [`skill:${blueprint.skillId}`]
}));
