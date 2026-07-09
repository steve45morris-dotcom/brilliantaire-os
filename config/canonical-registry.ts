export interface ApprovedEntity {
  name: string;
  type: 'platform' | 'os' | 'kernel' | 'executive' | 'intelligence' | 'knowledge' | 'workspace' | 'product' | 'plugin' | 'runtime' | 'service';
  owner: string;
  purpose: string;
  status: 'active' | 'deprecated' | 'legacy';
}

export const CANONICAL_REGISTRY: ApprovedEntity[] = [
  {
    name: 'The One System',
    type: 'platform',
    owner: 'OS Architect',
    purpose: 'Overarching decentralized mesh network coordinating micro-agents, compute, and workspaces.',
    status: 'active'
  },
  {
    name: 'Brilliantaire OS',
    type: 'os',
    owner: 'OS Architect',
    purpose: 'Local, tactical execution platform for creative narrative, security audits, and local code operations.',
    status: 'active'
  },
  {
    name: 'Sentinel OS',
    type: 'os',
    owner: 'OS Architect',
    purpose: 'Legacy/duplicate naming context for local execution.',
    status: 'legacy'
  },
  {
    name: 'Brilliantaire Execution Kernel',
    type: 'kernel',
    owner: 'OS Architect',
    purpose: 'Core execution layer of Brilliantaire OS running sandboxed commands and hooks.',
    status: 'active'
  },
  {
    name: 'Productivity Agent Council',
    type: 'executive',
    owner: 'OS Architect',
    purpose: 'Council of 7 configured roles with metrics and file bindings.',
    status: 'active'
  },
  {
    name: 'Sovereign Stack Council',
    type: 'executive',
    owner: 'OS Architect',
    purpose: 'Global workspace council (Strategist, Librarian, Scout, Icyflamze).',
    status: 'active'
  },
  {
    name: 'Grounded Intelligence',
    type: 'intelligence',
    owner: 'Knowledge Librarian',
    purpose: 'Citation-backed NotebookLM query and answer verification pipeline.',
    status: 'active'
  },
  {
    name: 'Grounded Intelligence Index Graph',
    type: 'knowledge',
    owner: 'Knowledge Librarian',
    purpose: 'Reads response files and compiles grounded JSON/Markdown graphs.',
    status: 'active'
  },
  {
    name: 'Safe Command Router',
    type: 'service',
    owner: 'Build Operator',
    purpose: 'Gated CLI router executing whitelisted scripts with exact-name matching.',
    status: 'active'
  },
  {
    name: 'VibeVoice Vocal Bridge',
    type: 'service',
    owner: 'Knowledge Librarian',
    purpose: 'Vocal bridge connecting voice transcription to the OS inbox.',
    status: 'active'
  },
  {
    name: 'Voice Command Queue',
    type: 'service',
    owner: 'Workflow Auditor',
    purpose: 'Queue buffering incoming transcripts for execution.',
    status: 'active'
  },
  {
    name: 'Voice Confirmation Layer',
    type: 'service',
    owner: 'Workflow Auditor',
    purpose: 'Manual confirmation gate holding medium/high-risk voice actions.',
    status: 'active'
  },
  {
    name: 'Campaign Template Engine',
    type: 'service',
    owner: 'Creative Revenue Strategist',
    purpose: 'Local compiler generating marketing checklists, scripts, and content pillars.',
    status: 'active'
  },
  {
    name: 'Local Automation Runner',
    type: 'service',
    owner: 'Build Operator',
    purpose: 'Controlled executor running sequential maintenance routines.',
    status: 'active'
  },
  {
    name: 'Controlled Background Automation',
    type: 'service',
    owner: 'Build Operator',
    purpose: 'Schedules approved local routines via cron/launchd.',
    status: 'active'
  },
  {
    name: 'Local TTS Audio Renderer',
    type: 'runtime',
    owner: 'Build Operator',
    purpose: 'Speech synthesis renderer utilizing local Piper.',
    status: 'active'
  },
  {
    name: 'Local ASR Command Listener',
    type: 'runtime',
    owner: 'Build Operator',
    purpose: 'Speech-to-text transcriber using Whisper binaries.',
    status: 'active'
  },
  {
    name: 'Icyflamze',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Creative brand and marketing strategy workspace.',
    status: 'active'
  },
  {
    name: 'Tree Groove Records',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Independent music distribution workspace.',
    status: 'active'
  },
  {
    name: 'ProfBetGeng',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'High-signal sports betting analytics workspace.',
    status: 'active'
  },
  {
    name: 'Antigravity Lab',
    type: 'workspace',
    owner: 'OS Architect',
    purpose: 'Development sandbox and CLI testing workspace.',
    status: 'active'
  },
  {
    name: 'Joy',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Placeholder workspace listed in guidelines.',
    status: 'legacy'
  },
  {
    name: 'Podcast',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Placeholder workspace listed in guidelines.',
    status: 'legacy'
  },
  {
    name: 'Avatar',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Placeholder workspace listed in guidelines.',
    status: 'legacy'
  },
  {
    name: 'AI School',
    type: 'workspace',
    owner: 'Creative Revenue Strategist',
    purpose: 'Placeholder workspace listed in guidelines.',
    status: 'legacy'
  }
];

export function validateNaming(name: string): { valid: boolean; canonicalName?: string; status?: string } {
  const match = CANONICAL_REGISTRY.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (match) {
    return {
      valid: match.status === 'active',
      canonicalName: match.name,
      status: match.status
    };
  }
  
  // Fuzzy checks
  if (name.toLowerCase().includes('sentinel') || name.toLowerCase().includes('icyos')) {
    return {
      valid: false,
      canonicalName: 'Brilliantaire OS',
      status: 'legacy'
    };
  }

  return { valid: false };
}
