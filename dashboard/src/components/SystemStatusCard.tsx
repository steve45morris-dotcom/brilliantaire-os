import React from 'react';

interface SystemStatusCardProps {
  currentPhase: string;
  activeCapabilitiesCount: number;
  activeProjectsCount: number;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  currentPhase,
  activeCapabilitiesCount,
  activeProjectsCount,
}) => {
  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #00ffcc',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(0, 255, 204, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#00ffcc', borderBottom: '1px dashed #00ffcc', paddingBottom: '10px', marginTop: 0 }}>
        🛰️ SYSTEM STATUS
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={{ color: '#8892b0' }}>CURRENT PHASE:</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff007f', marginTop: '4px' }}>
            {currentPhase}
          </div>
        </div>
        <div>
          <span style={{ color: '#8892b0' }}>ACTIVE CAPABILITIES:</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffcc', marginTop: '4px' }}>
            {activeCapabilitiesCount}
          </div>
        </div>
        <div>
          <span style={{ color: '#8892b0' }}>ACTIVE PROJECTS:</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffcc', marginTop: '4px' }}>
            {activeProjectsCount}
          </div>
        </div>
      </div>
    </div>
  );
};
