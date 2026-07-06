---
inclusion: manual
---
# Privacy Modes — Staff vs Client-Visible

Reference: "use #12-privacy-modes"

## The Two Modes

| Mode | Who sees the screen | What's shown |
|------|--------------------|--------------| 
| **Staff** (default) | SA only | Everything — LTV, tags, Rx, notes, return rate, credits $ |
| **Client-visible** | SA + client together | Curated — name, wishlist, fit profile, preferences, photos |

## Toggle Mechanism

- **Global toggle** — top-right corner, eye icon. One tap switches ALL screens.
- **Visual indicator** — colored bar at top when client-visible mode is active
- **"Hand to client"** action — activates client-visible + simplified chrome + larger touch targets

## Per-Screen Visibility Rules

| Screen | Staff mode shows | Client-visible mode hides |
|--------|-----------------|--------------------------|
| Client profile | Full profile | LTV, AOV, internal tags, return rate, $ credits (shows "credits available"), private notes |
| Product detail | All data + inventory + sales history + analytics | Inventory counts, sales data, analytics |
| Fitting session | Notes editable, all annotations | SA notes hidden, photos visible |
| Catalogue browse | Full filters + pricing | Prices hidden until client taps product |
| Second Sight | Full grade + internal notes | Intake confirmation only |
| Settings | Full access | Blocked entirely |

## Implementation

```typescript
// src/features/privacy/PrivacyModeProvider.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacyState {
  mode: 'staff' | 'client';
  handedToClient: boolean;
  toggleMode: () => void;
  handToClient: () => void;
  reclaimFromClient: () => void;  // requires biometric
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      mode: 'staff',
      handedToClient: false,
      toggleMode: () => set((s) => ({ mode: s.mode === 'staff' ? 'client' : 'staff' })),
      handToClient: () => set({ mode: 'client', handedToClient: true }),
      reclaimFromClient: () => set({ mode: 'staff', handedToClient: false }),
    }),
    { name: 'privacy-mode', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

## Component Pattern

```tsx
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

export function ClientLTV({ value }: { value: number }) {
  const mode = usePrivacyStore((s) => s.mode);
  if (mode === 'client') return null;  // Hidden in client mode
  return <Text className="text-body text-midGrey">${formatCurrency(value)}</Text>;
}

// Wrapper for any staff-only content
export function StaffOnly({ children }: { children: React.ReactNode }) {
  const mode = usePrivacyStore((s) => s.mode);
  if (mode === 'client') return null;
  return <>{children}</>;
}
```

## "Hand to Client" Flow

1. SA taps "Hand to client" button
2. Mode switches to client-visible
3. Navigation simplifies (sidebar hidden, larger touch targets)
4. Client browses, picks favourites, reviews photos
5. SA takes iPad back → double-tap home button → biometric auth → staff mode restored
6. Session continues

## Audit

Every mode switch is logged:
```typescript
await api.post('/api/admin/interactions', {
  type: 'privacy_mode_change',
  metadata: {
    from: 'staff',
    to: 'client',
    clientId: activeClientId,
    sessionId: currentSessionId,
  },
});
```

## Rules

1. **Staff mode is the default.** App always starts in staff mode after biometric auth.
2. **Toggle is reversible in one tap** (staff ↔ client). No confirmation needed for toggle.
3. **"Hand to client" requires biometric to reclaim** — prevents accidental staff data exposure.
4. **Never show internal tags to clients.** "VIP - tough to please" must NEVER display.
5. **Credits: show "credits available" not dollar amount** in client mode.
6. **Pricing: hidden by default in client mode.** Client taps a product to see price (intentional friction).
7. **Grey-out enforcement:** if SA opens a staff-only panel while in client mode, show greyed overlay with "Switch to staff mode to view."
