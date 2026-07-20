export interface BridgeResponse<T> {
  data: T;
  source: 'live' | 'mock' | 'fallback';
  status: 'online' | 'offline' | 'error';
  errors: string[];
  lastUpdated: string;
}

export class LiveDataBridge {
  protected buildResponse<T>(data: T, source: 'live' | 'mock' | 'fallback', status: 'online' | 'offline' | 'error' = 'online', errors: string[] = []): BridgeResponse<T> {
    return {
      data,
      source,
      status,
      errors,
      lastUpdated: new Date().toISOString()
    };
  }
}
