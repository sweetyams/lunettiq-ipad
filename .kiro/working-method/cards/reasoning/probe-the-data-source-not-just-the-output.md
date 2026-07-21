## Method Card: Probe the Data Source, Not Just the Output

**Type:** architecture
**Confidence:** high
**Scope:** project-wide

### Trigger
When a feature works correctly but the user questions where its input data comes from.

### Observed User Move
After bilingual labels were implemented and working, asked "where is this locale set?" — then identified that the source (storefront locale) was wrong for the context (admin UI language).

### Underlying Principle
A feature can produce correct output from the wrong source. When the user questions the source rather than the output, they're identifying a coupling that will break in a different context. The fix is not to change the output but to introduce a proper resolution chain for the input.

### Applies When
- A value is inherited from a parent context without explicit ownership
- The same field serves two different purposes (storefront language vs admin language)
- A "default" is being used where a "preference" should exist

### Reasoning
Conflating two concerns behind one field works until the concerns diverge. Storefront locale and admin UI language are the same today for both tenants, but they're conceptually independent. A French bakery might want English admin for anglophone staff. The moment you notice "this field serves two masters," introduce a resolution chain.

### Future Agent Behaviour
When implementing a feature that reads from project context:
1. Ask: "Is this the right source for this specific use case?"
2. Ask: "Could this value need to differ from its current source in another context?"
3. If yes: introduce a resolution chain (user pref > specific setting > inherited default)
4. Don't wait for the user to ask "where does this come from?"

### Counterbalance
Not every inherited value needs its own resolution chain. If two concerns are genuinely always the same (e.g., project currency for both storefront and admin), adding a separate admin currency setting is over-engineering.

### Risk If Overused
Every context value gets its own 4-layer resolution chain, creating a maze of overrides that's impossible to debug.

### Trigger Questions
- Does this value serve exactly one purpose, or could it diverge?
- Would a different user on the same project need a different value?
- Is the current source the "owner" of this concern, or just a convenient default?

### Evidence
2026-05-21-reports-hub-scoping: User asked "isnt the locale for storefront?" after seeing admin bilingual wired to ctx.locale. Led to 4-layer resolution: user Clerk metadata > project admin_locale > project locale > 'en'.

### Do Not Overapply
When the source genuinely owns the concern. When adding a resolution chain would confuse rather than clarify. When there's no realistic scenario where the values would diverge.

### Emergence Notes
The correction arrived as a single question ("isnt the locale for storefront?") that reframed the entire implementation. The agent had the right output (bilingual labels) from the wrong source (storefront locale). The question dissolved the assumption without rejecting the work.

### Decay / Review
Stable. Review if the platform simplifies to single-locale projects.

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-21 | reports-hub-scoping | Original | Storefront locale conflated with admin language; resolved with 4-layer chain |
| 2026-05-23 | table-nesting-systemic-fix | Reinforced | Types (component rename) → computable (ESLint rule) → enforceable (Playwright crawl). Each layer prerequisite for the next. |
| 2026-06-01 | cake-pricing-source-of-truth | Reinforced | Three competing sources of truth (grid cells, pricing groups, Shopify variants). Resolved: grid cells own structure, Shopify variants own current prices, pricing groups own editable state. |

### Graduated
Graduated to `.kiro/steering/48-debugging-triage.md` (Probe the Data Source section) on 2026-06-25.
