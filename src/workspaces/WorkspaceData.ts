import { WorkspaceDataRecord } from './WorkspaceTypes.js';

export const mockWorkspacesData: Record<string, WorkspaceDataRecord> = {
  'the-one-system': {
    id: 'the-one-system',
    name: 'The One System',
    description: 'Core platform orchestrator and operations telemetry cockpit.',
    tag: 'Kernel OS',
    overview: 'This is the master workspace for system-wide configuration, boot sequence audits, module registries, and OIL recommendations.',
    goals: [
      { id: 'tos-g1', title: 'Complete Version 1.0.0 stable governance audit', status: 'completed' },
      { id: 'tos-g2', title: 'Optimize EventBus wildcard topics dispatch cycles', status: 'in_progress' }
    ],
    workflows: [
      { id: 'tos-w1', name: 'Operations Intelligence Sweep', status: 'completed' },
      { id: 'tos-w2', name: 'Constitutional Boundaries Verification', status: 'idle' }
    ],
    recommendedActions: [
      'Trigger intelligence:scan command',
      'Run security checks on local providers'
    ],
    knowledgeLinks: [
      { label: 'System Constitution', url: 'file:///Users/alexanderanthony/docs/constitution/THE_ONE_SYSTEM_CONSTITUTION.md' },
      { label: 'Operating Playbook', url: 'file:///Users/alexanderanthony/docs/playbook/THE_ONE_SYSTEM_PLAYBOOK.md' }
    ],
    revenueStatus: '$0.00 (Core Operations)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), activity: 'Completed project verification sweep.' },
      { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), activity: 'Activated branch protection on main.' }
    ],
    reports: [
      'SYSTEM_HEALTH_REPORT.md',
      'PLATFORM_AUDIT.md'
    ]
  },
  'icyflamze': {
    id: 'icyflamze',
    name: 'Icyflamze Studio',
    description: 'Rollout coordinator, lyric staging, and ad tracking portal.',
    tag: 'Creator OS',
    overview: 'Branding and content engine for Tree Groove releases and social marketing campaigns.',
    goals: [
      { id: 'icy-g1', title: 'Draft creative script for Episode 1 trailer', status: 'completed' },
      { id: 'icy-g2', title: 'Plan marketing asset schedule', status: 'in_progress' }
    ],
    workflows: [
      { id: 'icy-w1', name: 'Trailer Asset Render Intake', status: 'idle' },
      { id: 'icy-w2', name: 'Campaign simulation launch', status: 'completed' }
    ],
    recommendedActions: [
      'Approve Episode 1 trailer pack',
      'Track campaign ad spend benchmarks'
    ],
    knowledgeLinks: [
      { label: 'Creative IP Bible', url: 'file:///Users/alexanderanthony/ICYFLAMZE_CORE_SEASON_1_IP_BIBLE.md' },
      { label: 'Content Machine Spec', url: 'file:///Users/alexanderanthony/ICYFLAMZE_CONTENT_MACHINE_SPEC.md' }
    ],
    revenueStatus: '$4,280.00 (Active Campaigns)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), activity: 'Trailer package verified.' }
    ],
    reports: [
      'ICYOS_SYSTEM_SCORECARD.md'
    ]
  },
  'profbetgeng': {
    id: 'profbetgeng',
    name: 'ProfBetGeng',
    description: 'Sports analytics, dynamic bankroll, and betting telemetry indexes.',
    tag: 'Analytics OS',
    overview: 'Runs analytics pipelines to calculate risk factors, tracking daily sport betting ROI metrics.',
    goals: [
      { id: 'bet-g1', title: 'Update prediction models bankroll caps', status: 'in_progress' }
    ],
    workflows: [
      { id: 'bet-w1', name: 'Compile sport betting metrics', status: 'idle' }
    ],
    recommendedActions: [
      'Analyze historical ROI indexes',
      'Ingest Obsidian bet telemetry logs'
    ],
    knowledgeLinks: [
      { label: 'Obsidian Notes Ingest', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$8,450.00 (Monthly Sports Yield)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), activity: 'Synced Obsidian daily bets log.' }
    ],
    reports: [
      'DAILY_BET_TELEMETRY.md'
    ]
  },
  'treegroove': {
    id: 'treegroove',
    name: 'TreeGroove Records',
    description: 'Music catalog and release distribution accounting.',
    tag: 'Music OS',
    overview: 'Orchestrates digital music distribution release pipelines and royalties dashboards.',
    goals: [
      { id: 'tg-g1', title: 'Verify digital distributor metadata mappings', status: 'completed' }
    ],
    workflows: [
      { id: 'tg-w1', name: 'Digital Ingest Scheduler', status: 'completed' }
    ],
    recommendedActions: [
      'Check distributor API status',
      'Verify royalties balance sheet'
    ],
    knowledgeLinks: [
      { label: 'Catalog Registry', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$2,090.00 (Royalties Net)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), activity: 'Metadata schema checked and locked.' }
    ],
    reports: [
      'ROYALTIES_LEDGER.md'
    ]
  },
  'joy-beauty-studio': {
    id: 'joy-beauty-studio',
    name: 'Joy Beauty Studio',
    description: 'Booking scheduler and salon CRM client portal.',
    tag: 'Business OS',
    overview: 'Operational manual interfaces for tracking salon appointments, customer profiles, and ad conversions.',
    goals: [
      { id: 'jbs-g1', title: 'Setup salon booking calendar scheduler', status: 'in_progress' }
    ],
    workflows: [
      { id: 'jbs-w1', name: 'Customer Inbound Parser', status: 'idle' }
    ],
    recommendedActions: [
      'Integrate booking API hooks',
      'Generate weekly client reports'
    ],
    knowledgeLinks: [
      { label: 'Salon Operating Guide', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$0.00 (Pending Integrations)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), activity: 'Booking form template generated.' }
    ],
    reports: [
      'SALES_CONVERSION_REPORT.md'
    ]
  },
  'avatar': {
    id: 'avatar',
    name: 'Avatar Studio',
    description: 'Digital personas animation and interactive scripts coordinator.',
    tag: 'Media OS',
    overview: 'Manages Veo and Sora models render queues for generating visual assets.',
    goals: [
      { id: 'av-g1', title: 'Verify rendering pipeline settings', status: 'completed' }
    ],
    workflows: [
      { id: 'av-w1', name: 'Model Ingest queue', status: 'idle' }
    ],
    recommendedActions: [
      'Trigger video render script',
      'Preview assets in browser'
    ],
    knowledgeLinks: [
      { label: 'Render Guides', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$0.00 (Internal R&D)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), activity: 'Render script checks completed.' }
    ],
    reports: [
      'RENDER_TELEMETRY.md'
    ]
  },
  'podcast': {
    id: 'podcast',
    name: 'Podcast Engine',
    description: 'ASR script parsing, summaries exports, and audio queues.',
    tag: 'Media OS',
    overview: 'Orchestrates audio transcription, automated transcript notes generation, and summaries indexing.',
    goals: [
      { id: 'pod-g1', title: 'Export transcript annotations', status: 'in_progress' }
    ],
    workflows: [
      { id: 'pod-w1', name: 'ASR Transcript Scanner', status: 'completed' }
    ],
    recommendedActions: [
      'Initiate transcript ingest',
      'Approve narrative brief summaries'
    ],
    knowledgeLinks: [
      { label: 'Audio Pipeline Schema', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$0.00 (Internal R&D)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), activity: 'ASR transcript parsing complete.' }
    ],
    reports: [
      'ASR_INTEGRITY_REPORT.md'
    ]
  },
  'ai-school': {
    id: 'ai-school',
    name: 'AI School',
    description: 'Developer educational materials and tutorials compilation.',
    tag: 'Education OS',
    overview: 'Workspace directory containing AI agent tutorial guidelines and documentation templates.',
    goals: [
      { id: 'ais-g1', title: 'Verify markdown templates layout', status: 'completed' }
    ],
    workflows: [
      { id: 'ais-w1', name: 'Template Ingestion Sync', status: 'idle' }
    ],
    recommendedActions: [
      'Create tutorial markdown',
      'Audit document index structure'
    ],
    knowledgeLinks: [
      { label: 'Tutorial Template', url: 'file:///Users/alexanderanthony/docs/specifications/WORKSPACE_REGISTRY.md' }
    ],
    revenueStatus: '$0.00 (Developer Relations)',
    recentActivity: [
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), activity: 'Templates index locked.' }
    ],
    reports: [
      'TUTORIALS_INDEX.md'
    ]
  }
};
