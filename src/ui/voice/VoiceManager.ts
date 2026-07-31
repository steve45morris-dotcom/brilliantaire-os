import { VoiceConfig, defaultVoiceConfig } from './VoiceConfig.js';
import { VOICE_EVENTS, VoiceEventType } from './VoiceEvents.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class VoiceManager {
  private config: VoiceConfig = { ...defaultVoiceConfig };
  private listeners: ((config: VoiceConfig) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).globalVoiceManager = this;
      try {
        const stored = localStorage.getItem('tos_voice_config');
        if (stored) {
          this.config = { ...this.config, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.warn('[VoiceManager] Failed to read from localStorage:', e);
      }
    }

    // Subscribe to AMOC model changes to announce them
    globalEventBus.subscribe('ModelAssignmentChanged', (evt) => {
      const { role, newModelId } = evt.payload;
      let spokenRole = role;
      if (role === 'Architecture Reviewer') spokenRole = 'Reviewer';
      
      let spokenModel = 'unknown model';
      if (newModelId.includes('gemini')) {
        spokenModel = 'Gemini';
      } else if (newModelId.includes('claude')) {
        spokenModel = 'Claude';
      } else if (newModelId.includes('gpt')) {
        spokenModel = 'GPT';
      } else if (newModelId.includes('llama')) {
        spokenModel = 'Llama';
      } else {
        spokenModel = newModelId;
      }
      this.speak(`${spokenRole} configured as ${spokenModel}.`);
    });
  }


  public getConfig(): VoiceConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...updates };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tos_voice_config', JSON.stringify(this.config));
      } catch (e) {
        console.warn('[VoiceManager] Failed to save config to localStorage:', e);
      }
    }
    this.listeners.forEach(l => l({ ...this.config }));
  }

  public subscribe(callback: (config: VoiceConfig) => void): () => void {
    this.listeners.push(callback);
    callback({ ...this.config });
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public speakEvent(event: VoiceEventType): void {
    const text = VOICE_EVENTS[event];
    if (text) {
      this.speak(text);
    }
  }

  public speak(text: string): void {
    if (!this.config.enabled || this.config.muted) {
      console.log(`[VoiceManager] Speech suppressed (enabled: ${this.config.enabled}, muted: ${this.config.muted}): "${text}"`);
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.log(`[VoiceManager] Speech synthesis unsupported in environment: "${text}"`);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.config.volume;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;

      window.speechSynthesis.speak(utterance);
      console.log(`[VoiceManager] Speaking text: "${text}"`);
    } catch (err) {
      console.error('[VoiceManager] Speech synthesis error during execution:', err);
    }
  }
}

export const globalVoiceManager = new VoiceManager();
export const globalVoiceManagerKey = 'VoiceManager';
