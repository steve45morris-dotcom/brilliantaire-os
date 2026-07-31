export interface GovernanceDriftPayload {
  type: 'naming' | 'duplicate' | 'dependency' | 'deprecated' | 'registry';
  componentId: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GovernanceAuditCompletedPayload {
  score: number;
  health_score?: number;
  issuesCount: number;
  timestamp: string;
  issues: Array<GovernanceDriftPayload>;
}
