export interface WorkspaceGoal {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress';
}

export interface WorkspaceWorkflow {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface WorkspaceDataRecord {
  id: string;
  name: string;
  description: string;
  tag: string;
  overview: string;
  goals: WorkspaceGoal[];
  workflows: WorkspaceWorkflow[];
  recommendedActions: string[];
  knowledgeLinks: { label: string; url: string }[];
  revenueStatus: string;
  recentActivity: { timestamp: string; activity: string }[];
  reports: string[];
}
