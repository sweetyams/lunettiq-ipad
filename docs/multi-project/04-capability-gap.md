# Contract gap — `my-projects` has no capability/module info

**Raised by:** iPad team, after a live test
**Status:** worked around client-side; a contract addition would let the iPad handle it properly
**Relates to:** `00-shared-plan.md` §4, `03-foundry-handoff.md` §1

---

## What we hit

Signing in as `willem@sweetyams.com` (a user whose only membership is the `sweetyams`
project) surfaced three failures in a row:

1. **PIN unlock → "module not enabled."** `sweetyams` has no `device-management` module, so
   `/api/admin/device/authenticate` rejects every PIN. The lock screen was unusable.
2. **No way out.** Sign out / Change store lived only in More, which sits behind the lock —
   the user was trapped.
3. **"Device owner" bypass → empty app.** The Face ID escape dismissed the lock but set no
   operator and had no synced data (sweetyams has none of the modules the iPad syncs), so the
   app opened to an empty shell.

Root cause: **`my-projects` returns every project the user is a member of, with no signal of
which projects are actually set up for the iPad app.** So the app auto-selected an
iPad-incapable tenant and dropped the user into a broken state.

## Client-side workaround (shipped)

- **Lock-screen escape hatch** — Sign out + Change store now render on the PIN screen, so a
  user can never be trapped.
- **Capability probe** — on activating a tenant, the app calls
  `GET /api/admin/device/staff-roster` once. `NOT_FOUND` / `404` / "not enabled" →
  device-management is treated as disabled for that tenant → the PIN lock is skipped
  (solo mode) instead of showing a dead screen.
- **Uncapable-tenant notice** — when device-management is known-disabled, a banner explains
  the store isn't set up for the iPad and offers Change store / Sign out.

This is a heuristic: it uses *device-management* as a proxy for "iPad-capable." It costs an
extra round-trip per tenant and can't distinguish a store that has storefront data but no
device-management from one that has nothing.

## What would fix it properly (Foundry ask)

Add capability/module info to the `my-projects` response so the iPad can filter or flag
*before* selecting a tenant. Minimal shape:

```jsonc
{
  "slug": "lunettiq",
  // ...existing fields...
  "capabilities": {
    "deviceManagement": true,   // PIN quick-switch / staff-roster
    "storefront": true,         // product catalogue sync
    "scheduling": true          // appointments sync
  }
}
```

or, simplest, a single boolean the platform already knows:

```jsonc
{ "slug": "lunettiq", "ipadEnabled": true }
```

With that, the iPad would:
- **filter** `my-projects` to iPad-capable tenants before auto-selecting;
- show a store in the picker as **unavailable** rather than letting the user pick into a
  broken shell;
- skip the capability probe round-trip entirely.

## Decision needed

- Does the platform have a per-project notion of "iPad-enabled" (or a module list) it can
  expose on `my-projects`?
- If yes, prefer the explicit `capabilities`/`ipadEnabled` field; the iPad will switch from
  the probe heuristic to the authoritative flag.
- If no, the client-side workaround stands, but flagging remains best-effort.
