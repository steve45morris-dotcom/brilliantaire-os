// Pure helpers for the Inbox page: what a brain dump looks like before sorting,
// and what the kept missions add up to while reviewing. No React, no fetches.

/** Steps as typed, one per non-blank line. */
export const stepsOf = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);

/** A whole number of minutes from 1 to 1440, null when blank, NaN when invalid. */
export function minutesOf(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= 1440 ? n : NaN;
}

/** Lines with something on them besides list markers: a rough count of items before sorting. */
export function itemCount(text: string): number {
  return text.split('\n').filter((line) => line.replace(/^[\s\-*•·\d.)]+/, '').trim()).length;
}

/** Total valid minutes across estimates; blank and invalid ones count as zero. */
export function plannedMinutes(estimates: readonly string[]): number {
  return estimates.reduce((sum, e) => {
    const m = minutesOf(e);
    return m && !Number.isNaN(m) ? sum + m : sum;
  }, 0);
}

/** "45 min", "1 h", "2 h 30 min". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Puts every kept mission that has no project into `projectId`; others are left alone. */
export function assignUnassigned<T extends { include: boolean; projectId: string }>(drafts: readonly T[], projectId: string): T[] {
  return drafts.map((d) => (d.include && !d.projectId ? { ...d, projectId } : d));
}
