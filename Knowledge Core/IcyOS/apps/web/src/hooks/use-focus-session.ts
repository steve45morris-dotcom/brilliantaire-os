import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api/client';

export type SessionState = 'ready' | 'running' | 'paused' | 'completed' | 'skipped' | 'overrun';

export interface SessionEvent {
  timestamp: string;
  type: string;
  message: string;
}

export function useFocusSession(initialDurationSeconds: number = 1800, initialBufferSeconds: number = 600) {
  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [timeLeft, setTimeLeft] = useState(initialDurationSeconds);
  const [bufferLeft, setBufferLeft] = useState(initialBufferSeconds);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const addEvent = (type: string, message: string) => {
    setEvents((prev) => [
      { timestamp: new Date().toISOString(), type, message },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (sessionState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setSessionState('overrun');
            addEvent('transition', 'Session overrun triggered: Protected Buffer consumption active.');
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sessionState === 'overrun') {
      timerRef.current = setInterval(() => {
        setBufferLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            addEvent('buffer_exhausted', 'Protected Buffer completely consumed.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  const startSession = async (missionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ sessionId: string }>('/api/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ missionId }),
      });
      if (response.success) {
        setSessionState('running');
        addEvent('start', `Focus session started for mission ${missionId}`);
      } else {
        setError(response.error?.message || 'Failed to start focus session');
      }
    } catch {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  const pauseSession = () => {
    if (sessionState === 'running') {
      setSessionState('paused');
      addEvent('pause', 'Session paused by operator.');
    }
  };

  const resumeSession = () => {
    if (sessionState === 'paused') {
      setSessionState('running');
      addEvent('resume', 'Session resumed.');
    }
  };

  const completeSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ status: string }>('/api/sessions/complete', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      if (response.success) {
        setSessionState('completed');
        addEvent('complete', `Session completed successfully.`);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setError(response.error?.message || 'Failed to complete session');
      }
    } catch {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  const skipMission = async (missionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ status: string }>('/api/missions/skip', {
        method: 'POST',
        body: JSON.stringify({ missionId }),
      });
      if (response.success) {
        setSessionState('skipped');
        addEvent('skip', `Mission skipped by operator.`);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setError(response.error?.message || 'Failed to skip mission');
      }
    } catch {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
