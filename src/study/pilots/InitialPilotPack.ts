import { createPilotRecord } from './PilotRecord.js';
import type { MaturityDecision, PilotMetricResult, PilotRecord } from './PilotTypes.js';

interface CompletedPilotInput {
  id: string;
  skillId: string;
  title: string;
  realTask: string;
  objective: string;
  report: string;
  decision: MaturityDecision;
  metrics: PilotMetricResult[];
  lessons: string[];
}

function completedPilot(input: CompletedPilotInput): PilotRecord {
  const evidenceId = `evidence-${input.id}`;
  return createPilotRecord({
    id: input.id,
    skillId: input.skillId,
    title: input.title,
    workspace: 'icyflamze',
    realTask: input.realTask,
    objective: input.objective,
    whyThisPilot: 'Use a real Icyflamze workspace task to convert documented engineering practice into measured evidence.',
    whenApplied: 'During the 2026-07-12 engineering effectiveness sprint.',
    procedure: ['Capture baseline', 'Apply practice to real work', 'Verify evidence', 'Measure result', 'Review maturity'],
    baseline: {
      commit: 'feature/engineering-skill-pilots-worktree',
      buildStatus: 'passed',
      testStatus: '120/120 passed before pilot implementation',
      dirtyFiles: ['Pre-existing broad home-worktree changes preserved by path-scoped edits']
    },
    expectedOutcome: input.objective,
    successMetrics: input.metrics.map((metric) => ({
      name: metric.name,
      target: metric.value,
      unit: metric.unit,
      direction: 'at-least'
    })),
    failureConditions: ['Required evidence is missing', 'Verification fails', 'Unrelated worktree state changes'],
    rollbackPlan: ['Use pilot-owned reverse patch only', 'Verify build', 'Reapply exact forward state'],
    status: 'completed',
    startedAt: '2026-07-12T08:30:00.000Z',
    completedAt: '2026-07-12T14:10:00.000Z',
    evidence: [{
      id: evidenceId,
      type: 'report',
      path: input.report,
      summary: `${input.title} measured pilot report.`,
      recordedAt: '2026-07-12T14:10:00.000Z',
      verified: true
    }],
    verificationResult: {
      passed: true,
      checkedAt: '2026-07-12T14:12:00.000Z',
      checks: [{ name: 'Measured report exists', passed: true, evidence: evidenceId }],
      reviewer: 'OS Architect',
      notes: input.decision === 'Revise' ? ['Pilot process verified; skill implementation requires revision.'] : []
    },
    measuredOutcome: {
      metrics: input.metrics,
      summary: `${input.title} completed with decision ${input.decision}.`,
      measuredAt: '2026-07-12T14:10:00.000Z'
    },
    lessons: input.lessons,
    maturityDecision: input.decision,
    reviewer: 'OS Architect',
    relatedReports: [input.report],
    relatedCommits: [],
    knowledgeNodeIds: [`skill:${input.skillId}`, `pilot:${input.id}`]
  });
}

export const ENGINEERING_PILOT_RECORDS: PilotRecord[] = [
  completedPilot({
    id: 'pilot-change-impact-analysis-icyflamze',
    skillId: 'engineering-change-impact-analysis',
    title: 'Change Impact Analysis: Icyflamze Song and Lyric Slice',
    realTask: 'Predict and compare the scope of a lyric-to-song association change.',
    objective: 'Keep actual source changes within the predicted scope.',
    report: 'docs/pilots/CHANGE_IMPACT_ANALYSIS_ICYFLAMZE_SONG_LYRIC.md',
    decision: 'Continue Pilot',
    metrics: [
      { name: 'impactPredictionAccuracy', value: 100, unit: 'percent' },
      { name: 'unexpectedSourceFiles', value: 0, unit: 'files' }
    ],
    lessons: ['Dashboard-local state and graph endpoint registration must be included in impact predictions.']
  }),
  completedPilot({
    id: 'pilot-production-readiness-icyflamze',
    skillId: 'engineering-production-readiness-review',
    title: 'Production Readiness Review: Icyflamze OS',
    realTask: 'Review the Icyflamze home and completed lyric-to-song slice.',
    objective: 'Expose real release risks and improve readiness with evidence.',
    report: 'docs/pilots/PRODUCTION_READINESS_REVIEW_ICYFLAMZE_OS.md',
    decision: 'Continue Pilot',
    metrics: [
      { name: 'readinessScoreAfter', value: 83, unit: 'points' },
      { name: 'highFindingsResolved', value: 2, unit: 'findings' }
    ],
    lessons: ['A numeric readiness score cannot override an unresolved browser acceptance blocker.']
  }),
  completedPilot({
    id: 'pilot-effective-troubleshooting-dashboard-action',
    skillId: 'engineering-effective-troubleshooting',
    title: 'Effective Troubleshooting: Missing Dashboard Action Evidence',
    realTask: 'Isolate why a visible save did not create routed action evidence.',
    objective: 'Find the root cause without trial-and-error edits and prevent recurrence.',
    report: 'docs/pilots/EFFECTIVE_TROUBLESHOOTING_CASE.md',
    decision: 'Continue Pilot',
    metrics: [
      { name: 'rootCauseConfidence', value: 98, unit: 'percent' },
      { name: 'regressionTestsAdded', value: 2, unit: 'tests' }
    ],
    lessons: ['Required operational actions should import the existing router instead of relying on optional browser globals.']
  }),
  completedPilot({
    id: 'pilot-documentation-drift-detection',
    skillId: 'engineering-documentation-drift-detection',
    title: 'Documentation Drift Detection: Workspace and Command Surface',
    realTask: 'Compare routes, package commands, links, paths, statuses, counts, and preview instructions.',
    objective: 'Find real documentation drift with measured false positives.',
    report: 'docs/reports/DOCUMENTATION_DRIFT_REPORT.md',
    decision: 'Revise',
    metrics: [
      { name: 'realDriftItemsFound', value: 78, unit: 'items' },
      { name: 'driftItemsResolved', value: 1, unit: 'items' }
    ],
    lessons: ['Semantic route and command taxonomies are required to reduce false positives.']
  }),
  completedPilot({
    id: 'pilot-automated-testing-rollback-icyflamze',
    skillId: 'engineering-automated-testing-and-rollback',
    title: 'Automated Testing and Rollback: Icyflamze Song and Lyric Slice',
    realTask: 'Develop, reverse, build, reapply, and reverify the lyric-to-song feature.',
    objective: 'Restore previous behavior while preserving unrelated dirty files.',
    report: 'docs/pilots/AUTOMATED_TESTING_AND_ROLLBACK_PILOT.md',
    decision: 'Continue Pilot',
    metrics: [
      { name: 'rollbackSuccess', value: 1, unit: 'boolean' },
      { name: 'unrelatedFilesPreserved', value: 1, unit: 'boolean' }
    ],
    lessons: ['Path-scoped forward copies provide reliable rollback evidence in a broad untracked worktree.']
  })
];
