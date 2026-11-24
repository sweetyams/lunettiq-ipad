import { describe, it, expect } from 'vitest';
import { isNotMemberError } from '@/src/features/auth/authErrors';

describe('isNotMemberError', () => {
  it('spots Foundry’s membership 403', () => {
    expect(isNotMemberError({ status: 403, code: 'FORBIDDEN', message: 'Not a member of this project' })).toBe(true);
  });
  it('leaves wrong PIN, lockout and permission errors alone', () => {
    expect(isNotMemberError({ status: 401, code: 'INVALID_PIN', message: 'Invalid PIN' })).toBe(false);
    expect(isNotMemberError({ status: 423, code: 'LOCKED', message: 'Locked' })).toBe(false);
    expect(isNotMemberError({ status: 403, code: 'FORBIDDEN', message: 'Missing permission org:staff:read' })).toBe(false);
  });
});
