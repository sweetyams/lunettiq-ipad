---
inclusion: always
---
# TypeScript & React Native Conventions

## File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Screen (Expo Router) | `app/(group)/name/index.tsx` | `app/(app)/clients/index.tsx` |
| Feature component | `{Name}.tsx` | `ClientProfile.tsx` |
| Hook | `use{Name}.ts` | `useOfflineSync.ts` |
| Store (Zustand) | `use{Name}Store.ts` | `useSessionStore.ts` |
| API query | `use{Name}.ts` in `src/api/` | `src/api/useClients.ts` |
| DB model | `{Name}.model.ts` | `Client.model.ts` |
| Types | `{name}.types.ts` | `session.types.ts` |
| Test | `{Name}.test.tsx` | `ClientProfile.test.tsx` |

## Project Structure

```
app/                          # Expo Router (file-based routing)
├── (auth)/                   # Login, biometric setup
├── (app)/                    # Main app (tabbed)
│   ├── home/                 # Today view
│   ├── clients/              # Client list, profile, session
│   ├── products/             # Catalogue browser
│   ├── appointments/         # Calendar
│   └── more/                 # Second Sight, Custom, Settings
└── _layout.tsx               # Root providers

src/
├── api/                      # TanStack Query hooks + typed fetch client
├── db/                       # WatermelonDB schema + models + sync
├── features/                 # Domain logic (discovery, session, fitting, etc.)
├── camera/                   # Photo capture, burst, enhance
├── pencil/                   # Apple Pencil annotations
├── sync/                     # Offline sync engine
└── ui/                       # Shared components (brand kit)
```

## TypeScript Style

- **Strict mode** — `strict: true`, no `any`, no non-null assertions
- **Prefer `interface` over `type`** for object shapes (extendable)
- **Explicit return types** on exported functions
- **`as const`** for literal unions — never stringly-typed
- **No default exports** except in Expo Router page files (required by convention)
- **Barrel exports** via `index.ts` per directory

## Import Ordering

```typescript
// React / React Native
import { View, Text, Pressable } from 'react-native';
import { useCallback, useState } from 'react';

// Expo
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';

// Third-party
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';

// Project (absolute with @/ alias)
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { Button } from '@/src/ui/Button';
```

## Naming Conventions

- **Components:** PascalCase — `ClientCard`, `FittingShelf`
- **Hooks:** camelCase with `use` prefix — `usePrivacyMode`, `useSyncStatus`
- **Stores:** camelCase with `use` prefix + `Store` suffix — `useSessionStore`
- **Constants:** UPPER_SNAKE — `MAX_PHOTOS_PER_SESSION`, `SYNC_INTERVAL_MS`
- **API endpoints:** camelCase matching Foundry routes — `fetchClients`, `createSession`
- **Event handlers:** `on` prefix — `onPhotoCapture`, `onVerdictChange`

## Component Pattern

```tsx
interface ClientCardProps {
  client: Client;
  onPress: (id: string) => void;
  showTier?: boolean;
}

export function ClientCard({ client, onPress, showTier = true }: ClientCardProps) {
  return (
    <Pressable onPress={() => onPress(client.id)} className="...">
      {/* content */}
    </Pressable>
  );
}
```

Rules:
- Props interface above component, named `{Component}Props`
- Destructure props in parameter
- Default values in destructuring, not `defaultProps`
- No inline styles — use NativeWind classes
