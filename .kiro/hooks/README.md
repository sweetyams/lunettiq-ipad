# Universal Hooks

Hooks that ship with every Foundry Methodology project.

## Included Hooks

| Hook | Type | Default | Purpose |
|------|------|---------|--------|
| `git-safety-check.json` | preToolUse | enabled | Block destructive git commands (stash, reset --hard, clean -f) |
| `pre-commit-verify.json` | preCommit | enabled | Run verify pipeline before commits |
| `agent-spawn-env-check.json` | agentSpawn | enabled | Validate environment on session start |
| `file-guard-template.json` | preToolUse | disabled | Template for restricting agent file access |

## Customizing

### Enable/Disable
Set `"enabled": true` or `"enabled": false` in any hook file.

### File Guards
The file guard template is disabled by default. To use it:
1. Set `"enabled": true`
2. Edit the `rules` array to match your project structure
3. Define which agents can access which paths

### Adding Custom Hooks
Create a new `.json` file in `.kiro/hooks/` following the same structure.
Available trigger types: `preCommit`, `agentSpawn`, `preToolUse`, `userPromptSubmit`.
