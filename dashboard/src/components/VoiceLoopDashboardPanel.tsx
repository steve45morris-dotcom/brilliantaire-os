import React from 'react';

interface RecorderSafetyFlags {
  liveMicEnabled: boolean;
  backgroundRecordingEnabled: boolean;
  autoTranscribeAfterRecording: boolean;
  confirmationRequired: boolean;
}

interface VoiceRecorderData {
  backendStatus: string;
  latestSession: string;
  sessionCount: number;
  stagedForAsrCount: number;
  rejectedCount: number;
  archivedCount: number;
  safetyFlags: RecorderSafetyFlags;
  latestRecorderLog: string;
}

interface VoiceLoopDashboardPanelProps {
  asrBackend: string;
  ttsRenderer: string;
  voiceBridgeStatus: string;
  queueCounts: {
    approvedAsr: number;
    ready: number;
    executed: number;
    rejected: number;
  };
  latestTranscript: string;
  latestApprovedPacket: string;
  latestExecutedPacket: string;
  blockedPacketCount: number;
  lastAuditEvent: string;
  safetyFlags: {
    liveMicEnabled: boolean;
    autoExecute: boolean;
    cloudAsrEnabled: boolean;
    exactNameRouterActive: boolean;
    rawShellExecutionBlocked: boolean;
  };
  recorder?: VoiceRecorderData;
}

export const VoiceLoopDashboardPanel: React.FC<VoiceLoopDashboardPanelProps> = ({
  asrBackend,
  ttsRenderer,
  voiceBridgeStatus,
  queueCounts,
  latestTranscript,
  latestApprovedPacket,
  latestExecutedPacket,
  blockedPacketCount,
  lastAuditEvent,
  safetyFlags,
  recorder
}) => {
  return (
    <div style={{
      background: 'rgba(10, 15, 26, 0.8)',
      border: '1px solid #00ffcc',
      borderRadius: '12px',
      padding: '24px',
      color: '#ffffff',
      boxShadow: '0 4px 30px rgba(0, 255, 204, 0.1)',
      fontFamily: 'monospace',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h2 style={{ color: '#00ffcc', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginTop: 0, fontSize: '18px', fontWeight: 'bold' }}>
        🎙️ VOICE LOOP STATUS PANEL
      </h2>
      
      {/* Backend and Engine Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>ASR ENGINE</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{asrBackend || 'Not Detected'}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>TTS RENDERER</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{ttsRenderer || 'Not Registered'}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>VOICE BRIDGE</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{voiceBridgeStatus || 'Inactive'}</span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>BLOCKED PACKETS</span>
          <span style={{ color: '#ff073a', fontWeight: 'bold' }}>{blockedPacketCount}</span>
        </div>
      </div>

      {/* Queue Counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#00ffcc' }}>PIPELINE QUEUES</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8' }}>ASR Approved Intake:</span>
          <span style={{ color: '#ffb300', fontWeight: 'bold' }}>{queueCounts.approvedAsr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8' }}>Bridge Ready Queue:</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{queueCounts.ready}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8' }}>Bridge Executed Queue:</span>
          <span style={{ color: '#39ff14', fontWeight: 'bold' }}>{queueCounts.executed}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#94a3b8' }}>Bridge Rejected Queue:</span>
          <span style={{ color: '#ff073a', fontWeight: 'bold' }}>{queueCounts.rejected}</span>
        </div>
      </div>

      {/* Safety Matrix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #1e293b', paddingTop: '12px', fontSize: '12px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#ff007f' }}>SAFETY CONTROLS</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Live Microphone:</span>
          <span style={{ color: safetyFlags.liveMicEnabled ? '#ff073a' : '#39ff14' }}>{safetyFlags.liveMicEnabled ? 'ENABLED' : 'DISABLED'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Auto Execute:</span>
          <span style={{ color: safetyFlags.autoExecute ? '#ff073a' : '#39ff14' }}>{safetyFlags.autoExecute ? 'ENABLED' : 'DISABLED'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Cloud ASR:</span>
          <span style={{ color: safetyFlags.cloudAsrEnabled ? '#ff073a' : '#39ff14' }}>{safetyFlags.cloudAsrEnabled ? 'ENABLED' : 'DISABLED'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Exact Name Router:</span>
          <span style={{ color: safetyFlags.exactNameRouterActive ? '#39ff14' : '#ff073a' }}>{safetyFlags.exactNameRouterActive ? 'ENFORCED' : 'BYPASSABLE'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Raw Shell Exec Block:</span>
          <span style={{ color: safetyFlags.rawShellExecutionBlocked ? '#39ff14' : '#ff073a' }}>{safetyFlags.rawShellExecutionBlocked ? 'ACTIVE' : 'INACTIVE'}</span>
        </div>
      </div>

      {/* Voice Session Recorder Section */}
      {recorder && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#00ffcc' }}>🎤 VOICE SESSION RECORDER</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>RECORDER STATUS</span>
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{recorder.backendStatus || 'Unavailable'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>LATEST SESSION</span>
              <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px', wordBreak: 'break-all' }}>{recorder.latestSession || 'None'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>SESSIONS COUNT</span>
              <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{recorder.sessionCount}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>STAGED FOR ASR</span>
              <span style={{ color: '#39ff14', fontWeight: 'bold' }}>{recorder.stagedForAsrCount}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>REJECTED SESSIONS</span>
              <span style={{ color: '#ff073a', fontWeight: 'bold' }}>{recorder.rejectedCount}</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>ARCHIVED SESSIONS</span>
              <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>{recorder.archivedCount}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginTop: '6px' }}>
            <span style={{ color: '#ff007f', fontSize: '11px', fontWeight: 'bold' }}>RECORDER SAFETY FLAGS</span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Live Microphone:</span>
              <span style={{ color: recorder.safetyFlags.liveMicEnabled ? '#ff073a' : '#39ff14' }}>
                {recorder.safetyFlags.liveMicEnabled ? 'ENABLED (Dangerous)' : 'DISABLED (Safe)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Background Recording:</span>
              <span style={{ color: recorder.safetyFlags.backgroundRecordingEnabled ? '#ff073a' : '#39ff14' }}>
                {recorder.safetyFlags.backgroundRecordingEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Auto Transcribe:</span>
              <span style={{ color: recorder.safetyFlags.autoTranscribeAfterRecording ? '#ff073a' : '#39ff14' }}>
                {recorder.safetyFlags.autoTranscribeAfterRecording ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Confirmation Gate:</span>
              <span style={{ color: recorder.safetyFlags.confirmationRequired ? '#39ff14' : '#ff073a' }}>
                {recorder.safetyFlags.confirmationRequired ? 'ENFORCED' : 'BYPASSABLE'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            <span style={{ color: '#64748b', display: 'block' }}>LATEST RECORDER EVENT LOG</span>
            <span style={{ color: '#e2e8f0', fontStyle: 'italic', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
              "{recorder.latestRecorderLog || 'No events recorded.'}"
            </span>
          </div>
        </div>
      )}

      {/* Telemetry Detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #1e293b', paddingTop: '12px', fontSize: '11px' }}>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>LATEST TRANSCRIPT TEXT</span>
          <span style={{ color: '#e2e8f0', fontStyle: 'italic', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
            "{latestTranscript || 'No transcript staged yet.'}"
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>LATEST APPROVED INTAKE</span>
          <span style={{ color: '#ffb300', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
            {latestApprovedPacket || 'None'}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>LATEST EXECUTED PACKET</span>
          <span style={{ color: '#39ff14', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
            {latestExecutedPacket || 'None'}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>LATEST AUDIT LOG EVENT</span>
          <span style={{ color: '#39ff14', wordBreak: 'break-all', display: 'block', marginTop: '2px' }}>
            {lastAuditEvent || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};
