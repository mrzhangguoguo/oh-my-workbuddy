---
name: ask-claude
category: utility
status: deprecated
description: Deprecated compatibility shim for Claude advisor requests. Use `ask` with the claude backend instead.
agent_created: true
triggers: ["ask claude", "claude advisor", "deprecated"]
---

> Ported from oh-my-codex `ask-claude`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ask Claude compatibility shim

Deprecated. Do not invoke or route this skill for new work.

Use `ask claude <question>` (the `ask` skill with the `claude` backend) directly for Claude advisor workflows. This file exists only to preserve the public/catalog-visible `ask-claude` skill contract while the canonical `ask` skill owns provider selection.

Task: {{ARGUMENTS}}
