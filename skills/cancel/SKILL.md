---
name: cancel
description: Abort the current WorkBuddy workflow — stop background agents/processes, clear in-progress tasks, and hand back control to the user
agent_created: true
triggers: ["cancel", "stop", "abort", "cancel this", "stop the task"]
---

> Ported from oh-my-codex `cancel`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Cancel

The standard, safe way to stop whatever is currently running and exit cleanly.

WorkBuddy has no persistent "mode" state like OMX's `.omx/state/*.json`, so there is
nothing to terminalize across sessions — but in-progress work within the current session
can still be stopped. Use this skill whenever the user says "cancel", "stop", "abort", or
asks to halt the current flow.

## What It Does

1. **Stop background work.** If any background shell command (started with `run_in_background`)
   is running, stop it with the TaskStop tool (or send its `task_id`).
2. **Stop spawned agents.** If any Agent tool calls are still in flight, let them finish their
   current message or stop them; do not start new ones.
3. **Clear the task list.** Mark every `in_progress` task as `completed` only if it is genuinely
   done; otherwise set it back to `pending` so it is not silently lost, or delete it. Do not leave
   phantom `in_progress` items.
4. **Preserve recoverable progress.** Anything worth keeping (files written, decisions made) should
   already be on disk or in `.workbuddy/memory/YYYY-MM-DD.md`. Do not delete user files.
5. **Report and yield.** Tell the user what was stopped and what (if anything) remains, then stop.
   Do not auto-continue into another workflow.

## Usage

```
/cancel
```

Or say: "cancel", "stop", "abort".

## Force / Full Reset

WorkBuddy sessions are stateless between turns, so a simple "stop" already resets the flow.
Use `--force` / `--all` semantics only to also:

- Clear **all** in-progress and pending tasks from the task list (not just the current one).
- Remove any `.workbuddy/memory` scratch notes you created for this run if the user wants a clean slate.

Example:

```
/cancel --force
```

## Notes

- **Safe by default:** only the current session's in-flight work is affected; never touch unrelated
  files, other sessions, or global config.
- **Resume-friendly:** written files and memory entries survive a cancel, so the user can pick up
  later without re-doing completed work.
- **No destructive deletion:** cancelling never deletes the user's source, git history, or installed skills.
