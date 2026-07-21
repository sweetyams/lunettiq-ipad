# Working Method

Shapes reasoning under ambiguity. Sits beside steering as an interpretive layer.

**Steering** constrains behaviour — what the AI must/must not do.
**Working Method** shapes reasoning — how to think when the answer isn't obvious.

## Files

| File | Purpose |
|---|---|
| `known-tensions.md` | Persistent unresolved tradeoffs to navigate |
| `decision-cards.md` | Architecture + systems reasoning patterns |
| `anti-patterns.md` | Repeated failure modes |

## Unified Card Template

```md
## Method Card: [Name]

**Type:** framing | architecture | workflow | taste
**Confidence:** high | medium | low
**Scope:** project-wide | feature-area | specific-domain

### Trigger
When this situation appears.

### Underlying Principle
The reusable judgement.

### Applies When
Specific contexts.

### Counterbalance
The opposing valid concern.

### Evidence
Session reference.
```

## Thinking Arcs

Saved as `arcs/YYYY-MM-DD-<slug>.md` when a session produces reusable reasoning.

## Lifecycle

1. **Capture** — pattern noticed during a session, added as a card
2. **Reinforce** — same pattern seen again, evidence added
3. **Graduate** — card promoted to a steering rule (enforced, not just advisory)
4. **Archive** — card subsumed by another or no longer applicable
