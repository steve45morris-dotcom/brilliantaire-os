'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { apiFetch } from '../../../lib/api/client';
import { addDays, clockOf, dayWindow, localDate } from '../../../lib/day/local';
import type { ReviewDay } from '../../../lib/day/types';

const QUESTIONS = [
  { key: 'wentWell', label: 'What went well?' },
  { key: 'gotInWay', label: 'What got in the way?' },
  { key: 'nextTime', label: 'What will you do differently next time?' },
] as const;

type Answers = Record<(typeof QUESTIONS)[number]['key'], string>;
const EMPTY: Answers = { wentWell: '', gotInWay: '', nextTime: '' };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1 !p-4">
      <span className="text-2xl font-bold text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </Card>
  );
}

export default function ReviewPage() {
  const [today] = useState(() => localDate());
  const [date, setDate] = useState(today);
  const [day, setDay] = useState<ReviewDay | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setDay(null);
    setError(null);
    setSavedAt(null);
    const w = dayWindow(d);
    const res = await apiFetch<ReviewDay>(`/api/review?date=${d}&start=${encodeURIComponent(w.start)}&end=${encodeURIComponent(w.end)}`);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not load your day');
      return;
    }
    const r = res.data.review;
    setDay(res.data);
    setScore(r?.score ?? null);
    setAnswers({ wentWell: r?.wentWell ?? '', gotInWay: r?.gotInWay ?? '', nextTime: r?.nextTime ?? '' });
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!score || busy) return;
    setBusy(true);
    setError(null);
    const res = await apiFetch('/api/review', {
      method: 'POST',
      body: JSON.stringify({ date, score, wentWell: answers.wentWell, gotInWay: answers.gotInWay, nextTime: answers.nextTime }),
    });
    setBusy(false);
    if (res.success) {
      setSavedAt(new Date().toISOString());
      setDay((d) => (d ? { ...d, review: { date, score, wentWell: answers.wentWell || null, gotInWay: answers.gotInWay || null, nextTime: answers.nextTime || null } } : d));
    }
    else setError(res.error?.message ?? 'Could not save your review');
  }

  const stats = day?.stats;
  const label = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Review</h1>
          <p className="text-zinc-500 text-sm">What got done, and a minute to reflect on it.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className="p-1 text-zinc-400 hover:text-zinc-100">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-zinc-300 min-w-28 text-center">{label}</span>
          <button
            type="button"
            aria-label="Next day"
            onClick={() => setDate(addDays(date, 1))}
            disabled={date >= today}
            className="p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!day && !error && <p className="text-sm text-zinc-500">Loading…</p>}

      {day && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Steps done" value={String(stats.stepsDone.length)} />
            <Stat label="Focus time" value={stats.focusMinutes ? formatMinutes(stats.focusMinutes) : '0 min'} />
            <Stat label="Focus sessions" value={String(stats.focusSessions)} />
            <Stat label="Planned missions worked on" value={stats.plannedMissions ? `${stats.plannedMissionsWorked} / ${stats.plannedMissions}` : '—'} />
          </div>

          <Card className="flex items-start gap-3 !p-4">
            <Lightbulb size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-zinc-300">{day.insights.message}</span>
              <span className="text-xs text-zinc-500">
                Last 7 days: {formatMinutes(day.insights.focusMinutesLast7Days)} of focus over {day.insights.sessionsLast7Days}{' '}
                {day.insights.sessionsLast7Days === 1 ? 'session' : 'sessions'}.
              </span>
            </div>
          </Card>

          {stats.stepsDone.length > 0 && (
            <Card className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-zinc-300">Done</span>
              <ul aria-label="Steps done" className="flex flex-col gap-1">
                {stats.stepsDone.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-zinc-500 w-12 shrink-0 pt-0.5">{clockOf(s.completedAt)}</span>
                    <span className="text-zinc-200">{s.command}</span>
                    {s.missionName && <span className="text-zinc-600 truncate">· {s.missionName}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <form onSubmit={save} className="flex flex-col gap-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-zinc-300 mb-2">How was the day, from 1 to 10?</legend>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={score === n}
                      onClick={() => setScore(n)}
                      className={`w-9 h-9 rounded-md text-sm font-semibold border ${score === n ? 'bg-pink-600 border-pink-500 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>
              {QUESTIONS.map((q) => (
                <label key={q.key} className="flex flex-col gap-1 text-sm text-zinc-400">
                  {q.label}
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={answers[q.key]}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                  />
                </label>
              ))}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!score || busy}>
                  {busy ? 'Saving…' : day.review ? 'Update review' : 'Save review'}
                </Button>
                {savedAt && <span className="text-xs text-emerald-400">Saved.</span>}
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
