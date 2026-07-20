export interface OperationEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  actor: string;
  session?: string;
  task?: string;
  timing?: number;
  severity: 'info' | 'warn' | 'error';
  message: string;
  data: Record<string, any>;
  attention: boolean;
  error?: string;
}

export interface LiveSession {
  id: string;
  type: 'cli' | 'ui' | 'runtime' | 'background' | 'scheduled';
  status: 'active' | 'idle' | 'completed' | 'failed' | 'expired';
  startedAt: string;
  lastHeartbeatAt: string;
  endedAt: string | null;
  actor: string;
  origin: string;
  projectId: string;
  workspaceId: string;
  activeTaskIds: string[];
  summary: string;
}

export interface LiveTask {
  id: string;
  sessionId: string;
  type: 'command' | 'agent' | 'skill' | 'workflow' | 'workflow_step' | 'queue_job' | 'approval';
  name: string;
  status: 'queued' | 'running' | 'blocked' | 'completed' | 'failed' | 'cancelled';
  parentTaskId?: string;
  projectId: string;
  agentId?: string;
  skillId?: string;
  workflowId?: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  progress: number;
  attentionRequired: boolean;
  attentionReason?: string;
  lastEventId: string;
}

export interface AttentionItem {
  id: string;
  type: 'error' | 'blocked_task' | 'failed_workflow' | 'approval_required' | 'stale_session' | 'health_warning';
  title: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}
