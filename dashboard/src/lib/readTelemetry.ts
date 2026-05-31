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

export interface RecorderSafetyFlags {
  liveMicEnabled: boolean;
  backgroundRecordingEnabled: boolean;
  autoTranscribeAfterRecording: boolean;
  confirmationRequired: boolean;
}

export interface VoiceRecorderData {
  backendStatus: string;
  latestSession: string;
  latestSessionStatus: string;
  asrDispatchStatus: string;
  transcriptionStatus: string;
  stagedCommandStatus: string;
  asrApprovalStatus: string;
  bridgeReadiness: string;
  executionStatus: string;
  duplicateDispatchProtection: boolean;
  sessionCount: number;
  stagedForAsrCount: number;
  rejectedCount: number;
  archivedCount: number;
  safetyFlags: RecorderSafetyFlags;
  latestRecorderLog: string;
}

export interface VoiceLoopData {
  asrBackend: string;
  ttsRenderer: string;
  voiceBridgeStatus: string;
  queueCounts: {
    approvedAsr: number;
    ready: number;
    executed: number;
    rejected: number;
  };
  latestTranscript: string;
  latestApprovedPacket: string;
  latestExecutedPacket: string;
  blockedPacketCount: number;
  lastAuditEvent: string;
  safetyFlags: {
    liveMicEnabled: boolean;
    autoExecute: boolean;
    cloudAsrEnabled: boolean;
    exactNameRouterActive: boolean;
    rawShellExecutionBlocked: boolean;
  };
  recorder?: VoiceRecorderData;
}

export interface DashboardData {
  currentPhase: string;
  activeCapabilities: string[];
  activeProjects: string[];
  nextActions: string[];
  commandSummary: CommandSummary;
  voiceSummary: VoiceSummary;
  voiceLoop: VoiceLoopData;
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
