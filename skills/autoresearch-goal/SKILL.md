---
name: autoresearch-goal
category: research
status: active
description: Durable professor-critic research workflow bound to a tracked goal, with validation-gated completion. Use when a research mission needs ongoing goal-focused management plus professor/critic-style validation.
agent_created: true
triggers: ["autoresearch-goal", "research goal", "professor critic research", "validated research mission"]
---

> Ported from oh-my-codex `autoresearch-goal`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Autoresearch Goal

Use this workflow when a research mission should be bound to a tracked goal while WorkBuddy remains the durable state owner. This is for research projects that need goal-focused management plus professor/critic-style validation; it is not the default answer for ordinary pre-planning best-practice lookup.

## Boundary

- Do **not** claim shell commands mutate hidden external goal state — WorkBuddy tracks the goal locally.
- Do **not** edit upstream tooling or add dependencies to satisfy a goal lifecycle.
- Track goal status with the **task list** (TaskCreate/TaskUpdate) and persist durable artifacts under `.omw/autoresearch-goal/<slug>/`.
- Treat the goal as "complete" only via the local completion gate below, not via an external tool's hidden state.

## Artifacts

`autoresearch-goal` writes:
- `.omw/autoresearch-goal/<slug>/mission.json`
- `.omw/autoresearch-goal/<slug>/rubric.md`
- `.omw/autoresearch-goal/<slug>/ledger.jsonl`
- `.omw/autoresearch-goal/<slug>/completion.json`

## Flow

1. Create the mission and professor-critic rubric. Capture in `.omw/autoresearch-goal/<slug>/mission.json` and `rubric.md` (topic, rubric, and the critic command/prompt).
2. Emit the model-facing handoff: summarize the mission + rubric so the active session has a clear objective.
3. Track the goal with the task list; mark it active as the intended objective.
4. Research iteratively against the rubric. Record every critic outcome in `.omw/autoresearch-goal/<slug>/ledger.jsonl` via the verdict command (verdict `pass`|`fail`|`blocked` + evidence).
5. Completion is blocked until professor-critic validation records `verdict=pass`. After the mission audit passes, mark the task-list goal `complete` and record `.omw/autoresearch-goal/<slug>/completion.json` with the matching goal snapshot.
6. Treat the completion step as durable local state reconciliation; do not mutate external goal state through shell commands or hooks.
7. After completion, clear the active goal in the task list before starting another same-session goal.

## Completion gate

A passing professor-critic artifact and a matching completed goal snapshot (task-list status `complete`) are required. Assistant prose, partial tests, or a failed/blocked verdict are not sufficient.

Lifecycle: the task-list goal starts active when the mission is created, and is marked `complete` after the professor-critic and audit pass. Local artifacts reconcile snapshots and record the cleanup step; they must not mutate hidden external goal state.
