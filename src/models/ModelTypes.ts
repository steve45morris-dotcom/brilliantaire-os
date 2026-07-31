export type ModelProvider =
  | 'Google Gemini'
  | 'OpenAI'
  | 'Anthropic'
  | 'Open Source'
  | 'Local'
  | 'MCP';

export type ModelStatus =
  | 'Configured'
  | 'Available'
  | 'Unavailable'
  | 'Disconnected';

export type ModelSpeed = 'slow' | 'medium' | 'fast';
export type ModelCost = 'low' | 'medium' | 'high';

export interface ModelRecord {
  id: string;
  provider: ModelProvider;
  displayName: string;
  version: string;
  status: ModelStatus;
  contextWindow: number;
  supportsVision: boolean;
  supportsVoice: boolean;
  supportsReasoning: boolean;
  supportsCoding: boolean;
  supportsResearch: boolean;
  supportsAgents: boolean;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  estimatedSpeed: ModelSpeed;
  estimatedCost: ModelCost;
  recommendedTasks: string[];
  // Lifecycle Metadata
  supported: boolean;
  deprecated: boolean;
  retirementDate?: string;
  capabilities: string[];
  discoveredAt?: string;
  source: 'api' | 'config' | 'hardcoded';
}


export type ModelRole =
  | 'Builder'
  | 'Architecture Reviewer'
  | 'Research'
  | 'Writing'
  | 'Debugger'
  | 'Executive Reports'
  | 'Documentation'
  | 'Workflow Planner'
  | 'Skill Discovery'
  | 'Knowledge Summarizer'
  | 'Conversation'
  | 'Voice Assistant';

export type ModelAssignments = Record<ModelRole, string>;

export interface ExplainabilitySettings {
  showSelectionReasons: boolean;
  showConfidenceScores: boolean;
  showAlternatives: boolean;
  showCostEstimates: boolean;
  showPerformanceEstimates: boolean;
}

export interface ModelSelectionHistoryRecord {
  timestamp: string;
  modelId: string;
  role: ModelRole;
  taskType: string;
  reason: string;
  override: boolean;
}

export interface AMOCConfig {
  assignments: ModelAssignments;
  providerStatus: Record<ModelProvider, ModelStatus>;
  explainabilitySettings?: ExplainabilitySettings;
}

