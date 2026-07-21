---
name: capture-method
description: "Extract a reusable reasoning pattern from this session and save as a working method card"
arguments:
  - name: pattern
    description: "Brief name for the pattern (e.g. 'verify data before building its view')"
    required: false
---

Extract a reusable method card from this session{{#pattern}}: "{{pattern}}"{{/pattern}}.

## When to Use

Trigger this when you notice:
- A reasoning approach that worked well and would help in future sessions
- A decision framework that resolved ambiguity
- A failure mode that was recovered from in a reusable way
- A recurring judgment call that now has a clear heuristic

## Card Format

Write to `.kiro/working-method/cards/{category}/{slug}.md`:

```markdown
## Method Card: {Name}

**Type:** framing | architecture | workflow | taste | decision
**Confidence:** high | medium | low
**Scope:** project-wide | feature-area | specific-domain

### Trigger
When this situation appears.

### Underlying Principle
The reusable judgement (one sentence).

### Applies When
- Specific condition 1
- Specific condition 2

### Counterbalance
The opposing valid concern that makes this a tension, not a law.

### Evidence
- Session: {date} — {what happened}
- Outcome: {what the pattern produced}

### Future Agent Behaviour
What the agent should do differently next time this trigger appears.
```

## Rules

- Every card MUST have evidence (no speculative patterns)
- Every card MUST have a counterbalance (no absolutes)
- Cards are heuristics, not laws — they guide, they don't override
- If the pattern is strong enough to be mandatory, promote it to steering instead
- Category: `decision/`, `architecture/`, `reasoning/`, `anti-pattern/`

## Graduation Path

```
Session observation → Method card (heuristic)
                         ↓ (2+ evidence entries)
                   Steering rule (enforceable)
```
