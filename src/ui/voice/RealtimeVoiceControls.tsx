import React, { useEffect, useState } from 'react';
import { globalOpenAIRealtimeClient } from './OpenAIRealtimeClient.js';
import { globalRealtimeSessionManager } from './RealtimeSessionManager.js';
import { globalRealtimeAudioManager } from './RealtimeAudioManager.js';
import { RealtimeConnectionStatus, RealtimeTranscriptItem } from './RealtimeTypes.js';

export const RealtimeVoiceControls: React.FC = () => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [transcripts, setTranscripts] = useState<RealtimeTranscriptItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const unsubStatus = globalOpenAIRealtimeClient.subscribeStatus((s) => setStatus(s));
    const unsubTrans = globalOpenAIRealtimeClient.subscribeTranscripts((t) => setTranscripts(t));
    return () => {
      unsubStatus();
      unsubTrans();
    };
  }, []);

  const handleToggleConnection = async () => {
    if (status === 'connected') {
      globalRealtimeAudioManager.stopRecording();
      globalRealtimeSessionManager.stopSession();
      setRecording(false);
    } else {
      const success = await globalRealtimeSessionManager.startSession();
      if (success) {
        setRecording(true);
        globalRealtimeAudioManager.startRecording();
      }
    }
  };

  const handleSendText = () => {
    if (!textInput) return;
    globalOpenAIRealtimeClient.sendText(textInput);
    setTextInput('');
  };

  const handleToggleMute = () => {
    if (muted) {
      if (status === 'connected') {
        globalRealtimeAudioManager.startRecording();
        setRecording(true);
      }
      setMuted(false);
    } else {
      globalRealtimeAudioManager.stopRecording();
      setRecording(false);
      setMuted(true);
    }
  };

  const statusColor = status === 'connected' ? '#00e676' : status === 'connecting' ? '#ffb000' : status === 'error' ? '#ff2e55' : '#64748b';

  return (
    <div style={{
      background: 'rgba(5, 7, 12, 0.9)',
      border: `1px solid rgba(0, 240, 255, 0.15)`,
      borderRadius: '12px',
      padding: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', letterSpacing: '1px' }}>🗣️ REALTIME VOICE PORTAL</h4>
        <span style={{ color: statusColor, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{status}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleToggleConnection}
          style={{
            flex: 1,
            padding: '10px',
            background: status === 'connected' ? 'rgba(255, 46, 85, 0.1)' : 'rgba(0, 240, 255, 0.05)',
            border: `1px solid ${status === 'connected' ? '#ff2e55' : '#00f0ff'}`,
            borderRadius: '6px',
            color: status === 'connected' ? '#ff2e55' : '#00f0ff',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          {status === 'connected' ? 'Disconnect' : 'Connect Voice'}
        </button>

        <button
          onClick={handleToggleMute}
          disabled={status !== 'connected'}
          style={{
            padding: '10px 16px',
            background: muted ? 'rgba(255,176,0,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${muted ? '#ffb000' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '6px',
            color: muted ? '#ffb000' : '#ffffff',
            cursor: status === 'connected' ? 'pointer' : 'not-allowed',
            fontSize: '11px'
          }}
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* Transcripts Log */}
      <div style={{
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '6px',
        padding: '12px',
        minHeight: '120px',
        maxHeight: '200px',
        overflowY: 'auto',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {transcripts.length === 0 ? (
          <span style={{ color: '#64748b', fontStyle: 'italic' }}>No voice transcript history.</span>
        ) : (
          transcripts.map((t) => (
            <div key={t.id} style={{ display: 'flex', gap: '8px' }}>
              <span style={{ color: t.role === 'user' ? '#00f0ff' : '#bc13fe', fontWeight: 'bold' }}>
                [{t.role.toUpperCase()}]:
              </span>
              <span style={{ color: '#cbd5e1' }}>{t.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Text override input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Type fallback voice command..."
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#ffffff',
            fontSize: '12px'
          }}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
        />
        <button
          onClick={handleSendText}
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid #00f0ff',
            borderRadius: '4px',
            color: '#00f0ff',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
