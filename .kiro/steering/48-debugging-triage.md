---
inclusion: auto
foundry-method: universal
version: "2026.07.1"
---

# Debugging Triage

When something is reported broken, do NOT immediately assume the fix is in code. Triage from the outside in:

## Order of investigation

1. **Environment** — browser extensions, VPN, DNS, device settings, firewalls, proxy
2. **Network** — can the server reach the endpoint? Can the client? Are they different?
3. **Configuration** — env vars, settings, deploy state, domain config
4. **Code** — only after 1–3 are ruled out

## Questions to ask early

- "Does it work in a different environment?" (rules out local config)
- "Is this happening locally, in production, or both?" (narrows the layer)
- "Did anything change recently outside the code?" (deploys, DNS, new settings)
- "Can you reach the failing endpoint directly?" (isolates network vs auth)

## Anti-pattern: tunnel vision

Do NOT iterate on code fixes when the symptom is clearly environmental. If the same code works elsewhere, the problem isn't the code.

## When the bug IS in code: trace backward

1. Find where the error manifests (the symptom)
2. Ask: "what called this with bad data?"
3. Trace one level up — repeat until you find the SOURCE
4. Fix at the source, not at the symptom point

If 2+ fixes at the same layer haven't resolved it, the cause is one layer deeper.

## Probe the Data Source

When output is wrong, trace backward to the data source before modifying rendering logic. Query the actual endpoint with real IDs. If the API returns wrong data, the fix is in the query/handler — not the component.
