---
name: note
category: shortcut
status: deprecated
description: DEPRECATED shim. Use the WorkBuddy memory surface `.workbuddy/memory/YYYY-MM-DD.md` directly when you need to persist notes.
agent_created: true
triggers: ["note", "take a note", "save note"]
---

> Ported from oh-my-codex `note`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Note (deprecated)

**Hard-deprecated. Do not invoke or route this skill.**

To persist notes in WorkBuddy, append directly to the daily memory file:

```
.workbuddy/memory/YYYY-MM-DD.md
```

Use this for durable cross-session notes instead of a dedicated `note` skill. For
ephemeral progress tracking, prefer the task list (TaskCreate/TaskUpdate).

This file exists only to preserve the catalog-visible `note` compatibility contract.
