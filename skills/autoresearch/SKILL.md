---
name: autoresearch
category: research
status: active
description: Stateful validator-gated research loop that keeps nudging until explicit validation evidence exists. Use when a research output is a bounded deliverable that must pass a script or professor-critic validator, not for ordinary pre-planning docs lookup.
agent_created: true
triggers: ["autoresearch", "validator-gated research", "research loop", "keep researching until valid"]
---

> Ported from oh-my-codex `autoresearch`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Autoresearch

Autoresearch is a skill-first, stateful research loop. It keeps the useful measured-research loop, but runs as a native WorkBuddy workflow (task list + `.omw/` artifacts) instead of a direct CLI or tmux launch surface.

## Boundary with planning research

Use `autoresearch` when the research output itself is a bounded deliverable that must pass an explicit validator. Do not recommend it for ordinary pre-planning docs lookup or general best-practice checks; use the `research` skill for that. If `autoresearch` is intentionally run before architecture planning, its approved artifact should feed evidence into `ralplan`; it should not become a final architecture/component unless the user explicitly asks for ongoing research automation.

## Use when

- You want a persistent research loop.
- The task should keep nudging until explicit validation evidence exists.
- You want init-time choice between script validation and prompt+architect validation.

## Do not use when

- You want a generic research/docs lookup (use `research`).
- You have not decided the validation regime yet.

## Core contract

1. **Init chooses validation mode.** Pick exactly one:
   - `mission-validator-script`
   - `prompt-architect-artifact`
2. **Persist mode state** in `.omw/autoresearch/<slug>/autoresearch-state.json` including:
   - `validation_mode`
   - `completion_artifact_path`
   - `mission_validator_command` **or** `validator_prompt`
   - optional `output_artifact_path`
3. **Completion is artifact-gated.** The loop does not stop because the model says "done", because a hook fired once, or because several turns were no-ops.
4. **Intake + execution** use skills: invoke the `deep-interview` skill (`skill: deep-interview`) with an autoresearch intake to clarify the mission + evaluator, then run the loop.

## Completion artifact contract

### `mission-validator-script`
The completion artifact must exist and record a passing validator result, for example:

```json
{
  "status": "passed",
  "passed": true,
  "summary": "metric improved beyond baseline"
}
```

### `prompt-architect-artifact`
The completion artifact must include both an architect approval verdict and an output artifact path, for example:

```json
{
  "validator_prompt": "Review the research output against the mission.",
  "architect_review": { "verdict": "approved" },
  "output_artifact_path": ".omw/autoresearch/<slug>/report.md"
}
```

## Recommended flow

1. Invoke the `deep-interview` skill (`skill: deep-interview`) with the `--autoresearch` intake to clarify mission + evaluator.
2. Materialize `.omw/autoresearch/<slug>/mission.md`, `sandbox.md`, and `result.json`.
3. Start `autoresearch` with the chosen validation mode stored in mode state (`.omw/autoresearch/<slug>/autoresearch-state.json`).
4. Use the **task list** to keep nudging the loop, re-running validation, until the completion artifact satisfies the chosen validation mode.
5. Finish only after the validator artifact is complete.

## Migration note

- There is no direct `omx autoresearch` CLI in WorkBuddy.
- No detached tmux or split-pane launch.
- No noop-count completion gate — completion is strictly artifact/validator-gated.
