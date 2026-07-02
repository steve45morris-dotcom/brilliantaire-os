import { useState } from 'react';
import { apiFetch } from '../lib/api/client';

export type TimelineStatus = 'draft' | 'generated' | 'approved' | 'locked';

export function useTimelineApproval(initialStatus: TimelineStatus = 'draft') {
  const [status, setStatus] = useState<TimelineStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveTimeline = async (timelineId: string) => {
    if (status === 'approved' || status === 'locked') {
      setError('Timeline is already approved or locked');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ status: TimelineStatus }>('/api/timelines/approve', {
        method: 'POST',
        body: JSON.stringify({ timelineId }),
      });
      if (response.success && response.data) {
        setStatus('approved');
      } else {
        setError(response.error?.message || 'Failed to approve timeline');
      }
    } catch (err) {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  const rejectTimeline = async () => {
    if (status === 'locked') {
      setError('Cannot reject a locked timeline');
      return;
    }
    setStatus('draft');
  };

  const regenerateTimeline = async (timelineId: string) => {
    if (status === 'locked') {
      setError('Cannot regenerate a locked timeline');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ status: TimelineStatus }>('/api/timelines/regenerate', {
        method: 'POST',
        body: JSON.stringify({ timelineId }),
      });
      if (response.success && response.data) {
        setStatus('generated');
      } else {
        setError(response.error?.message || 'Failed to regenerate timeline');
      }
    } catch (err) {
      setError('Network communication failure');
    } finally {
      setLoading(false);
    }
  };

  const lockTimeline = () => {
    if (status !== 'approved') {
      setError('Only approved timelines can be locked');
      return;
    }
    setStatus('locked');
  };

  return {
    status,
    loading,
    error,
    approveTimeline,
    rejectTimeline,
    regenerateTimeline,
    lockTimeline,
    setStatus,
    setError,
  };
}
