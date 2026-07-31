export type EyeState = 'idle' | 'observing' | 'thinking' | 'executing' | 'approval' | 'alert' | 'error' | 'offline' | 'reporting' | 'waiting';

export interface EyeConfig {
  enabled: boolean;
  reduceAnimation: boolean;
  compactMode: boolean;
}
