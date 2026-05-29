import React from 'react';

interface CampaignReadinessCardProps {
  campaignName: string;
  readinessScore: string;
  executionStatus: string;
  filesPresentCount: number;
  missingFilesCount: number;
}

export const CampaignReadinessCard: React.FC<CampaignReadinessCardProps> = ({
  campaignName,
  readinessScore,
  executionStatus,
  filesPresentCount,
  missingFilesCount,
}) => {
  const isReady = executionStatus.toUpperCase().includes('READY') || executionStatus.toUpperCase().includes('STAGED');
  
  const statusColor = isReady ? '#39ff14' : '#ff073a';
  const statusBg = isReady ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 7, 58, 0.1)';

  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #ff007f',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(255, 0, 127, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#ff007f', borderBottom: '1px dashed #ff007f', paddingBottom: '10px', marginTop: 0 }}>
        📢 CAMPAIGN READINESS
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={{ color: '#8892b0' }}>CAMPAIGN:</span>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>
            {campaignName}
          </div>
        </div>
        <div>
          <span style={{ color: '#8892b0' }}>READINESS SCORE:</span>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#39ff14', marginTop: '4px' }}>
            {readinessScore}
          </div>
        </div>
        <div style={{
          padding: '8px 12px',
          borderRadius: '4px',
          background: statusBg,
          border: `1px solid ${statusColor}`,
          display: 'inline-block',
          width: 'fit-content'
        }}>
          <span style={{ color: '#8892b0', fontSize: '12px' }}>STATUS: </span>
          <span style={{ color: statusColor, fontWeight: 'bold' }}>{executionStatus}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
          <div>
            <span style={{ color: '#8892b0', fontSize: '12px' }}>FILES PRESENT:</span>
            <div style={{ fontSize: '18px', color: '#ffffff' }}>{filesPresentCount}</div>
          </div>
          <div>
            <span style={{ color: '#8892b0', fontSize: '12px' }}>MISSING:</span>
            <div style={{ fontSize: '18px', color: missingFilesCount > 0 ? '#ff073a' : '#ffffff' }}>
              {missingFilesCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
