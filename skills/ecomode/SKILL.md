---
name: ecomode
description: DEPRECATED shim — cost-optimized execution modifier. Do not route here; use the `ultrawork` skill for maintained high-throughput parallel execution instead.
agent_created: true
triggers: ["ecomode", "eco mode", "cheaper agents"]
---

> Ported from oh-my-codex `ecomode`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ecomode (deprecated)

**Hard-deprecated. Do not invoke or route this skill.** Cost-optimized execution is
now handled by the `ultrawork` skill (high-throughput parallel execution).

- For "don't stop until done" loops, use `ultrawork`.
- For parallelism, use `ultrawork` (it spawns teammates via the Agent tool).
- For lighter-weight model selection when spawning agents, see
  `references/agent-tiers.md`.

This file exists only to preserve the catalog-visible `ecomode` compatibility
contract while canonical execution guidance is handled by `ultrawork`.

## What Ecomode Used To Do (historical)

It preferred cheaper model tiers for delegated work:

| Default Depth | Ecomode Preference |
|---------------|--------------------|
| thorough | standard, thorough only if essential |
| standard | cheap first, standard if needed |
| cheap | cheap — no change |

The underlying principle — *prefer the lightest model that can do the job, escalate
only when needed* — is preserved in `references/agent-tiers.md` and should be applied
whenever you spawn teammates with the Agent tool.

## Disabling

No action needed: this skill is deprecated and is never auto-routed.
