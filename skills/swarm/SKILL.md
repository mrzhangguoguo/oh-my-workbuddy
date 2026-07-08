---
name: swarm
category: execution
status: deprecated
description: Deprecated compatibility shim for team execution. Use `team` (Agent-tool coordination) instead.
agent_created: true
triggers: ["swarm", "swarm mode", "parallel agents"]
---

> Ported from oh-my-codex `swarm`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Swarm — deprecated

Hard-deprecated. Do not invoke or route this skill for new work.

Use the `team` skill (`skill: team`) instead. In WorkBuddy, coordinated multi-agent execution is done by spawning teammates with the **Agent tool** against a shared task list — there is no `omx team` tmux runtime to invoke. This file exists only to preserve the catalog-visible `swarm` contract while `team` owns coordinated execution.
