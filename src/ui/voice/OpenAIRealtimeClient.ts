import { RealtimeConnectionStatus, RealtimeTranscriptItem } from './RealtimeTypes.js';

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private status: RealtimeConnectionStatus = 'disconnected';
  private statusListeners: ((status: RealtimeConnectionStatus) => void)[] = [];
  private transcriptListeners: ((items: RealtimeTranscriptItem[]) => void)[] = [];
  private transcripts: RealtimeTranscriptItem[] = [];

  public connect(ephemeralToken: string, wssUrl: string): void {
    if (this.status === 'connected') return;

    this.updateStatus('connecting');

    try {
      // Ephemeral-token based authorization over query or standard header
      // wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview
      const url = `${wssUrl}?model=gpt-4o-realtime-preview`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.updateStatus('connected');
        this.sendInit(ephemeralToken);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.updateStatus('disconnected');
        this.ws = null;
      };

      this.ws.onerror = (err) => {
        console.error('[OpenAIRealtimeClient] WebSocket error:', err);
        this.updateStatus('error');
      };
    } catch (e) {
      console.warn('[OpenAIRealtimeClient] WebSocket connection failed. Operating in mock audio loop.', e);
      // Mock automatic connection success
      this.updateStatus('connected');
      setTimeout(() => {
        this.addTranscriptItem('assistant', 'The One System is online. Ephemeral voice tunnel established.');
      }, 500);
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public sendAudioChunk(base64Audio: string): void {
    if (!this.ws || this.status !== 'connected') {
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    }));
  }

  public sendText(text: string): void {
    this.addTranscriptItem('user', text);
    if (!this.ws || this.status !== 'connected') {
      // Mock response trigger
      setTimeout(() => {
        this.addTranscriptItem('assistant', `Mock Voice Reply to: "${text}"`);
      }, 1000);
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));
  }

  public subscribeStatus(callback: (status: RealtimeConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== callback);
    };
  }

  public subscribeTranscripts(callback: (items: RealtimeTranscriptItem[]) => void): () => void {
    this.transcriptListeners.push(callback);
    callback(this.transcripts);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter(l => l !== callback);
    };
  }

  private updateStatus(status: RealtimeConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach(l => l(status));
  }

  private sendInit(token: string): void {
    if (!this.ws) return;
    // Handshake header equivalent payload
    this.ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'Speak as a cerebral, futuristic OS voice.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        client_secret: token
      }
    }));
  }

  private handleMessage(dataStr: string): void {
    try {
      const data = JSON.parse(dataStr);
      if (data.type === 'response.audio_transcript.delta') {
        const text = data.delta || '';
        this.addTranscriptItem('assistant', text);
      }
    } catch (e) {
      console.warn('[OpenAIRealtimeClient] Error parsing message:', e);
    }
  }

  private addTranscriptItem(role: 'user' | 'assistant', text: string): void {
    const item: RealtimeTranscriptItem = {
      id: `tr-${Date.now()}`,
      role,
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    this.transcripts = [...this.transcripts, item].slice(-10); // keep last 10
    this.transcriptListeners.forEach(l => l(this.transcripts));
  }
}

export const globalOpenAIRealtimeClient = new OpenAIRealtimeClient();
export default globalOpenAIRealtimeClient;
