# Agents

Agent configurations define AI assistant roles, access boundaries, and workflow rules.

## Primary Agent (default)

Every project gets a primary agent with full access. This is the agent you interact with for general development work.

## When to Add Scoped Agents

Add a scoped agent when:
- A specific workflow should only touch certain files (e.g., design agent limited to components)
- You want different verification steps for different areas
- Multiple people work on the same project with different agent permissions

## Creating a Scoped Agent

1. Create `<name>.json` in `.kiro/agents/`
2. Set `access.files` to restrict file paths
3. Set `access.tools` to limit available tools
4. Reference from file-guard hooks if needed

## Example: Design-only Agent

```json
{
  "name": "Design Agent",
  "description": "Scoped to UI components and styling only.",
  "access": {
    "files": ["src/components/**", "src/ui/**", "src/styles/**"],
    "tools": ["read", "write", "search"]
  }
}
```
