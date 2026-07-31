export type PilotStatus =
  | 'planned'
  | 'ready'
  | 'running'
  | 'blocked'
  | 'verifying'
  | 'measured'
  | 'completed'
  | 'rejected'
  | 'archived';

export type MaturityDecision =
  | 'Promote'
  | 'Continue Pilot'
  | 'Revise'
  | 'Suspend'
  | 'Reject'
  | 'Archive';

export type MaturityLevel = 'Studied' | 'Experimental' | 'Verified' | 'Operational';

export interface PilotMetricTarget {
  name: string;
  target: number;
  unit: string;
  direction: 'at-least' | 'at-most' | 'exactly';
}

export interface PilotMetricResult {
  name: string;
  value: number;
  unit: string;
}

export interface PilotBaseline {
  commit: string;
  buildStatus: string;
  testStatus: string;
  dirtyFiles: string[];
}

export interface PilotEvidence {
  id: string;
  type: 'report' | 'test' | 'build' | 'metric' | 'diff' | 'rollback' | 'review' | 'other';
  path: string;
  summary: string;
  recordedAt: string;
  verified: boolean;
}

export interface PilotVerificationCheck {
  name: string;
  passed: boolean;
  evidence: string;
}

export interface PilotVerificationResult {
  passed: boolean;
  checkedAt: string;
  checks: PilotVerificationCheck[];
  reviewer: string;
  notes: string[];
}

export interface PilotMeasuredOutcome {
  metrics: PilotMetricResult[];
  summary: string;
  measuredAt: string;
}

export interface PilotRecord {
  id: string;
  skillId: string;
  title: string;
  workspace: string;
  realTask: string;
  objective: string;
  whyThisPilot: string;
  whenApplied: string;
  procedure: string[];
  baseline: PilotBaseline;
  expectedOutcome: string;
  successMetrics: PilotMetricTarget[];
  failureConditions: string[];
  rollbackPlan: string[];
  status: PilotStatus;
  startedAt: string | null;
  completedAt: string | null;
  evidence: PilotEvidence[];
  verificationResult: PilotVerificationResult | null;
  measuredOutcome: PilotMeasuredOutcome | null;
  lessons: string[];
  maturityDecision: MaturityDecision | null;
  reviewer: string;
  relatedReports: string[];
  relatedCommits: string[];
  knowledgeNodeIds: string[];
}

export type PilotRecordDraft = Omit<
  PilotRecord,
  'status' | 'startedAt' | 'completedAt' | 'evidence' | 'verificationResult' | 'measuredOutcome' | 'lessons' | 'maturityDecision'
> & Partial<Pick<
  PilotRecord,
  'status' | 'startedAt' | 'completedAt' | 'evidence' | 'verificationResult' | 'measuredOutcome' | 'lessons' | 'maturityDecision'
>>;
