---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---
# Component Patterns

## Expo Router — File-Based Routing

```
app/(app)/clients/index.tsx          → /clients (list)
app/(app)/clients/[id].tsx           → /clients/:id (profile)
app/(app)/clients/[id]/session.tsx   → /clients/:id/session (active session)
```

### Layouts

```tsx
// app/(app)/_layout.tsx — tab navigator
export default function AppLayout() {
  return <Tabs>...</Tabs>;
}

// app/(app)/clients/_layout.tsx — stack within tab
export default function ClientsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

## Screen Pattern

Every screen follows this shape:

```tsx
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useClient } from '@/src/api/useClients';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: client, isLoading, error } = useClient(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => {}} />;
  if (!client) return <EmptyState message="Client not found" />;

  return (
    <ScrollView className="flex-1 bg-offWhite">
      {/* content */}
    </ScrollView>
  );
}
```

Rules:
- Always handle 4 states: loading, error, empty, content
- `useLocalSearchParams` for route params (typed)
- No inline fetch calls — use TanStack Query hooks from `src/api/`

## Reusable Components (`src/ui/`)

### Required components (build before features)

| Component | Purpose |
|-----------|---------|
| `Button` | Primary, secondary, ghost, danger variants |
| `Card` | Standard container with padding + radius |
| `Avatar` | Initials or photo, tier badge overlay |
| `Badge` | Tier badges, status indicators |
| `Input` | Text input with label + error |
| `SearchBar` | Full-width search with debounce |
| `LoadingState` | Skeleton shimmer, never a spinner |
| `ErrorState` | Message + retry button |
| `EmptyState` | Illustration + message + CTA |
| `BottomSheet` | Modal sheet from bottom |
| `FitBadge` | ✓ Good fit / ⚠ Slightly off / ✗ May not fit |

### Component rules

- All components use NativeWind (className prop)
- All interactive components meet 44pt minimum touch target
- All components support both light and dark mode
- No inline styles — use className exclusively
- No business logic in UI components — pure presentation

## List Pattern (iPad optimized)

```tsx
// Split view: list left, detail right (iPad landscape)
<View className="flex-row flex-1">
  <View className="w-2/5 border-r border-warmGrey">
    <FlatList data={items} renderItem={...} />
  </View>
  <View className="w-3/5">
    {selectedId ? <DetailPanel id={selectedId} /> : <SelectPrompt />}
  </View>
</View>
```

## Photo Grid Pattern (Fitting mode)

```tsx
// Horizontal scroll shelf
<ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-sm">
  {photos.map((photo) => (
    <Pressable key={photo.id} onPress={() => selectPhoto(photo.id)}>
      <Image source={{ uri: photo.thumbnailUrl }} className="w-20 h-20 rounded-md mr-sm" />
      {photo.verdict && <VerdictBadge verdict={photo.verdict} />}
    </Pressable>
  ))}
</ScrollView>
```

## Offline-Aware Components

Components that write data must check sync status:

```tsx
import { useSyncStore } from '@/src/sync/useSyncStore';

export function SaveButton({ onSave }: { onSave: () => void }) {
  const isOnline = useSyncStore((s) => s.isOnline);

  return (
    <Button onPress={onSave} variant="primary">
      {isOnline ? 'Save' : 'Save (will sync later)'}
    </Button>
  );
}
```

## Gesture Patterns

| Gesture | Action |
|---------|--------|
| Tap | Primary action (navigate, select) |
| Long press | Context menu (recommend, add to session) |
| Swipe left | Quick action on list row |
| Pull to refresh | Refresh list data |
| Pinch | Zoom photo |
| Two-finger tap | Toggle privacy mode (staff shortcut) |
