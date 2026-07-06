---
inclusion: manual
---
# Feature Buildflow — Orchestrator

Reference: "use #20-feature-buildflow". Routes to the correct phase.

## Commands

| User says | Phase | What happens |
|-----------|-------|--------------|
| "create feature {name}" | Full flow | All phases in order |
| "research feature {name}" | Research | Read similar features, document patterns |
| "build state for {name}" | State | Design types, stores, query hooks |
| "build component {name}" | Component | UI implementation |
| "test feature {name}" | Tests | Write tests for the feature |
| "verify feature {name}" | Verify | Run checks, confirm completeness |

## Full Create Flow

```
research → state/types → API hooks → component → tests → verify
```

## Pre-flight (before any phase)

1. **Does the feature exist?** Search for `{Name}.tsx` — if yes, you're modifying.
2. **Which directory?** `src/features/{domain}/` for domain logic, `app/(app)/` for screens.
3. **Write a task brief** before starting.
4. **Check existing patterns.** Read 1-2 similar features for conventions.

## Phase: Research

1. Find 2-3 similar screens/features in the codebase
2. Read their component, hooks, and types
3. Document: state shape, API integration pattern, offline handling, privacy mode handling
4. Write findings to task brief

## Phase: State/Types

1. Define TypeScript interfaces in `{feature}.types.ts`
2. Create TanStack Query hooks in `src/api/use{Feature}.ts`
3. Create Zustand store if local state needed
4. Define WatermelonDB model if offline caching needed

## Phase: API Hooks

1. Create query hooks using TanStack Query
2. Create mutation hooks with optimistic updates
3. Handle: loading, error, offline fallback
4. Wire invalidation (mutations invalidate related queries)

## Phase: Component

1. Build the screen component in `app/(app)/{tab}/{screen}.tsx`
2. Handle all 4 states: loading, error, empty, content
3. Implement privacy mode visibility rules
4. Ensure 44pt touch targets, 17pt min text
5. Add `#Preview` equivalents (Storybook or in-app dev screen)

## Phase: Tests

1. Component test covering all 4 states
2. Hook test covering success + error + offline
3. Privacy mode test (data hidden when mode = 'client')
4. Offline test (correct fallback when network unavailable)

## Phase: Verify

1. TypeScript passes (`npx tsc --noEmit`)
2. Tests pass (`npx vitest run`)
3. EAS build succeeds (`eas build --platform ios --profile development --local`)
4. Feature works in Expo Go on physical iPad
5. Task brief updated with findings

## Exit Gates (after every phase)

- Types compile
- No `any` types introduced
- Privacy mode respected (sensitive data hidden)
- Offline behavior documented/tested
- Task brief updated
