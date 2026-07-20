import { SkillCandidate } from './SkillAcquisitionTypes.js';

export class SkillCompatibilityChecker {
  public checkCompatibility(candidate: Partial<SkillCandidate>): number {
    let score = 100;

    // Check if category is standard
    if (!candidate.category) {
      score -= 20;
    }

    // Check description completeness
    if (!candidate.description || candidate.description.length < 10) {
      score -= 15;
    }

    // Mock evaluation metrics
    if (candidate.name?.toLowerCase().includes('legacy')) {
      score -= 30;
    }

    if (candidate.name?.toLowerCase().includes('v2') || candidate.name?.toLowerCase().includes('official')) {
      score = Math.min(score + 10, 100);
    }

    return Math.max(score, 0);
  }
}

export const globalSkillCompatibilityChecker = new SkillCompatibilityChecker();
