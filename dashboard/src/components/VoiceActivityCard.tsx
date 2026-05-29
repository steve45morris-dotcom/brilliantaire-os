import React from 'react';

interface VoiceActivityCardProps {
  accepted: number;
  pending: number;
  rejected: number;
  approvedConfirmations: number;
  deniedConfirmations: number;
}

export const VoiceActivityCard: React.FC<VoiceActivityCardProps> = ({
  accepted,
  pending,
  rejected,
  approvedConfirmations,
  deniedConfirmations,
}) => {
  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #bc13fe',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(188, 19, 254, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#bc13fe', borderBottom: '1px dashed #bc13fe', paddingBottom: '10px', marginTop: 0 }}>
        🎙️ VOICE ACTIVITY
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Immediately Executed:</span>
          <span style={{ fontWeight: 'bold', color: '#39ff14' }}>{accepted}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Pending Confirmation:</span>
          <span style={{ fontWeight: 'bold', color: '#ffb300' }}>{pending}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Rejected Phrases:</span>
          <span style={{ fontWeight: 'bold', color: '#ff073a' }}>{rejected}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Confirmations Approved:</span>
          <span style={{ fontWeight: 'bold', color: '#39ff14' }}>{approvedConfirmations}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Confirmations Denied:</span>
          <span style={{ fontWeight: 'bold', color: '#ff073a' }}>{deniedConfirmations}</span>
        </div>
      </div>
    </div>
  );
};
