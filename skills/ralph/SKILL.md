---
name: ralph
category: execution
status: active
core: true
description: "Self-referential persistence loop that keeps working on a task until it is fully complete and architect-verified, with parallel delegation, automatic retry, and a mandatory verification gate. Use when guaranteed completion matters. Triggers: 'ralph', 'don't stop', 'must complete', 'finish this', 'keep going until done'."
agent_created: true
triggers: ["ralph", "don't stop", "must complete", "finish this", "keep going until done"]
---

> Ported from oh-my-codex `ralph`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ralph

Ralph is a persistence loop that keeps working on a task until it is fully complete and architect-verified. It wraps parallel execution with session persistence, automatic retry on failure, and mandatory verification before completion.

## Use When
- Task requires guaranteed completion with verification (not just "do your best").
- User says "ralph", "don't stop", "must complete", "finish this", "keep going until done".
- Work may span multiple iterations and needs persistence across retries.
- Task benefits from parallel execution with architect sign-off at the end.

## Do Not Use When
- User wants a full autonomous pipeline from idea to code — use the pipeline/autopilot path.
- User wants to explore or plan first — use `plan`.
- User wants a quick one-shot fix — delegate directly to an executor Agent.
- User wants manual control over completion — execute directly.

## Why This Exists
Complex tasks fail silently: partial implementations declared "done", tests skipped, edge cases forgotten. Ralph prevents this by looping until work is genuinely complete, requiring fresh verification evidence before completion, and using an explicit architect Agent verification to confirm quality.

## Execution Policy
- Fire independent Agent calls simultaneously — never wait sequentially for independent work.
- Use `run_in_background: true` for long operations (installs, builds, test suites).
- Preserve legacy Ralph tier intent through model selection if available: LOW → light model, STANDARD → default, THOROUGH → strongest available model. (WorkBuddy model routing is environment-dependent; only apply when a lighter/heavier model is selectable.)
- Deliver the full implementation: no scope reduction, no partial completion, no deleting tests to make them pass.
- Apply the shared workflow guidance pattern: outcome-first framing, concise visible updates, local overrides, validation proportional to risk, explicit stop rules, automatic continuation for safe reversible steps. Ask only for material, destructive, credentialed, external-production, or preference-dependent branches.

## Steps
0. **Pre-context intake** (required before the loop starts):
   - Assemble or load a context snapshot at `.omw/ralph/context-{task-slug}-{timestamp}.md` (UTC `YYYYMMDDTHHMMSSZ`).
   - Minimum fields: task statement, desired outcome, known facts/evidence, constraints, unknowns/open questions, likely codebase touchpoints.
   - If a relevant snapshot exists, reuse it and record the path in the task list.
   - If ambiguity is high, gather brownfield facts first via repository inspection (Read/Grep/Glob/Bash) or the Explore subagent, then run `deep-interview --quick <task>` to close critical gaps.
   - Do not begin Ralph execution (delegation, implementation, verification) until snapshot grounding exists. If forced to proceed, note explicit risk tradeoffs.
1. **Review progress**: Check the task list and any prior iteration state.
2. **Continue from where you left off**: Pick up incomplete tasks.
3. **Delegate in parallel**: Route tasks to specialist Agent calls (Agent tool, `subagent_type: general-purpose`) with a clear role framing and appropriate model intensity:
   - Simple lookups: light model — "What does this function return?"
   - Standard work: default model — "Add error handling to this module"
   - Complex analysis: strongest model — "Debug this race condition"
   - When Ralph is entered as a `plan`/consensus follow-up, start from the approved available-agent-types roster: implementation lane, evidence/regression lane, final sign-off lane.
4. **Run long operations in background**: builds, installs, test suites use `run_in_background: true`.
5. **Visual task gate** (when screenshot/reference images are present): before every next edit, run a visual verdict step requiring structured JSON (`score`, `verdict`, `category_match`, `differences[]`, `suggestions[]`, `reasoning`). Persist verdict to `.omw/ralph/{scope}/progress.json`. Default pass threshold: `score >= 90`. For URL-based visual cloning tasks, route through the dedicated visual-clone skill if available.
6. **Verify completion with fresh evidence**:
   a. Identify the command that proves the task is complete.
   b. Run verification (test, build, lint).
   c. Read the output — confirm it actually passed.
   d. Check: zero pending/in_progress task-list items.
7. **Architect verification** (Agent role, separate call):
   - <5 files, <100 lines with full tests: Agent (`subagent_type: general-purpose`, default model) minimum.
   - Standard changes: Agent default model.
   - >20 files or security/architectural changes: Agent strongest model.
   - Ralph floor: always run an explicit architect Agent, even for small changes.
7.5 **Mandatory Deslop Pass**:
   - After step 7 passes, run a deslop/cleanup pass (e.g. invoke the `ai-slop-cleaner` skill if available, scoped to changed files only, standard mode). If the prompt contains `--no-deslop`, skip this step entirely.
7.6 **Regression Re-verification**:
   - After the deslop pass, re-run all tests/build/lint and read the output to confirm green.
   - If post-deslop regression fails, roll back cleaner changes or fix and retry. Do not proceed to completion until green (unless `--no-deslop`).
8. **On approval**: report final elapsed time and a completion summary; then clean up task list items. (No hidden runtime goal state to clear.)
9. **On rejection**: Fix the issues raised, then re-verify with the same role/model profile.

## Tool Usage
- Use the Agent tool framed as `architect` for verification cross-checks when changes are security-sensitive or architectural.
- Skip extra consultation for simple, well-tested changes.
- Track Ralph lifecycle state in the task list (TaskCreate/TaskUpdate) and/or append to `.workbuddy/memory/YYYY-MM-DD.md`. Never shell out to a runtime CLI.
- Persist the context snapshot path in the task list so later phases share grounding.

## Completion Audit (Stop Gate)
Before declaring complete, build a `prompt_to_artifact_checklist` mapping every user requirement, named workflow, file, command, gate, and deliverable to a concrete artifact/evidence item, plus `verification_evidence` entries (commands, exit status, files inspected). Write the Ralph completion state to `.omw/ralph/{scope}/progress.json` with a top-level `completion_audit` field. Read it back and verify `completion_audit.passed === true`, a non-empty checklist, and non-empty evidence before producing the final answer. Do not write bare checklist/evidence fields by themselves.

## Escalation And Stop Conditions
- Stop and report when a fundamental blocker requires user input (missing credentials, unclear requirements, external service down).
- Stop when the user says "stop", "cancel", "abort".
- Continue working when the system sends "continue" — the iteration proceeds.
- If architect rejects, fix and re-verify (do not stop).
- If the same issue recurs across 3+ iterations, report it as a potential fundamental problem.

## Final Checklist
- [ ] All requirements met (no scope reduction)
- [ ] Zero pending/in_progress task-list items
- [ ] Fresh test run output shows all tests pass
- [ ] Fresh build output shows success
- [ ] Architect verification passed (explicit Agent call minimum)
- [ ] Deslop pass completed on changed files (or `--no-deslop`)
- [ ] Post-deslop regression tests pass

## Advanced
### PRD Mode (Optional)
When the user provides `--prd`, initialize a Product Requirements Document before the loop:
1. Run `deep-interview --quick <task>` for a compact requirements pass; persist output to `.omw/ralph/interviews/{slug}-{timestamp}.md`.
2. Create canonical artifacts: PRD at `.omw/ralph/prd-{slug}.md`; progress ledger at `.omw/ralph/{scope}/progress.json`.
3. Parse the task (everything after `--prd`); break into user stories (right-sized, verifiable, independent, priority-ordered).
4. Proceed to the normal Ralph loop using user stories as the task list.

### `--no-deslop`
If present, skip the deslop pass after step 7 and continue with the latest successful pre-deslop verification evidence.

### Visual Reference Flags (Optional)
Ralph supports visual reference flags for screenshot tasks: `-i <image-path>` (repeatable), `--images-dir <directory>`.

### Background Execution Rules
**Run in background** (`run_in_background: true`): package installation, builds, test suites, docker operations.
**Run blocking** (foreground): quick status checks, file reads/edits, simple commands.
