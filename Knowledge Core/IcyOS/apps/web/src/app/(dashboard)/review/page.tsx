'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Save } from 'lucide-react';
import { useCountUp } from '../../../components/dashboard/hud';
import { Words } from '../../../components/daylight/command-hero';
import { tiltHandlers } from '../../../components/daylight/daylight-fx';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { formatMinutes } from '../../../lib/inbox/review';
import { apiFetch } from '../../../lib/api/client';
import { addDays, clockOf, dayWindow, localDate } from '../../../lib/day/local';
import type { ReviewDay } from '../../../lib/day/types';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const QUESTIONS = [
  { key: 'wentWell', label: 'What went well', hint: 'Wins, momentum, anything to repeat.' },
  { key: 'gotInWay', label: 'What got in the way', hint: 'Blockers, drift, interruptions.' },
  { key: 'nextTime', label: 'Next time', hint: 'One thing to do differently.' },
] as const;

type Answers = Record<(typeof QUESTIONS)[number]['key'], string>;
const EMPTY: Answers = { wentWell: '', gotInWay: '', nextTime: '' };
const scoreWord = (n: number) => (n <= 3 ? 'Rough' : n <= 6 ? 'Steady' : n <= 8 ? 'Good' : 'Flow');

/** One readout figure. A number counts up when it arrives; text shows as it is. */
function Stat({ label, count, text, lit }: { label: string; count?: number; text?: string; lit: boolean }) {
  const counted = useCountUp(count ?? 0);
  return (
    <div className={s.rvStat} data-lit={lit || undefined}>
      <span className={s.rvStatV}>{count != null ? counted : text}</span>
      <span className={s.rvStatL}>{label}</span>
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
    } else setError(res.error?.message ?? 'Could not save your review');
  }

  const stats = day?.stats;
  const label =
    date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const headline = date === today ? 'How did today go?' : 'Looking back.';

  return (
    <DaylightFrame>
      <section className={s.hero} aria-label="Review">
        <span className={s.floor} aria-hidden />
        <div className={s.rvDate}>
          <button type="button" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))} className={s.rvArrow} data-snd="low">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <span className={s.rvDay} aria-live="polite">
            <span className={s.liveDot} aria-hidden />
            {label}
            {day?.review ? ' · logged' : ''}
          </span>
          <button type="button" aria-label="Next day" onClick={() => setDate(addDays(date, 1))} disabled={date >= today} className={s.rvArrow} data-snd="high">
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <h1 className={s.h1}>
          <Words text="Review" delay={0.05} />
          <span className={s.h1em}>
            <Words key={headline} text={headline} delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>What got done, and a minute to reflect on it.</p>
      </section>

      <div className={s.page}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad} ${s.rise}`}>
            {error}
          </p>
        )}

        {!day && !error && <p className={s.nothing}>Opening your day…</p>}

        {day && stats && (
          <>
            <section className={`${s.card} ${s.cmd} ${s.rvDeck} ${s.rise}`} aria-label="The day in numbers">
              <div className={s.rvStats}>
                <Stat label="Steps done" count={stats.stepsDone.length} lit={stats.stepsDone.length > 0} />
                <Stat label="Focus time" text={stats.focusMinutes ? formatMinutes(stats.focusMinutes) : '0 min'} lit={stats.focusMinutes > 0} />
                <Stat label="Sessions" count={stats.focusSessions} lit={stats.focusSessions > 0} />
                <Stat
                  label="Plan worked"
                  text={stats.plannedMissions ? `${stats.plannedMissionsWorked}/${stats.plannedMissions}` : '—'}
                  lit={stats.plannedMissions > 0 && stats.plannedMissionsWorked >= stats.plannedMissions}
                />
              </div>
              <div className={s.rvInsight}>
                <Lightbulb size={18} aria-hidden />
                <div>
                  <p>{day.insights.message}</p>
                  <span>
                    Last 7 days · {formatMinutes(day.insights.focusMinutesLast7Days)} focus over {plural(day.insights.sessionsLast7Days, 'session')}
                    {day.insights.ratio != null && <> · actual ÷ planned ×{day.insights.ratio.toFixed(2)}</>}
                  </span>
                </div>
              </div>
            </section>

            {stats.stepsDone.length > 0 && (
              <section className={`${s.card} ${s.panel} ${s.rise}`} style={{ animationDelay: '0.12s' }} aria-label="Completed">
                <div className={s.sec} style={{ marginTop: 0 }}>
                  <span className={s.lab}>Completed</span>
                  <span className={s.meta}>{plural(stats.stepsDone.length, 'step')}</span>
                </div>
                <ul aria-label="Steps done" className={s.rvDone}>
                  {stats.stepsDone.map((x, i) => (
                    <li key={i}>
                      <span className={s.rvClock}>{clockOf(x.completedAt)}</span>
                      <CheckCircle2 size={15} className={s.rvCheck} aria-hidden />
                      <span className={s.rvCmd}>{x.command}</span>
                      {x.missionName && <span className={s.rvMission}>{x.missionName}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <form onSubmit={save} className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.rise}`} style={{ animationDelay: '0.24s' }} {...tiltHandlers}>
              <div className={s.sec} style={{ marginTop: 0 }}>
                <span className={s.lab}>{day.review ? 'Your review · logged' : 'Log the day'}</span>
                {savedAt && (
                  <span className={s.meta} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} aria-hidden /> Saved at {clockOf(savedAt)}
                  </span>
                )}
              </div>

              <fieldset className={s.rvScore}>
                <legend className={s.meta}>Day score, 1 to 10</legend>
                <div className={s.rvScoreRow}>
                  <div className={s.rvBar}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={score === n}
                        aria-label={`Score ${n}`}
                        onClick={() => setScore(n)}
                        className={s.rvSeg}
                        data-lit={(score != null && n <= score) || undefined}
                        data-on={score === n || undefined}
                        style={{ ['--i' as string]: n }}
                        data-snd={n > 5 ? 'high' : 'low'}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className={s.rvBig} aria-live="polite">
                    {score ? (
                      <>
                        {score}
                        <small>{scoreWord(score)}</small>
                      </>
                    ) : (
                      <small>Pick one</small>
                    )}
                  </span>
                </div>
                <div className={s.rvEnds} aria-hidden>
                  <span>Rough</span>
                  <span>Flow</span>
                </div>
              </fieldset>

              {QUESTIONS.map((q) => (
                <label key={q.key} className={s.rvQ}>
                  <span>
                    <b>{q.label}</b> {q.hint}
                  </span>
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={answers[q.key]}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                    className={s.area}
                    style={{ minHeight: 76, resize: 'vertical', lineHeight: 1.55 }}
                  />
                </label>
              ))}

              <div className={s.form} style={{ marginTop: 6 }}>
                <span className={s.meta}>{score ? 'Saved to this day; you can update it any time.' : 'Pick a score to save.'}</span>
                <button type="submit" className={`${s.btn} ${s.btnOx} ${s.tlSubmit}`} disabled={!score || busy} data-snd="drum">
                  <Save size={15} aria-hidden /> {busy ? 'Saving…' : day.review ? 'Update review' : 'Log review'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </DaylightFrame>
  );
}
