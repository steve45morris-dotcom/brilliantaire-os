import { SkillCandidate } from './SkillAcquisitionTypes.js';

export class SkillRiskScorer {
  public calculateRisk(candidate: Partial<SkillCandidate>): number {
    let risk = 10; // baseline

    // Check license compatibility
    if (candidate.license) {
      const lic = candidate.license.toLowerCase();
      if (lic.includes('gpl')) {
        risk += 20; // GPL has copyleft risk
      } else if (lic.includes('mit') || lic.includes('apache')) {
        risk -= 5;
      }
    } else {
      risk += 15; // Unspecified license is a risk
    }

    // Category risk checks
    if (candidate.category) {
      const cat = candidate.category.toLowerCase();
      if (cat.includes('network') || cat.includes('auth') || cat.includes('api')) {
        risk += 25; // High-risk integrations
      }
      if (cat.includes('sandbox') || cat.includes('docs')) {
        risk -= 5;
      }
    }

    // Name threat keywords detection
    if (candidate.name) {
      const name = candidate.name.toLowerCase();
      if (name.includes('destructive') || name.includes('delete') || name.includes('remove')) {
        risk += 40;
      }
    }

    return Math.min(Math.max(risk, 0), 100);
  }
}

export const globalSkillRiskScorer = new SkillRiskScorer();
