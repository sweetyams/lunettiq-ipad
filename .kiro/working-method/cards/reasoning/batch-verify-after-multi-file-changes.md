## Method Card: Batch-Verify After Multi-File Changes

**Type:** reasoning
**Confidence:** medium
**Scope:** project-wide

### Trigger
When a task modifies 3+ files before declaring the work complete.

### Observed User Move
Repeated corrections where work was presented as done but `pnpm verify` failed, pages rendered broken, or types didn't compile. The pattern: make all changes → declare done → user discovers it doesn't work.

### Underlying Principle
Each file change introduces risk. Multi-file changes compound risk multiplicatively. Intermediate verification catches failures at the point of introduction rather than at the end when the cause is buried under subsequent changes. A broken file 3 changes ago is harder to diagnose than a broken file just changed.

### Applies When
- Modifying 3+ files in a single task
- Touching files in different layers (schema + handler + page)
- Any change that crosses a boundary (API shape + UI consumer)
- Changes to shared code (types, utilities, platform primitives)

### Reasoning
"Works in my head" is not verification. TypeScript might pass while the endpoint returns 404. The endpoint might return data while the page renders blank. The page might render while the published storefront shows stale content. Each layer needs its own verification.

### Future Agent Behaviour
1. After modifying 3+ files: run `pnpm tsc --noEmit --skipLibCheck` before continuing
2. After touching UI: visually verify the page renders (don't just check types)
3. After touching API + UI together: verify the full round-trip (API returns data → UI displays it)
4. After ALL changes: run `pnpm verify` before declaring done
5. If verification fails: fix before making more changes. Don't accumulate breakage.

### Counterbalance
Don't verify after every single line change in a 2-file fix. The threshold is 3+ files or crossing a layer boundary. Trivial renames across files don't need intermediate verification if the rename is mechanical.

### Risk If Overused
Excessive verification of trivial changes slows momentum. Single-file fixes and mechanical renames don't need intermediate checks. Use judgment: "If this is wrong, will I know immediately or will it be hidden?"

### Trigger Questions
- Have I modified 3+ files without running any verification?
- Did I cross a layer boundary (schema → handler → page)?
- Would the user see breakage if I'm wrong?
- Am I about to declare "done" — have I verified?

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-06-25 | methodology-review | Original | From steering voice-and-tone "After non-trivial changes: run the narrowest relevant check first" and "After UI changes: verify the page visually before committing" |

### Do Not Overapply
Single-file fixes. Mechanical renames. Documentation-only changes. Changes where `tsc` is sufficient verification.

### Decay / Review
Stable. Fundamental quality discipline.
