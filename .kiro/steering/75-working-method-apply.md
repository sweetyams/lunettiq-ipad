---
inclusion: manual
foundry-method: universal
version: "2026.07.1"
description: Working method trigger classification — when and how to activate the working method layer.
---

# Working Method Apply

Classify the task before starting. The working method layer activates at different levels.

## Trigger Levels

**L0 — No working method.** Steering only. Simple edits, factual lookups, formatting, narrow bug fixes, mechanical conversions.

**L1 — Light working method.** 2-3 relevant heuristics. Spec cleanup, small refactors, naming decisions, minor choices within known patterns.

**L2 — Active working method.** Project reasoning patterns and known tensions. Architecture decisions, product design, tradeoff analysis, multi-file restructuring.

**L3 — Reflective working method.** Analyze the interaction itself. Extract or update patterns. Repeated refinement loops, strategy sessions, method capture.

## Classification Heuristic

```
Is this executional with a clear spec?           → L0
Is this a small decision within known patterns?  → L1
Is this strategic, ambiguous, or architectural?  → L2
Is this a repeated refinement or meta-analysis?  → L3
Is this a direct user instruction?               → User prompt wins
```

## How to Apply (L1-L2)

1. Check `.kiro/working-method/` for relevant patterns
2. Apply silently unless the user asks for reasoning
3. If the method conflicts with user instruction, follow the user

## Do Not

- Treat the working method as rigid rules — they are heuristics
- Quote method cards verbatim in every response
- Let the working method override explicit user instructions
