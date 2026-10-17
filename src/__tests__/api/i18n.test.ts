import { describe, it, expect, vi } from 'vitest';

vi.mock('react-native-mmkv', () => ({ MMKV: class { getString() { return undefined; } set() {} delete() {} } }));

import { en } from '@/src/i18n/en';
import { fr } from '@/src/i18n/fr';
import { t } from '@/src/i18n';

function keys(o: object, p = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [`${p}${k}`] : keys(v, `${p}${k}.`)));
}

describe('i18n', () => {
  it('French defines every English key, none empty', () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
    for (const k of keys(fr)) expect(t('fr', k as never)).not.toBe('');
  });
  it('interpolates and falls back', () => {
    expect(t('fr', 'handed.titleNamed', { name: 'Camille' })).toBe('Camille, lesquelles aimez-vous?');
    expect(t('en', 'handed.lovedSoFar', { count: 2 })).toBe('2 loved so far.');
    expect(t('en', 'nope.key' as never)).toBe('nope.key');
  });
});
