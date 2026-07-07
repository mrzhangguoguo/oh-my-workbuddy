---
name: performance-goal
description: "Run an evaluator-gated performance optimization loop with durable WorkBuddy artifacts and safe handoffs. Use when the user wants measurable performance/optimization work (latency, throughput, memory) driven by a pass/fail benchmark rather than a one-off review. Triggers: 'optimize performance', 'reduce latency', 'performance goal', 'benchmark-driven optimization'."
agent_created: true
triggers: ["optimize performance", "reduce latency", "performance goal", "benchmark-driven optimization"]
---

> Ported from oh-my-codex `performance-goal`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Performance Goal Workflow

Use this skill when the user asks to optimize performance and wants a goal-oriented loop with a measurable pass/fail contract, not a one-off review.

## Contract

- WorkBuddy owns durable workflow state under `.omw/performance-goal/<slug>.md`.
- No optimization work may start until an **evaluator command** and a **pass/fail contract** exist.
- Do not declare the goal complete until the evaluator has a passing checkpoint **and** a completion audit proves the objective is met.
- Shell commands never mutate hidden runtime goal state — they run the evaluator and write evidence artifacts.

## Setup (no `omx` CLI)

1. Create a context snapshot in `.omw/performance-goal/<slug>.md` containing:
   - `objective`: the measurable target (e.g. "reduce CLI startup p95 latency by 20%").
   - `evaluator_command`: the command that produces the benchmark (e.g. `npm run perf:startup`).
   - `evaluator_contract`: the PASS definition (e.g. "p95 latency improves >=20% AND regression tests pass").
   - `status`: `created`.
2. Record the same in the task list via `TaskCreate` (one task per phase: start, optimize, checkpoint, complete).

If no workflow exists yet, do step 1 before any optimization.

## Agent Loop

1. Read the snapshot at `.omw/performance-goal/<slug>.md`; if absent, run the Setup step.
2. Follow the handoff:
   - Work only against the declared evaluator contract.
   - Optimize in small, reversible patches.
   - Run the evaluator and related regression tests.
   - Record each result as a checkpoint in the snapshot (`pass` / `fail` / `blocked`) with evidence text.
3. Optimize in small reversible patches; run the evaluator and regression tests after each.
4. Record every checkpoint (`pass`/`fail`/`blocked`) in the snapshot with evidence.
5. Complete only when a `pass` checkpoint exists **and** no required work remains.

## Completion Gate

A performance goal is incomplete unless the snapshot contains a `last_validation.status` of `pass` matching the evaluator contract, plus a completion audit that maps the objective to concrete evidence (benchmark output + test results). Passing ordinary tests alone is not sufficient unless they *are* the declared evaluator contract.

### Completion audit checklist
- [ ] `objective` restated as deliverables/success criteria.
- [ ] `evaluator_command` output read and confirmed to PASS per `evaluator_contract`.
- [ ] Regression tests read and confirmed green.
- [ ] Every requirement from the objective mapped to evidence in the snapshot.
- [ ] Snapshot `status` set to `complete` and task list updated.

Lifecycle: `created` starts the goal, `pass` checkpoint marks validated progress, `complete` is set only after the audit passes. Update the task list (`TaskUpdate`) at each transition instead of shelling out to any runtime CLI.
