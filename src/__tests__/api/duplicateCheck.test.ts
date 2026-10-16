import { describe, it, expect } from 'vitest';
import { duplicateSearchTerms, findLikelyDuplicates } from '@/src/api/duplicateCheck';
import type { Client } from '@/src/api/clients.types';

const c = (id: string, firstName: string | null, lastName: string | null, email: string | null = null, phone: string | null = null) =>
  ({ id, firstName, lastName, email, phone } as Client);

describe('duplicate check', () => {
  it('searches by email, then last name (first name only without a last name)', () => {
    expect(duplicateSearchTerms({ firstName: 'Camille', lastName: 'Tremblay', email: 'c@x.ca' })).toEqual(['c@x.ca', 'Tremblay']);
    expect(duplicateSearchTerms({ firstName: 'Camille' })).toEqual(['Camille']);
    expect(duplicateSearchTerms({ firstName: 'C' })).toEqual([]);
  });

  it('matches email, phone, and accent-insensitive names; strongest first', () => {
    const list = [
      c('a', 'Camille', 'Tremblay'),
      c('b', 'Léa', 'Bouchard', 'lea@x.ca'),
      c('d', 'Noah', 'Fortin', null, '+1 (514) 555-0104'),
      c('e', 'Camille', 'Roy'),
    ];
    expect(findLikelyDuplicates({ firstName: 'camile', lastName: 'tremblay' }, list).map((d) => d.id)).toEqual([]);
    expect(findLikelyDuplicates({ firstName: 'Cam', lastName: 'Tremblay' }, list).map((d) => [d.id, d.reason])).toEqual([['a', 'name']]);
    expect(findLikelyDuplicates({ firstName: 'Lea', lastName: 'Bouchard' }, list)[0]).toMatchObject({ id: 'b', reason: 'name' });
    expect(findLikelyDuplicates({ email: 'LEA@x.ca', phone: '514-555-0104' }, list).map((d) => [d.id, d.reason])).toEqual([['b', 'email'], ['d', 'phone']]);
  });
});
