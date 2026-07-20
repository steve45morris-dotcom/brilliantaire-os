export interface OpenAIRequestPayload {
  requestId: string;
  sessionId: string;
  workspaceId: string;
  userIntent: string;
  selectedModel: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'none';
  allowedTools: string[];
  outputSchema?: Record<string, any>;
  timeoutMs?: number;
  tokenLimit?: number;
  auditContext?: Record<string, any>;
}

export interface OpenAIResponsePayload {
  success: boolean;
  requestId: string;
  provider: 'openai';
  model: string;
  output: any;
  text?: string;
  structuredOutput?: any;
  toolCalls: any[];
  citations: any[];
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  estimatedCost?: number;
  status: 'completed' | 'failed' | 'approval-required' | 'cancelled';
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface OpenAIUsageRecord {
  requestId: string;
  workspaceId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  timestamp: string;
}
