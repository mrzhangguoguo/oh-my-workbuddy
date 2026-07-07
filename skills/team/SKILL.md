---
name: team
description: Coordinate N parallel agents on a shared task list using the Agent tool. Use for multi-lane execution, fan-out, and shared delivery+verification.
agent_created: true
triggers: ["team", "coordinate agents", "parallel execution", "fan out", "spawn teammates", "multi-agent"]
---

> Ported from oh-my-codex `team`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Team Skill

`team` is WorkBuddy's coordinated multi-agent execution mode. There is no tmux runtime or `omx team` CLI — coordination is built from the **Agent tool** (for teammates), the **task list** (shared board), and **memory** (durable handoffs).

## Team vs. simple Agent fan-out

- Use a **single Agent tool call** (or a few) for bounded, in-session parallelism where you (the leader) can wait for results directly and there are no shared mutable files.
- Use the **`team` workflow** below when you need durable shared task state, explicit handoffs, role separation (delivery vs. verification), worktree isolation, or long-running lanes that must stay tracked across the session.

The built-in task list is the single source of truth; it replaces `.omx/state/team/...`.

## Operating contract

When the user triggers `team`, the leader (you) must:

1. Build a shared task board with `TaskCreate` — one task per work item, with `subject`, `description`, `owner`, and `addBlocks`/`addBlockedBy` for dependencies.
2. Fan out teammates with the **Agent tool**, each given: the goal, its claimed task id(s), the relevant file paths, and a precise "report back" contract.
3. Track progress via `TaskUpdate` (status `pending` → `in_progress` → `completed`, or `deleted` if superseded).
4. Keep the board alive until every task is terminal (or an explicit abort).
5. Clean up only after terminal state.

Never present `omx team` / tmux as available inside WorkBuddy. If a legacy `omx team` invocation is literally requested, stop and explain the WorkBuddy equivalent.

## Pre-context intake gate

Before spawning teammates, require a grounded context snapshot:
1. Derive a task slug from the request.
2. Reuse a prior snapshot in `.workbuddy/memory/YYYY-MM-DD.md` when available.
3. Otherwise write a brief context note to `.workbuddy/memory/<slug>.md` with: task statement, desired outcome, known facts/evidence, constraints, unknowns, and likely codebase touchpoints.
4. If ambiguity is high, invoke the `deep-interview` skill (`skill: deep-interview`) first, or run repo inspection (Read/Grep/Glob) for brownfield facts.
5. If correctness depends on docs/externals, you may spawn a research teammate (Agent tool with a research brief) as an evidence lane.

Do not spawn worker agents until this gate is satisfied; if forced to proceed, state explicit scope/risk limits.

## Coordination protocol (Team Big Five + ATEM)

For isolated, independent tasks (per-file sweeps, typo/copy edits, independent lanes with no shared files), workers use a light protocol: ACK, claim-safe lifecycle, status, verification, completion evidence.

Activate the fuller boundary checklist when the task graph has dependencies, shared files/contracts, cross-boundary ownership, handoffs, integration/merge work, blocked lanes, or changed assumptions:

- **Shared mental model / single source of truth:** the task list, intakes, and memory notes are canonical.
- **Closed-loop ACK-readback handoffs:** acknowledge each handoff with understood scope, affected artifact/path, owner, and next action.
- **Boundary monitoring:** check upstream/downstream contracts, shared files, and verification evidence before marking completion.
- **Backup/reassignment:** blocked workers report the smallest needed help/reassignment request and continue safe unblocked slices.
- **Adaptability checkpoints:** changed assumptions/dependencies/results trigger a brief leader-facing update before widening scope.
- **Team orientation:** optimize for the integrated outcome, not local-only summaries — report integration risks, missing tests, and peer impacts.

## Worker model & roles

Select a **role prompt** per teammate (the `subagent_type` / description in the Agent call), not a separate CLI:
- `executor` — implement a focused change.
- `verifier` / `qa` — run tests, regression coverage, evidence before shutdown.
- `researcher` — gather external/version-aware evidence.
- `architect` — design/diagnosis review.

Recommended headcount and role counts come from the brief. If an ideal role is unavailable, choose the closest and say so. Keep at least one lane focused on verification.

## Required lifecycle (leader contract)

1. Create the task board; spawn teammates; verify each acknowledges (returns its plan).
2. Monitor via `TaskUpdate` and teammate returns — keep checking until terminal.
3. Wait for terminal task state before shutdown: `pending=0`, `in_progress=0`, `failed=0` (or an explicitly acknowledged failure path).
4. Only then close out: summarize evidence, mark the board done.
5. Verify cleanup: no orphaned processes, no leftover generated state.

Do not shut down while workers are actively writing unless the user explicitly requested abort.

## Message dispatch policy

- Deliver assignments through the Agent tool call arguments (the durable, structured path) — not ad-hoc re-typing.
- Verify completion via returned evidence and task-list status.
- Only fall back to follow-up Agent calls (or AskUserQuestion) after checking that a teammate stalled.

## Worker commit protocol (critical for incremental integration)

- After completing work and before reporting completion, workers SHOULD commit: `git add -A && git commit -m "task: <subject>"`. This makes changes available for incremental integration into the leader branch.
- If a worker forgets, the leader may commit on its behalf as a fallback.

## Task ID rule

- The task list id is the canonical identifier (e.g. `12`). Refer to tasks by id in handoffs. Never instruct teammates to read internal `.omx/` files.

## Failure modes & recovery

- **No ACK:** re-issue the assignment via a fresh Agent call with narrower scope; check that the task description was unambiguous.
- **Stale/duplicate work:** detect via the task list before spawning; assign explicit non-overlapping owners.
- **Blocked lane:** reassign the smallest needed slice; keep the rest progressing.
- **Stale generated state:** clean up generated harnesses/fixtures the worker left behind unless they are intentional deliverables.

## Reporting during execution

Provide concrete evidence each cycle:
1. Team started line (`Team started: <name>`), headcount, roles.
2. Task board id and current counts.
3. Per-lane status and verification evidence.
4. Completion/shutdown outcome.

Do not claim success without task-list + returned evidence. Do not claim clean completion if `in_progress>0`.

## Limitations

- Worktree provisioning requires a git repo and can collide on branch/path.
- Parallel commands that mutate the same state or worktree must not run concurrently — serialize them.
- Stale teammates from prior runs can interfere until cleaned up.
