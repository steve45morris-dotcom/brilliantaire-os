'use client';

import { useInboxCapture } from '../../../hooks/use-inbox-capture';
import { InboxCaptureBox } from '../../../components/inbox/inbox-capture-box';
import { InboxResultCard } from '../../../components/inbox/inbox-result-card';
import { Card } from '../../../components/ui/card';

export default function InboxPage() {
  const { input, setInput, loading, result, error, captureInput } = useInboxCapture();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Messy Inbox Ingestion</h1>
        <p className="text-zinc-500 text-sm">Capture messy thoughts and task coordinates into structured AI models.</p>
      </div>

      <Card className="flex flex-col gap-6">
        <InboxCaptureBox
          input={input}
          setInput={setInput}
          loading={loading}
          onCapture={captureInput}
          error={error}
        />
      </Card>

      {result && <InboxResultCard result={result} />}
    </div>
  );
}
