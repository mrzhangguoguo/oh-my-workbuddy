---
name: team
category: execution
status: active
core: true
description: Coordinate N parallel agents on a shared task list using the Agent tool and TeamCreate. Use for multi-lane execution, fan-out, shared delivery+verification, and long-running lanes tracked across a session.
agent_created: true
triggers: ["team", "coordinate agents", "parallel execution", "fan out", "spawn teammates", "multi-agent"]
---

> Ported from oh-my-codex `team`. OMX runtime conventions (`$macro` invocation, `omx team` CLI, tmux panes, `.omx/` state directory) are replaced with WorkBuddy idioms (TeamCreate, Agent tool, SendMessage, Task tools, `.workbuddy/` memory).

# Team Skill

`team` is WorkBuddy's coordinated multi-agent execution mode. There is no tmux runtime and no `omx team` CLI — coordination is built from the **TeamCreate** tool (team + shared task board), the **Agent** tool (teammates), the **SendMessage** tool (mailbox/dispatch), and the **Task** tools (single source of truth). Treat this skill as an operator workflow, not a generic prompt pattern.

In non-team surfaces (plain single-session chat without a created team), do not present `team` as directly available; first call `TeamCreate`, or stay on the nearest single-agent surface until the user explicitly wants the multi-agent runtime.

## Team vs Native Subagents

- Use a **single Agent tool call** (or a few run in parallel) for bounded, in-session parallelism where one leader thread can fan out a few independent subtasks and wait for them directly, with no shared mutable files.
- Use **`team`** when you need durable shared task state, explicit handoffs, role separation (delivery vs. verification), cross-boundary ownership, or long-running parallel execution that must stay tracked across the session and survive beyond one local reasoning burst.
- Native Agent fan-out can complement `team` execution, but it does **not** replace the team runtime's stateful coordination contract (shared task board, mailbox, lifecycle control).

## What This Skill Must Do

When the user triggers `team`, the leader (you) must:

1. Call **TeamCreate** to establish the team + task board (creates `/Users/lizhi/.workbuddy/teams/<team-name>.json` and `/Users/lizhi/.workbuddy/tasks/<team-name>/`).
2. Build the shared task board with **TaskCreate** — one task per work item, with `subject`, `description`, `owner`, and `addBlockedBy`/`addBlocks` for dependencies.
3. Fan out teammates with the **Agent** tool, each given: `team_name`, a unique `name`, a `subagent_type`/`description`, the goal, its claimed task id(s), the relevant file paths, and a precise "report back" contract.
4. Verify startup and surface concrete state/board evidence.
5. Keep the team state alive until every teammate is terminal (unless explicit abort).
6. Handle cleanup and stale-teammate recovery when needed.

If `TeamCreate`/Agent tooling is unavailable, stop with a hard error. Do not silently fall back to in-process fan-out that discards the shared board.

## Shared workflow guidance

Use the shared workflow guidance pattern: outcome-first framing, concise visible updates for multi-step work, local overrides for the active workflow branch, validation proportional to risk, explicit stop rules, and automatic continuation for safe reversible steps. Ask only for material, destructive, credentialed, external-production, or preference-dependent branches.

## Invocation Contract

```text
TeamCreate "<team-name>" + "<description>"
  -> TaskCreate (one per lane/work item, with owner)
  -> Agent (team_name=<team>, name=<workerN>, subagent_type=<role>, prompt=<assignment>)
```

Examples:

```text
TeamCreate "feature-x-sweep" "parallel analysis + fix of feature X"
TaskCreate subject="analyze feature X and report flaws" owner="worker-1"
TaskCreate subject="ship end-to-end fix with verification" owner="worker-2"
Agent team_name="feature-x-sweep" name="worker-1" subagent_type="general-purpose" prompt="analyze ..."
Agent team_name="feature-x-sweep" name="worker-2" subagent_type="general-purpose" prompt="fix ..."
```

### Team-first launch contract

The `TeamCreate` + `Agent` flow is the canonical launch path for coordinated execution. Team mode should carry its own parallel delivery + verification lanes without requiring a separate linked single-owner loop (e.g. `ralph`) up front.

- **Canonical launch:** create the team, then spawn `Agent` teammates for coordinated lanes.
- **Verification ownership:** keep one lane (or a dedicated verifier teammate) focused on tests, regression coverage, and evidence before shutdown.
- **Escalation:** start a separate single-owner loop (e.g. invoke `ultragoal` or `ralph`) only when a later manual follow-up still needs a persistent single-owner fix/verification loop.
- **Deprecation:** the old "team then ralph" combined launch has been removed. Use `TeamCreate` + `Agent` for team execution, or run a single-owner loop separately when you explicitly want that later.

### Team Big Five / ATEM coordination gate

`team` keeps simple independent fan-out lightweight. For isolated tasks (for example per-file sweeps, typo/copy edits, or explicitly independent lanes with no shared files/dependencies), workers use the normal concise protocol: startup ACK, claim-safe task lifecycle, status, verification, and completion evidence.

Activate the lightweight Team Big Five + ATEM-inspired coordination layer when the task or task graph has dependencies, shared files/surfaces/contracts, cross-boundary ownership, handoffs, integration/merge work, blocked lanes, or changed assumptions. The protocol is not a separate ceremony; it is a concise boundary checklist:

- **Shared mental model / single source of truth:** the task list, intakes, and memory notes are canonical.
- **Closed-loop communication / ACK-readback handoffs:** acknowledge handoffs with understood scope, affected artifact/path, owner, and next action.
- **Mutual performance monitoring at boundaries:** check upstream/downstream contracts, shared files, and verification evidence before completion.
- **Backup/reassignment behavior:** blocked workers report the smallest needed help/reassignment request and continue safe unblocked slices.
- **Adaptability checkpoints:** changed assumptions, dependencies, or verification results trigger a brief leader-facing update before widening scope.
- **Team orientation:** workers optimize for the integrated team outcome, not local-optimum-only task summaries; report integration risks, missing tests, and peer impacts.

ATEM fit: treat this as agile teamwork support for transition/action/interpersonal moments around boundaries, not as a heavyweight process model. Keep the protocol in WorkBuddy prompts, the task board, memory, and tests.

### Team + Ultragoal bridge

Use `ultragoal` (or the `autopilot` loop) for durable leader-owned goal/ledger tracking, and `team` for parallel execution lanes. When Team is launched with an active Autopilot/Ultragoal context, worker prompts/status may include leader-owned goal context: the active goal id, ledger path, and the `fresh_leader_get_goal_required` checkpoint policy.

Workers provide task status and verification evidence only. They do **not** own the goal state, create worker ledgers, mutate the leader's `.omw/autopilot/<slug>/` ledger, or auto-launch Team from the goal. The leader uses terminal Team evidence plus a fresh goal snapshot to run the appropriate checkpoint/completion skill with the team evidence cited.

### Teammate model & thinking selection

Important: the `subagent_type`/`description` in an `Agent` call selects the **worker role prompt**, not a separate CLI (WorkBuddy has no codex-vs-claude CLI split).

To select a teammate's model, use the `model` argument on the `Agent` call:

```text
# Force a specific model for all teammates
Agent team_name="x" name="worker-1" model="<model-id>" subagent_type="general-purpose" prompt="..."

# Lighter teammate for low-complexity lane
Agent team_name="x" name="worker-2" model="<lite-model>" subagent_type="general-purpose" prompt="..."

# Let the leader's model inherit (omit model)
Agent team_name="x" name="worker-3" subagent_type="general-purpose" prompt="..."
```

Model precedence (highest to lowest):

1. Explicit `model` argument on the `Agent` call.
2. Inherited leader model (when `model` is omitted).
3. The runtime default model for the worker subtype.

Thinking-level rule (critical):

- **No model-name heuristic mapping.** The runtime must **not** infer reasoning effort from model-name substrings (e.g. `spark`, `high-capability`, `mini`).
- When the leader assigns teammate roles/tasks, WorkBuddy allocates **per-worker reasoning effort dynamically** from the resolved worker role and any `model` override (`lite` / `reasoning` / default tiers).
- Explicit `model` still wins: if the `Agent` call already pins a specific model, that explicit value overrides dynamic allocation for that worker.

Other per-worker knobs:

- `max_turns` — cap the teammate's reasoning rounds before it must hand back.
- `run_in_background` — launch and return immediately; the leader is notified on completion (preferred for long lanes).

## Preconditions

Before running `team`, confirm:

1. The Agent tool is available (full capability set: file edit, Bash, etc.).
2. `TeamCreate`/`Task*` tools are available.
3. The working directory and task board paths under `/Users/lizhi/.workbuddy/` are writable.
4. If the task touches a git repo, the working tree is clean enough that parallel commits won't collide on the same branch/path (consider separate worktrees per lane).
5. There is no stale team with the same `team_name` from a prior run (see Clean-Slate Recovery).

Suggested preflight:

```text
# list existing teams to avoid name collision
ls /Users/lizhi/.workbuddy/teams/ 2>/dev/null || true
```

If a stale team exists, clean it up before `TeamCreate` to prevent the new board overlapping old state.

## Pre-context Intake Gate

Before launching teammates, require a grounded context snapshot:

1. Derive a task slug from the request.
2. Reuse the latest relevant note in `.workbuddy/memory/YYYY-MM-DD.md` (or `.omw/autopilot/<slug>/context.md` when inside Autopilot) when available.
3. If none exists, write a brief context note with:
   - task statement
   - desired outcome
   - known facts/evidence
   - constraints
   - unknowns/open questions
   - likely codebase touchpoints
4. If ambiguity remains high, invoke `deep-interview` first for requirements, then run repo inspection (Read/Grep/Glob) for brownfield facts, before team launch.
5. If current correctness depends on official docs, version-aware framework guidance, best practices, or external dependency behavior, spawn a `researcher` teammate as an evidence lane before or alongside worker launch instead of relying on repo-local recall alone.

Do not spawn worker agents until this gate is satisfied; if forced to proceed quickly, state explicit scope/risk limitations in the launch report.

## Follow-up Staffing Contract

When `team` is used as a follow-up mode from `ralplan` (or from an Autopilot/Ultragoal story), carry forward the approved plan's explicit **available-role roster** and convert it into concrete staffing guidance before launch:

- keep worker-role choices inside the known roster
- state the recommended headcount and role counts
- state the suggested reasoning level for each lane when available
- explain why each lane exists (delivery, verification, specialist support)
- include an explicit launch hint (`TeamCreate ...` + `Agent ...`) for the coordinated run; mention `ultragoal` as the default durable follow-up/ledger path; mention a later separate single-owner loop only when explicitly requested or genuinely needed as a fallback
- if the ideal role is unavailable, choose the closest role from the roster and say so

## Current Runtime Behavior (As Implemented)

WorkBuddy `team` currently performs:

1. `TeamCreate` parses `team_name` + `description` and creates:
   - `/Users/lizhi/.workbuddy/teams/<team-name>.json` (team config/members)
   - `/Users/lizhi/.workbuddy/tasks/<team-name>/` (shared task list directory)
2. `TaskCreate` writes task entries; `TaskUpdate`/`TaskGet`/`TaskList` mutate/read them.
3. `Agent` spawns a teammate process bound to the team:
   - `team_name` ties the teammate to the shared board
   - `name` is the addressable handle for `SendMessage`
   - `subagent_type`/`description` selects the role prompt
   - optional `model`, `max_turns`, `run_in_background`
4. The teammate works autonomously, then goes **idle** between turns and auto-notifies the leader on completion.
5. `SendMessage` delivers messages to a teammate (`type:"message"`), to all (`type:"broadcast"`), or lifecycle requests (`type:"shutdown_request"` / `type:"shutdown_response"`).
6. When the leader receives a teammate message, it is delivered automatically; the leader does not poll raw process output.
7. `TeamDelete` removes the team config + task directory during cleanup.

Important:

- The leader remains in the main session; teammates are independent Agent runs.
- Teammates may operate in separate git worktrees (spawn with explicit cwd/worktree per lane) while sharing one team board.
- Worker ACKs/status arrive via `SendMessage` to the leader; the board (`TaskList`) is the canonical progress surface.
- Submit/dispatch routing: teammates report back via `SendMessage`; the leader reads the board and decides reassignment. Direct `AskUserQuestion` from a teammate is fallback-only.

## Required Lifecycle (Operator Contract)

Follow this exact lifecycle when running `team`:

1. `TeamCreate`, then `TaskCreate` the board; spawn teammates and verify startup evidence (team config exists, teammates acknowledged with a returned plan).
2. Monitor task and worker progress with the task tools first (`TaskList`, `TaskGet`, `SendMessage` reads) before any manual intervention.
3. Wait for terminal task state before shutdown:
   - `pending=0`
   - `in_progress=0`
   - `failed=0` (or an explicitly acknowledged failure path)
4. Only then send `SendMessage` with `type:"shutdown_request"` to each teammate (or `type:"broadcast"`), then call `TeamDelete`.
5. Verify shutdown evidence and state cleanup (no orphaned tasks, no leftover team config).

Do not send shutdown while workers are actively writing updates unless the user explicitly requested abort/cancel. Do not treat ad-hoc re-typing as primary control flow when board/state evidence is available.

### Active leader monitoring rule

While a team is **ON/running**, the leader must not go blind. Keep checking live team state until terminal completion.

Minimum acceptable loop:

- Trust the auto-notification: when a teammate finishes, you are notified and can act.
- Between notifications, poll `TaskList` for the team to confirm `in_progress` is draining.
- For long-running background lanes, periodically `TaskList` rather than assuming silence means done.

If a teammate reports a stale/lifecycle/all-idle signal, immediately `TaskList`/read its message before any manual intervention.

## Message Dispatch Policy (board-first, message-first)

To avoid brittle behavior, **message/task delivery must not be driven by ad-hoc re-typing**.

Required default path:

1. Use `TeamCreate` + `Agent` for orchestration.
2. Use `SendMessage` for mailbox/task mutations and teammate communication.
3. Verify delivery via board/state evidence (`TaskList`, teammate `SendMessage` replies).

Strict rules:

- **MUST NOT** use repeated manual re-prompts as the primary mechanism to deliver instructions/messages once a teammate is running.
- **MUST NOT** spam follow-up calls without first checking board/state evidence.
- **MUST** prefer durable state writes + runtime dispatch (task status, `SendMessage` inbox).
- Direct follow-up `Agent` calls are **fallback-only** and only after failure checks (for example a teammate reported stalled) or explicit user request.

## Operational Commands

```text
TeamCreate "<team-name>" "<description>"
TaskCreate subject="<work item>" owner="<workerN>" description="<...>"
TaskUpdate taskId=<id> status=in_progress|completed
TaskList
SendMessage type="message" recipient="<workerN>" content="<...>"
SendMessage type="broadcast" content="<...>"
SendMessage type="shutdown_request" recipient="<workerN>"
TeamDelete  (cleanup)
```

Semantics:

- `TeamCreate`: establishes team config + empty task board.
- `TaskList`: reads team snapshot (task counts, blocked/owned workers).
- `SendMessage`: delivers a message or lifecycle request to a teammate or all.
- `TeamDelete`: graceful cleanup that removes the team config + task directory.

## Data Plane and Control Plane

### Control Plane

- Team config + task list files (`/Users/lizhi/.workbuddy/teams/<team>/`, `/Users/lizhi/.workbuddy/tasks/<team>/`)
- Teammate Agent processes bound by `team_name`
- Leader notifications delivered via the `SendMessage` auto-delivery path

### Data Plane

- Task list entries (`/Users/lizhi/.workbuddy/tasks/<team>/`)
- Team mailbox (the `SendMessage` channel): leader↔teammate messages, ACKs, lifecycle requests

### Key Files

- `/Users/lizhi/.workbuddy/teams/<team-name>.json` — team config & member registry
- `/Users/lizhi/.workbuddy/tasks/<team-name>/` — shared task board
- Each teammate's working files live in its own cwd/worktree; integration happens via commits + board status
- `.workbuddy/memory/YYYY-MM-DD.md` — durable handoff notes across the session

## Team Mutation Interop (message-first)

Use `SendMessage` and the Task tools for machine-readable mutation/reads instead of raw process manipulation.

```text
SendMessage type="message" recipient="worker-1" content="ACK: starting task 3"
TaskUpdate taskId=3 status=in_progress owner="worker-1"
TaskUpdate taskId=3 status=completed
```

`SendMessage` responses are delivered to the leader automatically; the teammate's `name` is the stable address used in `recipient`.

## Team + Worker Protocol Notes

Leader-to-worker:

- Write the full assignment into the `Agent` prompt (goal, claimed task id(s), file paths, report-back contract).
- Send a short `SendMessage` trigger (`type:"message"`) with the task id and a one-line scope if a mid-run nudge is needed.

Worker-to-leader:

- Send ACK + status via `SendMessage` (`type:"message"`, `recipient:"<leader>"` — the leader is addressed by its handle).
- Claim/transition/release task lifecycle via `TaskUpdate` (set `owner`, `status`).

Worker commit protocol (critical for incremental integration):

- After completing task work and before reporting completion, workers SHOULD commit:
  `git add -A && git commit -m "task: <task-subject>"`
- This ensures changes are available for incremental integration into the leader branch.
- If a worker forgets to commit, the leader may commit on its behalf as a fallback, but explicit commits are preferred.

Task ID rule (critical):

- The task list id is the canonical identifier (example `3`). Refer to tasks by id in handoffs.
- `Agent` prompt and `SendMessage` use the bare id (example `"3"`), not a path.
- Never instruct workers to read internal `.omx/` or runtime state files; use the board + `SendMessage`.

## Environment Knobs

Useful runtime controls (passed per `Agent` call, not global env):

- `model`
  - Per-teammate model selector (explicit id, or omit to inherit leader model).
  - No model-name heuristic for reasoning effort; explicit `model` wins.
- `max_turns`
  - Cap the teammate's reasoning rounds before it must hand back. Use higher for complex lanes, lower for bounded sweeps.
- `run_in_background`
  - Launch and return immediately; the leader is notified on completion. Preferred for long lanes so the leader can monitor the board in parallel.
- `team_name`
  - Binds the teammate to the shared board. Must match the `TeamCreate` name exactly.
- `name`
  - Addressable handle for `SendMessage`. Must be unique within the team.

## Failure Modes and Diagnosis

Operator note (important for teammate lanes):

- A teammate that appears to "do nothing" after a trigger may simply be processing; its output arrives via `SendMessage` notification, not a synchronous return.
- This is not necessarily a runtime bug. Confirm board/state before diagnosing dispatch failure.
- Avoid repeated blind follow-up calls; they can create noisy duplicate instructions once the teammate becomes idle.

### Safe Manual Intervention (last resort)

Use only after checking `TaskList` and the teammate's latest `SendMessage`:

1. Capture the teammate's last message tail to confirm current worker state.
2. If the teammate is stuck in an interactive state, send one concise `SendMessage` (`type:"message"`) nudge and wait for evidence.
3. Re-check:
   - board status via `TaskList`
   - the teammate's latest `SendMessage` reply
4. If genuinely stalled, reassign the smallest needed slice to another teammate via `TaskUpdate` + a fresh `Agent`.

### No ACK / no reply from a teammate

Meaning:

- Leader spawned the teammate but never received a `SendMessage` reply.

Checks:

1. `TaskList` for the team — is the claimed task still `in_progress` or `pending`?
2. Did the `Agent` call return a `name` that matches the `SendMessage` `recipient`?
3. Is the teammate still running (background) or did it error on launch?

Fixes:

- Re-issue the assignment via a fresh `Agent` call with narrower scope and an explicit `name`.
- Confirm the task description was unambiguous and self-contained.

### Task-id mismatch blocking worker flow

Meaning:

- The teammate cannot find/claim the task because the id referenced in its prompt does not match the board.

Checks:

1. `TaskList` — confirm the task id exists and its `owner` matches the teammate `name`.
2. Verify the `Agent` prompt referenced the bare id (e.g. `3`), not a path.

Fix: `TaskUpdate` to set the correct `owner`, or re-spawn with the corrected id.

### Stale team state from a prior run

Meaning:

- A team with the same `team_name` already exists; new board overlaps old state.

Checks:

1. `ls /Users/lizhi/.workbuddy/teams/` for the name.
2. `TaskList` shows tasks not created by the current run.

Fix: clean the stale team (see Clean-Slate Recovery) and re-run `TeamCreate` with a fresh name.

## Clean-Slate Recovery

Run from the leader session:

```text
# 1) Inspect teams
ls /Users/lizhi/.workbuddy/teams/

# 2) Inspect the stale team's task board
TaskList   (with the stale team context)

# 3) Remove stale team state
TeamDelete   (removes /Users/lizhi/.workbuddy/teams/<team>/ and /Users/lizhi/.workbuddy/tasks/<team>/)

# 4) Retry with a fresh name
TeamCreate "<fresh-team>" "<description>"
```

Guidelines:

- Do not delete the leader session.
- Do not kill unrelated teams; scope cleanup to the stale team only.
- After `TeamDelete`, confirm both the teams/ and tasks/ entries are gone.

## Required Reporting During Execution

When operating this skill, provide concrete progress evidence:

1. Team started line (`Team started: <name>`), headcount, roles.
2. Task board id/name and current counts (`pending`/`in_progress`/`completed`/`failed`).
3. Per-lane status and verification evidence (from `SendMessage` replies + `TaskList`).
4. Completion/shutdown outcome.

Do not claim success without board + returned evidence. Do not claim clean completion if `in_progress>0` or `failed>0` without an acknowledged failure path.

## Programmatic Team Orchestration

Use the `TeamCreate` + `Agent` + `SendMessage` + `Task` flow as the supported team-launch surface. For automation, drive the same flow from scripts or supervising agents rather than relying on a separate MCP runner.

### Supported current surfaces

- **TeamCreate + Agent** — Primary method for interactive or automated team orchestration. Use this when you want a shared board and addressable teammates.
- **Task board** — Inspect `/Users/lizhi/.workbuddy/tasks/<team>/` (or `TaskList`) when you need status, task, or mailbox evidence after launch.

### Cleanup distinction

Two cleanup paths exist and must not be confused:

- `TeamDelete` (**state cleanup**): removes the team config + task board on disk. Use after a team run is fully complete.
- Teammate shutdown: use `SendMessage` `shutdown_request` (or `broadcast`) when you need to stop running teammates before deleting the team.

### Automation example

```text
1. TeamCreate "fix-bugs" "parallel bug fixes"
2. TaskCreate subject="fix login bug" owner="worker-1"
3. Agent team_name="fix-bugs" name="worker-1" subagent_type="general-purpose" prompt="..."
4. TaskList   (monitor)
5. SendMessage type="shutdown_request" recipient="worker-1"
6. TeamDelete
```

## Limitations

- Worktree provisioning requires a git repository and can fail on branch/path collisions.
- Parallel teammates that mutate the same state or worktree must not run concurrently — serialize them or give each its own worktree.
- Stale teams from prior runs can interfere until manually cleaned (`TeamDelete`).
- Teammates are independent Agent runs; cross-teammate shared mutable state should be coordinated through the task board + commits, not in-memory assumptions.

## Scenario Examples

**Good:** The user says `continue` after the workflow already has a clear next step. Continue the current branch of work (e.g. spawn the next teammate lane, or advance the board) instead of restarting or re-asking the same question.

**Good:** The user changes only the output shape or downstream delivery step (for example "now make a PR"). Preserve earlier non-conflicting workflow constraints and apply the update locally, then let the verifier lane re-check.

**Good:** The user says `team, analyze feature X in parallel and ship fixes`. `TeamCreate` + build the board + spawn an analyzer lane and a fixer lane; the verifier lane gates shutdown.

**Bad:** The user says `team`, and the workflow restarts discovery or stops before the missing verification/evidence is gathered.

**Bad:** Autopilot/team invents independent "Expansion", "QA", and "Validation" phases and treats them as the primary lifecycle, bypassing the strict `deep-interview -> ralplan -> ultragoal -> code-review -> ultraqa` contract.
