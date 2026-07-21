---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
---

# Working Method Digest

Proven patterns that apply broadly. Auto-promoted from method cards with 2+ evidence entries.

1. **System Boundary First** — Identify the owning layer before implementing. Decide: instance fix, pattern fix, or governance fix.

2. **Verify Data Before Building Its View** — Before building UI over data, spot-check it against the source. Treat "0 of everything" as a parser smell. A 5-minute diagnostic prevents hours building on broken foundations.

3. **Trace Before Fixing** — When a fix fails twice, stop iterating. The mental model is wrong, not the parameters. Measure at the layer boundary.

4. **Spec as Framework** — Extract intent from specs and designs. Don't execute literally without thinking consequences. Ask what else this touches.

5. **Verify After Changes** — Run the verify command after code changes. Type errors + lint + tests must pass before reporting done.

6. **Surgical Changes** — Touch only what the task requires. Don't improve adjacent code. Match existing style. Remove only what YOUR changes made unused.

7. **Enforce Prevention Alongside Fix** — When fixing a class-level bug: (1) fix all existing instances, (2) add a steering rule, (3) add a lint pattern if detectable. A fix without enforcement is temporary.

8. **Steal Patterns, Don't Install Frameworks** — When an external library has good architecture, read its source and extract the useful logic. Don't add a dependency for conventions you can write in 60 lines.

9. **Never Destroy Working Tree State** — Before any git operation that modifies the tree, commit first. `git stash` is banned. Lost work is unrecoverable; messy history is always fixable.

10. **Component Context Over Semantic Correctness** — When a component was designed for a different visual context, go one layer deeper to the underlying primitive rather than fighting the wrapper's assumptions.

11. **Structured Scoping Questions** — For multi-dimensional feature requests, present 2-4 numbered multi-choice questions. Parse compressed answers for both option selection AND inline priority signals.

12. **Audit Before Fix** — When a specific symptom reveals a systemic gap, map the entire surface area of the problem class before fixing the one instance.

13. **Build the Mechanism, Not the Script** — Fix mechanisms should be the same code path that handles new data. One-time scripts that fix today's shapes break on tomorrow's edge cases.
