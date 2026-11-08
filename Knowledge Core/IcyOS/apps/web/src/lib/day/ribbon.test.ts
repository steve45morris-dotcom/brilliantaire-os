import { describe, expect, it } from 'vitest';
import { ribbonOf, summarise } from './ribbon';
import type { PlanBlock } from './types';

const T0 = Date.parse('2026-11-08T09:00:00Z');
const at = (min: number) => new Date(T0 + min * 60_000).toISOString();
const block = (kind: PlanBlock['kind'], from: number, to: number): PlanBlock => ({
  kind,
  missionId: kind === 'mission' ? `m${from}` : null,
  title: kind,
  start: at(from),
  end: at(to),
});
const PLAN = [block('mission', 0, 60), block('buffer', 60, 75), block('break', 75, 90), block('mission', 90, 120)];

describe('ribbonOf', () => {
  it('lays blocks out proportionally and covers the whole span', () => {
    const r = ribbonOf(PLAN);
    expect(r.map((s) => [s.left, s.width])).toEqual([
      [0, 50],
      [50, 12.5],
      [62.5, 12.5],
      [75, 25],
    ]);
    expect(r.reduce((n, s) => n + s.width, 0)).toBe(100);
  });
  it('is empty for no blocks or a zero span', () => {
    expect(ribbonOf([])).toEqual([]);
    expect(ribbonOf([block('mission', 0, 0)])).toEqual([]);
  });
});

describe('summarise', () => {
  it('counts missions and focus time, not buffers or breaks', () => {
    const s = summarise(PLAN, T0 - 1);
    expect(s).toMatchObject({ missions: 2, focusMinutes: 90, spanMinutes: 120, nowAt: null, current: -1 });
  });
  it('places now inside the span and names the running block', () => {
    expect(summarise(PLAN, T0 + 30 * 60_000)).toMatchObject({ nowAt: 25, current: 0 });
    expect(summarise(PLAN, T0 + 80 * 60_000)).toMatchObject({ current: 2 });
  });
  it('treats a block end as exclusive, and the plan end as outside it', () => {
    expect(summarise(PLAN, T0 + 60 * 60_000).current).toBe(1);
    expect(summarise(PLAN, T0 + 120 * 60_000)).toMatchObject({ nowAt: null, current: -1 });
  });
});
