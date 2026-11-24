/** Foundry's 403 when the iPad's signed-in account isn't on the active store. Pure, tested. */
export function isNotMemberError(e: { status?: number; code?: string; message?: string }): boolean {
  const msg = (e.message ?? '').toLowerCase();
  return msg.includes('not a member') || (e.status === 403 && e.code === 'FORBIDDEN' && !msg.includes('permission'));
}
