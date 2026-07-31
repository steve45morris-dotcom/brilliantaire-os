export interface VoiceConfig {
  enabled: boolean;
  muted: boolean;
  volume: number; // 0 to 1
  rate: number;   // 0.1 to 10
  pitch: number;  // 0 to 2
}

export const defaultVoiceConfig: VoiceConfig = {
  enabled: false,
  muted: false,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0
};
