export type SkillStatus = 'active' | 'experimental' | 'verified' | 'deprecated' | 'archived';

export type SkillCategory =
  | 'research'
  | 'content'
  | 'outreach'
  | 'verification'
  | 'analytics'
  | 'automation'
  | 'revenue'
  | 'operations'
  | 'memory'
  | 'media'
  | 'design';

export interface SkillMetadata {
  name: string;
  owner: string;
  version: string;
  status: SkillStatus;
  category: SkillCategory;
  dependencies: string[];
  lastUsed: string | null;
  usageCount: number;
  successRate: number;
  failureNotes: string[];
  retirementCandidate: boolean;
  verificationNotes?: string;
}

export interface SkillDetail extends SkillMetadata {
  instructions: string;
  references: Record<string, string>;
  scripts: Record<string, string>;
}

export interface SkillBundle {
  name: string;
  description: string;
  skills: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  expectedOutput: string;
  humanApprovalRequired: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
}

export interface WorkflowTemplate {
  name: string;
  objective: string;
  inputs: string[];
  steps: Omit<WorkflowStep, 'status'>[];
  requiredSkills: string[];
  expectedOutput: string;
  verificationCriteria: string[];
  retryLogic: {
    maxRetries: number;
    retryDelaySec: number;
  };
  humanApprovalPoints: string[];
}

export interface WorkflowInstance {
  id: string;
  templateName: string;
  objective: string;
  inputs: Record<string, any>;
  steps: WorkflowStep[];
  requiredSkills: string[];
  expectedOutput: string;
  verificationCriteria: string[];
  retryLogic: {
    maxRetries: number;
    retryDelaySec: number;
  };
  humanApprovalPoints: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStepIndex: number;
  outputs?: Record<string, any>;
  errors?: string[];
}

export interface AgentDefinition {
  name: string;
  role: string;
  systemPrompt: string;
  skills: string[];
}

export interface VerificationCriterionResult {
  criterion: string;
  passed: boolean;
  reason?: string;
}

export interface VerificationResult {
  passed: boolean;
  checklist: VerificationCriterionResult[];
  errors: string[];
  factualAccuracyScore: number; // 0-100
  formattingValid: boolean;
  instructionComplianceValid: boolean;
  hallucinationDetected: boolean;
  businessImpactScore: number; // 0-100
}

export interface MemorySchema {
  decisions: {
    id: string;
    timestamp: string;
    title: string;
    context: string;
    decision: string;
  }[];
  projectContext: Record<string, any>;
  outcomes: any[];
  lessonsLearned: string[];
  workflowHistory: {
    id: string;
    workflowName: string;
    status: string;
    timestamp: string;
  }[];
  agentNotes: Record<string, string>;
  userPreferences: Record<string, any>;
  activeGoals: string[];
  blockedItems: string[];
}

export interface OutcomeRecord {
  id: string;
  timestamp: string;
  objective: string;
  actionTaken: string;
  workflowUsed?: string;
  skillsUsed: string[];
  outputQualityScore: number; // 0-100
  result: 'success' | 'failure';
  businessImpact?: string;
  revenueImpact?: number;
  nextRecommendation?: string;
}

export type JobType =
  | 'scheduled_scan'
  | 'overnight_research'
  | 'recurring_brief'
  | 'git_monitoring'
  | 'trend_monitoring'
  | 'content_check';

export interface BackgroundJob {
  id: string;
  name: string;
  type: JobType;
  schedule: string; // Cron pattern or 'interval:X'
  status: 'queued' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  retries: number;
  maxRetries: number;
  failureLogs: string[];
  payload: Record<string, any>;
  result?: any;
  lastRun?: string;
  nextRun?: string;
}

export interface WorkspaceSnapshot {
  jobId: string;
  createdAt: string;
  status: 'active' | 'archived';
  paths: {
    root: string;
    snapshots: string;
    logs: string;
    outputs: string;
  };
}

export interface RouterDecision {
  requestId: string;
  requestText: string;
  detectedIntent: string;
  agentAssignment: string;
  requiredSkills: string[];
  workflowSelection?: string;
  humanApprovalRequired: boolean;
  backgroundQueueRequired: boolean;
  reasoning: string;
}
