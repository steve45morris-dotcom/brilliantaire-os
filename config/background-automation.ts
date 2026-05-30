export const ENABLE_BACKGROUND_AUTOMATION = false;
export const DRY_RUN_DEFAULT = true;
export const ALLOW_EXTERNAL_COMMANDS = false;
export const ALLOW_SOCIAL_POSTING = false;
export const ALLOW_DESTRUCTIVE_ACTIONS = false;

export interface BackgroundSchedule {
  name: string;
  routine: string;
  suggestedTime: string;
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  owningAgent: string;
  description: string;
}

export const BACKGROUND_SCHEDULES: BackgroundSchedule[] = [
  {
    name: 'morning-daily-check',
    routine: 'daily-check',
    suggestedTime: '09:00',
    enabled: false,
    riskLevel: 'low',
    owningAgent: 'Workflow Auditor',
    description: 'Runs daily sanity check, workspace audit, and dashboard data compile.'
  },
  {
    name: 'afternoon-campaign-check',
    routine: 'campaign-check',
    suggestedTime: '15:00',
    enabled: false,
    riskLevel: 'low',
    owningAgent: 'Creative Revenue Strategist',
    description: 'Runs campaign simulations check and Sporty metrics compilation.'
  },
  {
    name: 'evening-voice-check',
    routine: 'voice-check',
    suggestedTime: '20:00',
    enabled: false,
    riskLevel: 'low',
    owningAgent: 'Workflow Auditor',
    description: 'Scans voice queue pending items and updates telemetry summaries.'
  }
];
