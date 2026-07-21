---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
description: Compose from existing before creating new.
---

# Foundations First

Build bottom-up: use existing primitives before creating new ones.

## The Rule

Before creating anything new, check if the building blocks already exist:
1. Search for existing components/utilities that do what you need
2. If they exist — use them, don't reinvent
3. If they partially exist — extend or compose, don't duplicate
4. If nothing exists — create the primitive first, then compose your feature from it

## Decision Framework

Before writing new code, ask:
1. Does a component/utility already exist for this? → **Use it**
2. Does a partial solution exist? → **Extend it**
3. Will this pattern repeat (2+ uses)? → **Extract a reusable primitive first**
4. Is this truly one-off? → **Write inline, but keep it composable**

## Anti-Patterns

- ❌ Copy-pasting from another file instead of extracting shared code
- ❌ Installing a library for something achievable in 60 lines
- ❌ Creating a new utility without searching for an existing one
- ❌ Building a feature-specific solution when the pattern is reusable
