## Method Card: Compile Success Is Not Endpoint Verification

**Type:** anti-pattern
**Confidence:** high
**Scope:** project-wide

### Trigger
When creating or modifying an API endpoint and declaring it "done" after `tsc --noEmit` passes.

### Observed User Move
"how did we do all of this work just for you to not even test the endpoint to see if it would even work" — after the price endpoint compiled cleanly but returned $0 on first real call.

### Underlying Principle
Type-checking verifies structure, not behavior. An API endpoint that compiles can still return wrong data (null prices from raw DB), wrong status codes, or fail entirely at runtime. The endpoint is not verified until it has been called with real data and the response matches expectations.

### Applies When
- Creating any new API route
- Modifying response shape of existing routes
- Adding database queries to endpoints (especially when the DB schema has nullable fields)
- Any endpoint that resolves data through multiple layers (grid → variants → prices)

### Reasoning
TypeScript catches structural errors but cannot verify: correct data resolution paths, nullable field handling at runtime, query correctness against real data, or whether the endpoint's logic matches the enricher/projection it's supposed to mirror.

### Future Agent Behaviour
After creating or modifying an API endpoint:
1. Run `tsc --noEmit` (necessary but not sufficient)
2. Call the endpoint with `curl` using real IDs from the database
3. Verify the response values are correct (not just non-null — actually correct)
4. Test edge cases (missing data, different product types, addon combinations)

### Counterbalance
Not every code change needs a full integration test. For pure utility functions, type-checking plus unit tests suffice. This applies specifically to endpoints that touch the database or resolve data through multiple layers.

### Risk If Overused
Slows down work on trivial endpoints (health checks, simple CRUD) that genuinely are verified by types alone.

### Trigger Questions
- Does this endpoint read from the database?
- Does it resolve data through a multi-step path (grid → variants → prices)?
- Could a nullable field cause it to return 0/null instead of the correct value?

### Evidence
2026-05-31: Price endpoint compiled cleanly but returned `{ price: 0 }` because it read raw grid data (price: null in DB) instead of resolving from Shopify variants. Only discovered when actually called with curl.

### Do Not Overapply
Simple pass-through endpoints, static responses, or endpoints already covered by integration tests in CI.

### Decay / Review
Stable. Core engineering practice.

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-31 | cake-pdp-api-driven-rendering | Reinforced | Price endpoint compiled cleanly but returned `{ price: 0 }` — read raw grid data instead of Shopify variants |
| 2026-06-01 | collection-management-full-session | Reinforced | Drag handles rendered without drag-and-drop wired, translation keys shown raw without translations loaded, buttons without click handlers — TypeScript passed but feature was non-functional |

### Evidence Log
| Date | Context |
|------|---------|
| 2026-06-03 | Orders showed 0 items after fix deployed. `tsc` passed, DB had correct data, but drizzle's `sql` template rendered `${orders.id}` as unqualified `"id"` in subquery — resolved to wrong table. Only discovered by running the exact drizzle query against real data, not by `tsc` or raw SQL testing. |
| 2026-06-03 | Dev server (Turbopack) served stale compiled code for 20+ minutes after file changes. `tsc` passed, DB had correct data, but the running server returned old results. Required `rm -rf .next` + server restart to pick up changes. Variant: "compile passes AND data is correct BUT server serves stale code." |
| 2026-06-11 | Shopify push code was fixed correctly (verified via direct `npx tsx` script) but the Next.js dev server served 40-minute-old compiled code from `.next/`. Five successive "fixes" appeared to do nothing — all were correct but never executed. Required `rm -rf .next/cache && pnpm dev` to pick up changes to `src/lib/` files imported transitively by server routes. |

### Graduation
Graduated to steering `#11a-test-expectations-digest` (2026-06-09). Card retained for full evidence history.
