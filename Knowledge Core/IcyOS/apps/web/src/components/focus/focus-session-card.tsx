'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { SessionTimer } from './session-timer';
import { PauseButton } from './pause-button';
import { ResumeButton } from './resume-button';
import { CompleteButton } from './complete-button';
import { SkipButton } from './skip-button';
import { ProtectedBufferCard } from './protected-buffer-card';
import { SessionEventLog } from './session-event-log';
import { useFocusSession } from '../../hooks/use-focus-session';

interface FocusSessionCardProps {
  missionId: string;
  missionTitle: string;
}

export function FocusSessionCard({ missionId, missionTitle }: FocusSessionCardProps) {
  const {
    sessionState,
    timeLeft,
    bufferLeft,
    events,
    loading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    skipMission,
  } = useFocusSession();

  const handleStart = () => startSession(missionId);
  const handleComplete = () => completeSession('current-session-id');
  const handleSkip = () => skipMission(missionId);

  const getStatusBadgeColor = (s: string) => {
    switch (s) {
      case 'running': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'paused': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'overrun': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <Card className="flex flex-col gap-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-500">Active Focus Target</span>
          <span className="text-lg font-bold text-zinc-100">{missionTitle}</span>
        </div>
        <Badge className={`capitalize ${getStatusBadgeColor(sessionState)}`}>
          {sessionState}
        </Badge>
      </div>

      {error && (
        <span className="text-xs font-semibold text-pink-500 p-3 bg-pink-950/10 border border-pink-900/50 rounded-lg">
          {error}
        </span>
      )}

      {sessionState !== 'ready' && (
        <div className="flex flex-col gap-6">
          <SessionTimer timeLeft={timeLeft} />
          <ProtectedBufferCard bufferLeft={bufferLeft} />
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {sessionState === 'ready' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
          >
            Start Focus Target
          </button>
        )}
        {sessionState === 'running' && (
          <>
            <PauseButton onPause={pauseSession} />
            <CompleteButton onComplete={handleComplete} loading={loading} />
          </>
        )}
        {sessionState === 'paused' && (
          <>
            <SkipButton onSkip={handleSkip} loading={loading} />
            <ResumeButton onResume={resumeSession} />
          </>
        )}
        {sessionState === 'overrun' && (
          <CompleteButton onComplete={handleComplete} loading={loading} />
        )}
      </div>

      {sessionState !== 'ready' && <SessionEventLog events={events} />}
    </Card>
  );
}
