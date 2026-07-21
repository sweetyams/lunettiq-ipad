---
name: perf-pass
description: "Deep performance audit — render cost, memory, battery, list virtualization, image handling"
arguments:
  - name: target
    description: "Screen name, feature area (e.g. 'fitting', 'products', 'session'), or 'all'. Defaults to recent changes."
    required: false
---

Deep performance pass on **{{target}}**.

## Purpose

`pnpm verify` catches surface violations (inline arrows, missing keyExtractor).
`perf-pass` goes deeper: Is this code *fast on a real iPad*? Will it drain battery? Does it work smoothly with 200+ products?

## Scope

{{#target}}Target: `{{target}}`{{/target}}
{{^target}}Infer from recent changes (staged files or last commit).{{/target}}

---

## Dimension 1 — Render Cost

- [ ] **No unnecessary re-renders.** Components receiving callbacks use `useCallback`. Objects in props are memoized.
- [ ] **FlatList for lists > 20 items.** No `ScrollView` + `.map()` for dynamic lists.
- [ ] **FlatList optimized.** Has `keyExtractor`, `getItemLayout` (if fixed height), `removeClippedSubviews`, `maxToRenderPerBatch`.
- [ ] **No inline arrow functions in renderItem.** Extract to named function or `useCallback`.
- [ ] **Heavy computations memoized.** `useMemo` for expensive filtering/sorting (product scoring, fit calculation).
- [ ] **No cascade invalidations.** TanStack Query `invalidateQueries` isn't over-broad (invalidating all queries on one mutation).

## Dimension 2 — Image Performance

- [ ] **Thumbnails for grids.** Product grid uses 500px thumbnails, not full-resolution images.
- [ ] **Fitting photos compressed.** JPEG 80%, max 2048px longest edge before upload.
- [ ] **Image caching.** Using expo-image (not Image) for automatic caching.
- [ ] **No simultaneous large image loads.** Photo grid limits concurrent loads.
- [ ] **Progressive loading.** Skeleton → thumbnail → full resolution on zoom.

## Dimension 3 — Memory

Budget: <80MB idle, <200MB active fitting.

- [ ] **Photo cleanup.** Sessions with 20 photos don't keep all full-resolution in memory.
- [ ] **List virtualization working.** FlatList items outside viewport are unmounted.
- [ ] **No event listener leaks.** All subscriptions cleaned up in useEffect return.
- [ ] **WatermelonDB queries scoped.** Not loading entire tables — use `.query(Q.where(...))`.
- [ ] **TanStack Query garbage collection.** `gcTime` configured appropriately (not infinite).

## Dimension 4 — Battery

Budget: <30% drain per 8-hour shift.

- [ ] **No polling.** No `setInterval` for data refresh — use TanStack Query `refetchInterval` only when visible.
- [ ] **Camera released.** Camera resource freed when not in fitting mode.
- [ ] **Background sync throttled.** Photo uploads batch, don't individually wake network.
- [ ] **Animations respect Reduce Motion.** No infinite loops when system prefers reduced motion.
- [ ] **Screen awake only in fitting.** `useKeepAwake` only active during FITTING state.

## Dimension 5 — Startup & Navigation

- [ ] **Cold start < 1.5s.** No heavy computation at app launch.
- [ ] **Screen transitions < 300ms.** No blocking data fetch on navigation.
- [ ] **Lazy tab loading.** Tabs not visited don't mount/fetch.
- [ ] **Prefetching on hover/focus.** Product detail prefetched when card is long-pressed.
- [ ] **Search debounced.** Minimum 300ms before API or local query fires.

## Dimension 6 — Offline Performance

- [ ] **WatermelonDB queries < 100ms.** Local product search returns within budget.
- [ ] **Sync queue doesn't block UI.** Draining happens in background, never on main thread.
- [ ] **Cache size bounded.** Purge rules active (7 days photos, 30 days unused clients).
- [ ] **No network waits.** Optimistic UI — writes show immediately, sync later.

---

## Exit Gate

After addressing issues:
1. `pnpm verify` passes
2. No React DevTools Profiler warnings on target screens
3. FlatList benchmark: 200 items scrolls at 60fps

## Report

```markdown
## Perf Pass: {{target}}

**Memory estimate:** idle {N}MB / active {N}MB
**Render count (key screen):** {N} renders on mount
**FlatList items:** {N} (virtualized: yes/no)
**Image strategy:** thumbnails {size}px / full {size}px

### Critical Issues
1. {issue} — {impact}

### Optimizations
1. {opportunity} — {estimated improvement}

### Passed
- {dimension}: ✓
```
