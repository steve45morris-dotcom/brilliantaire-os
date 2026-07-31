export type EngineeringSkillCandidateStatus = 'candidate' | 'experimental';
export type EngineeringSkillEffort = 'low' | 'medium' | 'high';

export interface EngineeringSkillCandidate {
  id: string;
  title: string;
  category:
    | 'architecture'
    | 'release'
    | 'incident'
    | 'observability'
    | 'security'
    | 'testing'
    | 'documentation'
    | 'governance'
    | 'migration'
    | 'workspace';
  status: EngineeringSkillCandidateStatus;
  purpose: string;
  whyItMatters: string;
  whenItApplies: string;
  howItWorks: string;
  sourceRequirements: string[];
  compatibilityScore: number;
  duplicationRisk: number;
  implementationEffort: EngineeringSkillEffort;
  recommendedPriority: 'high' | 'medium' | 'low';
  verificationCriteria: string[];
}

interface SkillBlueprint {
  title: string;
  category: EngineeringSkillCandidate['category'];
  status: EngineeringSkillCandidateStatus;
  compatibilityScore: number;
  duplicationRisk: number;
  implementationEffort: EngineeringSkillEffort;
  recommendedPriority: 'high' | 'medium' | 'low';
}

const BLUEPRINTS: SkillBlueprint[] = [
  { title: 'Architecture Decision Records', category: 'architecture', status: 'candidate', compatibilityScore: 92, duplicationRisk: 18, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Request for Comments', category: 'architecture', status: 'candidate', compatibilityScore: 88, duplicationRisk: 20, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Change Impact Analysis', category: 'governance', status: 'candidate', compatibilityScore: 90, duplicationRisk: 22, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Production Readiness Review', category: 'release', status: 'candidate', compatibilityScore: 95, duplicationRisk: 16, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Release Engineering', category: 'release', status: 'experimental', compatibilityScore: 93, duplicationRisk: 24, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'Incident Management', category: 'incident', status: 'candidate', compatibilityScore: 94, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Blameless Postmortems', category: 'incident', status: 'candidate', compatibilityScore: 92, duplicationRisk: 14, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Effective Troubleshooting', category: 'incident', status: 'candidate', compatibilityScore: 96, duplicationRisk: 16, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Observability Design', category: 'observability', status: 'experimental', compatibilityScore: 94, duplicationRisk: 26, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'Service Level Objectives', category: 'observability', status: 'candidate', compatibilityScore: 95, duplicationRisk: 20, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Alert Quality Review', category: 'observability', status: 'candidate', compatibilityScore: 90, duplicationRisk: 22, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Capacity Planning', category: 'observability', status: 'candidate', compatibilityScore: 87, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Dependency Management', category: 'governance', status: 'candidate', compatibilityScore: 93, duplicationRisk: 24, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Technical Debt Management', category: 'governance', status: 'candidate', compatibilityScore: 89, duplicationRisk: 20, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Code Ownership', category: 'governance', status: 'candidate', compatibilityScore: 91, duplicationRisk: 15, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Pull Request Governance', category: 'governance', status: 'candidate', compatibilityScore: 96, duplicationRisk: 14, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Branch Protection', category: 'release', status: 'candidate', compatibilityScore: 97, duplicationRisk: 12, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Secure Software Review', category: 'security', status: 'candidate', compatibilityScore: 95, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Threat Modeling', category: 'security', status: 'candidate', compatibilityScore: 94, duplicationRisk: 21, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Test Strategy Design', category: 'testing', status: 'candidate', compatibilityScore: 92, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Contract Testing', category: 'testing', status: 'candidate', compatibilityScore: 90, duplicationRisk: 22, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'End-to-End Testing', category: 'testing', status: 'candidate', compatibilityScore: 89, duplicationRisk: 24, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'Performance Testing', category: 'testing', status: 'candidate', compatibilityScore: 88, duplicationRisk: 23, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Recovery Testing', category: 'testing', status: 'candidate', compatibilityScore: 93, duplicationRisk: 19, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Automated Rollback', category: 'release', status: 'experimental', compatibilityScore: 91, duplicationRisk: 27, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'Feature Flag Management', category: 'release', status: 'candidate', compatibilityScore: 90, duplicationRisk: 22, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Database Migration Safety', category: 'migration', status: 'candidate', compatibilityScore: 96, duplicationRisk: 19, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'API Compatibility Review', category: 'governance', status: 'candidate', compatibilityScore: 92, duplicationRisk: 17, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Documentation as Code', category: 'documentation', status: 'candidate', compatibilityScore: 94, duplicationRisk: 16, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Documentation Drift Detection', category: 'documentation', status: 'candidate', compatibilityScore: 90, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Runbook Creation', category: 'documentation', status: 'candidate', compatibilityScore: 93, duplicationRisk: 15, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Operational Checklist Design', category: 'documentation', status: 'candidate', compatibilityScore: 92, duplicationRisk: 14, implementationEffort: 'low', recommendedPriority: 'high' },
  { title: 'Root Cause Analysis', category: 'incident', status: 'candidate', compatibilityScore: 95, duplicationRisk: 17, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Reliability Review', category: 'observability', status: 'candidate', compatibilityScore: 93, duplicationRisk: 21, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Dependency Upgrade Review', category: 'governance', status: 'candidate', compatibilityScore: 90, duplicationRisk: 24, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Software Supply Chain Review', category: 'security', status: 'candidate', compatibilityScore: 96, duplicationRisk: 19, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'License Compatibility Review', category: 'security', status: 'candidate', compatibilityScore: 94, duplicationRisk: 17, implementationEffort: 'medium', recommendedPriority: 'high' },
  { title: 'Deprecation Planning', category: 'release', status: 'candidate', compatibilityScore: 88, duplicationRisk: 18, implementationEffort: 'medium', recommendedPriority: 'medium' },
  { title: 'Migration Planning', category: 'migration', status: 'candidate', compatibilityScore: 91, duplicationRisk: 22, implementationEffort: 'high', recommendedPriority: 'high' },
  { title: 'Workspace Template Design', category: 'workspace', status: 'experimental', compatibilityScore: 84, duplicationRisk: 28, implementationEffort: 'high', recommendedPriority: 'medium' }
];

export const ENGINEERING_SKILL_CATALOG: EngineeringSkillCandidate[] = BLUEPRINTS.map(
  (blueprint) => {
    const lower = blueprint.title.toLowerCase();
    return {
      id: `engineering-${lower.replace(/[^a-z0-9]+/g, '-')}`,
      title: blueprint.title,
      category: blueprint.category,
      status: blueprint.status,
      purpose: `${blueprint.title} as a governed engineering practice for The One System.`,
      whyItMatters: `It reduces drift, decision noise, and operational risk around ${lower}.`,
      whenItApplies: `Use it when changes in ${lower} affect reliability, safety, or release confidence.`,
      howItWorks: 'Define the boundary, gather Tier 1 evidence, map the workflow, verify results, and keep a rollback path.',
      sourceRequirements: [
        'At least one Tier 1 official source',
        'At least one implementation or operating example',
        'License and reuse restrictions recorded'
      ],
      compatibilityScore: blueprint.compatibilityScore,
      duplicationRisk: blueprint.duplicationRisk,
      implementationEffort: blueprint.implementationEffort,
      recommendedPriority: blueprint.recommendedPriority,
      verificationCriteria: [
        'Owner is named',
        'Documentation exists',
        'Rollback or disable method exists',
        'Outcome metrics are measurable'
      ]
    };
  }
);

export class EngineeringSkillCatalog {
  public list(): EngineeringSkillCandidate[] {
    return [...ENGINEERING_SKILL_CATALOG];
  }

  public byStatus(status: EngineeringSkillCandidateStatus): EngineeringSkillCandidate[] {
    return ENGINEERING_SKILL_CATALOG.filter((candidate) => candidate.status === status);
  }

  public byCategory(category: EngineeringSkillCandidate['category']): EngineeringSkillCandidate[] {
    return ENGINEERING_SKILL_CATALOG.filter((candidate) => candidate.category === category);
  }

  public findByTitle(title: string): EngineeringSkillCandidate | null {
    return ENGINEERING_SKILL_CATALOG.find((candidate) => candidate.title === title) ?? null;
  }
}

export const globalEngineeringSkillCatalog = new EngineeringSkillCatalog();
