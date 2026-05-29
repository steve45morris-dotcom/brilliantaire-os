import React from 'react';

interface TelemetryFilesCardProps {
  latestSnapshotPath: string;
  latestTelemetryReportPath: string;
  latestSportyReportPath: string;
  missingSignals: string[];
}

export const TelemetryFilesCard: React.FC<TelemetryFilesCardProps> = ({
  latestSnapshotPath,
  latestTelemetryReportPath,
  latestSportyReportPath,
  missingSignals,
}) => {
  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #39ff14',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(57, 255, 20, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#39ff14', borderBottom: '1px dashed #39ff14', paddingBottom: '10px', marginTop: 0 }}>
        📂 TELEMETRY LOG FILES
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <span style={{ color: '#8892b0', fontSize: '12px' }}>LATEST SNAPSHOT:</span>
          <div style={{ color: '#00ffcc', fontSize: '13px', wordBreak: 'break-all', marginTop: '4px' }}>
            {latestSnapshotPath ? `📄 ${latestSnapshotPath}` : '❌ None Generated'}
          </div>
        </div>
        <div>
          <span style={{ color: '#8892b0', fontSize: '12px' }}>UNIFIED TELEMETRY:</span>
          <div style={{ color: '#00ffcc', fontSize: '13px', wordBreak: 'break-all', marginTop: '4px' }}>
            {latestTelemetryReportPath ? `📄 ${latestTelemetryReportPath}` : '❌ None Generated'}
          </div>
        </div>
        <div>
          <span style={{ color: '#8892b0', fontSize: '12px' }}>SPORTY CAMPAIGN METRICS:</span>
          <div style={{ color: '#00ffcc', fontSize: '13px', wordBreak: 'break-all', marginTop: '4px' }}>
            {latestSportyReportPath ? `📄 ${latestSportyReportPath}` : '❌ None Generated'}
          </div>
        </div>
        {missingSignals.length > 0 && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #2d3748', paddingTop: '8px' }}>
            <span style={{ color: '#ff073a', fontSize: '12px', fontWeight: 'bold' }}>⚠️ MISSING SIGNALS DETECTED:</span>
            <ul style={{ color: '#ff073a', margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
              {missingSignals.map((sig, idx) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
