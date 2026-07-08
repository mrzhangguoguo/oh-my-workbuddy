---
name: ask-gemini
category: utility
status: deprecated
description: Deprecated compatibility shim for Gemini advisor requests. Use `ask` with the gemini backend instead.
agent_created: true
triggers: ["ask gemini", "gemini advisor", "deprecated"]
---

> Ported from oh-my-codex `ask-gemini`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ask Gemini compatibility shim

Deprecated. Do not invoke or route this skill for new work.

Use `ask gemini <question>` (the `ask` skill with the `gemini` backend) directly for Gemini advisor workflows. This file exists only to preserve the public/catalog-visible `ask-gemini` skill contract while the canonical `ask` skill owns provider selection.

Task: {{ARGUMENTS}}
