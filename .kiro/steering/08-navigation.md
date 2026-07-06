---
inclusion: manual
---
# Navigation — Expo Router Patterns

Reference: "use #08-navigation"

## Tab Bar (bottom)

```
Home | Clients | Products | Appointments | More
```

Tabs persist across navigation within each tab (stack per tab).

## Stack Navigation (within tabs)

```tsx
// app/(app)/clients/_layout.tsx
import { Stack } from 'expo-router';

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/session" />
    </Stack>
  );
}
```

Navigate with typed links:
```tsx
import { useRouter } from 'expo-router';

const router = useRouter();
router.push(`/clients/${client.id}`);
router.push(`/clients/${client.id}/session`);
router.back();
```

## Modal Sheets (bottom sheet)

Use for non-navigational overlays:
- Photo verdict picker
- Quick note entry
- Credit issuance form
- Product recommendation confirmation

```tsx
import { BottomSheet } from '@/src/ui/BottomSheet';

<BottomSheet isOpen={showVerdict} onClose={() => setShowVerdict(false)}>
  <VerdictPicker onSelect={handleVerdict} />
</BottomSheet>
```

## Deep Linking

```
lunettiq://clients/{id}        → Client profile
lunettiq://appointments/{id}   → Appointment detail
lunettiq://session/{id}        → Resume active session
```

Configure in `app.config.ts`:
```ts
scheme: 'lunettiq',
```

## Navigation Rules

- **Tab switches preserve state** — navigating away and back doesn't reset the tab's stack
- **Active session persists** — switching tabs doesn't end a fitting session
- **Back gesture** — native swipe-back on all stack screens
- **No nested navigators** — Expo Router handles all nesting via file structure
- **Modal presentation** — use `presentation: 'modal'` in Stack.Screen options for full-screen modals

## iPad-Specific

- **Split view for lists** — left panel (list) + right panel (detail) on landscape
- **Popovers instead of full-screen modals** — for small selections (verdict, quick note)
- **Drag-to-dismiss** — all sheets support drag-to-dismiss gesture
