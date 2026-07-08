---
name: hud
category: display
status: active
description: Inspect live progress of long-running or multi-step work. WorkBuddy has a built-in status display; this skill explains how to read progress via the task list and memory. Trigger "show progress", "what's the status", "hud", "where are we".
agent_created: true
triggers: ["show progress", "what's the status", "hud", "where are we"]
---

> Ported from oh-my-codex `hud`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# HUD (progress inspection)

In OMX, the HUD was a TUI statusline plus an `omx hud` CLI that read `.omx/state/*`
files. **WorkBuddy has a built-in status display** — there is no separate HUD to
configure, and no `.omx/` state to read. This skill is a short guide to inspecting
progress using WorkBuddy-native surfaces.

## How to inspect progress

### 1. Task list (primary, real-time)
The task list is the canonical "HUD" for any multi-step or autonomous work.

- Use **TaskList** to see every tracked task with its status
  (`pending` / `in_progress` / `completed` / `deleted`) and owner.
- Use **TaskGet** on a specific task id to see its full description, dependencies
  (`blockedBy`), and any notes.
- Use **TaskUpdate** to flip a task to `in_progress` or `completed` as work advances.

This replaces OMX's "modes / turns / activity" HUD entirely — each workflow phase is
a task row you can watch update live.

### 2. Memory (durable, cross-session)
For state that must survive across sessions or be summarized for the user, append to:

```
.workbuddy/memory/YYYY-MM-DD.md
```

Use this for: last completed milestone, current phase, open decisions, and handoff
notes. It is the durable analogue of OMX's `.omx/state/*.json`.

### 3. Built-in status display
WorkBuddy's own UI already shows model, current directory, and session context. No
configuration (no `config.toml` `[tui] status_line`, no `.omx/hud-config.json`) is
needed or available.

## Color / severity heuristic

When summarizing progress for the user, reuse a simple traffic-light convention:

- **Green** — on track / healthy.
- **Yellow** — caution (e.g. a task >70% through its budget, or a slow step).
- **Red** — blocked / critical (a task is blocked, or a step failed).

## What this skill does NOT do

- It does not run any `omx hud` command (no such command exists in WorkBuddy).
- It does not read or write `.omx/` state (that directory does not exist here).

To inspect progress, simply read the task list and/or today's memory file.
