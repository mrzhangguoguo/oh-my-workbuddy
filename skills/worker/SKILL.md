---
name: worker
category: execution
status: active
description: 'Protocol for a unit of work assigned to a WorkBuddy subagent (Agent tool) — ACK, claim-safe lifecycle, evidence-backed completion, and clean blocking escalation. Triggers: "worker protocol", "subagent task lifecycle", "claim task", "team worker".'
agent_created: true
triggers: ["worker protocol", "subagent task lifecycle", "claim task", "team worker"]
---

> Ported from oh-my-codex `worker`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Worker Protocol (WorkBuddy subagent)

This skill describes the discipline a WorkBuddy **subagent** (spawned via the Agent tool) should
follow when a leader assigns it a unit of work. In OMX this was a tmux-pane Team worker driven by
`omx team api`; in WorkBuddy there is no tmux runtime or `omx` binary. Coordination happens
through (a) the Agent's returned result, and (b) optional shared artifacts under
`.omw/team/<team>/`. The value preserved here is the *claim-safe lifecycle, ACK-readback, and
evidence discipline* — not the transport.

## Identity

A worker is created by a leader who spawns an Agent with a clear identity and task. The identity
looks like:

`<team-name>/worker-<n>` — e.g. `alpha/worker-2`.

Pass the identity and the full task into the Agent prompt. There is no `OMX_TEAM_WORKER` env
var to read; the prompt is the source of truth.

## Startup Protocol (ACK)

1. Parse the assigned identity into `teamName` (before `/`) and `workerName` (after `/`).
2. Send a startup ACK **before** task work: in your first response (or as the first line of your
   returned result), state one short deterministic line, e.g. `ACK: worker-2 initialized`.
3. After ACK, proceed to the assigned task.

If the team uses a durable mailbox artifact, write the ACK to
`.omw/team/<teamName>/mailbox/<workerName>.md`; otherwise the ACK lives in your returned message.

## Inbox + Tasks

1. Read the task from the Agent prompt (the leader embeds the task directly — there is no separate
   inbox file to poll).
2. If the team uses durable task files, read
   `.omw/team/<teamName>/tasks/task-<id>.json`; otherwise work from the prompt.
3. Pick the first unblocked task assigned to you.
4. **Claim the task (do NOT start work without a claim)**: record
   `{"state":"in_progress","owner":"<workerName>"}` via TaskUpdate on the shared task list, or
   write it to the task file / `.omw/team/<teamName>/workers/<workerName>/status.md`.
5. Do the work.
6. **Complete/fail via lifecycle transition**: move the task to `completed` or `failed` with a
   short `result`/`error` note — TaskUpdate on the task list, or write to the task file. Do not
   leave lifecycle fields ambiguous.
7. Write your worker status back:
   `.omw/team/<teamName>/workers/<workerName>/status.md` with `{"state":"idle", ...}` (or mark the
   corresponding task done in the task list).

## Mailbox

Check for messages addressed to you:

`.omw/team/<teamName>/mailbox/<workerName>.md`

When notified, read messages and follow any instructions. Use short ACK replies when appropriate.
Note: in WorkBuddy the primary delivery channel is the Agent's returned result to the leader;
a mailbox file is only needed when work spans multiple turns or multiple workers must coordinate.

## Dispatch Discipline (state-first)

Treat team state (task list / shared artifacts) as the source of truth.

- Prefer the task list (TaskCreate/TaskUpdate) and `.omw/team/<teamName>/...` artifacts.
- Do **not** rely on ad-hoc nudges as a primary delivery channel.
- If a manual trigger arrives, treat it only as a prompt to re-check state and continue through
  the normal claim-safe lifecycle.

## Team Big Five / ATEM Coordination Gate

Keep independent fan-out lightweight: if your task is isolated with no shared files, dependencies,
or handoffs, normal startup ACK, claim-safe lifecycle, status, verification, and completion
evidence are sufficient.

When your task activates the Team Big Five / ATEM-inspired protocol (dependencies, shared
files/surfaces/contracts, handoffs, integration, blocked lanes, or changed assumptions), use this
concise boundary checklist:

- **Shared mental model / single source of truth**: treat the task spec, inbox, mailbox, approved
  handoff, and leader updates as canonical.
- **Closed-loop communication / ACK-readback**: acknowledge handoffs with what you understood,
  affected artifact/path, owner, and next action.
- **Mutual performance monitoring**: check boundary contracts, shared files, and verification
  evidence before completion.
- **Backup/reassignment behavior**: if blocked, write blocked status with the smallest needed
  help/reassignment request and continue any safe unblocked slice.
- **Adaptability checkpoint**: changed assumptions, dependencies, or verification results require
  a brief leader-facing update before widening scope.
- **Team orientation**: optimize for the integrated team result; report integration risks, missing
  tests, and peer impacts instead of local-only success.

## Completion evidence

Always return, in your result, enough to verify the work:
- what changed (files/paths),
- the verification command run and its output (build/typecheck/test),
- any manual QA notes,
- remaining differences or open risks.

## Shutdown

If the leader signals shutdown (via the prompt or mailbox), stop accepting new work, write your
shutdown ack to `.omw/team/<teamName>/workers/<workerName>/shutdown.md`, and end your turn.
