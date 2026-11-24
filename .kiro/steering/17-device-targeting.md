---
inclusion: always
---
# Device Targeting & Run Commands

## The Only Run Command

```bash
pnpm ios
```

This runs `expo run:ios --device 'iPad Pro 13 Lunettiq'` — the custom simulator configured for this project. There is no other way to run the app.

## Hard Rules

1. **Never suggest `expo run:ios` without `--device`** — it picks the last-used device, which is often an iPhone.
2. **Never suggest `pnpm dev` or `expo start`** — Expo Go cannot run native modules (WatermelonDB, camera, simdjson). It will crash.
3. **Never suggest `npx expo start`** — same problem as above.
4. **The target device is always `iPad Pro 13 Lunettiq`** — a custom simulator matching the 12.9" iPad Pro form factor the app is designed for.
5. **If the simulator doesn't exist**, tell the user to create it:
   ```bash
   xcrun simctl create 'iPad Pro 13 Lunettiq' 'iPad Pro 13-inch (M4)'
   ```
6. **If Expo opens the wrong device** (iPhone), the fix is:
   - Delete `.expo/devices.json` or reset it to `{"devices": []}`
   - Ensure `package.json` `"ios"` script includes `--device 'iPad Pro 13 Lunettiq'`
   - Never rely on Expo's device memory — always specify explicitly

## Quick Reference for Instructions

| Task | Command |
|------|---------|
| Run app (iPad sim) | `pnpm ios` |
| Metro bundler only (for hot reload after native build) | `pnpm start` |
| Fresh native build | `pnpm prebuild && pnpm ios` |
| Nuclear reset | `pnpm nuke` (deletes node_modules + ios, reinstalls everything) |
| Type check | `pnpm typecheck` |
| Tests | `pnpm test` |
| Sim logs | `pnpm logs` |
| TestFlight build | `npx eas build --platform ios --profile preview` |
| Submit to TestFlight | `npx eas submit --platform ios --profile preview` |

## Never Suggest These

| Command | Why |
|---------|-----|
| `pnpm dev` | Intentionally errors out — Expo Go doesn't work |
| `expo start` | Opens Expo Go, crashes on native modules |
| `expo run:ios` (bare) | May target iPhone |
| `react-native run-ios` | Wrong CLI for Expo projects |

## When User Says "Run It" or "Get It On Device"

- **Simulator:** `pnpm ios` — always targets iPad Pro 13 Lunettiq
- **Physical iPad (dev):** `npx eas build --platform ios --profile development` → install via EAS link
- **Physical iPad (TestFlight):** `npx eas build --platform ios --profile preview` then `npx eas submit --platform ios --profile preview`
- **Never suggest Xcode manual archive** — EAS handles signing and distribution
