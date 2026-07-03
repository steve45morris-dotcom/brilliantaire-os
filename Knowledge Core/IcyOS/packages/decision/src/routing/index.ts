export type RouteCategory = 
  | 'inbox_parsing'
  | 'timeline_generation'
  | 'reflection_summarization'
  | 'executive_briefing'
  | 'knowledge_lookup';

export interface DecisionRequest {
  category: RouteCategory;
  input: string;
  context?: any;
}

export interface DecisionResult {
  decision_source: 'deterministic' | 'llm_orchestrated';
  confidence_score: number;
  explanation: string;
  llm_required: boolean;
  orchestration_request?: {
    model_hint: 'fast' | 'reasoning' | 'heavy';
    prompt_template_id: string;
    payload: any;
  };
}
