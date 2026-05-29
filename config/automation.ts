export interface AutomationRoutine {
  name: string;
  description: string;
  commands: string[];
  owningAgent: string;
  riskLevel: 'low' | 'medium' | 'high';
  enabled: boolean;
  stopOnFailure: boolean;
}

export const AUTOMATION_ROUTINES: AutomationRoutine[] = [
  {
    name: 'daily-check',
    description: 'Verify workspace health, print action summaries, compile telemetry snapshots, and export status lists.',
    commands: [
      'audit',
      'brief',
      'next',
      'mesh-telemetry snapshot',
      'mesh-telemetry report',
      'dashboard-export'
    ],
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    enabled: true,
    stopOnFailure: true
  },
  {
    name: 'campaign-check',
    description: 'Audit campaign simulation validation status and compile campaign-specific metrics snapshots.',
    commands: [
      'campaign-simulate status sporty',
      'mesh-telemetry campaign sporty',
      'dashboard-export'
    ],
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'low',
    enabled: true,
    stopOnFailure: true
  },
  {
    name: 'voice-check',
    description: 'Check voice queues pending confirmation and compile telemetry reports.',
    commands: [
      'voice-pending',
      'mesh-telemetry report',
      'dashboard-export'
    ],
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    enabled: true,
    stopOnFailure: true
  }
];
