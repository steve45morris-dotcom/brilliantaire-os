export interface VoiceCommandDefinition {
  phrase: string;
  normalizedCommand: string;
  routerCommand: string;
  owningAgent: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresConfirmation: boolean;
  enabled: boolean;
}

export const VOICE_COMMANDS_REGISTRY: VoiceCommandDefinition[] = [
  {
    phrase: 'show daily brief',
    normalizedCommand: 'show daily brief',
    routerCommand: 'daily-brief',
    owningAgent: 'Action Router',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'run audit',
    normalizedCommand: 'run audit',
    routerCommand: 'audit',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'show next actions',
    normalizedCommand: 'show next actions',
    routerCommand: 'next',
    owningAgent: 'Action Router',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'show agents',
    normalizedCommand: 'show agents',
    routerCommand: 'agents',
    owningAgent: 'OS Architect',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'show campaign help',
    normalizedCommand: 'show campaign help',
    routerCommand: 'campaign-help',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'scan obsidian',
    normalizedCommand: 'scan obsidian',
    routerCommand: 'ingest',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'stage write',
    normalizedCommand: 'stage write',
    routerCommand: 'stage-write',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'approve write',
    normalizedCommand: 'approve write',
    routerCommand: 'approve-write',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'high',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'create sporty brief',
    normalizedCommand: 'create sporty brief',
    routerCommand: 'campaign brief sporty',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'create sporty calendar',
    normalizedCommand: 'create sporty calendar',
    routerCommand: 'campaign calendar sporty',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'create sporty street script',
    normalizedCommand: 'create sporty street script',
    routerCommand: 'campaign street-script sporty',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'create sporty checklist',
    normalizedCommand: 'create sporty checklist',
    routerCommand: 'campaign checklist sporty',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'medium',
    requiresConfirmation: true,
    enabled: true
  },
  {
    phrase: 'show higgsfield status',
    normalizedCommand: 'show higgsfield status',
    routerCommand: 'higgsfield-ai status',
    owningAgent: 'Creative Architect',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  },
  {
    phrase: 'show higgsfield help',
    normalizedCommand: 'show higgsfield help',
    routerCommand: 'higgsfield-ai-help',
    owningAgent: 'Creative Architect',
    riskLevel: 'low',
    requiresConfirmation: false,
    enabled: true
  }
];
