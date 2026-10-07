// Browser-side date helpers for Timeline, Focus and Review. The browser knows
// the user's time zone, so it turns local dates and clock times into instants
// before calling the API. Pure, so they're tested directly.

const pad = (n: number) => String(n).padStart(2, '0');

/** The local calendar date of a moment, as YYYY-MM-DD. */
export function localDate(at: Date = new Date()): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** The local moment for a date and an HH:MM clock time. */
export function localMoment(date: string, clock: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = clock.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** The whole local day as two ISO instants (midnight to midnight). */
export function dayWindow(date: string): { start: string; end: string } {
  const start = localMoment(date, '00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * The working window for a day from two clock times. On today, a start
 * already past moves up to now (rounded up to 5 minutes). Null when nothing
 * is left of the window.
 */
export function workWindow(date: string, from: string, to: string, now: Date = new Date()): { start: string; end: string } | null {
  let start = localMoment(date, from).getTime();
  const end = localMoment(date, to).getTime();
  const roundedNow = Math.ceil(now.getTime() / 300_000) * 300_000;
  if (start < roundedNow && localDate(now) === date) start = roundedNow;
  if (end - start < 10 * 60_000) return null;
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

/** "09:05" style local time of an ISO instant. */
export function clockOf(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 75 → "1:15", 3725 → "1:02:05". */
export function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** The date a number of days from another, as YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = localMoment(date, '12:00');
  d.setDate(d.getDate() + days);
  return localDate(d);
}
