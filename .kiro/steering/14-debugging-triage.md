---
inclusion: manual
---
# Debugging Triage

Reference: "use #14-debugging-triage". Check environment before assuming code bugs.

## Triage Order

1. **Metro bundler** — Running? Try `npx expo start --clear` to reset cache.
2. **Expo Go / Dev Client** — Correct version? Latest SDK? Try force-quit + reopen.
3. **Physical device** — Connected to same WiFi? `adb devices` / trust popup dismissed?
4. **Network** — API reachable from device? VPN? Firewall? Try `curl` from laptop.
5. **Clerk** — Token valid? Publishable key correct for env? Check Clerk dashboard.
6. **Dependencies** — `npx expo install --check` for version compatibility. Try `rm -rf node_modules && pnpm install`.
7. **WatermelonDB** — Schema mismatch? Try wiping local DB: `await database.write(() => database.unsafeResetDatabase())`.
8. **Code** — Only after 1-7 are ruled out.

## Common Traps

| Symptom | Likely cause |
|---------|-------------|
| "Unable to resolve module" | Metro cache stale — `npx expo start --clear` |
| White screen on launch | JS error before first render — check Metro terminal |
| API returns 401 | Clerk token expired or wrong env key |
| API returns 404 | Module not enabled on tenant, or wrong base URL |
| Photos not uploading | Presigned URL expired, or R2 CORS issue |
| WatermelonDB crash | Schema version mismatch — reset or migrate |
| NativeWind styles not applying | Tailwind config missing the file path |
| "Invariant Violation" | Native module not linked — `npx expo prebuild --clean` |
| App works in Expo Go, crashes in build | Native dependency needs dev client, not Expo Go |
| Slow FlatList | Missing `keyExtractor`, or inline render functions |

## When to Widen Scope

If the first fix attempt doesn't resolve it:
1. Stop making code changes
2. Ask: "Is this a code problem or an environment problem?"
3. Check one layer out (network, device, bundler) before touching code again

## Expo-Specific Recovery

```bash
# Nuclear reset (fixes 90% of mysterious issues)
rm -rf node_modules .expo ios android
pnpm install
npx expo prebuild --clean
npx expo start --clear
```
