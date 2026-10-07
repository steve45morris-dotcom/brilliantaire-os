'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, SegmentBar, TacButton, useCountUp, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import { addDays, clockOf, dayWindow, localDate } from '../../../lib/day/local';
import type { ReviewDay } from '../../../lib/day/types';

const CYAN = '#22d3ee';
const pad = (n: number) => String(n).padStart(2, '0');

const QUESTIONS = [
  { key: 'wentWell', label: 'WHAT WENT WELL', hint: 'Wins, momentum, anything to repeat.' },
  { key: 'gotInWay', label: 'WHAT GOT IN THE WAY', hint: 'Blockers, drift, interruptions.' },
  { key: 'nextTime', label: 'NEXT TIME', hint: 'One thing to do differently.' },
] as const;

type Answers = Record<(typeof QUESTIONS)[number]['key'], string>;
const EMPTY: Answers = { wentWell: '', gotInWay: '', nextTime: '' };

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      {children}
    </div>
  );
}

function Stat({ label, value, unit, color = '#e0dcd2', numeric }: { label: string; value: string; unit?: string; color?: string; numeric?: number }) {
  const counted = useCountUp(numeric ?? 0);
  const shown = numeric != null ? String(counted) : value;
  return (
    <div
      className="relative flex flex-col gap-1.5 px-4 py-3.5 rounded-lg overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)', border: '1px solid #1e2030', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}
    >
      <CornerBrackets color="rgba(201,168,76,0.3)" size={10} />
      <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">{label}</span>
      <span className="font-tactical text-[26px] leading-none font-semibold tabular-nums" style={{ color, textShadow: color === GOLD ? '0 0 18px rgba(201,168,76,0.3)' : 'none' }}>
        {shown}
        {unit && <span className="text-[11px] text-[#4a4d5a] ml-1">{unit}</span>}
      </span>
    </div>
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
  const label = date === today ? 'TODAY' : date === addDays(today, -1) ? 'YESTERDAY' : new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  const scoreColor = (n: number) => (n <= 3 ? '#f87171' : n <= 6 ? '#fbbf24' : GREEN);

  return (
    <div className="relative flex flex-col gap-5 max-w-3xl">
      <Backdrop />

      <PageHeader
        eyebrow="DEBRIEF"
        title="Review"
        aside={
          <div className="flex items-center gap-1 p-0.5 rounded-md border border-[#1e2030] bg-[#08090e]">
            <button type="button" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-[#6b6e7a] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="font-tactical text-[10px] tracking-[0.18em] text-[#e0dcd2] min-w-[6.5rem] text-center">{label}</span>
            <button type="button" aria-label="Next day" onClick={() => setDate(addDays(date, 1))} disabled={date >= today} className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-[#6b6e7a] hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
              <ChevronRight size={15} />
            </button>
          </div>
        }
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">What got done, and a minute to reflect on it.</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!day && !error && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// INITIALIZING</span>}

      {day && stats && (
        <>
          <SectionLabel>DAY READOUT</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label="STEPS DONE" value="" numeric={stats.stepsDone.length} color={stats.stepsDone.length > 0 ? GOLD : '#4a4d5a'} />
            <Stat label="FOCUS TIME" value={stats.focusMinutes ? formatMinutes(stats.focusMinutes).toUpperCase() : '0M'} color={stats.focusMinutes > 0 ? GOLD : '#4a4d5a'} />
            <Stat label="SESSIONS" value="" numeric={stats.focusSessions} color={stats.focusSessions > 0 ? '#e0dcd2' : '#4a4d5a'} />
            <Stat label="PLAN WORKED" value={stats.plannedMissions ? `${stats.plannedMissionsWorked}/${stats.plannedMissions}` : '—'} color={stats.plannedMissions && stats.plannedMissionsWorked >= stats.plannedMissions ? GREEN : '#e0dcd2'} />
          </div>

          <div
            className="relative flex items-start gap-3 px-4 py-3.5 rounded-lg overflow-hidden"
            style={{ background: 'linear-gradient(160deg, rgba(34,211,238,0.06), transparent)', border: '1px solid rgba(34,211,238,0.2)' }}
          >
            <CornerBrackets color="rgba(34,211,238,0.5)" size={12} />
            <Lightbulb size={15} className="shrink-0 mt-0.5" style={{ color: CYAN }} />
            <div className="flex flex-col gap-1 min-w-0">
              <span className="font-tactical text-[9px] tracking-[0.2em]" style={{ color: CYAN }}>INSIGHT</span>
              <span className="text-[14px] text-[#d0ccc4] leading-snug">{day.insights.message}</span>
              <span className="font-tactical text-[10px] tracking-[0.12em] text-[#4a4d5a] mt-0.5">
                7D · <span className="text-[#b8b4ac]">{formatMinutes(day.insights.focusMinutesLast7Days).toUpperCase()}</span> FOCUS OVER{' '}
                <span className="text-[#b8b4ac]">{pad(day.insights.sessionsLast7Days)}</span> {day.insights.sessionsLast7Days === 1 ? 'SESSION' : 'SESSIONS'}
                {day.insights.ratio != null && <> · ACTUAL/PLANNED <span className="text-[#b8b4ac]">×{day.insights.ratio.toFixed(2)}</span></>}
              </span>
            </div>
          </div>

          {stats.stepsDone.length > 0 && (
            <>
              <SectionLabel>COMPLETED · {pad(stats.stepsDone.length)}</SectionLabel>
              <Panel>
                <ul aria-label="Steps done" className="flex flex-col px-5 py-2">
                  {stats.stepsDone.map((s, i) => (
                    <li key={i} className={`flex items-center gap-3 py-2 ${i > 0 ? 'border-t border-[#1e2030]/50' : ''}`}>
                      <span className="font-tactical text-[11px] tabular-nums text-[#6b6e7a] w-12 shrink-0">{clockOf(s.completedAt)}</span>
                      <CheckCircle2 size={13} className="text-emerald-500/60 shrink-0" />
                      <span className="text-[13.5px] text-[#d0ccc4] flex-1 min-w-0 truncate">{s.command}</span>
                      {s.missionName && <span className="font-tactical text-[9px] tracking-[0.1em] text-[#4a4d5a] truncate max-w-[40%] hidden sm:inline">{s.missionName.toUpperCase()}</span>}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          <SectionLabel>{day.review ? 'REVIEW · LOGGED' : 'LOG THE DAY'}</SectionLabel>
          <Panel>
            <form onSubmit={save} className="flex flex-col gap-5 px-5 py-5">
              <fieldset className="flex flex-col gap-2.5">
                <legend className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a] mb-2.5">DAY SCORE · 1 TO 10</legend>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const lit = score != null && n <= score;
                    const sel = score === n;
                    const c = score ? scoreColor(score) : GOLD;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={sel}
                        aria-label={`Score ${n}`}
                        onClick={() => setScore(n)}
                        className="font-tactical flex-1 min-w-0 h-10 rounded-[4px] text-[12px] font-semibold tabular-nums transition-all"
                        style={{
                          background: lit ? c : '#0a0b10',
                          color: lit ? '#08090e' : '#4a4d5a',
                          boxShadow: sel ? `0 0 14px ${c}99, inset 0 0 0 1px ${c}` : lit ? 'none' : 'inset 0 0 0 1px #1e2030',
                          opacity: lit && !sel ? 0.75 : 1,
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between font-tactical text-[9px] tracking-[0.16em] text-[#2f3240]">
                  <span>ROUGH</span>
                  {score && <span style={{ color: scoreColor(score) }}>{score}/10</span>}
                  <span>FLOW</span>
                </div>
              </fieldset>

              {QUESTIONS.map((q) => (
                <label key={q.key} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline gap-2">
                    <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">{q.label}</span>
                    <span className="text-[11px] text-[#2f3240]">{q.hint}</span>
                  </span>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={answers[q.key]}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                    className="px-3 py-2 bg-[#08090e] border border-[#1e2030] rounded-md text-[13.5px] text-[#e0dcd2] leading-relaxed focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors resize-y"
                  />
                </label>
              ))}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e2030]">
                <span className="font-tactical text-[9px] tracking-[0.16em] text-emerald-400 inline-flex items-center gap-1.5">
                  {savedAt && <><CheckCircle2 size={11} /> LOGGED {clockOf(savedAt)}</>}
                </span>
                <TacButton type="submit" disabled={!score || busy}>
                  <Save size={12} /> {busy ? 'SAVING…' : day.review ? 'UPDATE LOG' : 'LOG REVIEW'}
                </TacButton>
              </div>
            </form>
          </Panel>
        </>
      )}
    </div>
  );
}
