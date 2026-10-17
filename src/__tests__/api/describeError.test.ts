import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/api/client', () => {
  class APIError extends Error {
    constructor(public code: string, message: string, public details?: unknown, public status?: number) { super(message); }
  }
  return { APIError };
});

import { APIError } from '@/src/api/client';
import { describeError } from '@/src/ui/kit/states';

describe('describeError', () => {
  it('picks a plain-language message by status', () => {
    expect(describeError(new APIError('X', 'nope', undefined, 403)).title).toBe('No access');
    expect(describeError(new APIError('X', 'HTTP 502', undefined, 502)).title).toBe('Foundry had a problem');
    expect(describeError(new TypeError('Network request failed')).title).toBe('You’re offline');
    expect(describeError('weird').title).toBe('Couldn’t load this');
  });
});
