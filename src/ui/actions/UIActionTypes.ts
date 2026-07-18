export type ActionFeedbackType = 'success' | 'warning' | 'approval_required' | 'unavailable' | 'failed' | 'queued';

export interface UIAction {
  id: string;
  label: string;
  category: string;
  route?: string;
  requiresApproval: boolean;
}

export interface UIActionLog {
  actionId: string;
  timestamp: string;
  feedback: ActionFeedbackType;
  details?: string;
}
