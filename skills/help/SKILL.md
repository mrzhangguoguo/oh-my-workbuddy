---
name: help
description: DEPRECATED shim. Use the `omx-setup` skill for install/setup and the `doctor` skill for troubleshooting instead.
agent_created: true
triggers: ["help", "how to install", "troubleshoot skills"]
---

> Ported from oh-my-codex `help`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Help (deprecated)

**Hard-deprecated. Do not invoke or route this skill.**

- For setup and install guidance, invoke the `omx-setup` skill.
- For installation diagnostics and fixes, invoke the `doctor` skill.

This file exists only to preserve the catalog-visible `help` compatibility contract.
