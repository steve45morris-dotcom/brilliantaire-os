export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealtimeVoiceConfig {
  enabled: boolean;
  status: RealtimeConnectionStatus;
  voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer';
  enableVAD: boolean;
  muted: boolean;
  volume: number;
}

export interface RealtimeTranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
