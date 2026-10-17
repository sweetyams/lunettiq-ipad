import { describe, it, expect } from 'vitest';
import { formatPhone, staffFirstName } from '@/src/ui/kit/format';

describe('kit formatters', () => {
  it('turns staff names and emails into first names', () => {
    expect(staffFirstName('Benjamin Amram')).toBe('Benjamin');
    expect(staffFirstName('willem@sweetyams.com')).toBe('Willem');
    expect(staffFirstName('marie.lefebvre@lunettiq.com')).toBe('Marie');
    expect(staffFirstName('')).toBe('Staff');
  });
  it('formats North American phones', () => {
    expect(formatPhone('+15145550101')).toBe('514-555-0101');
    expect(formatPhone('(514) 555 0101')).toBe('514-555-0101');
    expect(formatPhone('+33 1 23 45 67 89')).toBe('+33 1 23 45 67 89');
  });
});
