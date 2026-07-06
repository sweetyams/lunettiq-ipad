---
inclusion: fileMatch
fileMatchPattern: "**/*.ts,**/*.tsx"
---
# Performance

## Budgets

| Metric | Target |
|--------|--------|
| App launch (cold) | < 1.5s to interactive |
| Screen transition | < 300ms |
| Photo capture to thumbnail | < 500ms |
| Photo upload (WiFi) | < 4s per 2MB |
| Search results (local) | < 100ms |
| Search results (API) | < 500ms |
| Battery per shift | < 30% drain (8-hour shift) |
| Memory (idle) | < 80MB |
| Memory (active fitting) | < 200MB |

## Rules

- **No work at startup** — defer to screen-level `useEffect` or TanStack Query
- **Lazy screens** — don't mount tab content until tab is first visited
- **Image optimization** — 500px thumbnails for grid, full resolution only on zoom
- **FlatList, not ScrollView** — for any list > 20 items (virtualized rendering)
- **Debounce search** — 300ms minimum before API call
- **Cancel on navigate** — abort in-flight requests when leaving a screen
- **Background upload** — photos upload via background queue, never block UI

## Common Pitfalls

```tsx
// ❌ Wrong — renders all items, kills performance
<ScrollView>
  {clients.map(c => <ClientCard key={c.id} client={c} />)}
</ScrollView>

// ✅ Correct — virtualized, only renders visible items
<FlatList
  data={clients}
  renderItem={({ item }) => <ClientCard client={item} />}
  keyExtractor={(item) => item.id}
/>
```

## Battery Optimization

- Reduce location polling (only when needed for appointment context)
- Auto-dim screen after 2 min inactivity
- Pause background sync when app is backgrounded
- Compress photos before upload (JPEG 80% quality, max 2048px)
- No animations when `reduceMotion` is enabled

## Profiling

Use before optimizing:
1. **React DevTools Profiler** — find unnecessary re-renders
2. **Flipper** — network, layout, performance
3. **Xcode Instruments** — memory leaks, CPU profiling
4. **Flashlight** — automated perf benchmarks
