import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { en, type Dictionary } from './en';
import { fr } from './fr';

/**
 * Minimal i18n (no dependency): typed EN/FR dictionaries, `t(lang, key, vars)`,
 * and two languages: the staff UI language (persisted per device) and the
 * client language for client-facing screens (per visit).
 */
export type Lang = 'en' | 'fr';
export const DICTS: Record<Lang, Dictionary> = { en, fr };

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Leaves<Dictionary>;

/** Device language from Intl (no native module needed). */
export function deviceLang(): Lang {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    return loc.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

export function t(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  const pick = (d: Dictionary) => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], d) as string | undefined;
  const raw = pick(DICTS[lang]) ?? pick(en) ?? key;
  return vars ? raw.replace(/\{(\w+)\}/g, (_, v) => String(vars[v] ?? `{${v}}`)) : raw;
}

const storage = new MMKV({ id: 'i18n' });
const mmkv = {
  getItem: (n: string) => storage.getString(n) ?? null,
  setItem: (n: string, v: string) => storage.set(n, v),
  removeItem: (n: string) => storage.delete(n),
};

interface LangState {
  /** Staff UI language (device setting). */
  uiLang: Lang;
  /** Language for client-facing screens in the current visit. */
  clientLang: Lang;
  setUiLang: (l: Lang) => void;
  setClientLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      uiLang: deviceLang(),
      clientLang: deviceLang(),
      setUiLang: (uiLang) => set({ uiLang }),
      setClientLang: (clientLang) => set({ clientLang }),
    }),
    { name: 'i18n', storage: createJSONStorage(() => mmkv) },
  ),
);

/** `const tr = useT(); tr('tabs.home')`, in the staff UI language (or `'client'`). */
export function useT(audience: 'staff' | 'client' = 'staff') {
  const lang = useLangStore((s) => (audience === 'client' ? s.clientLang : s.uiLang));
  return (key: TKey, vars?: Record<string, string | number>) => t(lang, key, vars);
}
