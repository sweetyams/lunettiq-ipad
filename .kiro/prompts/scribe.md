---
name: scribe
description: "Document what was built, decided, and learned. Produces structured session notes or project documentation from the work just done."
arguments:
  - name: scope
    description: "What to document (e.g. 'this session', 'the feature we just built', 'architecture decisions'). Defaults to current session."
    required: false
  - name: output
    description: "Where to write (e.g. 'docs/sessions/', 'docs/architecture/', 'README'). Defaults to docs/sessions/."
    required: false
---

Scribe: document{{#scope}} {{scope}}{{/scope}}{{^scope}} this session{{/scope}}.

## Purpose

Capture what happened into durable documentation while context is fresh. Don't rely on memory — write it down now.

## Output Formats

### Session Notes (default)
Write to `{{#output}}{{output}}{{/output}}{{^output}}docs/sessions/{{/output}}YYYY-MM-DD-{slug}.md`:

```markdown
# {Date} — {Topic}

## What Was Done
- {Concrete deliverable 1}
- {Concrete deliverable 2}

## Decisions Made
| Decision | Rationale | Alternatives Considered |
|---|---|---|
| {choice} | {why} | {what else was possible} |

## Architecture / Design Notes
{Diagrams, data flows, component relationships — anything structural}

## Findings
{Patterns discovered, gotchas, things to remember}

## Open Questions
- {Things not yet resolved}

## Next Steps
- {What follows from this work}
```

### Feature Documentation
When documenting a feature (not a session), write to the appropriate docs location:

```markdown
# {Feature Name}

## Overview
{What it does, why it exists}

## How It Works
{Architecture, data flow, key components}

## Files
| File | Purpose |
|---|---|
| `path` | {role} |

## Usage
{How to use it, examples, commands}

## Decisions
{Key choices and why}
```

### Architecture Decision Record
When documenting a significant decision:

```markdown
# ADR-{NNN} — {Title}

## Status
{proposed | accepted | deprecated | superseded}

## Context
{What forces are at play}

## Decision
{What we chose}

## Consequences
{What follows — good and bad}
```

## Rules

- Write while context is fresh — don't defer documentation
- Be specific: file names, line numbers, concrete examples
- Decisions need rationale (not just "we chose X" but "we chose X because Y")
- Include what was tried and rejected (saves future re-derivation)
- Link to related docs/steering/findings
- Don't duplicate steering rules — reference them instead
