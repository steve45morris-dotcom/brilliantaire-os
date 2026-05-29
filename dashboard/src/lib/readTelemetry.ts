export interface CommandSummary {
  totalCommands: number;
  successfulCommands: number;
  blockedCommands: number;
  totalVoiceCommands: number;
  voiceAccepted: number;
  voicePending: number;
  voiceRejected: number;
  voiceApprovedConfirmations: number;
  voiceDeniedConfirmations: number;
  obsidianWrites: number;
  totalRiskEvents: number;
}

export interface VoiceSummary {
  accepted: number;
  pending: number;
  rejected: number;
  approvedConfirmations: number;
  deniedConfirmations: number;
}

export interface CampaignReadiness {
  campaignName: string;
  readinessScore: string;
  executionStatus: string;
  filesPresentCount: number;
  missingFilesCount: number;
  missingFilesList: string[];
}

export interface DashboardData {
  currentPhase: string;
  activeCapabilities: string[];
  activeProjects: string[];
  nextActions: string[];
  commandSummary: CommandSummary;
  voiceSummary: VoiceSummary;
  campaignReadiness: CampaignReadiness;
  latestSnapshotPath: string;
  latestTelemetryReportPath: string;
  latestSportyReportPath: string;
  missingSignals: string[];
  exportedAt: string;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch('./dashboard-data.json');
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
}
