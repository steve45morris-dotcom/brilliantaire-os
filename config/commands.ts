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
  "automation-metrics": {
    key: "automation-metrics",
    label: "Automation Metrics Telemetry Report",
    aliases: [],
    npmScript: "automation-metrics",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--metrics"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-health": {
    key: "automation-health",
    label: "Automation Health Operational Overview",
    aliases: [],
    npmScript: "automation-health",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--health"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-history": {
    key: "automation-history",
    label: "Automation Execution Runs History",
    aliases: [],
    npmScript: "automation-history",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--history"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-effectiveness": {
    key: "automation-effectiveness",
    label: "Automation Effectiveness Evaluation",
    aliases: [],
    npmScript: "automation-effectiveness",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--effectiveness"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-scoreboard": {
    key: "automation-scoreboard",
    label: "Automation Performance Scoreboard",
    aliases: [],
    npmScript: "automation-scoreboard",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--scoreboard"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "automation-telemetry-gen": {
    key: "automation-telemetry-gen",
    label: "Generate Operational Telemetry Reports to Files",
    aliases: [],
    npmScript: "automation-telemetry-gen",
    command: "npx",
    args: ["tsx", "scripts/telemetry_layer.ts", "--generate"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "list-schedules": {
    key: "list-schedules",
    label: "List Active Schedules Details",
    aliases: [],
    npmScript: "list-schedules",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--list"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "create-schedule": {
    key: "create-schedule",
    label: "Register New Schedule Option",
    aliases: [],
    npmScript: "create-schedule",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--create"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "pause-schedule": {
    key: "pause-schedule",
    label: "Pause Trigger Schedule",
    aliases: [],
    npmScript: "pause-schedule",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--pause"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "resume-schedule": {
    key: "resume-schedule",
    label: "Resume Trigger Schedule",
    aliases: [],
    npmScript: "resume-schedule",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--resume"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "scheduler-health": {
    key: "scheduler-health",
    label: "Retrieve Scheduler Health Scorecard",
    aliases: [],
    npmScript: "scheduler-health",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--health"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "scheduler-report": {
    key: "scheduler-report",
    label: "Compile Scheduler Summary Reports",
    aliases: [],
    npmScript: "scheduler-report",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--report"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
    enabled: true
  },
  "scheduler-run": {
    key: "scheduler-run",
    label: "Execute Scheduler Verification Tick",
    aliases: [],
    npmScript: "scheduler-run",
    command: "npx",
    args: ["tsx", "scripts/scheduler_layer.ts", "--run"],
    owningAgent: "Workflow Auditor",
    risk: "low",
    requires_exact_name: false,
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
