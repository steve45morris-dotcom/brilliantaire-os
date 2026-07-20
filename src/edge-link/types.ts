import { v4 as uuidv4 } from 'uuid';
export interface Device {
  id: string;
  name: string;
  publicKey: string;
  lastSeen: number;
}
export interface Command {
  id: string;
  target: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  timestamp: number;
  signature?: string;
}
export interface CommandResponse {
  commandId: string;
  status: 'success' | 'error' | 'pending_confirmation';
  data?: unknown;
  error?: string;
}
export const generateCommandId = () => uuidv4();
