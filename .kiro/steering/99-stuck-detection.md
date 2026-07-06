---
inclusion: always
---
# Stuck Detection & Recovery

## Self-Monitoring Rules

### Build Loops
If `npx tsc --noEmit` or EAS build fails 3+ times with the same error:
1. STOP executing
2. Read the full error (not just the last line)
3. Check: is this a dependency issue, not a code issue?
4. Try `rm -rf node_modules && pnpm install` before more code changes

### Metro Bundler Crashes
If Metro crashes or won't resolve modules:
1. STOP assuming code is the problem
2. `npx expo start --clear`
3. If still broken: `rm -rf .expo node_modules && pnpm install`
4. Check for circular imports (Metro error message will say)

### API Integration Failures
If API calls fail repeatedly:
1. Verify the endpoint exists: `curl -H "Authorization: Bearer ..." http://lunettiq.localhost:4000/api/admin/...`
2. Check the Foundry dev server is running
3. Verify Clerk token is valid and has the right permissions
4. Check CORS — is the app's bundle ID in `cors_allowed_origins`?

### WatermelonDB Issues
If local DB operations fail:
1. Schema version mismatch — check if model was updated without migration
2. Try `database.unsafeResetDatabase()` in dev
3. Check that model `@field` decorators match schema columns

### Oscillation
If you've switched between two approaches more than once:
1. STOP and name both approaches
2. List pros/cons of each
3. Pick one and commit — max 2 more attempts
4. After 5 total attempts, halt and report to user

## Recovery Protocol
1. Note what failed and why
2. If the fix requires architectural change, STOP and ask the user
3. If within scope, try the fundamentally different approach
4. After 5 total attempts at any single problem, halt and report
