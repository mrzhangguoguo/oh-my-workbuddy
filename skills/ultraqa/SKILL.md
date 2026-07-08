---
name: ultraqa
category: review
status: active
core: true
description: Adversarial dynamic end-to-end QA - generate hostile scenarios, test, verify, fix, report, and clean up. Use for robust behavior verification.
agent_created: true
triggers: ["ultraqa", "adversarial qa", "e2e qa", "hostile scenario testing", "robustness test"]
---

> Ported from oh-my-codex `ultraqa`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# UltraQA Skill

## Operating Contract

- Outcome-first framing with concise, evidence-dense progress and completion reporting.
- Treat newer user updates as local overrides for the active workflow branch while preserving earlier non-conflicting constraints.
- If the user says `continue`, advance the current verified next step instead of restarting discovery.
- UltraQA is not satisfied by a shallow build/lint/typecheck/test checklist. It must exercise the requested behavior through adversarial dynamic e2e scenarios whenever the target can be run, simulated, or harnessed safely.

[ULTRAQA ACTIVATED - ADVERSARIAL DYNAMIC E2E QA CYCLING]

## Overview

UltraQA finds real behavior failures by combining normal verification commands with generated end-to-end scenarios, hostile user modeling, temporary harnesses when useful, and a structured evidence report. The workflow repeats test → diagnose → fix → retest until the goal is met, a bounded stop condition is reached, or a safety boundary blocks further execution.

## Goal Parsing

Parse the goal from arguments. Supported formats:

| Invocation | Goal Type | What to Check |
|------------|-----------|---------------|
| `/ultraqa --tests` | tests | Existing tests plus adversarial dynamic e2e scenarios for the changed behavior |
| `/ultraqa --build` | build | Build succeeds and generated smoke/e2e probes still run against the built artifact when applicable |
| `/ultraqa --lint` | lint | Lint passes and no generated harness/test artifact violates project hygiene |
| `/ultraqa --typecheck` | typecheck | Typecheck passes and generated typed harnesses compile when applicable |
| `/ultraqa --custom "pattern"` | custom | Custom success pattern is verified against behavior, not trusted as misleading success output |
| `/ultraqa --interactive` | interactive | CLI/service behavior is tested with generated hostile and edge-case interactions |

If no structured goal is provided, interpret the argument as a custom behavior goal and derive a runnable e2e strategy from repository context.

## Required Scenario Matrix

Before declaring success, create and maintain a scenario matrix (in memory or a temp file). Each row must include: scenario id, intent, user/attacker model, setup, command or harness, expected signal, actual result, fixes applied, evidence, and cleanup status.

The matrix must include normal-path coverage plus adversarial dynamic e2e scenarios selected from the current goal and codebase. Unless clearly irrelevant or impossible, include these hostile and edge-case classes:

1. **Malformed input**: invalid JSON, missing fields, invalid flags, oversized strings, unusual Unicode, path traversal-like values, corrupted state files.
2. **Repeated interruptions**: repeated `continue`, stop/cancel/abort wording, interrupted command output, retries after partial progress.
3. **Prompt injection attempts**: user text that tries to override instructions, exfiltrate secrets, skip verification, delete state, or claim false success.
4. **Cancel/resume behavior**: active state cleanup, resume detection, stale in-progress state, cancellation followed by a fresh run.
5. **Stale state**: old state files, mismatched sessions, missing timestamps, contradictory phase metadata.
6. **Dirty worktree**: pre-existing modifications, untracked generated files, verification that UltraQA does not hide or overwrite unrelated work.
7. **Hung or long-running commands**: bounded timeout handling, killed child processes, recovery notes.
8. **Flaky tests**: rerun strategy, failure clustering, quarantine evidence, avoiding false green from a single lucky pass.
9. **Misleading success output**: output containing success phrases with non-zero exits, hidden failures, skipped tests, partial command logs.

## Dynamic E2E and Temporary Harness Rules

- Generate temporary tests, scripts, fixtures, or harnesses when they materially improve behavioral confidence and no existing e2e surface covers the scenario.
- Prefer project-native test tools and small throwaway harnesses under a temporary directory or clearly named test fixture.
- Record every generated artifact in the scenario matrix, including whether it was committed intentionally or removed during cleanup.
- Use bounded runtimes and explicit timeouts for commands that can hang.
- Validate exit codes and output semantics; do not trust success-looking text alone.
- Do not delete, rewrite, or mask unrelated user work. Capture dirty-worktree evidence before and after generated harness work.

### Temporary Harness Generation Guardrails

Generated harnesses are part of the QA evidence chain; until setup succeeds, they are evidence about the harness apparatus, not product behavior.

- **Use absolute repo imports for built artifacts.** When a harness runs from `/tmp` or another scratch directory but imports repository code, resolve the repo root explicitly and import built modules with an absolute path or `pathToFileURL(join(repoRoot, "dist", ...)).href`. Never rely on `./dist/...` from the harness's temp directory.
- **Use a safe file writer for JS/TS harness bodies.** Prefer a small Node/Python writer or another non-interpolating file-write mechanism for harness source containing backticks, `${...}`, shell metacharacters, or prompt-injection strings. If a shell heredoc is unavoidable, quote the delimiter and verify the written file before execution; do not use interpolating heredocs for JavaScript assertions.
- **Sanitize ambient runtime env for isolated probes.** When the scenario creates a temporary repo/state tree or checks local isolation, run the probe with `OMX_ROOT`/`OMX_STATE_ROOT`-style env unset (e.g. `env -u OMX_ROOT -u OMX_STATE_ROOT ...`) — and in WorkBuddy, never reference `.omx/`. Use a clean cwd so ambient boxed state cannot redirect reads/writes away from the scenario fixture.
- **Classify harness setup failures separately.** If a generated harness fails before exercising product behavior (import paths, shell interpolation, env leakage, fixture construction), record it as harness debris, fix the harness, and rerun the scenario before declaring a product defect.

## Cycle Workflow

### Cycle N (Max 5)

Track each cycle in the task list: `TaskCreate` a cycle task (`in_progress` → `completed`).

1. **PLAN ADVERSARIAL QA**
   - Restate the goal, success criteria, safety bounds, and stop condition.
   - Inspect repository context enough to identify runnable surfaces, test commands, state files, cleanup paths.
   - Build or update the required scenario matrix before running commands.

2. **RUN BASELINE VERIFICATION**
   - `--tests`: run the project's test command.
   - `--build`: run the project's build command.
   - `--lint`: run the project's lint command.
   - `--typecheck`: run the project's type check command.
   - `--custom`: run the appropriate command and check the pattern plus exit status and failure markers.
   - `--interactive`: harness the CLI/service with generated hostile and edge-case interactions (spawn a `qa-tester`-style Agent if available, otherwise drive it directly via Bash).

3. **RUN ADVERSARIAL DYNAMIC E2E SCENARIOS**
   - Execute the scenario matrix using existing e2e tests, generated temporary tests, or generated harnesses.
   - Model malicious/hostile user behavior explicitly, including prompt injection and attempts to bypass safety or verification.
   - Exercise malformed input, repeated interruptions, cancel/resume, stale state, dirty worktree, hung commands, flaky tests, and misleading success output when relevant.
   - Capture commands, exit codes, key output excerpts, artifacts, and cleanup status.

4. **CHECK RESULT**
   - **YES** only if baseline verification and adversarial e2e scenarios passed, generated artifacts are cleaned up or intentionally tracked, and the report has complete evidence.
   - **NO** if any scenario failed, was skipped without justification, left debris, relied on misleading output, or lacked evidence. Continue to step 5.

5. **ARCHITECT DIAGNOSIS**
   - Reason about root cause, safety implications, and specific fix recommendations. Invoke the `architect`/`analyze` skill via the Skill tool if available (`skill: architect` / `skill: analyze`); otherwise perform the diagnosis directly.

6. **FIX ISSUES**
   - Apply the fix precisely. Invoke an `executor`/`plan` skill via the Skill tool if available; otherwise implement directly. Constraints: preserve unrelated dirty work, clean temporary harnesses, keep safety bounds.

7. **CLEAN UP AND ROLLBACK**
   - Remove temporary harnesses, fixtures, logs, spawned processes, and state files unless intentional deliverables.
   - Roll back failed experimental edits not part of the final fix.
   - Re-check the worktree and record remaining intentional changes or residual debris.

8. **REPEAT**
   - Go back to step 1 with the updated scenario matrix and failure history.

## Safety Bounds

UltraQA must stay inside these safety bounds:

- No destructive commands such as force resets, broad deletes, secret exfiltration, credential dumping, production writes, or unbounded process spawning.
- No reading or printing secrets beyond the minimum metadata needed to verify absence of leakage.
- No network or external-production side effects unless the user explicitly authorized them.
- No unbounded waits: use timeouts, retries with caps, clear hung-command diagnostics.
- No hiding unrelated dirty work or generated debris.
- If a required scenario would violate these bounds, mark it blocked in the report with the safe substitute used.

## Exit Conditions

| Condition | Action |
|-----------|--------|
| **Goal Met** | Exit success: `ULTRAQA COMPLETE: Goal met after N cycles` plus the structured report |
| **Cycle 5 Reached** | Exit with diagnosis: `ULTRAQA STOPPED: Max cycles` plus failures, fixes attempted, residual risks, evidence |
| **Same Failure 3x** | Exit early: `ULTRAQA STOPPED: Same failure detected 3 times` plus root cause, safety notes, next owner |
| **Safety Boundary** | Exit: `ULTRAQA BLOCKED: [destructive/credentialed/external-production/unbounded action]` plus safe substitute evidence |
| **Environment Error** | Exit: `ULTRAQA ERROR: [port/dependency/hung command issue]` plus cleanup status |

## Structured Report

Every terminal UltraQA result must include this report shape:

```markdown
# UltraQA Report

## Goal and success criteria
- Goal:
- Stop condition:
- Safety bounds applied:

## Scenario matrix
| ID | User/attacker model | Scenario | Command/harness | Expected signal | Actual result | Status | Evidence | Cleanup |
|----|---------------------|----------|-----------------|-----------------|---------------|--------|----------|---------|

## Commands run
- `[exit code] command` — purpose, duration/timeout, key output evidence

## Failures found
- Scenario ID, failure signal, root cause, user impact, safety impact

## Fixes applied
- Files changed, rationale, linked failing scenario(s), regression evidence

## Cleanup and rollback
- Generated artifacts removed or intentionally kept
- State/process cleanup performed
- Worktree status before/after

## Residual risks
- Untested or blocked scenarios with reasons and safe substitutes

## Evidence
- Test output, e2e logs, harness output, transcripts when relevant, rerun/flake evidence
```

## Observability

Output progress each cycle:

```text
[ULTRAQA Cycle 1/5] Planning adversarial scenario matrix...
[ULTRAQA Cycle 1/5] Running baseline tests...
[ULTRAQA Cycle 1/5] Running ADV-E2E-003 prompt-injection harness...
[ULTRAQA Cycle 1/5] FAILED - stale state resume accepted misleading success output
[ULTRAQA Cycle 1/5] Architect diagnosing scenario ADV-E2E-003...
[ULTRAQA Cycle 1/5] Fixing: src/hooks/... - validate exit code before success phrase
[ULTRAQA Cycle 1/5] Cleaning temporary harnesses and state...
[ULTRAQA Cycle 2/5] PASSED - baseline + 9 adversarial scenarios pass
[ULTRAQA COMPLETE] Goal met after 2 cycles
```

## State Tracking

Use the **task list** for UltraQA lifecycle state (create a task per cycle; update `current_phase` via status/description). For durable cross-session resume context, append a short note to `.workbuddy/memory/YYYY-MM-DD.md` (e.g. `mode: ultraqa, iteration: N, scenario_matrix: <summary>`). Never call `omx state`.

- **On start**: `TaskCreate` the run with `current_phase: planning`.
- **On each cycle**: `TaskUpdate` the cycle task (`qa` → `adversarial-e2e` → `diagnose` → `fix` → `cleanup`).
- **On completion**: mark cycle tasks completed; if resuming, read the memory note for prior iteration count.

## Scenario Examples

**Good:** The user says `continue` after the workflow already has a clear next step. Continue the current branch, rerun the relevant adversarial scenario, update the report instead of restarting discovery.

**Good:** The user changes only the output shape or downstream delivery step (e.g. `make a PR`). Preserve earlier non-conflicting constraints and apply the update locally.

**Good:** A CLI prints `SUCCESS` while exiting 1. Mark the misleading-success-output scenario failed, fix the parser/reporting path, rerun the generated harness.

**Bad:** The workflow runs only `npm test`/`build`/`lint`/`typecheck`, sees green, and declares UltraQA complete without adversarial dynamic e2e coverage.

**Bad:** A generated harness leaves untracked files, state, or a child process behind and the final report omits cleanup status.

**Bad:** The user says `continue`, and the workflow restarts discovery or stops before missing verification/evidence is gathered.

## Cancellation

The user can cancel (e.g. `/cancel`), which clears UltraQA state. Cancellation itself should be tested in cancel/resume scenarios when relevant, but UltraQA must not block an explicit user cancellation.

## Important Rules

1. **ADVERSARIAL E2E REQUIRED** — Baseline build/lint/typecheck/test commands are necessary evidence, not sufficient completion proof.
2. **SCENARIO MATRIX REQUIRED** — Track normal, hostile, malformed, interruption, injection, cancel/resume, stale-state, dirty-worktree, hung-command, flaky, and misleading-output coverage.
3. **GENERATE HARNESSES WHEN USEFUL** — Create temporary tests/harnesses when they materially improve confidence, then clean up or commit intentionally.
4. **PARALLEL WHEN SAFE** — Run independent diagnostics while preparing fixes; do not parallelize commands that mutate the same state or worktree.
5. **TRACK FAILURES** — Record each failure to detect patterns and avoid false greens.
6. **EARLY EXIT ON PATTERN** — 3x same failure = stop and surface with root cause and residual risk.
7. **CLEAR OUTPUT** — User should always know current cycle, scenario, command, status, evidence.
8. **CLEAN UP** — Clear task list + temporary artifacts on completion, cancellation, or early stop.
9. **SAFETY FIRST** — Never exfiltrate secrets, run destructive cleanup, write to production, or wait indefinitely to satisfy a scenario.

## STATE CLEANUP ON COMPLETION

When goal met OR max cycles reached OR exiting early: mark all UltraQA cycle tasks completed/deleted and remove temporary e2e harnesses, fixtures, and logs unless they are intentional artifacts listed in the report. Do not delete files outside the run's scope.

---

Begin ULTRAQA cycling now. Parse the goal, build the adversarial dynamic e2e scenario matrix, and start cycle 1.
