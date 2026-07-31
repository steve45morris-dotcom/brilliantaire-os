export type StudyStatus =
  | 'proposed'
  | 'researching'
  | 'studied'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'adopted'
  | 'archived';

export type StudySourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export type StudyRecommendation = 'adopt' | 'pilot' | 'watch' | 'verify' | 'research_more' | 'reject' | 'archive';

export interface StudySource {
  title: string;
  url: string;
  tier: StudySourceTier;
  retrievedAt: string;
  license?: string;
  sourceType?: 'official' | 'primary' | 'community' | 'experimental';
  notes?: string;
}

export interface StudyVerificationCheck {
  name: string;
  passed: boolean;
  reason?: string;
}

export interface StudyScoreBreakdown {
  sourceQuality: number;
  evidenceDepth: number;
  applicability: number;
  verificationReadiness: number;
  duplicationRisk: number;
  maintainability: number;
  total: number;
}

export interface StudyRecord {
  id: string;
  title: string;
  category: string;
  status: StudyStatus;
  summary: string;
  what: string;
  why: string;
  whenToUse: string;
  whenNotToUse: string;
  prerequisites: string[];
  implementationMethod: string;
  verificationMethod: string;
  rollbackMethod: string;
  tradeoffs: string[];
  risks: string[];
  evidence: string[];
  sources: StudySource[];
  affectedWorkspaces: string[];
  affectedServices: string[];
  expectedOutcome: string;
  measurableIndicators: string[];
  recommendation: StudyRecommendation;
  confidence: number;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: string | null;
  knowledgeNodeIds: string[];
  relatedSkillIds: string[];
}

export interface StudyWorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredArtifacts: string[];
  approvalRequired: boolean;
}

export interface StudyVerificationResult {
  passed: boolean;
  checks: StudyVerificationCheck[];
  missingFields: string[];
  blockers: string[];
  warnings: string[];
}

export interface StudyScoreResult {
  score: number;
  breakdown: StudyScoreBreakdown;
  recommendation: StudyRecommendation;
  confidence: number;
}
