import { useState } from 'react';
import { apiFetch } from '../lib/api/client';

export function useInboxCapture() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureInput = async (val: string) => {
    if (!val.trim()) {
      setError('Input field cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiFetch<{ result: string }>('/api/inbox/capture', {
        method: 'POST',
        body: JSON.stringify({ input: val }),
      });
      if (response.success && response.data) {
        setResult(response.data.result);
      } else {
        setError(response.error?.message || 'Server error occurred during ingestion');
      }
    } catch (err) {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  return {
    input,
    setInput,
    loading,
    result,
    error,
    captureInput,
  };
}
