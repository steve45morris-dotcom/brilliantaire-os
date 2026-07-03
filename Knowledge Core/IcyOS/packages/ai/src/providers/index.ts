import { RuntimeRequest, RuntimeResponse } from '../capabilities';

export interface Provider {
  id: string;
  isAvailable(): boolean;
  getSupportedCapabilities(): string[];
  execute(request: RuntimeRequest): Promise<RuntimeResponse>;
}
