export interface RoadmapMilestone {
  branch: 'The One System' | 'Icyflamze' | 'TreeGroove' | 'ProfBetGeng' | 'Joy Beauty Studio' | 'Avatar' | 'Podcast' | 'AISchool';
  phase: string;
  targetDate: string;
  status: 'planned' | 'current' | 'released';
}

export class RoadmapPlanner {
  private milestones: RoadmapMilestone[] = [
    { branch: 'The One System', phase: 'Kernel Subsystem Integration', targetDate: '2026-07-02', status: 'released' },
    { branch: 'The One System', phase: 'Executive Layer & Knowledge Graph', targetDate: '2026-07-06', status: 'current' },
    { branch: 'TreeGroove', phase: 'Music Release Marketing Workflow', targetDate: '2026-08-01', status: 'planned' },
    { branch: 'ProfBetGeng', phase: 'Betting Automation Web Bridge', targetDate: '2026-09-01', status: 'planned' }
  ];

  public getMilestones(): RoadmapMilestone[] {
    return [...this.milestones];
  }
}

export const globalRoadmapPlanner = new RoadmapPlanner();
