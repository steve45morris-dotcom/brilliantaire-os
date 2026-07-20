import { SkillCandidate } from './SkillAcquisitionTypes.js';
import { globalGitHubSkillSource } from './GitHubSkillSource.js';
import { SKILL_ACQUISITION_EVENTS } from './SkillAcquisitionEvents.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class SkillAcquisitionService {
  private candidates: SkillCandidate[] = [];

  constructor() {
    // Seed default candidates to make UI look fully alive and populated initially
    this.candidates = [
      {
        id: 'git-steve45morris-dotcom-brilliantaire-os-stripe-auto-billing',
        name: 'stripe-auto-billing',
        description: 'Automates customer billing webhook validation and transaction processing logs.',
        sourceUrl: 'https://github.com/steve45morris-dotcom/brilliantaire-os/tree/main/skills/stripe-auto-billing',
        repoName: 'steve45morris-dotcom/brilliantaire-os',
        license: 'MIT',
        riskScore: 35,
        compatibilityScore: 90,
        recommendedAction: 'approve',
        status: 'discovered',
        category: 'Finance Integration'
      },
      {
        id: 'git-steve45morris-dotcom-brilliantaire-os-youtube-caption-harvester',
        name: 'youtube-caption-harvester',
        description: 'Queries YouTube API endpoints to parse video scripts and keywords indices.',
        sourceUrl: 'https://github.com/steve45morris-dotcom/brilliantaire-os/tree/main/skills/youtube-caption-harvester',
        repoName: 'steve45morris-dotcom/brilliantaire-os',
        license: 'Apache-2.0',
        riskScore: 25,
        compatibilityScore: 85,
        recommendedAction: 'approve',
        status: 'approved', // Pre-approve one into the Experimental queue
        category: 'Content Engine'
      },
      {
        id: 'git-icyflamze-creative-assets-legacy-cleanup-rm',
        name: 'legacy-cleanup-rm',
        description: 'Destructive deletion script targeting root temporary files.',
        sourceUrl: 'https://github.com/icyflamze/creative-assets/tree/main/skills/legacy-cleanup-rm',
        repoName: 'icyflamze/creative-assets',
        license: 'GPL-3.0',
        riskScore: 75,
        compatibilityScore: 40,
        recommendedAction: 'reject',
        status: 'rejected', // Pre-reject one to illustrate review logs
        category: 'Maintenance'
      }
    ];
  }

  public async scan(repoName: string): Promise<SkillCandidate[]> {
    const discovered = await globalGitHubSkillSource.scanSource(repoName);
    
    for (const item of discovered) {
      if (!this.candidates.some(c => c.id === item.id)) {
        this.candidates.push(item);
        globalEventBus.publish(SKILL_ACQUISITION_EVENTS.DISCOVERED, { candidateId: item.id, item });
      }
    }
    return discovered;
  }

  public approve(candidateId: string): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      candidate.status = 'approved';
      globalEventBus.publish(SKILL_ACQUISITION_EVENTS.APPROVED, { candidateId });
    }
  }

  public reject(candidateId: string): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      candidate.status = 'rejected';
      globalEventBus.publish(SKILL_ACQUISITION_EVENTS.REJECTED, { candidateId });
    }
  }

  public verify(candidateId: string): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      candidate.status = 'verified';
      globalEventBus.publish(SKILL_ACQUISITION_EVENTS.VERIFIED, { candidateId });
    }
  }

  public activate(candidateId: string): void {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (candidate) {
      candidate.status = 'active';
      globalEventBus.publish(SKILL_ACQUISITION_EVENTS.ACTIVATED, { candidateId });
    }
  }

  public getCandidates(status?: 'discovered' | 'candidate' | 'approved' | 'rejected' | 'verified' | 'active'): SkillCandidate[] {
    if (status) {
      return this.candidates.filter(c => c.status === status);
    }
    return this.candidates;
  }
}

export const globalSkillAcquisitionService = new SkillAcquisitionService();
export const globalSkillAcquisitionServiceRegistryKey = 'SkillAcquisitionService';
