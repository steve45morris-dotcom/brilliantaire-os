import React from 'react';

interface CommandActivityCardProps {
  totalCommands: number;
  successfulCommands: number;
  blockedCommands: number;
  obsidianWrites: number;
}

export const CommandActivityCard: React.FC<CommandActivityCardProps> = ({
  totalCommands,
  successfulCommands,
  blockedCommands,
  obsidianWrites,
}) => {
  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #1f51ff',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(31, 81, 255, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#1f51ff', borderBottom: '1px dashed #1f51ff', paddingBottom: '10px', marginTop: 0 }}>
        💻 COMMAND ACTIVITY
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#8892b0' }}>Total Command Runs:</span>
          <span style={{ fontWeight: 'bold' }}>{totalCommands}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#39ff14' }}>Successful Runs:</span>
          <span style={{ fontWeight: 'bold', color: '#39ff14' }}>{successfulCommands}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#ff073a' }}>Blocked Boundaries:</span>
          <span style={{ fontWeight: 'bold', color: '#ff073a' }}>{blockedCommands}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2d3748', paddingBottom: '6px' }}>
          <span style={{ color: '#00ffcc' }}>Obsidian Writes Logged:</span>
          <span style={{ fontWeight: 'bold', color: '#00ffcc' }}>{obsidianWrites}</span>
        </div>
      </div>
    </div>
  );
};
