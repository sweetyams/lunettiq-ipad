---
name: review-prompts
description: "Meta-prompt: review all project prompts for clarity, platform-fit, and improvement opportunities"
arguments:
  - name: focus
    description: "Which prompt(s) to review (e.g. 'scribe', 'all', 'fresh-eyes fit-and-finish'). Defaults to all."
    required: false
---

Review and improve prompts in `.kiro/prompts/`{{#focus}} (focus: {{focus}}){{/focus}}.

## Purpose

Prompts are protocols — they tell the agent *how* to approach a job. Like steering rules, they degrade if they're vague, overly generic, or misaligned with the project's actual stack and workflow. This meta-review catches that drift.

## Process

### 1. Read each prompt
{{#focus}}Read the specified prompt(s): {{focus}}{{/focus}}{{^focus}}Read all `.md` files in `.kiro/prompts/`{{/focus}}

### 2. Evaluate against criteria

For each prompt, score 1-5 on:

| Criterion | What it means |
|---|---|
| **Platform fit** | Does it reference this project's actual tools, commands, and patterns? Or is it generic? |
| **Actionability** | Can the agent follow it step-by-step without ambiguity? |
| **Exit clarity** | Is it clear what "done" looks like? |
| **Steering integration** | Does it reference relevant steering rules, or operate in isolation? |
| **Efficiency** | Does it avoid unnecessary steps for this project's stack? |

### 3. Identify improvements

For each prompt scoring <4 on any criterion:
- **Platform fit <4:** Add project-specific commands, tools, file patterns, or conventions
- **Actionability <4:** Replace vague instructions with concrete steps
- **Exit clarity <4:** Add explicit exit criteria or output format
- **Steering integration <4:** Reference specific steering file numbers
- **Efficiency <4:** Remove steps that don't apply to this stack, add shortcuts

### 4. Propose changes

For each prompt that needs improvement, show:
```
## {prompt name} — Score: {avg}/5

### Current weakness
{What's vague, generic, or misaligned}

### Proposed change
{The specific edit — show the new section/lines}

### Why
{What this fixes in practice}
```

### 5. Apply (with confirmation)

After presenting all proposals, ask: "Apply these improvements?"
- If yes → edit the prompt files
- If partially → ask which ones to apply

## Platform Adaptation Guidance

When improving prompts for a specific platform, consider:

| Platform | What prompts should reference |
|---|---|
| Shopify Theme | `shopify theme check`, Liquid linting, section schema, theme editor testing |
| Expo/React Native | `expo start`, TypeScript strict, Jest/Testing Library, EAS build |
| Next.js/PWA | `next build`, Lighthouse CI, service worker, SSR/SSG validation |
| iOS Swift | `xcodebuild`, Swift Testing, SwiftUI previews, Accessibility Inspector |
| General TypeScript | `tsc --noEmit`, ESLint, Vitest/Jest, package.json scripts |

## Rules

- Don't make prompts longer just to be thorough — brevity is a feature
- Don't duplicate steering rules inside prompts — reference them
- Platform-specific additions go in the prompt, not in universal steering
- If a prompt is fine as-is, say so (not everything needs changing)
- Track improvements as findings if they reveal a systemic gap
