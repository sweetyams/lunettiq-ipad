# Decision Cards — Expo / React Native

## Method Card: TanStack Query vs Local State

**Type:** architecture
**Confidence:** high
**Scope:** features, data

### Trigger
A feature needs data that comes from an API.

### Decision Framework
| Question | → TanStack Query | → Zustand/useState |
|---|---|---|
| Comes from the server? | ✓ | |
| Needs cache invalidation? | ✓ | |
| Multiple components read it? | ✓ | |
| Needs background refresh? | ✓ | |
| Purely UI state (modal open, tab index)? | | ✓ |
| Ephemeral (gone on unmount)? | | ✓ |
| Persists across screens? | depends | ✓ (Zustand) |

### Counterbalance
Don't put everything in TanStack Query. UI state (selected tab, form draft, modal visibility) belongs in local state or Zustand.

---

## Method Card: WatermelonDB vs API-Only

**Type:** architecture
**Confidence:** high
**Scope:** features, offline

### Trigger
A feature needs data. Should it be in the local DB (WatermelonDB) or fetched fresh from the API?

### Decision Framework
| Question | → WatermelonDB | → API only |
|---|---|---|
| Must work offline? | ✓ | |
| Data changes frequently (real-time)? | | ✓ |
| User creates/edits this data locally? | ✓ | |
| Read-only reference data? | Maybe (cache) | ✓ |
| Needs to sync bidirectionally? | ✓ | |
| Large dataset (1000+ rows)? | ✓ (fast queries) | Paginate |

### Counterbalance
WatermelonDB adds schema management, migrations, and sync complexity. If the feature only works online anyway (e.g. payment), skip the local DB.

---

## Method Card: Screen vs Component

**Type:** architecture
**Confidence:** high
**Scope:** navigation, ui

### Trigger
Building new UI. Should this be a new screen (route) or a component within an existing screen?

### Decision Framework
| Question | → New screen | → Component |
|---|---|---|
| Has its own URL/deep link? | ✓ | |
| User navigates "into" it? | ✓ | |
| Needs its own header/back button? | ✓ | |
| Is a modal/sheet over current content? | ✓ (modal route) | |
| Is a tab/section within a screen? | | ✓ |
| Conditionally visible? | | ✓ |

---

## Method Card: Optimistic vs Pessimistic Updates

**Type:** decision
**Confidence:** high
**Scope:** features, api

### Trigger
User performs a mutation (create, update, delete). Should UI update immediately or wait for server?

### Decision Framework
| Question | → Optimistic | → Pessimistic |
|---|---|---|
| Reversible if fails? | ✓ | |
| User expects instant feedback? | ✓ | |
| Involves money/payment? | | ✓ |
| Server might reject (validation)? | | ✓ |
| Offline-capable? | ✓ (queue) | |
| Order matters (sequence)? | | ✓ |

### Counterbalance
Optimistic updates need rollback logic. If the mutation has complex server-side validation, show a loading state instead.

---

## Method Card: NativeWind Class vs StyleSheet

**Type:** taste
**Confidence:** high
**Scope:** ui, styling

### Trigger
Styling a component.

### Underlying Principle
NativeWind (Tailwind for RN) for layout and common patterns. StyleSheet.create only when NativeWind can't express it (animations, dynamic computed values, platform-specific).

### Applies When
- Layout (flex, padding, margin, sizing) → NativeWind always
- Colors, typography → NativeWind (uses design tokens)
- Animations, transforms → StyleSheet or Reanimated
- Dynamic values (based on props/state) → StyleSheet or inline

### Counterbalance
Don't fight NativeWind for complex animations. The boundary is clear: static styling = NativeWind, dynamic/animated = StyleSheet/Reanimated.
