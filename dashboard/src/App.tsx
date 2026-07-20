import React, { useEffect, useState } from 'react';
import { fetchDashboardData, DashboardData } from './lib/readTelemetry.js';
import { SystemStatusCard } from './components/SystemStatusCard.jsx';
import { CampaignReadinessCard } from './components/CampaignReadinessCard.jsx';
import { CommandActivityCard } from './components/CommandActivityCard.jsx';
import { VoiceActivityCard } from './components/VoiceActivityCard.jsx';
import { VoiceLoopDashboardPanel } from './components/VoiceLoopDashboardPanel.jsx';
import { NextActionsCard } from './components/NextActionsCard.jsx';
import { TelemetryFilesCard } from './components/TelemetryFilesCard.jsx';
import { JoyBeautyStudio } from './components/JoyBeautyStudio.jsx';

export const App: React.FC = () => {
  const isJoyBeautyStudioRoute = typeof window !== 'undefined' && window.location.pathname === '/projects/joy-beauty-studio';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isJoyBeautyStudioRoute) return;
    fetchDashboardData()
      .then((payload) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load telemetry data. Make sure "npm run dashboard:export" has been run.');
        setLoading(false);
      });
  }, [isJoyBeautyStudioRoute]);

  if (isJoyBeautyStudioRoute) {
    return <JoyBeautyStudio />;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0c10',
        color: '#00ffcc',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'monospace',
        fontSize: '20px',
        letterSpacing: '2px'
      }}>
        📡 CONNECTING TO MESH TELEMETRY CLIENT...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0c10',
        color: '#ff073a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'monospace',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️ TELEMETRY CONNECTION FAILED</div>
        <div style={{ maxWidth: '600px', fontSize: '16px', color: '#ffffff', lineHeight: '1.6' }}>
          {error || 'No data exported. Please execute the export task via CLI first.'}
        </div>
        <pre style={{
          marginTop: '30px',
          background: 'rgba(255, 7, 58, 0.1)',
          border: '1px solid #ff073a',
          padding: '15px',
          color: '#ffffff',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          npm run command -- "dashboard-export"
        </pre>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050709',
      backgroundImage: 'radial-gradient(circle at 50% 50%, #0d131f 0%, #050709 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 20px',
    }}>
      {/* Header Container */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 40px auto',
        padding: '24px',
        background: 'rgba(10, 15, 26, 0.9)',
        border: '1px solid #334155',
        borderRadius: '12px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-0.5px',
            background: 'linear-gradient(to right, #00ffcc, #ff007f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🌌 Brilliantaire OS
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '14px', fontFamily: 'monospace' }}>
            Tactical Local Mesh Telemetry Controller (Read-Only)
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '30px', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>ACTIVE GATEWAY PHASE</span>
            <span style={{ color: '#ff007f', fontWeight: 'bold', fontSize: '15px' }}>{data.currentPhase}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>LAST TELEMETRY REFRESH</span>
            <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '15px' }}>
              {new Date(data.exportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </header>

      {/* Grid Container */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
      }}>
        <SystemStatusCard
          currentPhase={data.currentPhase}
          activeCapabilitiesCount={data.activeCapabilities.length}
          activeProjectsCount={data.activeProjects.length}
        />

        <CampaignReadinessCard
          campaignName={data.campaignReadiness.campaignName}
          readinessScore={data.campaignReadiness.readinessScore}
          executionStatus={data.campaignReadiness.executionStatus}
          filesPresentCount={data.campaignReadiness.filesPresentCount}
          missingFilesCount={data.campaignReadiness.missingFilesCount}
        />

        <CommandActivityCard
          totalCommands={data.commandSummary.totalCommands}
          successfulCommands={data.commandSummary.successfulCommands}
          blockedCommands={data.commandSummary.blockedCommands}
          obsidianWrites={data.commandSummary.obsidianWrites}
        />

        <VoiceActivityCard
          accepted={data.voiceSummary.accepted}
          pending={data.voiceSummary.pending}
          rejected={data.voiceSummary.rejected}
          approvedConfirmations={data.voiceSummary.approvedConfirmations}
          deniedConfirmations={data.voiceSummary.deniedConfirmations}
        />

        <VoiceLoopDashboardPanel {...data.voiceLoop} />

        <NextActionsCard
          nextActions={data.nextActions}
        />

        <TelemetryFilesCard
          latestSnapshotPath={data.latestSnapshotPath}
          latestTelemetryReportPath={data.latestTelemetryReportPath}
          latestSportyReportPath={data.latestSportyReportPath}
          missingSignals={data.missingSignals}
        />
      </main>

      <footer style={{
        maxWidth: '1200px',
        margin: '40px auto 0 auto',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        🔐 Operational Boundaries Secured. All controls strictly routed via safe CLI channels.
      </footer>
    </div>
  );
};
