'use client';

import { useReflection } from '../../../hooks/use-reflection';
import { ReviewScore } from '../../../components/review/review-score';
import { VoiceReflection } from '../../../components/review/voice-reflection';
import { TextReflection } from '../../../components/review/text-reflection';
import { AiSummaryCard } from '../../../components/review/ai-summary-card';
import { LearningSignalCard } from '../../../components/review/learning-signal-card';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';

export default function ReviewPage() {
  const {
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
  } = useReflection();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Session Reflection</h1>
        <p className="text-zinc-500 text-sm">Reflect on your focus targets performance to calibrate AI schedules.</p>
      </div>

      {error && (
        <span className="text-xs font-semibold text-pink-500 p-3 bg-pink-950/10 border border-pink-900/50 rounded-lg">
          {error}
        </span>
      )}

      {!result ? (
        <Card className="flex flex-col gap-6">
          <ReviewScore score={score} onChange={setScore} />
          
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Audio Recording
            </span>
            <VoiceReflection
              isRecording={isRecording}
              hasPermission={hasMicPermission}
              onStart={startRecording}
              onStop={stopRecording}
              onRequestPermission={requestMicPermission}
            />
          </div>

          <TextReflection text={text} onChange={setText} disabled={loading} />

          <Button
            onClick={submitReflection}
            disabled={loading}
            className="w-full sm:w-auto self-end flex items-center justify-center gap-2"
          >
            {loading && <Spinner className="h-4 w-4 text-white" />}
            <span>Submit Reflection</span>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <AiSummaryCard summary={result.summary} />
          <LearningSignalCard signals={result.signals} />
          <Button onClick={() => window.location.reload()} className="self-start">
            Start New Session
          </Button>
        </div>
      )}
    </div>
  );
}
