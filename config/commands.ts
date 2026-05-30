export interface CommandEntry {
  key: string;
  label: string;
  aliases: string[];
  npmScript?: string;
  command: string;
  args: string[];
  owningAgent: string;
  risk: 'low' | 'medium' | 'high';
  requires_exact_name: boolean;
  enabled: boolean;
  isMock?: boolean;
  mockOutput?: string;
}

export const COMMAND_POLICY: Record<string, CommandEntry> = {
  "automation-help": {
    key: "automation-help",
    label: "Automation help and routine listing",
    aliases: ["automation list", "routine help"],
    npmScript: "automation-help",
    command: "npx",
    args: ["tsx", "scripts/automation-help.ts"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-runner": {
    key: "automation-runner",
    label: "Local automation routine runner",
    aliases: ["run automation", "routine"],
    npmScript: "automation-runner",
    command: "npx",
    args: ["tsx", "scripts/automation-runner.ts"],
    owningAgent: "Build Operator",
    risk: "medium",
    requires_exact_name: true,
    enabled: true
  },
  "audit": {
    key: "audit",
    label: "System configuration validation and audit check",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Audit: System health check completed successfully. 0 issues found."
  },
  "brief": {
    key: "brief",
    label: "Compile and present daily summary brief",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Brief: Daily operational overview prepared. System operating at peak efficiency."
  },
  "next": {
    key: "next",
    label: "Identify next scheduled actions",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Next: Phase 8A completed. Next action is setting up scheduled jobs."
  },
  "mesh-telemetry snapshot": {
    key: "mesh-telemetry snapshot",
    label: "Capture cybernetic background particle mesh telemetry snapshot",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Mesh Telemetry: Cybernetic particle mesh configuration snapshot captured. 45 nodes stable."
  },
  "mesh-telemetry report": {
    key: "mesh-telemetry report",
    label: "Generate cybernetic background particle mesh telemetry report",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Mesh Telemetry Report: 45 active nodes, responsive vector links, mouse interaction status: ACTIVE, theme-sync: OK."
  },
  "dashboard-export": {
    key: "dashboard-export",
    label: "Export visual cockpit telemetry to out/dashboard.html",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Dashboard Export: Visual cockpit telemetry successfully saved to out/dashboard.html."
  },
  "campaign-simulate status sporty": {
    key: "campaign-simulate status sporty",
    label: "Simulate and check status of sporty campaign",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Creative Revenue Strategist",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Campaign Simulate: Status for campaign 'sporty' retrieved. Conversion rates normal, engagement: HIGH."
  },
  "mesh-telemetry campaign sporty": {
    key: "mesh-telemetry campaign sporty",
    label: "Collect telemetry for sporty campaign in background mesh",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Creative Revenue Strategist",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Mesh Telemetry: Campaign 'sporty' telemetry snapshot completed."
  },
  "voice-pending": {
    key: "voice-pending",
    label: "Check for pending vocal announcements in Oracle Voice Bridge",
    aliases: [],
    command: "mock",
    args: [],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true,
    isMock: true,
    mockOutput: "Voice Pending: 0 announcements queued in the voice bridge buffer."
  }
};
