# Anti-Patterns — Expo / React Native

## Inline fetch in components

**Trigger:** Component has `useEffect(() => { fetch(...) }, [])` directly.

**Why it's wrong:** No caching, no deduplication, no loading/error states, no background refresh, no retry. Every mount re-fetches. Multiple instances duplicate requests.

**Fix:** Use TanStack Query with a query key. Extract the fetch to `src/api/`.

---

## WatermelonDB schema change without version bump

**Trigger:** Added or renamed a column in a WatermelonDB model.

**Why it's wrong:** App crashes on launch with "Migration needed" because schemaVersion in `schema.ts` wasn't incremented. Even adding an *optional* field requires a version bump + migration entry.

**Fix:** Every model change → increment `schemaVersion` → add migration in `migrations.ts`.

---

## Hardcoded API URLs

**Trigger:** `fetch('http://lunettiq.localhost:4000/api/...')` scattered in files.

**Why it's wrong:** Breaks on device, breaks in production, breaks for other tenants.

**Fix:** Single `API_BASE` constant from env/config. All fetches go through the API client (`src/api/client.ts`).

---

## Navigation state in Zustand

**Trigger:** Storing "current screen" or "active tab" in Zustand global store.

**Why it's wrong:** Duplicates what Expo Router already manages. Two sources of truth for navigation = bugs when back button doesn't match store state.

**Fix:** Navigation state belongs to the router. Use `usePathname()`, `useLocalSearchParams()`, and `router.push()`. Zustand is for app-level state that survives navigation.

---

## Missing keyboard dismiss on scroll

**Trigger:** User opens keyboard, scrolls the list, keyboard stays open covering content.

**Why it's wrong:** On iPad especially, the keyboard covers half the screen. Users expect scroll-to-dismiss.

**Fix:** Add `keyboardDismissMode="on-drag"` to ScrollView/FlatList. For custom gesture areas, `Keyboard.dismiss()` on tap-outside.

---

## Unhandled promise rejection in async handlers

**Trigger:** `onPress={async () => { await doThing() }}` without try/catch.

**Why it's wrong:** If `doThing()` throws, React Native shows a red screen in dev and silently fails in production. No user feedback.

**Fix:** Every async handler gets try/catch with toast feedback:
```tsx
onPress={async () => {
  try { await doThing(); toast.success('Done'); }
  catch (e) { toast.error(e.message); }
}}
```

---

## Platform-specific code without Platform check

**Trigger:** Using iOS-only API (e.g. PencilKit, haptics) without `Platform.OS === 'ios'` guard.

**Why it's wrong:** Crashes on Android/web. Even if you "only target iPad," Expo builds for all platforms by default and web previews will break.

**Fix:** Always guard platform-specific imports with `Platform.OS` check or use `.ios.ts` / `.android.ts` file extensions.
