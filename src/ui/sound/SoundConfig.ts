export interface SoundConfig {
  enabled: boolean;
  volume: number;
  muteAlerts: boolean;
  muteSuccess: boolean;
}

export const defaultSoundConfig: SoundConfig = {
  enabled: false, // Default to muted per browser audio policies and prompt instructions
  volume: 0.5,
  muteAlerts: false,
  muteSuccess: false
};
