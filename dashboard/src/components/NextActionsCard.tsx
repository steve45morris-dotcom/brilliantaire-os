import React from 'react';

interface NextActionsCardProps {
  nextActions: string[];
}

export const NextActionsCard: React.FC<NextActionsCardProps> = ({ nextActions }) => {
  const topActions = nextActions.slice(0, 7);

  return (
    <div style={{
      background: 'rgba(20, 24, 33, 0.8)',
      border: '1px solid #ffb300',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 0 10px rgba(255, 179, 0, 0.2)',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#ffb300', borderBottom: '1px dashed #ffb300', paddingBottom: '10px', marginTop: 0 }}>
        🎯 NEXT ACTIONS MATRIX
      </h2>
      {topActions.length === 0 ? (
        <div style={{ color: '#8892b0', fontStyle: 'italic' }}>No pending action items. Ready for next phase.</div>
      ) : (
        <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topActions.map((action, idx) => (
            <li key={idx} style={{ color: '#ffffff', lineHeight: '1.4' }}>
              <span style={{ color: '#ffb300', marginRight: '6px' }}>[ ]</span>
              {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
