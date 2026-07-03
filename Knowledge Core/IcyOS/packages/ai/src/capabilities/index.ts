export type CapabilityProfile = 'fast' | 'reasoning' | 'heavy' | 'local';

export interface RuntimeRequest {
  request_id: string;
  capability: CapabilityProfile;
  confidence_required: number;
  latency_target: number; // in milliseconds
  cost_target: number; // in USD cents
  fallback_policy: 'retry' | 'failover' | 'none';
  payload: any;
}

export interface RuntimeResponse {
  request_id: string;
  provider_id: string;
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
  };
  latency_ms: number;
}
