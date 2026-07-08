---
name: pipeline
category: planning
status: active
core: true
description: "Configurable orchestrator that sequences planning/execution/review stages as ordered WorkBuddy skill invocations with a task-list state and resume support. Use to run a repeatable multi-stage workflow (interview → plan → execute → review → QA). Triggers: 'run the pipeline', 'autopilot pipeline', 'sequence stages', 'stage orchestrator'."
agent_created: true
triggers: ["run the pipeline", "autopilot pipeline", "sequence stages", "stage orchestrator"]
---

> Ported from oh-my-codex `pipeline`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Pipeline Skill

`pipeline` sequences stages through a uniform flow: each stage is an ordered **skill invocation** (or Agent delegation), with progress tracked in the task list and durable artifacts in `.omw/`.

## Default Autopilot Pipeline

The default Autopilot pipeline sequences:

```
deep-interview -> plan (consensus) -> ultragoal (+ team if needed) -> code-review -> ultraqa
```

`team` is conditional: invoke it only inside an active Ultragoal story when independent lanes or broad verification justify parallel execution. Explicit legacy Ralph pipelines remain available as custom stages, but Ralph is not the advertised default loop.

## Configuration

Pipeline parameters are configurable per run:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxRalphIterations` | 10 | Quality-gate retry ceiling; legacy option name retained for compatibility |
| `workerCount` | 2 | Number of parallel Agent workers for a team stage |
| `agentType` | `executor` | Role framing for team workers (expressed as the Agent prompt role) |

## Stage Interface

Every stage implements the same shape:

- `name`: stage identifier.
- `run(ctx)`: perform the stage, accumulating artifacts from prior stages.
- `canSkip?(ctx)`: return true only when its required durable artifacts already exist and are approved in order.

Stages receive a `StageContext` (accumulated artifacts from prior stages) and return a `StageResult` (status, artifacts, duration).

## Built-in Stages

- **deep-interview**: Requirements clarification and ambiguity gate. Invoke the `deep-interview` skill.
- **plan (consensus)**: Consensus planning (Planner + Architect + Critic). Invoke the `plan` skill with consensus. Skips only when both `prd-*.md` and `test-spec-*.md` planning artifacts already exist **and** durable consensus evidence records Architect approval followed by Critic approval. Plan/test-spec files alone are not consensus evidence. If either review is missing, blocked, out of order, or non-approving, stay in `plan` and fail with an explicit blocker/max-iteration outcome rather than progressing to execution. Carry any `deep-interview-*.md` spec paths forward for traceability.
- **ultragoal**: Durable goal-mode execution; record ledgers under `.omw/ultragoal/`. Launch `team` only from inside an Ultragoal story when parallel lanes are warranted.
- **code-review**: Merge-readiness review gate. Invoke the `code-review` skill.
- **ultraqa**: Adversarial QA gate after a clean review; docs-only/trivially non-runtime changes may record an explicit skip reason.
- **team-exec** and **ralph-verify**: Legacy/custom pipeline adapters retained for explicit non-default pipelines.

## State Management

Track pipeline state in the task list (one task per stage) rather than a hidden state file. The built-in WorkBuddy status display shows progress automatically. Resume is supported from the last incomplete stage.

- **On start**: create tasks for each stage; mark the first as `in_progress`.
- **On stage transitions**: `TaskUpdate` the current stage to `completed` and the next to `in_progress`.
- **On completion**: mark all stages `completed`; append a short summary note to `.workbuddy/memory/YYYY-MM-DD.md`.

If a durable record is needed across sessions, write the pipeline state to `.omw/pipeline/<slug>.md` (active stage, per-stage status, artifact paths).

## Relationship to Other Skills

- **deep-interview / plan / ultragoal / code-review / ultraqa**: the default pipeline delegates to these skills in order.
- **team**: optional parallel execution engine inside an Ultragoal story when lanes are needed.
- **ralph**: available only for explicit legacy/custom pipelines.
