export interface LiveOperationsConfig {
  sessionTimeoutMs: number; // e.g. 5 minutes (300000)
  maxEventsInMemory: number; // e.g. 200
  enablePollingFallback: boolean;
}

export const globalLiveOperationsConfig: LiveOperationsConfig = {
  sessionTimeoutMs: 300000,
  maxEventsInMemory: 200,
  enablePollingFallback: true
};
