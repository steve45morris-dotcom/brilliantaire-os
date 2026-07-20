export type PresenceState =
  | 'idle'
  | 'observing'
  | 'thinking'
  | 'planning'
  | 'executing'
  | 'approval'
  | 'reporting'
  | 'alert'
  | 'waiting'
  | 'error';

export interface PresenceContext {
  currentState: PresenceState;
  currentProjectId?: string;
  suggestedAction?: string;
  recommendedFocus?: string;
  activeAlertCount: number;
  activeModelId?: string;
  activeModelName?: string;
  activeModelRole?: string;
  activeModelProvider?: string;
  activeModelReason?: string;
  activeModelCapabilities?: string[];
  activeModelConfidence?: number;
  activeModelExpectedBenefit?: string;
  activeModelTradeoffs?: string;
  activeModelSuggestedAlternative?: string;
  activeModelSuggestedAlternativeReason?: string;
}


