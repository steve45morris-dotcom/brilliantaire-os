import { useState } from 'react';
import { apiFetch } from '../lib/api/client';

export interface TimelineBlockData {
  id: string;
  title: string;
  mode: 'focus' | 'buffer' | 'break' | 'rest';
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: 'proposed' | 'approved' | 'active' | 'completed';
  confidence?: number;
}

export interface AdaptiveMetadata {
  recommended_time_window: string;
  confidence_score: number;
  reason: string;
  historical_pattern: string;
  buffer_recommendation: string;
}

export function useGenerateDailyPlan() {
  const [blocks, setBlocks] = useState<TimelineBlockData[]>([]);
  const [metadata, setMetadata] = useState<AdaptiveMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ blocks: TimelineBlockData[]; metadata: AdaptiveMetadata }>('/api/timelines/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (response.success && response.data) {
        // Sort blocks by startTime ascending
        const sorted = [...response.data.blocks].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setBlocks(sorted);
        setMetadata(response.data.metadata);
      } else {
        setError(response.error?.message || 'Failed to generate plan coordinates');
      }
    } catch (err) {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  return {
    blocks,
    metadata,
    loading,
    error,
    generatePlan,
    setBlocks,
  };
}
