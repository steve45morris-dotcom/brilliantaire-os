'use client';

import React from 'react';
import { TimelineStatusPill } from './timeline-status-pill';
import { ApproveButton } from './approve-button';
import { RejectButton } from './reject-button';
import { RegenerateButton } from './regenerate-button';
import { TimelineStatus } from '../../hooks/use-timeline-approval';
import { Button } from '../ui/button';

interface ApprovalPanelProps {
  timelineId: string;
  status: TimelineStatus;
  loading: boolean;
  onApprove: (id: string) => void;
  onReject: () => void;
  onRegenerate: (id: string) => void;
  onLock: () => void;
}

export function ApprovalPanel({
  timelineId,
  status,
  loading,
  onApprove,
  onReject,
  onRegenerate,
  onLock,
}: ApprovalPanelProps) {
  const isApproved = status === 'approved';
  const isLocked = status === 'locked';
  const isCompleted = isApproved || isLocked;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-950/60 border border-zinc-900 rounded-lg gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-500">Timeline State:</span>
        <TimelineStatusPill status={status} />
      </div>

      <div className="flex items-center gap-2">
        {!isCompleted ? (
          <>
            <RegenerateButton
              onRegenerate={() => onRegenerate(timelineId)}
              loading={loading}
              disabled={loading}
            />
            <RejectButton
              onReject={onReject}
              disabled={loading}
            />
            <ApproveButton
              onApprove={() => onApprove(timelineId)}
              loading={loading}
              disabled={loading}
            />
          </>
        ) : (
          <>
            {isApproved && (
              <Button onClick={onLock} className="bg-pink-600 hover:bg-pink-700 text-white">
                Lock Schedule
              </Button>
            )}
            {isLocked && (
              <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                Schedule Locked
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
