# Staff Quick-Switch — iPad Implementation Spec (Aligned with Foundry)

**Updated:** 2026-07-23  
**Foundry handoff:** `foundry/docs/specs/staff-quick-switch-ipad-handoff.md`  
**Status:** Server ready. iPad implementation pending.

---

## Summary of Changes from Original Spec

After reviewing Foundry's implementation, these deltas were resolved:

1. `verify-pin` requires `staffId` in request (select avatar first, then PIN)
2. `verify-pin` response is leaner (no locationIds, permissions, imageUrl)
3. `set-pin` is simpler (no `currentPin` — server handles auth)
4. `staff-roster` requires `?locationId=` param
5. Error responses are richer (remainingAttempts, lockedUntil timestamp)
6. Field naming: `hasPinSet` (not `hasPin`)

---

## API Contract (as built by Foundry)

### GET `/api/admin/device/staff-roster?locationId={id}`

**Purpose:** Lock screen avatar grid. Called on lock screen mount + cached.

**Response:**
```typescript
interface StaffRosterEntry {
  staffId: string;
  clerkUserId: string;
  name: string;
  role: string;
  imageUrl: string | null;
  hasPinSet: boolean;
}

// GET /api/admin/device/staff-roster?locationId=loc_downtown
// Response: { data: StaffRosterEntry[], error: null }
```

**iPad caching:** Cache in MMKV for 1 hour. Refresh on every lock screen mount if online.

---

### POST `/api/admin/device/verify-pin`

**Purpose:** Validate PIN after avatar tap.

**Request:**
```typescript
{ staffId: string; pin: string }
```

**Response (200 success):**
```typescript
{
  data: {
    staffId: string;
    clerkUserId: string;
    name: string;
    email: string;
    role: string;
  };
  error: null;
}
```

**Response (401 failure):**
```typescript
{
  data: null;
  error: {
    code: 'INVALID_PIN';
    message: string;
    details: { remainingAttempts: number };
  };
}
```

**Response (423 locked):**
```typescript
{
  data: null;
  error: {
    code: 'LOCKED';
    message: string;
    details: { lockedUntil: string }; // ISO 8601
  };
}
```

---

### POST `/api/admin/device/set-pin`

**Purpose:** Staff sets their PIN (first time or change).

**Request:**
```typescript
{ staffId: string; pin: string }
```

**Response (200):**
```typescript
{ data: { success: true }; error: null }
```

**Permission:** Staff can set their own. Managers can set any staff at their location.

---

### Header: `X-Found-Operator`

Sent on **every** authenticated request when the active operator differs from the device owner:

```
Authorization: Bearer <device_clerk_jwt>
X-Found-Surface: tablet
X-Found-Operator: <operator.clerkUserId>
```

**Never sent** when operator IS the device owner (or no operator is set).

---

## iPad Implementation Plan

### Store: `useOperatorStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

interface Operator {
  staffId: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string | null; // populated from roster cache
}

interface OperatorState {
  /** The Clerk userId of the device session owner (the person who signed in with OAuth) */
  deviceOwnerId: string | null;
  /** The currently active operator (null = device owner is operating) */
  activeOperator: Operator | null;
  /** Timestamp of last PIN/FaceID auth */
  authenticatedAt: number | null;
  /** Roster cache for lock screen */
  roster: Operator[];
  rosterFetchedAt: number | null;
}

interface OperatorActions {
  setDeviceOwner: (clerkUserId: string) => void;
  switchOperator: (operator: Operator) => void;
  clearOperator: () => void; // → lock screen
  setRoster: (roster: Operator[]) => void;
}

// Derived:
// isSwitched = activeOperator !== null && activeOperator.clerkUserId !== deviceOwnerId
```

### API Client Change

```typescript
// In FoundryAPI.request():
async request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await this.getToken?.();
  
  const headers: HeadersInit = {
    'X-Found-Surface': SURFACE,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Operator header — only when a different staff member is active
  const { activeOperator, deviceOwnerId } = useOperatorStore.getState();
  if (activeOperator && activeOperator.clerkUserId !== deviceOwnerId) {
    headers['X-Found-Operator'] = activeOperator.clerkUserId;
  }

  // ... rest of request logic
}
```

### Error Handling — Operator Revocation

```typescript
// In FoundryAPI.request(), after getting response:
if (json.error?.code === 'FORBIDDEN') {
  const msg = json.error.message;
  if (
    msg.includes('not a member') ||
    msg.includes('not active') ||
    msg.includes('Operator')
  ) {
    // Operator was revoked/suspended between requests
    useOperatorStore.getState().clearOperator();
    toast.error('Access revoked', `${activeOperator?.name}'s access has been revoked.`);
    // Navigation: show lock screen (handled by the operator store listener)
    throw new OperatorRevokedError();
  }
}
```

### Lock Screen Flow

```
Lock Screen mount
  │
  ├─ Fetch roster: GET /api/admin/device/staff-roster?locationId={locationId}
  │  (or use cached if < 1 hour old and offline)
  │
  ├─ Show avatar grid
  │
  ├─ User taps avatar
  │  ├─ If avatar.clerkUserId === deviceOwnerId → Face ID prompt
  │  │   └─ Success → switchOperator(deviceOwner) → dismiss lock
  │  │   └─ Failure → stay on lock screen
  │  │
  │  └─ If different staff → show PinPad for that person
  │      └─ PIN entered → POST /api/admin/device/verify-pin
  │          ├─ 200 → switchOperator(response.data + avatar.imageUrl) → dismiss
  │          ├─ 401 → shake animation, show "X attempts remaining"
  │          └─ 423 → show countdown timer, disable PinPad
  │
  └─ "Or use Face ID" link → always unlocks as device owner
```

### Session Suspend/Resume on Switch

When operator switches:
1. Current session store state is saved to MMKV keyed by `operator.clerkUserId`
2. New operator's saved state is loaded (or INITIAL_STATE if none)
3. Privacy mode resets to STAFF
4. If previous operator had an active session, it's frozen (not ended)

```typescript
// On switch:
const prevState = useSessionStore.getState();
savePerOperatorState(prevOperator.clerkUserId, prevState);
const nextState = loadPerOperatorState(nextOperator.clerkUserId);
useSessionStore.setState(nextState ?? INITIAL_STATE);
usePrivacyStore.getState().resetToStaff();
```

On return (same operator enters PIN again):
- Restored state shows "Resume session with {client}?" banner
- SA taps resume → back where they left off
- SA taps "End" → runs end session flow

### PIN Setup (Settings Screen Addition)

New section in Settings (below sync):

```
┌─────────────────────────────────────────┐
│ Quick Switch PIN                        │
│                                         │
│ Your PIN: ● ● ● ●  [Change]            │
│                                         │
│ — or —                                  │
│                                         │
│ No PIN set. [Set up PIN]                │
└─────────────────────────────────────────┘
```

Flow:
1. Tap "Set up PIN" → PinPad (enter 4 digits)
2. "Confirm PIN" → PinPad again (must match)
3. On match → `POST /api/admin/device/set-pin { staffId, pin }`
4. Success → toast "PIN set. You'll appear on the lock screen."

### Component List

| Component | File | Purpose |
|-----------|------|---------|
| `PinPad` | `src/ui/PinPad.tsx` | 4-digit input with dots, numpad, shake animation |
| `StaffRoster` | `src/features/auth/StaffRoster.tsx` | Horizontal avatar grid for lock screen |
| `OperatorBadge` | `src/ui/OperatorBadge.tsx` | Name + avatar pill in session bar |
| `QuickSwitchLockScreen` | `src/features/auth/QuickSwitchLockScreen.tsx` | Full lock screen with roster + PIN |
| `SetPinSheet` | `src/features/auth/SetPinSheet.tsx` | PIN setup modal (enter + confirm) |
| `PinLockoutBanner` | `src/features/auth/PinLockoutBanner.tsx` | Countdown when locked out |
| `useOperatorStore` | `src/features/auth/useOperatorStore.ts` | Global operator state |
| `useVerifyPin` | `src/api/useDeviceAuth.ts` | TanStack mutation for verify-pin |
| `useSetPin` | `src/api/useDeviceAuth.ts` | TanStack mutation for set-pin |
| `useStaffRoster` | `src/api/useDeviceAuth.ts` | TanStack query for roster |

### Integration Points (Existing Code Changes)

| File | Change |
|------|--------|
| `src/api/client.ts` | Add `X-Found-Operator` header logic |
| `src/api/client.ts` | Add 403 operator-revocation detection |
| `src/features/auth/AuthProvider.tsx` | Replace biometric-only lock with QuickSwitchLockScreen |
| `src/features/auth/useAutoLock.ts` | On lock: clear operator (triggers lock screen) |
| `src/ui/SessionBar.tsx` | Show OperatorBadge + "Switch" button |
| `src/features/session/useSessionStore.ts` | Per-operator state save/restore |
| `app/(app)/more/settings.tsx` | Add PIN setup section |
| `app/_layout.tsx` | Set deviceOwnerId from Clerk auth on boot |

---

## Inactivity & Lock Rules (Unchanged)

| Event | Action |
|-------|--------|
| 2 min no touch (not in FITTING/HANDED) | Clear operator → lock screen |
| App backgrounded > 2 min | Clear operator → lock screen on return |
| "Lock" button tapped | Clear operator → lock screen |
| Device owner taps their avatar | Face ID → dismiss (no PIN) |
| Different staff taps avatar | PIN required |
| FITTING mode active | Lock suppressed (existing behavior) |
| HANDED mode active | Lock suppressed, switch blocked |

---

## Build Order

1. **`useOperatorStore`** + per-operator session save/restore
2. **`PinPad` component** (pure UI — can test in isolation)
3. **`src/api/useDeviceAuth.ts`** (roster query + verify/set mutations)
4. **`QuickSwitchLockScreen`** (roster + PinPad + Face ID fallback)
5. **API client header integration** (`X-Found-Operator`)
6. **403 operator-revocation handling**
7. **AuthProvider update** (swap biometric-only lock for quick-switch lock)
8. **SessionBar OperatorBadge** + switch button
9. **Settings PIN setup section**
10. **Per-operator session persistence** (suspend/resume)

---

## Open Decisions (Need Your Input)

1. **Offline PIN validation?** Foundry handoff says "iPad never validates PINs locally." If offline, staff can't switch. Is this acceptable for a retail floor that occasionally loses WiFi?

2. **Device owner without PIN:** The device owner can always Face ID in. Should they also be prompted to set a PIN so *other devices* recognize them? (Recommendation: yes, prompt on first sign-in.)

3. **Session suspend depth:** Do we save fitting photos/state per-operator, or just the session store? Fitting state can be large (20 photos in memory).
