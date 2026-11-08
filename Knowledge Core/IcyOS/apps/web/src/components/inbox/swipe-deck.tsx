'use client';

import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import type { Draft, ProjectOption } from './proposal-card';
import { tiltHandlers } from '../daylight/daylight-fx';
import s from '../daylight/daylight.module.css';
import { formatMinutes, minutesOf, stepsOf } from '../../lib/inbox/review';

// Swipe to decide, from the JARVIS Glass concept: the top mission is a card you drag
// right to keep or left to skip; ← and → and the two buttons do the same. Deck cards are
// for deciding, so the whole card can be grabbed; editing happens in the list afterwards.
const THRESHOLD = 110;
const FIELD = 'input,textarea,select,button,a';

/** The decision card: what the mission is, at a glance. */
function DecisionCard({ draft, index, projects }: { draft: Draft; index: number; projects: ProjectOption[] }) {
  const steps = stepsOf(draft.stepsText);
  const minutes = minutesOf(draft.estimate);
  const project = projects.find((p) => p.id === draft.projectId)?.name;
  return (
    <div className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.deckDark}`} style={{ padding: '26px 28px', cursor: 'grab', userSelect: 'none' }} {...tiltHandlers}>
      <span className={s.meta}>D-{String(index + 1).padStart(2, '0')}</span>
      <h3 className={s.h3} style={{ margin: '6px 0 12px', lineHeight: 1.1 }}>
        {draft.name || 'Untitled mission'}
      </h3>
      {steps.length > 0 ? (
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, color: 'var(--ink-2)' }}>
          {steps.slice(0, 5).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
          {steps.length > 5 && <li style={{ listStyle: 'none', color: 'var(--muted)' }}>+ {steps.length - 5} more</li>}
        </ol>
      ) : (
        <p className={s.nothing}>No steps yet.</p>
      )}
      <div className={s.btnRow} style={{ marginTop: 16 }}>
        <span className={`${s.pill} ${s.pillPlain}`} style={project ? undefined : { background: 'var(--brass-soft)', color: 'var(--gold-deep)' }}>
          {project ?? 'No project yet'}
        </span>
        {minutes && !Number.isNaN(minutes) ? <span className={`${s.pill} ${s.pillPlain}`}>{formatMinutes(minutes)}</span> : null}
      </div>
    </div>
  );
}

export function SwipeDeck({
  queue,
  decided,
  total,
  projects,
  onDecide,
}: {
  /** Missions not decided yet, in order. The first is on top. */
  queue: Draft[];
  decided: number;
  total: number;
  projects: ProjectOption[];
  onDecide: (key: string, keep: boolean) => void;
}) {
  const top = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const current = queue[0];

  function fly(keep: boolean) {
    const el = top.current;
    if (!el || !current || leaving.current) return;
    leaving.current = true;
    el.classList.remove(s.deckDrag);
    el.style.transform = `translateX(${keep ? 130 : -130}%) rotate(${keep ? 14 : -14}deg)`;
    el.style.opacity = '0';
    window.setTimeout(() => {
      leaving.current = false;
      onDecide(current.key, keep);
    }, 280);
  }

  // Drag with spring return, as in the concept: stamps fade in with the distance.
  useEffect(() => {
    const el = top.current;
    if (!el) return;
    const stamps = (dx: number) => {
      el.querySelector<HTMLElement>(`.${s.stampKeep}`)!.style.opacity = String(Math.max(0, Math.min(1, dx / THRESHOLD)));
      el.querySelector<HTMLElement>(`.${s.stampSkip}`)!.style.opacity = String(Math.max(0, Math.min(1, -dx / THRESHOLD)));
    };
    let startX = 0;
    let dx = 0;
    let down = false;
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest(FIELD)) return;
      down = true;
      startX = e.clientX;
      dx = 0;
      el.classList.add(s.deckDrag);
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      dx = e.clientX - startX;
      el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
      stamps(dx);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (Math.abs(dx) > THRESHOLD) fly(dx > 0);
      else {
        el.classList.remove(s.deckDrag);
        el.style.transform = '';
        stamps(0);
      }
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
    // Re-bound for each new top card.
  }, [current?.key]);

  // ← skips and → keeps, unless the cursor is in a field.
  const flyRef = useRef(fly);
  flyRef.current = fly;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') flyRef.current(true);
      if (e.key === 'ArrowLeft') flyRef.current(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!current) return null;

  return (
    <section aria-label="Decide each mission">
      <div className={s.deck}>
        {queue
          .slice(0, 3)
          .reverse()
          .map((d, i, shown) => {
            const depth = shown.length - 1 - i;
            return (
              <div key={d.key} ref={depth === 0 ? top : undefined} className={s.deckCard} data-depth={depth} aria-hidden={depth > 0 || undefined}>
                {depth === 0 && (
                  <>
                    <span className={`${s.stamp} ${s.stampKeep}`}>KEEP</span>
                    <span className={`${s.stamp} ${s.stampSkip}`}>SKIP</span>
                  </>
                )}
                <DecisionCard draft={d} index={decided + depth} projects={projects} />
              </div>
            );
          })}
      </div>
      <div className={s.deckBar}>
        <button type="button" className={s.btn} onClick={() => fly(false)} data-snd="low">
          <X size={16} aria-hidden /> Skip
        </button>
        <span className={s.meta}>
          {decided + 1} of {total}
        </span>
        <button type="button" className={`${s.btn} ${s.btnOx}`} onClick={() => fly(true)} data-snd="high">
          <Check size={16} aria-hidden /> Keep
        </button>
      </div>
      <p className={s.deckHint}>Drag the card right to keep it, left to skip it · or use ← →. You can edit the kept ones next.</p>
    </section>
  );
}
