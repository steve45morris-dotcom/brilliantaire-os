export interface KnowledgeConfig {
  maxGraphNodes: number;
  enableMemorySync: boolean;
  syncIntervalMinutes: number;
}

export const globalKnowledgeConfig: KnowledgeConfig = {
  maxGraphNodes: 10000,
  enableMemorySync: true,
  syncIntervalMinutes: 60
};
