import { useState } from 'react';
import { apiFetch } from '../lib/api/client';

export interface StructuredSignal {
  mood: string;
  energy: number;
  blockers: string[];
  wins: string[];
  lessons: string[];
}

export interface ReflectionSummary {
  summary: string;
  signals: StructuredSignal;
}

export function useReflection() {
  const [score, setScore] = useState<number>(5);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReflectionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setHasMicPermission(false);
      setError('Microphone access denied. Falling back to text reflection.');
    }
  };

  const startRecording = () => {
    if (hasMicPermission) {
      setIsRecording(true);
      setError(null);
    } else {
      requestMicPermission();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setText((prev) => (prev ? prev + ' ' : '') + 'Highly focused focus target. Resolved routes, but ran into timezone testing blockers.');
  };

  const submitReflection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<ReflectionSummary>('/api/reviews/record', {
        method: 'POST',
        body: JSON.stringify({ score, text }),
      });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error?.message || 'Failed to submit reflection');
      }
    } catch {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  return {
    score,
    setScore,
    text,
    setText,
    isRecording,
    hasMicPermission,
    loading,
    result,
    error,
    requestMicPermission,
    startRecording,
    stopRecording,
    submitReflection,
    setHasMicPermission,
    setError,
    setResult,
  };
}
