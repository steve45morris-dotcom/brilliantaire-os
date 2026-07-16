import React, { useState } from 'react';
import { applyDesignDashboardAction, DESIGN_QUALITY_ACTIONS, type DesignQualityAction } from '../../../src/design/DesignDashboardActions.js';
import { runDesignCommand, type DesignCommand } from '../../../src/design/DesignCli.js';
import { calculateVisualScore } from '../../../src/design/DesignGuardian.js';
import { PILOT_VERIFICATIONS } from '../../../src/design/PilotVerification.js';
import { globalActionRouter } from '../../../src/ui/actions/ActionRouter.js';

const joyVerification = PILOT_VERIFICATIONS['joy-beauty-studio'];
const joyScore = calculateVisualScore(joyVerification.categories);

const records = [
  ['the-one-system', 'The One System', 30, 80, 'captured', 'captured', 'missing'],
  ['icyflamze', 'Icyflamze', 90, 90, 'captured', 'captured', 'profiled'],
  ['profbetgeng', 'ProfBetGeng', 45, 85, 'captured', 'captured', 'profiled'],
  ['treegroove', 'TreeGroove Records', 25, 85, 'captured', 'captured', 'profiled'],
  ['joy-beauty-studio', 'Joy Beauty Studio', joyScore, 85, 'captured', 'captured', 'valid'],
  ['avatar', 'Avatar', 15, 85, 'captured', 'pending', 'profiled'],
  ['podcast', 'Podcast', 12, 85, 'pending', 'pending', 'profiled'],
  ['ai-school', 'AI School', 5, 85, 'unavailable', 'unavailable', 'profiled'],
] as const;

export const DesignQuality: React.FC<{ onNotify: (message: string, type: 'info' | 'success' | 'warn') => void }> = ({ onNotify }) => {
  const [selected, setSelected] = useState('joy-beauty-studio');
  const [detail, setDetail] = useState(`Joy Beauty Studio pilot improved from ${joyVerification.baselineScore} to ${joyScore}. Independent review passed with no blockers.`);

  const runAction = (action: DesignQualityAction) => {
    const result = applyDesignDashboardAction(selected, action);
    const commandByAction: Record<DesignQualityAction, DesignCommand> = {
      'Run Audit': 'design:audit',
      'Open DESIGN.md': 'design:profile',
      'Capture Screenshots': 'design:screenshot',
      'Run Review': 'design:review',
      'View Score': 'design:score',
      'Compare Versions': 'design:compare',
      'Start Revision': 'design:regression',
    };
    const commandResult = runDesignCommand(commandByAction[action], [selected]);
    setDetail(`${result.detail} Score ${commandResult.visualScore}/${commandResult.threshold}; ${commandResult.decision}. Evidence: ${commandResult.evidencePaths.join(', ')}`);
    globalActionRouter.routeAction(`design:${action.toLowerCase().replace(/\s+/g, '-')}`, commandResult);
    onNotify(`${action}: ${selected} -> ${commandResult.decision}`, commandResult.decision === 'pass' ? 'success' : 'warn');
  };

  return (
    <section className="hud-panel" aria-labelledby="design-quality-title">
      <div className="pilot-section-heading">
        <div>
          <h3 id="design-quality-title" className="cyber-title" style={{ color: '#ffb000' }}>Design Quality</h3>
          <span className="data-source-label">Frontend Design Guardian / experimental</span>
        </div>
        <div className="pilot-summary-strip"><span>8 projects</span><span>1 accepted</span><span>pilot +{joyScore - joyVerification.baselineScore}</span></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead><tr>{['Project', 'Score', 'Threshold', 'Desktop', 'Mobile', 'DESIGN.md', 'Decision'].map(label => <th key={label} style={{ textAlign: 'left', padding: '10px', color: '#64748b' }}>{label}</th>)}</tr></thead>
          <tbody>{records.map(([id, name, score, threshold, desktop, mobile, design]) => (
            <tr key={id} onClick={() => setSelected(id)} style={{ borderTop: '1px solid rgba(255,255,255,.06)', cursor: 'pointer', background: selected === id ? 'rgba(0,240,255,.05)' : 'transparent' }}>
              <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 700 }}>{name}</td><td>{score}</td><td>{threshold}</td><td>{desktop}</td><td>{mobile}</td><td>{design}</td><td style={{ color: score >= threshold && desktop === 'captured' && mobile === 'captured' ? '#00e676' : '#ffb000' }}>{score >= threshold && desktop === 'captured' && mobile === 'captured' ? 'pass' : 'revise'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <pre className="pilot-detail" aria-live="polite">{detail}</pre>
      <div className="pilot-actions" aria-label="Design Quality actions">
        {DESIGN_QUALITY_ACTIONS.map(action => <button key={action} type="button" className="premium-btn" onClick={() => runAction(action)}><span>{action}</span></button>)}
      </div>
    </section>
  );
};
