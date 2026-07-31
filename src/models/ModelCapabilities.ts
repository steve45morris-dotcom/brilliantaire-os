import { ModelRecord } from './ModelTypes.js';

export type CapabilityType =
  | 'Coding'
  | 'Reasoning'
  | 'Vision'
  | 'Voice'
  | 'Research'
  | 'Planning'
  | 'Streaming'
  | 'Tool Use'
  | 'Function Calling'
  | 'Large Context'
  | 'Agent Support';

export function getModelCapabilities(model: ModelRecord): CapabilityType[] {
  const capabilities: CapabilityType[] = [];

  if (model.supportsCoding) capabilities.push('Coding');
  if (model.supportsReasoning) capabilities.push('Reasoning');
  if (model.supportsVision) capabilities.push('Vision');
  if (model.supportsVoice) capabilities.push('Voice');
  if (model.supportsResearch) capabilities.push('Research');
  if (model.contextWindow >= 100000) capabilities.push('Large Context');
  if (model.supportsStreaming) capabilities.push('Streaming');
  if (model.supportsFunctionCalling) {
    capabilities.push('Function Calling');
    capabilities.push('Tool Use');
  }
  if (model.supportsAgents) capabilities.push('Agent Support');

  // Planning capability is true if model supports reasoning or agents
  if (model.supportsReasoning || model.supportsAgents) {
    capabilities.push('Planning');
  }

  return capabilities;
}

export function verifyModelCapability(
  model: ModelRecord,
  capability: CapabilityType
): boolean {
  const list = getModelCapabilities(model);
  return list.includes(capability);
}

export interface CapabilityComparison {
  modelId: string;
  displayName: string;
  provider: string;
  status: string;
  capabilities: CapabilityType[];
  speed: string;
  cost: string;
  contextWindow: number;
}

export function generateCapabilityMatrix(models: ModelRecord[]): CapabilityComparison[] {
  return models.map(model => ({
    modelId: model.id,
    displayName: model.displayName,
    provider: model.provider,
    status: model.status,
    capabilities: getModelCapabilities(model),
    speed: model.estimatedSpeed,
    cost: model.estimatedCost,
    contextWindow: model.contextWindow
  }));
}
