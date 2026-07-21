---
inclusion: always
---
# Deploy Safety

## Forbidden Directories (HARD RULE — never read, write, or execute in)

| Path | Reason |
|------|--------|
| `/Users/yann/Development/Foundry/foundry/` | Foundry platform repo — separate codebase, separate agent. Never edit, never commit, never run commands in this directory. Provide fix instructions to the user instead. |
| `/Users/yann/Development/Foundry/foundry/**` | Same — all subdirectories |

**If a fix requires changes in Foundry:** Describe the issue, the file, the line, and the fix in prose. Never apply it.

## Banned Commands (without explicit user confirmation)

| Command | Why |
|---------|-----|
| `eas build --profile production` | Production build — requires explicit confirmation |
| `eas submit` | App Store submission — requires explicit confirmation |
| `expo publish` | OTA update to all users — requires explicit confirmation |
| `eas update` | OTA update channel — requires explicit confirmation |

## Protected Files (never auto-modify without asking)

| File | Reason |
|------|--------|
| `app.config.ts` | App identity, deep linking, permissions, bundle ID |
| `eas.json` | Build profiles, distribution config |
| `package.json` | Dependency changes affect build stability |
| `.env*` | Secrets — never read, echo, or write |
| `.github/workflows/*` | CI pipeline — changes affect all PRs |
| `.githooks/*` | Quality gates — changes weaken enforcement |

## Build Profile Rules

| Profile | When | Who approves |
|---------|------|-------------|
| `development` | Any time during dev | Self (SA/developer) |
| `preview` | Feature complete, ready for testing | Team lead |
| `production` | Release candidate approved | Project owner |

## Pre-Deploy Checklist

Before any production build:
1. All verify checks pass (`pnpm verify`)
2. CHANGELOG.md updated
3. Version bumped in app.config.ts
4. No `TODO` or `FIXME` in shipped code paths
5. Offline sync tested on physical device
6. Privacy mode tested (staff ↔ client toggle)

## OTA Update Safety

Expo's EAS Update can push JS changes without App Store review. Rules:
- **Never OTA native module changes** — they require a full build
- **Never OTA breaking schema changes** — WatermelonDB migrations need coordinated release
- **Always test OTA on preview channel first** before promoting to production
