---
name: autopilot
description: Strict autonomous delivery loop that runs deep-interview, ralplan, ultragoal, code-review, and ultraqa in order with automatic re-planning when gates are not clean. Use on "autopilot", "autonomous", "build me", "create me", "make me", "full auto", "handle it all", or "I want a/an…".
agent_created: true
triggers: ["autopilot", "autonomous", "build me", "create me", "full auto", "handle it all"]
---

> Ported from oh-my-codex `autopilot`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Autopilot

Autopilot is the strict autonomous delivery loop for non-trivial work. Its recommended/default contract is exactly:

```text
deep-interview -> ralplan -> ultragoal (+ team if needed) -> code-review -> ultraqa
```

If `code-review` or `ultraqa` is not clean, Autopilot returns to `ralplan` with the findings as the next planning input, then continues again through `ultragoal`, `code-review`, and `ultraqa` until the gates are clean or a hard blocker is reported. Do not advertise any legacy alternate execution loop as the default Autopilot path.

## Use when

- User wants hands-off execution from a concrete idea, issue, PRD, or requirements artifact to reviewed and QA-checked code.
- User says "autopilot", "auto pilot", "autonomous", "build me", "create me", "make me", "full auto", "handle it all", or "I want a/an…".
- Task needs clarification, planning, durable execution, verification, code review, and QA with automatic follow-up when gates are not clean.

## Do not use when

- User wants to explore options or brainstorm — invoke the `plan` / `ralplan` skill.
- User says "just explain", "draft only", or "what would you suggest" — respond conversationally.
- User wants a single focused code change — invoke `ultragoal` directly, or do focused executor work.
- User wants only review/critique of existing code — invoke `code-review`.

## Strict loop contract

Autopilot must not run a separate broad expansion/planning/execution/QA/validation lifecycle as its primary behavior. It delegates those concerns to the canonical workflow phases below. Represent progress with the **task list** (TaskCreate/TaskUpdate), and persist durable artifacts under `.omw/autopilot/<slug>/`. Do not invent a separate execution framework.

1. **Phase `deep-interview`** — Socratic requirements clarification gate
   - Invoke the `deep-interview` skill (`skill: deep-interview`) to clarify intent, scope, non-goals, constraints, and decision boundaries.
   - Deep-interview is a structured question chain, not a one-question gate; treat the round cap as a ceiling, not a target.
   - After the user answers, re-score ambiguity. Ask another question only when a readiness gate is still unresolved and the answer would materially change execution; otherwise crystallize the spec and hand off.
   - Required handoff artifact: a clarified spec or concise requirements summary suitable for `ralplan`, including an explicit interview-complete rationale.

2. **Phase `ralplan`** — consensus planning gate
   - Ground the task with pre-context intake and the deep-interview artifact.
   - Invoke the `ralplan` skill (`skill: ralplan`) to produce/update PRD and test-spec artifacts. (If a lighter planning model is available, use it for the initial decomposition; otherwise keep ownership in the main session.)
   - PRD/test-spec files alone are not completion evidence. Ralplan may hand off only after durable consensus evidence records an `architect` approval followed by a `critic` approval.
   - When returning from a non-clean review or QA pass, include `return_to_ralplan_reason` and the findings as first-class planning input.
   - If either review is missing, blocked, out of order, or non-approving, remain in `ralplan` or report an explicit blocker/max-iteration outcome; do not progress to `ultragoal`, `team`, or implementation.
   - Required handoff artifact: an approved plan/test spec plus `ralplan_consensus_gate` evidence suitable for `ultragoal`.

3. **Phase `ultragoal`** — durable implementation + verification loop
   - Invoke the `ultragoal` skill (`skill: ultragoal`) from the approved ralplan artifacts.
   - Ultragoal owns implementation, tests, build/lint/typecheck evidence, cleanup, and final review gate discipline. Persist progress in `.omw/autopilot/<slug>/ledger.json`.
   - Use `team` only inside an active Ultragoal story when the story clearly benefits from coordinated parallel execution (e.g. independent file/module lanes, broad test matrix work, multi-domain implementation). Team remains explicit and leader-owned; Ultragoal keeps the goal/ledger state.
   - Required handoff artifact: implementation evidence, changed-file summary, verification evidence, and ledger/checkpoint references suitable for `code-review`.

4. **Phase `code-review`** — merge-readiness gate
   - Invoke the `code-review` skill (`skill: code-review`) on the diff/artifacts produced by `ultragoal`.
   - A clean review means final recommendation `APPROVE` with architectural status `CLEAR`.
   - `COMMENT`, `REQUEST CHANGES`, any architectural `WATCH`/`BLOCK`, or any unresolved finding is not clean.
   - If not clean because the implementation must be repaired, increment the review cycle, set `current_phase:"rework"`, and carry the findings as the sanctioned execution-fix input. Return to Phase `ralplan` only when the review shows the plan/requirements are wrong or incomplete.

5. **Phase `ultraqa`** — adversarial QA gate
   - Invoke the `ultraqa` skill (`skill: ultraqa`) after a clean code review when user-facing behavior, workflows, CLI/runtime behavior, integration surfaces, or regression risk warrant adversarial QA.
   - For docs-only or trivially non-runtime changes, record `ultraqa` as skipped with an explicit condition and evidence.
   - If UltraQA finds issues, set `return_to_ralplan_reason`, and transition back to Phase `ralplan`.

The only normal terminal state is `complete` after clean code review and a passed or explicitly skipped UltraQA gate. Cancellation, blocked credentials, unrecoverable repeated failures, or explicit user stop may terminate earlier with preserved state.

## Pre-context intake

Before Phase `deep-interview` or `ralplan` starts or resumes:
1. Derive a task slug from the request.
2. Reuse the latest relevant `.omw/autopilot/<slug>/context.md` snapshot when available.
3. If none exists, create `.omw/autopilot/<slug>/context.md` (UTC `YYYYMMDDTHHMMSSZ`) with:
   - activation prompt / task seed
   - original task status (`activation-prompt`, `legacy-unverified`, or `unavailable`)
   - desired outcome
   - known facts/evidence
   - constraints
   - unknowns/open questions
   - likely codebase touchpoints
   - a scope note that the seed is the Autopilot activation prompt, not guaranteed prior conversation context
4. If brownfield facts are missing, run normal repo inspection (Read, Grep, Glob, read-only Bash) before or during `deep-interview`; do not skip the clarification gate merely because the task sounds actionable.
5. Carry the snapshot path in the task list and all handoff artifacts.

## Execution policy

- Always execute the recommended phases in order: `deep-interview`, then `ralplan`, then `ultragoal`, then `code-review`, then `ultraqa`.
- `team` is conditional and explicit: use it only within an Ultragoal story when parallel execution materially improves throughput, quality, or safety.
- Never skip directly from vague/freeform expansion to implementation; unclear input must be clarified and planned through `deep-interview` and `ralplan`.
- A non-clean `code-review` that requires implementation repair enters Phase `rework`; a non-clean review that changes the plan/requirements, or failed `ultraqa`, returns to `ralplan`.
- Track each phase with the task list before handing off.
- Continue automatically through safe reversible phase transitions. Ask only for destructive, credential-gated, or materially preference-dependent branches.

## State management (task list + memory, not `omx`)

There is no `omx` binary in WorkBuddy. Represent Autopilot lifecycle state with the **task list** and a small JSON sidecar at `.omw/autopilot/<slug>/state.json`. Keep `current_phase` among `deep-interview`, `ralplan`, `ultragoal`, `rework`, `code-review`, `ultraqa`, `complete`, `failed`. Track `iteration`, `review_cycle`, handoff artifact paths, `review_verdict`, `qa_verdict`, and `return_to_ralplan_reason`.

- **On start**: create tasks for each phase; write `state.json` with `mode:"autopilot"`, `active:true`, `current_phase:"deep-interview"`, `iteration:1`, `review_cycle:0`, `phase_cycle:[...]`, and empty handoff slots.
- **On deep-interview -> ralplan**: only after a gate proves the interview chain is explicitly complete or the user authorized a skip. Persist `deep_interview_gate:{status:"complete"|"skipped", rationale, handoff_summary}` plus the clarified spec.
- **On ralplan -> ultragoal**: only after `ralplan_consensus_gate.complete:true` with recorded architect and critic approvals. Set `current_phase:"ultragoal"` and persist plan/test-spec paths.
- **On missing ralplan consensus evidence**: keep `current_phase:"ralplan"` with `blocked_reason`; report an explicit blocker or max-iteration outcome instead of handing off.
- **On ultragoal -> code-review**: persist implementation/test/ledger evidence.
- **On code-review -> ultraqa**: only after a real `code-review` pass produced durable evidence; do not author `review_verdict:{clean:true}` from the leader's own summary.
- **On non-clean code-review requiring repair**: increment `review_cycle`, set `current_phase:"rework"`, keep fixes scoped to findings, return to `code-review`.
- **On clean review + passed/skipped QA**: set `active:false`, `current_phase:"complete"`, persist both verdicts with durable source evidence. Self-attestation without source evidence is not a gate.
- **On non-clean review requiring plan changes or failed QA**: increment `iteration` and `review_cycle`, set `current_phase:"ralplan"`, set `return_to_ralplan_reason`.
- **On cancellation**: preserve progress for resume rather than deleting handoff artifacts.

## Continuation and resume

When the user says `continue`, `resume`, or `keep going` while Autopilot is active, read `.omw/autopilot/<slug>/state.json` and continue from `current_phase`:
- `deep-interview`: clarify requirements and record the handoff.
- `ralplan`: run/update consensus planning from current handoffs and any `return_to_ralplan_reason`.
- `ultragoal`: execute the approved plan durably and record verification/ledger evidence.
- `rework`: perform only the implementation fixes required by the current code-review findings, record fresh evidence, return to `code-review`.
- `team`: continue explicit team work only when nested under the active Ultragoal story; report evidence back to the leader.
- `code-review`: review the current diff and decide clean vs return-to-ralplan.
- `ultraqa`: run or explicitly skip adversarial QA, then finish if clean or transition to `ralplan` with findings if not clean.
- `complete`: report completion evidence; do not restart.

Do not restart discovery or discard handoff artifacts on continuation.

## Escalation and stop conditions

- Stop and report a blocker when required credentials/authority are missing.
- Stop and report when the same review or QA failure recurs across 3 review cycles with no meaningful new plan.
- Stop when the user says "stop", "cancel", or "abort".
- Otherwise, continue the loop until `code-review` is clean and `ultraqa` has passed or been explicitly skipped with evidence.

## Final checklist

- [ ] Phase `deep-interview` produced/updated clarified requirements or a concise spec
- [ ] Phase `ralplan` produced/updated approved planning artifacts and durable sequential evidence from architect and critic approvals
- [ ] Phase `ultragoal` implemented and verified the plan with fresh evidence and ledger references
- [ ] Phase `rework` was used for implementation-only review fixes when applicable
- [ ] `team` was used only if the active Ultragoal story needed coordinated parallel work, or explicitly recorded as not needed
- [ ] Phase `code-review` returned a clean verdict (`APPROVE` + `CLEAR`)
- [ ] Phase `ultraqa` passed, or was explicitly skipped for docs-only/trivially non-runtime with evidence
- [ ] Clean verdicts cite durable source evidence; leader-authored summaries alone are not gate evidence
- [ ] `review_verdict.clean` is true, `qa_verdict.clean` is true, `return_to_ralplan_reason` is null
- [ ] Tests/build/lint/typecheck evidence from Ultragoal is available in handoff artifacts
- [ ] Autopilot state is marked `complete` or cancellation state is preserved coherently
- [ ] User receives a concise summary with clarification, plan, implementation, verification, review, and QA evidence

## Examples

**Good:** User: `autopilot implement GitHub issue #42`
Flow: context snapshot -> `deep-interview` requirements check -> `ralplan` issue plan -> `ultragoal` durable implementation + tests (launch `team` only if a story needs parallel lanes) -> `code-review` -> `ultraqa`; if review or QA requests changes, return to `ralplan` with findings.

**Good:** User: `continue`, state says `current_phase:"code-review"`.
Flow: run `code-review` on current diff, transition to `ultraqa` if clean or to `ralplan` with findings if not clean.

**Bad:** Autopilot invents independent "Expansion", "QA", and "Validation" phases and treats them as the primary lifecycle.
Why bad: this bypasses the strict `deep-interview -> ralplan -> ultragoal -> code-review -> ultraqa` contract.
