import { SkillCandidate } from './SkillAcquisitionTypes.js';
import { globalSkillCompatibilityChecker } from './SkillCompatibilityChecker.js';
import { globalSkillRiskScorer } from './SkillRiskScorer.js';

export class SkillCandidateAnalyzer {
  public analyze(candidate: Partial<SkillCandidate>): { riskScore: number; compatibilityScore: number; recommendedAction: 'approve' | 'reject' | 'investigate' } {
    const compatibilityScore = globalSkillCompatibilityChecker.checkCompatibility(candidate);
    const riskScore = globalSkillRiskScorer.calculateRisk(candidate);

    let recommendedAction: 'approve' | 'reject' | 'investigate' = 'investigate';

    if (riskScore > 50 || compatibilityScore < 50) {
      recommendedAction = 'reject';
    } else if (riskScore < 30 && compatibilityScore > 80) {
      recommendedAction = 'approve';
    }

    return {
      riskScore,
      compatibilityScore,
      recommendedAction
    };
  }
}

export const globalSkillCandidateAnalyzer = new SkillCandidateAnalyzer();
