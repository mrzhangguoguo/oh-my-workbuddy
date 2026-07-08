---
name: my-skill
category: execution
status: active
description: One-line summary of what this skill does, including natural trigger phrases. Use when the user says "my-skill", "do X", or needs Y.
agent_created: true
triggers: ["my-skill", "do x", "needs y"]
---

> Ported from oh-my-codex `<name>` (delete this line if not a port).
> OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory)
> are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# My Skill

One-paragraph purpose: what this skill accomplishes and when it should activate.

## When to Use
- Trigger condition 1
- Trigger condition 2

## Do Not Use When
- Anti-condition 1 (route to another skill instead)

## Workflow
1. Step one — concrete action with the WorkBuddy tool to use (e.g. "Read the relevant files", "spawn an Agent with subagent_type=Explore").
2. Step two — decision point and criteria.
3. Step three — produce the handoff artifact (e.g. append to `.workbuddy/memory/YYYY-MM-DD.md`).

## Output / Handoff
- Describe the deliverable: a file path, a memory note, a task-list update, etc.

## Notes
- Keep WorkBuddy-native: prefer the Skill tool, Agent tool, TeamCreate, SendMessage, Task tools, `.workbuddy/` paths.
- Do NOT leave Codex/tmux/`omx`-CLI instructions.
