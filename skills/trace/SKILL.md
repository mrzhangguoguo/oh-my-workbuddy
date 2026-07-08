---
name: trace
category: utility
status: deprecated
description: Deprecated trace/runtime-inspection shim. Use normal repo inspection (Read, Grep, Glob, Bash) instead.
agent_created: true
triggers: ["trace", "runtime trace", "inspect execution"]
---

> Ported from oh-my-codex `trace`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Trace — deprecated

Hard-deprecated. Do not invoke or route this skill.

When you need trace/runtime evidence, use WorkBuddy-native inspection instead:
- **Source navigation:** `Grep` / `Glob` / `Read` to follow call paths.
- **Runtime behavior:** run the project's own test/debug/observability commands via `Bash`.
- **State inspection:** read relevant files directly (no `.omx/` state directory exists).

If a dedicated investigation skill fits the request better, invoke it via the Skill tool (e.g. `skill: research` for deep investigation, `skill: analyze` for code analysis).
