import { useEffect, useState } from 'react';

/** After this long a visit is one somebody forgot to end, not one in progress. */
export const STALE_VISIT_MS = 12 * 60 * 60 * 1000;

/**
 * The visit clock: "4:05" or "1:02:09"; a visit open longer than 12 hours reads
 * "open since Tue, 4:12 p.m." instead of counting hundreds of hours. Pure, tested.
 */
export function formatVisitElapsed(startedAt: number | null, now: number): string {
  if (!startedAt) return '0:00';
  const ms = Math.max(0, now - startedAt);
  if (ms >= STALE_VISIT_MS) {
    const d = new Date(startedAt);
    const day = d.toLocaleDateString('en-CA', { weekday: 'short' });
    const time = d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
    return `open since ${day}, ${time}`;
  }
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function isStaleVisit(startedAt: number | null, now = Date.now()): boolean {
  return !!startedAt && now - startedAt >= STALE_VISIT_MS;
}

/** The visit clock, ticking each second. */
export function useVisitElapsed(startedAt: number | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  return formatVisitElapsed(startedAt, now);
}
