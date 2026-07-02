export function formatTimeRange(start: string, end: string): string {
  try {
    const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    return `${s} - ${e}`;
  } catch {
    return `${start} - ${end}`;
  }
}
