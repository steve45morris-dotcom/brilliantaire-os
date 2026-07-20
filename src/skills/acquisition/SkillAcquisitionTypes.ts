export interface SkillCandidate {
  id: string;
  name: string;
  description: string;
  sourceUrl: string;
  repoName: string;
  license?: string;
  riskScore: number;
  compatibilityScore: number;
  recommendedAction: 'approve' | 'reject' | 'investigate';
  status: 'discovered' | 'candidate' | 'approved' | 'rejected' | 'verified' | 'active';
  category: string;
}

export interface SkillSourceScanResult {
  sourceUrl: string;
  repoName: string;
  candidates: SkillCandidate[];
}
