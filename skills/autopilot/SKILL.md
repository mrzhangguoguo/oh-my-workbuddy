---
name: autopilot
category: planning
status: active
core: true
description: Strict autonomous delivery loop that runs deep-interview, ralplan, ultragoal, code-review, and ultraqa in order with automatic re-planning when gates are not clean. Use on "autopilot", "autonomous", "build me", "create me", "make me", "full auto", "handle it all", or "I want a/an…".
agent_created: true
triggers: ["autopilot", "autonomous", "build me", "create me", "full auto", "handle it all"]
---

> Ported from oh-my-codex `autopilot`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.omw/autopilot/<slug>/` sidecar).

# Autopilot

Autopilot is the strict autonomous delivery loop for non-trivial work. Its recommended/default contract is exactly:

```text
deep-interview -> ralplan -> ultragoal (+ team if needed) -> code-review -> ultraqa
```

If `code-review` or `ultraqa` is not clean, Autopilot returns to `ralplan` with the findings as the next planning input, then continues again through `ultragoal`, `code-review`, and `ultraqa` until the gates are clean or a hard blocker is reported. Ralph is a legacy/explicit alternate execution loop only; do not advertise any legacy alternate loop as the default Autopilot path.

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

Autopilot must not run a separate broad expansion/planning/execution/QA/validation lifecycle as its primary behavior. It delegates those concerns to the canonical workflow phases below. Represent progress with the **task list** (TaskCreate/TaskUpdate/TaskList), and persist durable artifacts under `.omw/autopilot/<slug>/`. Do not invent a separate execution framework.

1. **Phase `deep-interview`** — Socratic requirements clarification gate
   - Invoke the `deep-interview` skill (`skill: deep-interview`) to clarify intent, scope, non-goals, constraints, and decision boundaries.
   - Deep-interview is a structured question chain, not a one-question gate; treat the round cap as a ceiling, not a target.
   - After the user answers, re-score ambiguity against the active profile threshold. Ask another question only when a readiness gate is still unresolved and the answer would materially change execution; otherwise crystallize the spec and hand off.
   - Required handoff artifact: a clarified spec or concise requirements summary suitable for `ralplan`, including an explicit interview-complete rationale when leaving deep-interview.

2. **Phase `ralplan`** — consensus planning gate
   - Ground the task with pre-context intake and the deep-interview artifact.
   - Current ownership rule: Autopilot records `planning_routing` in state before heavy planning. When the main session resolves to a cheap/mini model lane (for example a `*-mini`, `*spark*`, or explicitly cheap/economy/lite model name), the initial planning/decomposition owner is a dedicated `[planner]` role (spawn a planner Agent); otherwise `[main]` may keep ownership for backward compatibility. A configured `agentModels.planner` is an explicit opt-in that forces dedicated `[planner]` ownership even when `[main]` is not cheap/mini.
   - Invoke the `ralplan` skill (`skill: ralplan`) to produce/update PRD and test-spec artifacts. If `planning_routing.owner` is `planner`, use a dedicated `[planner]` Agent for the initial Planner draft/decomposition before the Architect→Critic consensus gates.
   - PRD/test-spec files alone are not completion evidence. Ralplan may hand off only after durable consensus evidence records a subsequent `architect` approval first and a subsequent `critic` approval second.
   - When returning from a non-clean review or QA pass, include `return_to_ralplan_reason` and the findings as first-class planning input.
   - If either review is missing, blocked, out of order, or non-approving, remain in `ralplan` or report an explicit blocker/max-iteration outcome; do not progress to `ultragoal`, `team`, or implementation.
   - Required handoff artifact: an approved plan/test spec plus `ralplan_consensus_gate` evidence suitable for `ultragoal`.

3. **Phase `ultragoal`** — durable implementation + verification loop
   - Invoke the `ultragoal` skill (`skill: ultragoal`) from the approved ralplan artifacts.
   - Ultragoal owns implementation, tests, build/lint/typecheck evidence, cleanup, and final review gate discipline. Persist progress in `.omw/autopilot/<slug>/ledger.jsonl`.
   - Use `team` only inside an active Ultragoal story when the story clearly benefits from coordinated parallel execution (for example independent file/module lanes, broad test matrix work, or multi-domain implementation). Team remains explicit and leader-owned; Ultragoal keeps the goal/ledger state.
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
- Each phase must write/update Autopilot state (task list + sidecar) before handing off.
- Use existing skills and Workflow tools (`deep-interview`, `ralplan`, `ultragoal`, optional `team`, `code-review`, `ultraqa`); do not invent a separate execution framework.
- Preserve legacy compatibility: if a user explicitly requests the old Ralph execution lane, use the `ralph` skill as an intentional alternate execution phase, but do not present it as Autopilot's default recommended loop.
- Continue automatically through safe reversible phase transitions. Ask only for destructive, credential-gated, or materially preference-dependent branches.
- Apply the shared workflow guidance pattern: outcome-first framing, concise visible updates for multi-step execution, local overrides for the active workflow branch, validation proportional to risk, explicit stop rules, and automatic continuation for safe reversible steps. Ask only for material, destructive, credentialed, external-production, or preference-dependent branches.

## State management (task list + sidecar, not `omx`)

There is no `omx` binary in WorkBuddy. Represent Autopilot lifecycle state with the **task list** and a small JSON sidecar at `.omw/autopilot/<slug>/state.json`. State must be session-aware when a session id exists. If a richer MCP state surface becomes available later, equivalent tool calls remain acceptable but are not required.

Inside active Autopilot, named child phases such as `ralplan` are supervised phases, not peer workflow activations: keep `mode:"autopilot"` active and update `current_phase:"ralplan"` rather than starting a standalone `mode:"ralplan"` over Autopilot.

Required fields:

```json
{
  "mode": "autopilot",
  "active": true,
  "current_phase": "deep-interview",
  "iteration": 1,
  "review_cycle": 0,
  "max_iterations": 10,
  "phase_cycle": ["deep-interview", "ralplan", "ultragoal", "code-review", "ultraqa"],
  "handoff_artifacts": {
    "context_snapshot_path": ".omw/autopilot/<slug>/context.md",
    "deep_interview": null,
    "ralplan": null,
    "ralplan_consensus_gate": {
      "required": true,
      "sequence": ["architect-review", "critic-review"],
      "planning_artifacts_are_not_consensus": true,
      "required_review_roles": ["architect", "critic"],
      "ralplan_architect_review": null,
      "ralplan_critic_review": null,
      "complete": false
    },
    "ultragoal": null,
    "code_review": null,
    "ultraqa": null
  },
  "review_verdict": null,
  "qa_verdict": null,
  "return_to_ralplan_reason": null
}
```

- **On start**: create tasks for each phase; write `state.json` with `mode:"autopilot"`, `active:true`, `current_phase:"deep-interview"`, `iteration:1`, `review_cycle:0`, `phase_cycle:[...]`, and empty handoff slots.
- **On deep-interview -> ralplan**: only after a gate proves the interview chain is explicitly complete or the user authorized a skip. Persist `deep_interview_gate:{status:"complete", rationale:"<why requirements are complete>", handoff_summary:"<summary>"}` (or equivalent non-empty rationale/summary) plus the clarified spec under `handoff_artifacts.deep_interview`. If a final question was involved, keep its same-session answered record linked by `question_id`/`satisfied_at`. For skip, persist `deep_interview_gate:{status:"skipped", skip_authorized_by_user:true, skip_reason:"<user-authorized reason>", skipped_at:"<timestamp>", source:"user"}`. Do not leave deep-interview merely because the first question was answered or cleared.
  - **Optional execution contract foundation**: when a downstream handoff explicitly sets `execution_contract_required:true`, persist a complete structured `execution_contract` under `handoff_artifacts.deep_interview` before leaving deep-interview. The canonical schema is `version:1`, `execution_stride:"task"|"deliverable"|"milestone"`, `source:"deep-interview"`, `selected_by:"user"|"default"`, `allow_task_shrink:<boolean>`, non-empty `completion_unit`, non-empty `stop_condition`, `acceptance_coverage_scope:"task"|"deliverable"|"milestone"`, and `shrink_policy:"allowed"|"ask_before_shrink"|"deny_unless_blocked"`.
  - Stride semantics are binding only when `execution_contract_required:true`: `task` means `allow_task_shrink:true`, `acceptance_coverage_scope:"task"`, `shrink_policy:"allowed"`; `deliverable` means `allow_task_shrink:false`, `acceptance_coverage_scope:"deliverable"`, `shrink_policy:"ask_before_shrink"`; `milestone` means `allow_task_shrink:false`, `acceptance_coverage_scope:"milestone"`, `shrink_policy:"deny_unless_blocked"`.
  - Preserve legacy behavior when `execution_contract_required` is absent or false. Do not infer stride from prose, broadness, phase names, snapshots, or task size; this foundation only validates an explicit structured contract and deliberately uses `milestone` rather than `phase`. New artifacts must write canonical snake_case keys under `handoff_artifacts.deep_interview`; any runtime may read legacy camelCase field/marker aliases and direct/nested `execution_contract` locations only as compatibility input.
- **On ralplan -> ultragoal**: only after `ralplan_consensus_gate.complete:true`, with a recorded `ralplan_architect_review.agent_role:"architect"` and `ralplan_architect_review.verdict:"approve"` recorded before a `ralplan_critic_review.agent_role:"critic"` and `ralplan_critic_review.verdict:"approve"`. Set `current_phase:"ultragoal"` and persist the plan/test-spec paths under `handoff_artifacts.ralplan`.
- **On missing ralplan consensus evidence**: keep `current_phase:"ralplan"`, persist `ralplan_consensus_gate.complete:false` with `blocked_reason`, and report an explicit blocker or max-iteration outcome instead of handing off to execution.
- **On ultragoal -> code-review**: set `current_phase:"code-review"`, persist implementation/test/ledger evidence under `handoff_artifacts.ultragoal`.
- **On code-review -> ultraqa**: set `current_phase:"ultraqa"` only after a real `code-review` pass produced durable evidence; persist the clean review under `handoff_artifacts.code_review` with its source thread/skill/stage reference. Do not author `review_verdict:{clean:true}` from the leader's own summary.
- **On non-clean code-review requiring implementation repair**: increment `review_cycle`, set `current_phase:"rework"`, persist `review_verdict`, persist the phase handoff under `handoff_artifacts.code_review`, and keep the fix scoped to the review findings before returning to `code-review`.
- **On clean review + passed/skipped QA**: set `active:false`, `current_phase:"complete"`, persist `review_verdict:{recommendation:"APPROVE", architectural_status:"CLEAR", clean:true}`, `qa_verdict:{clean:true, skipped:<boolean>, reason:<string|null>}`, and `completed_at` only when both gates have durable source evidence. Required evidence is either (a) actual `code-review`/`ultraqa` skill passes or agent/thread/tool records, or (b) for QA only, an explicit persisted skip reason for a documented docs-only/trivially non-runtime condition. If that evidence is missing, keep the active phase at `code-review` or `ultraqa` and record a blocker instead of self-attesting a clean gate.
- **On non-clean review requiring plan changes or failed QA**: increment `iteration` and `review_cycle`, set `current_phase:"ralplan"`, persist `review_verdict` or `qa_verdict`, persist the phase handoff, and set `return_to_ralplan_reason` to a concise findings-driven reason.
- **Legacy Ralph state**: if a user explicitly selected the legacy Ralph execution lane, phase names and handoff keys may include `ralph`; preserve and resume them rather than rewriting history to Ultragoal.
- **On cancellation**: run the `cancel` skill; preserve progress for resume rather than deleting handoff artifacts.

## Continuation and resume

When the user says `continue`, `resume`, or `keep going` while Autopilot is active, read `.omw/autopilot/<slug>/state.json` and continue from `current_phase`:
- `deep-interview`: clarify requirements and record the handoff artifact.
- `ralplan`: run/update consensus planning from current handoffs and any `return_to_ralplan_reason`.
- `ultragoal`: execute the approved plan durably and record verification/ledger evidence.
- `rework`: perform only the implementation fixes required by the current code-review findings, record fresh implementation/verification evidence, and return to `code-review`.
- `team`: continue explicit team work only when it is nested under the active Ultragoal story and report evidence back to the leader.
- `code-review`: review the current diff and decide clean vs return-to-ralplan.
- `ultraqa`: run or explicitly skip adversarial QA based on the documented condition, then finish if clean or transition to `ralplan` with findings if not clean.
- `ralph`: resume only for explicit legacy Ralph-path Autopilot state.
- `complete`: report completion evidence; do not restart.

Do not restart discovery or discard handoff artifacts on continuation.

## Pipeline orchestrator

Autopilot may be represented by a configurable pipeline orchestrator when useful. The default Autopilot pipeline contract is:

```text
deep-interview -> ralplan -> ultragoal -> code-review -> ultraqa
```

Pipeline state should use `current_phase` values that match the same phase names (`deep-interview`, `ralplan`, `ultragoal`, `rework`, `code-review`, `ultraqa`, `complete`, `failed`) and should carry `iteration`, `review_cycle`, `handoff_artifacts`, `review_verdict`, `qa_verdict`, and `return_to_ralplan_reason` alongside stage results. `team` is not a default pipeline stage; it is an explicit conditional execution engine inside an Ultragoal story.

## Escalation and stop conditions

- Stop and report a blocker when required credentials/authority are missing.
- Stop and report when the same review or QA failure recurs across 3 review cycles with no meaningful new plan.
- Stop when the user says "stop", "cancel", or "abort" and run the `cancel` skill.
- Otherwise, continue the loop until `code-review` is clean and `ultraqa` has passed or been explicitly skipped with evidence.

## Final checklist

- [ ] Phase `deep-interview` produced/updated clarified requirements or a concise spec
- [ ] Phase `ralplan` produced/updated approved planning artifacts and durable sequential evidence from a subsequent `architect` approval followed by a subsequent `critic` approval
- [ ] Phase `ultragoal` implemented and verified the plan with fresh evidence and durable ledger/checkpoint references
- [ ] Phase `rework` was used for implementation-only review fixes when applicable, with findings scoped to a fresh code-review cycle
- [ ] `team` was used only if the active Ultragoal story needed coordinated parallel work, or explicitly recorded as not needed
- [ ] Phase `code-review` returned a clean verdict (`APPROVE` + `CLEAR`)
- [ ] Phase `ultraqa` passed, or was explicitly skipped because the change was docs-only/trivially non-runtime with evidence
- [ ] Clean `review_verdict` cites durable source evidence from a real `code-review` pass; `qa_verdict` cites durable `ultraqa` evidence or an explicit persisted low-risk skip reason; leader-authored summaries alone are not gate evidence
- [ ] `review_verdict.clean` is true, `qa_verdict.clean` is true, and `return_to_ralplan_reason` is null
- [ ] Tests/build/lint/typecheck evidence from Ultragoal is available in handoff artifacts
- [ ] Autopilot state is marked `complete` or cancellation state is preserved coherently
- [ ] User receives a concise summary with clarification, plan, implementation, verification, review, and QA evidence

## Examples

**Good:** User: `autopilot implement GitHub issue #42`
Flow: create/load context snapshot -> `deep-interview` requirements check -> `ralplan` issue plan -> `ultragoal` durable implementation + tests (launch `team` only if a story needs parallel lanes) -> `code-review` -> `ultraqa`; if review or QA requests changes, return to `ralplan` with findings.

**Good:** User: `continue`, state says `current_phase:"code-review"`.
Flow: run `code-review` on current diff, persist verdict, transition to `ultraqa` if clean or to `ralplan` with findings if not clean.

**Good:** User: `autopilot --legacy-ralph finish the migration`
Flow: preserve the explicit legacy Ralph execution choice and run the old Ralph execution lane as an alternate, without changing the documented default Autopilot recommendation.

**Bad:** Autopilot invents independent "Expansion", "QA", and "Validation" phases and treats them as the primary lifecycle.
Why bad: this bypasses the strict `deep-interview -> ralplan -> ultragoal -> code-review -> ultraqa` contract.
