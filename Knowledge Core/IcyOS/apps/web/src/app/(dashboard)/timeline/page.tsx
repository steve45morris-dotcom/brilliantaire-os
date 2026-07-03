'use client';

import { useGenerateDailyPlan } from '../../../hooks/use-generate-daily-plan';
import { useTimelineApproval } from '../../../hooks/use-timeline-approval';
import { GeneratePlanButton } from '../../../components/timeline/generate-plan-button';
import { TimelineView } from '../../../components/timeline/timeline-view';
import { TimelineEmptyState } from '../../../components/timeline/timeline-empty-state';
import { ApprovalPanel } from '../../../components/timeline/approval-panel';
import { AdaptiveInsightCard } from '../../../components/timeline/adaptive-insight-card';

export default function TimelinePage() {
  const { blocks, metadata, loading: genLoading, error: genError, generatePlan, setBlocks } = useGenerateDailyPlan();
  const { status, loading: appLoading, error: appError, approveTimeline, rejectTimeline, regenerateTimeline, lockTimeline, setStatus } = useTimelineApproval('draft');

  const handleGenerate = async () => {
    await generatePlan();
    setStatus('generated');
  };

  const handleReject = async () => {
    await rejectTimeline();
    setBlocks([]);
  };

  const handleRegenerate = async (id: string) => {
    await regenerateTimeline(id);
    await generatePlan();
  };

  const loading = genLoading || appLoading;
  const error = genError || appError;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Daily Timeline</h1>
          <p className="text-zinc-500 text-sm">Generate hourly focus schedules aligned with workspace priorities.</p>
        </div>
        {blocks.length === 0 && (
          <GeneratePlanButton onGenerate={handleGenerate} loading={loading} />
        )}
      </div>

      {error && (
        <div className="p-4 border border-red-900 bg-red-950/10 text-xs font-semibold text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {metadata && (
        <AdaptiveInsightCard metadata={metadata} />
      )}

      {blocks.length > 0 && (
        <ApprovalPanel
          timelineId="current-timeline-id"
          status={status}
          loading={loading}
          onApprove={approveTimeline}
          onReject={handleReject}
          onRegenerate={handleRegenerate}
          onLock={lockTimeline}
        />
      )}

      {blocks.length === 0 ? (
        <TimelineEmptyState />
      ) : (
        <TimelineView blocks={blocks} />
      )}
    </div>
  );
}
