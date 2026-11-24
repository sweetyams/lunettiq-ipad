/**
 * Store traffic counter (gap checklist, Walk-in and intake).
 *
 * Two numbers, kept apart on purpose:
 * - Came in: one tap per person who walks through the door (helped or not).
 * - Helped: visits staff opened today (from the visit spine), counted separately.
 * Which one the store reports on is an open decision; counting both keeps the
 * option open. Counts live on this iPad per store and day until Foundry has a
 * traffic endpoint (docs/v2/05-foundry-api-requests.md §Store traffic).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'walk-in-counter' });
const mmkv = {
  getItem: (n: string) => storage.getString(n) ?? null,
  setItem: (n: string, v: string) => storage.set(n, v),
  removeItem: (n: string) => storage.delete(n),
};

/** "2026-11-24|loc_123" — local calendar day. */
export function dayKey(locationId: string | null, now: Date = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${d}|${locationId ?? 'store'}`;
}

export interface CounterDay {
  cameIn: number;
  helped: number;
  /** Tap times (ms) for the hour-by-hour view later; capped. */
  taps: number[];
}

interface CounterState {
  days: Record<string, CounterDay>;
  tapIn: (key: string, at?: number) => void;
  undo: (key: string) => void;
  markHelped: (key: string) => void;
}

const empty = (): CounterDay => ({ cameIn: 0, helped: 0, taps: [] });

/** Keep two weeks of days; older ones are dropped on write. */
export function prune(days: Record<string, CounterDay>, now: Date = new Date()): Record<string, CounterDay> {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).getTime();
  const out: Record<string, CounterDay> = {};
  for (const [k, v] of Object.entries(days)) {
    const t = Date.parse(k.split('|')[0] ?? '');
    if (Number.isFinite(t) && t >= cutoff) out[k] = v;
  }
  return out;
}

export function tapReducer(day: CounterDay | undefined, at: number): CounterDay {
  const d = day ?? empty();
  return { ...d, cameIn: d.cameIn + 1, taps: [...d.taps, at].slice(-500) };
}

export function undoReducer(day: CounterDay | undefined): CounterDay {
  const d = day ?? empty();
  return { ...d, cameIn: Math.max(0, d.cameIn - 1), taps: d.taps.slice(0, -1) };
}

export const useWalkInCounter = create<CounterState>()(
  persist(
    (set) => ({
      days: {},
      tapIn: (key, at = Date.now()) => set((s) => ({ days: prune({ ...s.days, [key]: tapReducer(s.days[key], at) }) })),
      undo: (key) => set((s) => ({ days: { ...s.days, [key]: undoReducer(s.days[key]) } })),
      markHelped: (key) => set((s) => {
        const d = s.days[key] ?? empty();
        return { days: prune({ ...s.days, [key]: { ...d, helped: d.helped + 1 } }) };
      }),
    }),
    { name: 'walk-in-counter', storage: createJSONStorage(() => mmkv) },
  ),
);
