export interface GitHubRepository {
  id: number;
  name: string;
  owner: string;
  url: string;
  defaultBranch: string;
  description: string;
  visibility: 'public' | 'private';
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastPushedAt: string;
  healthStatus: 'healthy' | 'moderate' | 'critical';
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repository: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  priority: 'P1' | 'P2' | 'P3';
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
  checksStatus: 'success' | 'failure' | 'pending';
  reviewStatus: 'approved' | 'changes_requested' | 'pending';
  url: string;
}

export interface GitHubActionRun {
  id: number;
  workflowName: string;
  status: string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'neutral' | 'skipped' | 'timed_out' | 'action_required' | null;
  branch: string;
  startedAt: string;
  completedAt: string | null;
  url: string;
}

export interface GitHubRepositoryHealth {
  repository: string;
  buildStatus: 'passing' | 'failing' | 'unknown';
  openIssueCount: number;
  staleIssueCount: number;
  openPRCount: number;
  failedWorkflowCount: number;
  lastCommitAgeDays: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
}
