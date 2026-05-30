export interface AutomationRoutine {
  name: string;
  description: string;
  commands: string[];
  owningAgent: string;
  riskLevel: 'low' | 'medium' | 'high';
  enabled: boolean;
  stopOnFailure: boolean;
}

export const AUTOMATION_ROUTINES: Record<string, AutomationRoutine> = {
  "daily-check": {
    name: "daily-check",
    description: "Daily system health and operational maintenance checks",
    commands: [
      "audit",
      "brief",
      "next",
      "mesh-telemetry snapshot",
      "mesh-telemetry report",
      "dashboard-export"
    ],
    owningAgent: "Workflow Auditor",
    riskLevel: "low",
    enabled: true,
    stopOnFailure: true
  },
  "campaign-check": {
    name: "campaign-check",
    description: "Check status of the active sporty marketing and monetization campaign",
    commands: [
      "campaign-simulate status sporty",
      "mesh-telemetry campaign sporty",
      "dashboard-export"
    ],
    owningAgent: "Creative Revenue Strategist",
    riskLevel: "low",
    enabled: true,
    stopOnFailure: true
  },
  "voice-check": {
    name: "voice-check",
    description: "Verify pending vocal announcements and speech queues",
    commands: [
      "voice-pending",
      "mesh-telemetry report",
      "dashboard-export"
    ],
    owningAgent: "Workflow Auditor",
    riskLevel: "low",
    enabled: true,
    stopOnFailure: true
  }
};
