---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---
# State Management Patterns

## Two state systems

| System | Tool | Use for |
|--------|------|---------|
| Server state | TanStack Query | API data (clients, products, appointments) |
| Local state | Zustand | App-level state (session, privacy mode, sync queue) |

Never mix: don't put API data in Zustand, don't put app state in TanStack Query.

## TanStack Query — Server State

```typescript
// src/api/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useClients(search?: string) {
  return useQuery({
    queryKey: ['clients', { search }],
    queryFn: () => api.get('/api/admin/clients', { params: { q: search, limit: 50 } }),
    staleTime: 5 * 60 * 1000, // 5 min — clients don't change often
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get(`/api/admin/clients/${id}`),
    enabled: !!id,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      api.patch(`/api/admin/clients/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}
```

### Rules

- `queryKey` always starts with the entity name: `['clients']`, `['products']`, `['appointments']`
- Use `staleTime` to prevent unnecessary refetches (5 min for lists, 1 min for detail)
- Mutations invalidate related queries via `queryClient.invalidateQueries`
- Optimistic updates for instant UI feedback on writes
- `enabled: false` for conditional queries (don't fetch without required params)

## Zustand — Local State

```typescript
// src/features/session/useSessionStore.ts
import { create } from 'zustand';

interface SessionState {
  activeClientId: string | null;
  mode: 'discovery' | 'session' | 'fitting';
  sessionId: string | null;
  framesTried: FrameTried[];
  setClient: (id: string | null) => void;
  setMode: (mode: SessionState['mode']) => void;
  addFrameTried: (frame: FrameTried) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeClientId: null,
  mode: 'discovery',
  sessionId: null,
  framesTried: [],
  setClient: (id) => set({ activeClientId: id, mode: id ? 'session' : 'discovery' }),
  setMode: (mode) => set({ mode }),
  addFrameTried: (frame) => set((s) => ({ framesTried: [...s.framesTried, frame] })),
  reset: () => set({ activeClientId: null, mode: 'discovery', sessionId: null, framesTried: [] }),
}));
```

### Rules

- One store per domain concern: `useSessionStore`, `usePrivacyStore`, `useSyncStore`
- Stores are flat — no nesting. If state is complex, split into another store.
- Actions are methods on the store, not separate dispatch functions
- No async logic in stores — async belongs in TanStack Query mutations or effects
- Persist to MMKV for critical state (active session survives app restart)

## WatermelonDB — Offline Cache

See `#09-offline-sync` for the full sync pattern. Key rules here:

- WatermelonDB is a **read cache**, not the source of truth
- Writes go to Foundry API first, then update local DB on success
- Offline writes queue in `sync_queue` table, drain on reconnect
- Never read from WatermelonDB when online — use TanStack Query (fresher)
- WatermelonDB is the **fallback** when network is unavailable

## When to use what

| Scenario | Use |
|----------|-----|
| List/detail from API | TanStack Query |
| "Am I in fitting mode?" | Zustand (`useSessionStore`) |
| "Is this device offline?" | Zustand (`useSyncStore`) |
| "Show me cached clients when offline" | WatermelonDB |
| "Queue this write for later" | WatermelonDB `sync_queue` |
| "What photos are pending upload?" | Zustand (`useSyncStore.pendingPhotos`) |
