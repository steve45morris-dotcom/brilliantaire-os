import { globalOpenAIRealtimeClient } from './OpenAIRealtimeClient.js';

export class RealtimeAudioManager {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  public async startRecording(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Convert Float32 PCM to 16-bit Int PCM
        const pcm16 = this.convertToPCM16(inputData);
        const base64 = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
        globalOpenAIRealtimeClient.sendAudioChunk(base64);
      };

      console.log('[RealtimeAudioManager] Recording started.');
    } catch (e) {
      console.warn('[RealtimeAudioManager] Failed to start audio context recording:', e);
    }
  }

  public stopRecording(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    console.log('[RealtimeAudioManager] Recording stopped.');
  }

  private convertToPCM16(float32Array: Float32Array): Int16Array {
    const l = float32Array.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const globalRealtimeAudioManager = new RealtimeAudioManager();
export default globalRealtimeAudioManager;
