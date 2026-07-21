# Known Tensions

Unresolved tradeoffs this project navigates. These don't have a "right" answer — they have a current default that shifts based on context.

## Template

### {Tension Name}

**Side A:** {First valid concern}
**Side B:** {Opposing valid concern}
**Current default:** {Which side we lean toward and why}
**When to deviate:** {Conditions that flip the default}
**Evidence:** {Session or file where this tension surfaced}

---

## Example Tensions

### DRY vs Locality

**Side A:** Extract shared code to reduce duplication
**Side B:** Keep code co-located for readability and independence
**Current default:** Extract at 2+ uses, but only if the abstraction is stable
**When to deviate:** If the "shared" code is still evolving, keep it inline until it stabilizes
**Evidence:** Multiple sessions where premature extraction caused coupling

### Strict Types vs Ergonomics

**Side A:** Maximum type safety catches bugs at compile time
**Side B:** Overly strict types slow development and create boilerplate
**Current default:** Strict for public APIs and data boundaries, pragmatic for internal implementation
**When to deviate:** Prototype code can use looser types, but tighten before merging

### Performance vs Developer Experience

**Side A:** Optimize for runtime performance
**Side B:** Optimize for code clarity and development speed
**Current default:** Ship fast, measure, optimize only measured bottlenecks
**When to deviate:** Known hot paths (render loops, API handlers) get perf attention upfront
