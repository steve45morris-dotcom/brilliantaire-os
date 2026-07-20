import { globalOpenAIRealtimeClient } from './OpenAIRealtimeClient.js';
import { globalVoiceManager } from './VoiceManager.js';
import { RealtimeConnectionStatus } from './RealtimeTypes.js';

export class RealtimeSessionManager {
  private status: RealtimeConnectionStatus = 'disconnected';

  constructor() {
    globalOpenAIRealtimeClient.subscribeStatus((newStatus) => {
      this.status = newStatus;
    });
  }

  public async startSession(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Request microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[RealtimeSessionManager] Microphone access granted.');
      } else {
        throw new Error('Microphone API unsupported.');
      }
    } catch (err) {
      console.warn('[RealtimeSessionManager] Mic permission denied. Falling back to browser speech synthesis.', err);
      globalVoiceManager.speak('Microphone access denied. Browser voice fallback active.');
      return false;
    }

    // 2. Fetch ephemeral token from backend
    // Since client runs in browser, we query our secure integrations endpoint:
    try {
      const response = await fetch('/api/integrations/openai/realtime-session', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Ephemeral session endpoint returned error status.');
      }
      const data = await response.json();
      if (data.success && data.token) {
        globalOpenAIRealtimeClient.connect(data.token, data.url || 'wss://api.openai.com/v1/realtime');
        return true;
      } else {
        throw new Error(data.error || 'No token returned.');
      }
    } catch (e) {
      console.warn('[RealtimeSessionManager] Ephemeral session request failed. Running mock connection loop.', e);
      globalOpenAIRealtimeClient.connect('mock-token', 'wss://api.openai.com/v1/realtime');
      return true;
    }
  }

  public stopSession(): void {
    globalOpenAIRealtimeClient.disconnect();
    console.log('[RealtimeSessionManager] Session closed.');
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }
}

export const globalRealtimeSessionManager = new RealtimeSessionManager();
export default globalRealtimeSessionManager;
