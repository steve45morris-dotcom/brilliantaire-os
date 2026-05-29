export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  npmScript: string;
  owningAgent: string;
  riskLevel: 'low' | 'medium' | 'high';
  outputType: string;
  enabled: boolean;
  requiresExactName: boolean;
}

export const COMMAND_REGISTRY: CommandDefinition[] = [
  {
    name: 'audit',
    aliases: ['check', 'verify'],
    description: 'Verify workspace structure, files, and local skills health',
    npmScript: 'audit',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'brief',
    aliases: ['report', 'summary'],
    description: 'Compile and print a clean operational summary brief',
    npmScript: 'brief',
    owningAgent: 'OS Architect',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'next',
    aliases: ['actions', 'next-actions'],
    description: 'List ranked next actions grouped by category',
    npmScript: 'next',
    owningAgent: 'Action Router',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'agents',
    aliases: ['council', 'roster'],
    description: 'Display active productivity agents council details',
    npmScript: 'agents',
    owningAgent: 'OS Architect',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'ingest',
    aliases: ['scan-notes', 'obsidian'],
    description: 'Recursively scan markdown notes from active vaults (Read-Only)',
    npmScript: 'ingest',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'daily-brief',
    aliases: ['daily', 'today'],
    description: 'Generate daily brief operations report output file',
    npmScript: 'daily-brief',
    owningAgent: 'Action Router',
    riskLevel: 'low',
    outputType: 'files',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'sync-status',
    aliases: ['sync'],
    description: 'Back up and sync vault snapshot to repository status lists',
    npmScript: 'sync-status',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'stage-write',
    aliases: ['stage', 'prepare-write'],
    description: 'Stage markdown status reports to outputs/write_staging/',
    npmScript: 'stage-write',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'approve-write',
    aliases: ['approve', 'write-to-vault'],
    description: 'Approve and execute safe write back into the active Obsidian vault (High Risk)',
    npmScript: 'approve-write',
    owningAgent: 'Knowledge Librarian',
    riskLevel: 'high',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'write-log',
    aliases: ['logs', 'write-history'],
    description: 'Read and display recent write history timeline logs',
    npmScript: 'write-log',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'build',
    aliases: ['compile'],
    description: 'Compile TypeScript source files to JavaScript dist/',
    npmScript: 'build',
    owningAgent: 'Build Operator',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'campaign-help',
    aliases: ['campaign commands', 'campaigns-help'],
    description: 'Print registry of available campaign template engine tasks',
    npmScript: 'campaign-help',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'campaign',
    aliases: ['campaigns'],
    description: 'Execute campaign templates generation workflows (Medium Risk)',
    npmScript: 'campaign',
    owningAgent: 'Creative Revenue Strategist',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'voice-help',
    aliases: ['voice commands', 'voice-list'],
    description: 'Print registry of all allowed voice command phrases',
    npmScript: 'voice-help',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'voice-queue',
    aliases: ['voice'],
    description: 'Process text-based voice command queue inbox files safely (Medium Risk)',
    npmScript: 'voice-queue',
    owningAgent: 'Build Operator',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'voice-pending',
    aliases: ['pending voice', 'voice review'],
    description: 'List voice commands pending confirmation review',
    npmScript: 'voice-pending',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'low',
    outputType: 'console',
    enabled: true,
    requiresExactName: false
  },
  {
    name: 'voice-confirm',
    aliases: ['confirm voice'],
    description: 'Approve and execute a pending voice command (High Risk)',
    npmScript: 'voice-confirm',
    owningAgent: 'Build Operator',
    riskLevel: 'high',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  },
  {
    name: 'voice-deny',
    aliases: ['deny voice'],
    description: 'Deny and discard a pending voice command (Medium Risk)',
    npmScript: 'voice-deny',
    owningAgent: 'Workflow Auditor',
    riskLevel: 'medium',
    outputType: 'files',
    enabled: true,
    requiresExactName: true
  }
];
