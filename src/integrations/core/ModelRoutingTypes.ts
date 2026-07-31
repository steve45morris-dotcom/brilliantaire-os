export type TaskRole =
  | 'general'
  | 'fast'
  | 'reasoning'
  | 'coding'
  | 'research'
  | 'verification'
  | 'structured-output'
  | 'voice'
  | 'image'
  | 'local-private';

export interface ModelRoutingPreferences {
  costPreference: 'low' | 'medium' | 'high';
  speedPreference: 'low' | 'medium' | 'high';
  privacyPreference: 'low' | 'medium' | 'high';
}

export interface ModelRoutingRequest {
  taskDescription: string;
  taskType?: TaskRole;
  requiredCapability?: string;
  workspaceId?: string;
  selectedProvider?: string; // locked/selected by user
  selectedModel?: string;    // locked/selected by user
  preferences?: Partial<ModelRoutingPreferences>;
}

export interface ModelRoutingResult {
  providerId: string;
  model: string;
  role: TaskRole;
  reason: string;
  confidence: number;
  fallbackProviderId?: string;
  fallbackModel?: string;
  requiresApproval: boolean;
  validationFailed?: boolean;
  suggestedProviderId?: string;
}
