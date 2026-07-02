import { Timestamp } from '../primitives';
import { ApiError } from '../errors';

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: {
    request_id: string;
    timestamp: Timestamp;
    version: string;
  };
}
