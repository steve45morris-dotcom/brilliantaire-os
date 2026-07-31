import { SoundConfig, defaultSoundConfig } from './SoundConfig.js';
import { SOUND_EVENTS } from './SoundEvents.js';

export class SoundManager {
  private config: SoundConfig = { ...defaultSoundConfig };
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).globalSoundManager = this;
    }
  }

  public updateConfig(newConfig: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): SoundConfig {
    return this.config;
  }

  private initCtx(): void {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  public play(event: string): void {
    if (!this.config.enabled) return;

    try {
      this.initCtx();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      // Web Audio node gain setting
      gainNode.gain.setValueAtTime(this.config.volume * 0.1, this.audioCtx.currentTime);

      switch (event) {
        case SOUND_EVENTS.BOOT_COMPLETE:
          osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
          osc.frequency.setValueAtTime(554, this.audioCtx.currentTime + 0.1);
          osc.frequency.setValueAtTime(659, this.audioCtx.currentTime + 0.2);
          osc.type = 'sine';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.4);
          break;

        case SOUND_EVENTS.COMMAND_ACCEPTED:
        case SOUND_EVENTS.RECOMMENDATION_ACCEPTED:
        case SOUND_EVENTS.WORKFLOW_COMPLETED:
          if (this.config.muteSuccess) return;
          osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.15);
          osc.type = 'sine';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.15);
          break;

        case SOUND_EVENTS.COMMAND_REJECTED:
        case SOUND_EVENTS.RECOMMENDATION_REJECTED:
        case SOUND_EVENTS.ERROR:
          osc.frequency.setValueAtTime(250, this.audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(150, this.audioCtx.currentTime + 0.2);
          osc.type = 'sawtooth';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.25);
          break;

        case SOUND_EVENTS.ALERT:
        case SOUND_EVENTS.APPROVAL_REQUIRED:
          if (this.config.muteAlerts) return;
          osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
          osc.type = 'square';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.08);
          break;

        case SOUND_EVENTS.WORKFLOW_STARTED:
          osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.2);
          osc.type = 'triangle';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.2);
          break;

        default:
          osc.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
          osc.type = 'sine';
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.02);
      }
    } catch (err) {
      console.warn('[SoundManager] Audio oscillator playback failed:', err);
    }
  }
}

export const globalSoundManager = new SoundManager();
export const globalSoundManagerRegistryKey = 'SoundManager';
