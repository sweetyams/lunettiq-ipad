import { APIError } from '@/src/api/client';

/** Plain-language title + next step for an error, by what actually went wrong. */
export function describeError(error: unknown): { title: string; message: string } {
  const status = error instanceof APIError ? error.status : undefined;
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (/network|fetch failed|offline|timed? ?out|internet/i.test(raw) && !status) {
    return { title: 'You’re offline', message: 'Check the Wi-Fi. What’s on this iPad still works; changes sync when you’re back.' };
  }
  if (status === 401) return { title: 'Signed out', message: 'Your session ended. Unlock or sign in again.' };
  if (status === 403) return { title: 'No access', message: 'Your role can’t see this. Ask a manager if you need it.' };
  if (status === 404) return { title: 'Not found', message: 'It may have been removed or moved to another store.' };
  if (status === 409) return { title: 'Changed elsewhere', message: 'Someone else updated this. Refresh and try again.' };
  if (status && status >= 500) return { title: 'Foundry had a problem', message: 'It’s not you. Try again in a moment.' };
  return { title: 'Couldn’t load this', message: 'Try again. If it keeps happening, tell a manager.' };
}
