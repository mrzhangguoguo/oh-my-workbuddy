---
name: deepsearch
description: Deprecated shim — use the `analyze` skill for deep repository analysis or repo inspection tools (Read/Grep/Glob/Bash) for fast repo-local lookup
agent_created: true
triggers: ["deepsearch", "deep search"]
---

> Ported from oh-my-codex `deepsearch`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Deepsearch — deprecated

Hard-deprecated. Do not invoke or route this skill.

For deep repository analysis, use the `analyze` skill (`skill: analyze`). For fast
repo-local lookup, use the normal inspection tools (Read, Grep, Glob, Bash) directly
— there is no `$macro` or `omx explore` command in WorkBuddy.
