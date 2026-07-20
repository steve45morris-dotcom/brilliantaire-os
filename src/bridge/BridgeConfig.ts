export interface BridgeConfig {
  useLiveAdapters: boolean;
  logBridgePayloads: boolean;
}

export const globalBridgeConfig: BridgeConfig = {
  useLiveAdapters: true,
  logBridgePayloads: false
};
