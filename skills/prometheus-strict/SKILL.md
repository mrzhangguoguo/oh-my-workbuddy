---
name: prometheus-strict
description: "Clean-room interview-driven planner with three voices (Metis clarifies, Momus challenges, Oracle synthesizes), then hands off to ultragoal/team. Use for rigorous pre-execution planning when ambiguity is risky. Triggers: 'prometheus strict', 'strict plan', 'interview-driven plan', 'rigorous planning before execution'."
agent_created: true
triggers: ["prometheus strict", "strict plan", "interview-driven plan", "rigorous planning before execution"]
---

> Ported from oh-my-codex `prometheus-strict`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Prometheus Strict

Clean-room planning workflow inspired by the high-level OMO Prometheus concept only. It reimplements the idea under this repository's MIT-licensed skill conventions. It does not copy implementation, prompts, wording, control flow, or runtime code from OMO.

Credit: Inspired by OMO Prometheus (`code-yeongyu/oh-my-openagent`), reimplemented from concept under MIT.

## Purpose
Prometheus Strict creates a rigorous plan before execution when ambiguity is still risky. It separates three planning voices: **Metis** clarifies requirements, **Momus** challenges assumptions and validation gaps, and **Oracle** synthesizes the handoff-ready plan.

The output is a planning-only artifact for `ultragoal` and, when independent lanes are justified, `team`. When a durable artifact is useful, store the final plan under `.omw/prometheus-strict/<slug>.md`.

## Use When
- The task is important enough that a shallow plan could produce wrong work.
- Requirements are partially known but acceptance criteria, boundaries, risks, or validation are incomplete.
- The user wants a strict interview before execution.
- A future `ultragoal` story needs durable scope, tests, and handoff sequencing.
- A team split may be needed, but lanes are not yet safe to assign.

## Do Not Use When
- Immediate implementation of a clear, low-risk change; use the normal execution path.
- Only a repository lookup or explanation; use the Explore/analysis tools.
- Adversarial execution QA after code changes; use the QA/review skill.
- Hook behavior, Sisyphus behavior, or a `start-work` port — explicit non-goals.

## Why This Exists
There is already `plan` (with consensus) and `deep-interview`. Prometheus Strict exists for a narrower case: an explicit clean-room strict-planning lane with named clarification, critique, and synthesis roles, plus a durable `.omw/prometheus-strict/` handoff contract. It is not a replacement for execution workflows.

## Execution Policy
- Stay planning-only. Do not edit source code during this skill unless the user starts a separate execution workflow afterward.
- Preserve clean-room boundaries. Do not copy or imitate OMO wording, source, prompts, runtime behavior, or control flow.
- Keep non-goals visible: no hook implementation, no Sisyphus/start-work port, no automatic external-production actions.
- Ask high-leverage questions as a batched `AskUserQuestion` round when answers materially change scope, safety, or validation. Reserve one-at-a-time questioning only for dependent chains where the next question depends on the previous answer.
- If a safe assumption is available, state it and continue.
- Use repository reads (Read/Grep/Glob/Bash) when needed to make paths, tests, and handoff commands concrete.
- During Metis planning, run pre-question research fan-out for every non-trivial intent unless trivial, self-contained, or already cached: use the **Explore** subagent for repo facts and the Agent tool for external docs / OSS references before asking the user. Prometheus Strict may fan out up to `2 Explore + 4 research` Agent calls per round so breadth comes from more citation-focused mini researchers while Metis/Momus/Oracle keep stronger judgment. If a lighter model is available for the research fan-out, prefer it.
- Recommend `team` only when Oracle identifies independent, bounded, verifiable lanes.

### Structured Question Surface
Every Metis/Momus/Oracle question to the user MUST go through `AskUserQuestion`. Plain prose questioning is the last fallback.
- **Batch independent high-leverage questions into a single `AskUserQuestion` call**: scope, constraints, non-goals, deliverables, safety bounds, acceptance criteria are normally independent and MUST be batched; reserve one-at-a-time only for dependent chains.
- Wait for the answers before checking the clearance rule, asking another round, or handing off.
- **Minimum two emitted question rounds**: when Metis emits any user-facing question round, do not hand off after Round 1 unless a stop condition forces exit; handoff is allowed only after Round 2 has been emitted and processed. Zero-question complete-checklist handoff remains valid when no questions were emitted.
- Between-round planning must actively use evidence: after Round 1 answers, refresh/reuse Explore/research evidence, re-run spec prefill, and build Round 2 from residual CRITICAL gaps only.

### Checklist Clearance
The interview is governed by deterministic checklist clearance, not "feels enough". Exit the Metis interview loop when the 6-item checklist is fully YES: objective / scope IN+OUT / acceptance / test strategy / handoff target / no outstanding CRITICAL. Each item is YES when USER_ANSWERED ∪ ABSORBED_WITH_CITATION ∪ INFERRED_FROM_SPEC. Only UNKNOWN counts as NO.

Cap interview rounds at **5** to prevent runaway. If clearance is not reached by round 5, carry remaining UNKNOWN items to Oracle as explicit `<unresolved_blocker>` entries.

**Stop conditions**: if the user's responses contain refusal/dismissive signals ("you decide", "whatever") or a turn abort, the round invalidates its answers — it does NOT advance any checklist item, exits the loop, and routes unresolved gaps either to silent absorption (dismissive delegation) or back to the user (for anger/abort).

## Steps

### 1. Intake and Safety Bounds
Restate the target result, known constraints, deliverables, validation expectations, and stop condition. Identify whether this turn is planning-only or also requests downstream execution. Hold destructive, credential-gated, external-production, or materially scope-changing decisions for explicit user confirmation.

### 2. Metis Interview (Iterative, Checklist Clearance)
Use the **Agent tool framed as Metis** as the interview voice (or run the same role in-context). Metis discovers success criteria, non-goals, evidence vs assumptions, required artifacts, likely execution lanes, and missing decisions. Before the first user-facing question batch, fan out repo/external research per intent: **Explore** maps local surfaces, Agent research calls gather official/upstream or OSS evidence.

Run the interview as a bounded loop:
1. Identify every UNKNOWN checklist item and every CRITICAL question that materially changes scope/safety/validation.
2. Batch the round's independent questions into a single `AskUserQuestion` call.
3. Collect answers, then run **Gap-fill Pass 1 — answer assimilation**: mark checklist items YES only when USER_ANSWERED, ABSORBED_WITH_CITATION, or INFERRED_FROM_SPEC.
4. Run **Gap-fill Pass 2 — residual adversarial scan**: re-check every remaining UNKNOWN against repo context, prior turns, research evidence, defaults; absorb non-CRITICAL gaps, leave only CRITICAL blockers.
5. Run **between-round planning** after Round 1: refresh/reuse evidence, re-run spec prefill, prepare Round 2 from residual CRITICAL gaps.
6. Evaluate the 6-item checklist only after BOTH gap-fill passes and the minimum two emitted question rounds gate; exit when ALL YES (or zero questions emitted).
7. If clearance not reached, or only Round 1 processed, return to step 1. Cap at 5 rounds; on cap, carry UNKNOWN forward to Oracle as `<unresolved_blocker>`.

### 3. Momus Challenge (Bounded Retry)
Use the **Agent tool framed as Momus** as the adversarial critique voice. Momus challenges underspecified acceptance criteria, unsafe assumptions, hidden destructive steps, overbroad scope, missing verification, ownership conflicts, and `ultragoal`/`team` handoff ambiguity.

**Bounded retry contract**: after Oracle synthesizes in §4, re-invoke Momus on the synthesized plan to verify Oracle's resolutions did not introduce new risks. Repeat Momus → Oracle re-synthesis up to **3 times total**. If blocking objections remain after the 3rd cycle, mark them carried-forward and proceed to §5.

### 4. Oracle Synthesis (Two-Pass: Synthesis + Self-Verification)
Use the **Agent tool framed as Oracle** as the synthesis voice.

**Pass 1 — Synthesis.** Oracle produces the final objective, scope and non-goals, accepted assumptions, resolved critique, sequenced steps/lanes, verification matrix, rollback/escalation conditions, and recommended handoff.

**Pass 2 — Self-Verification (machine-checkable acceptance contract).** Oracle re-reads its own Pass 1 and asserts:
- Every claim in the verification matrix has an explicit evidence source (test/build/lint/e2e/doc).
- Every step lists its owner/lane/executor; no shared-file conflicts between parallel lanes.
- Stop, rollback, and acceptance criteria are mutually consistent.
- No destructive, credential-gated, or external-production step is unauthorized.
- The handoff command is concrete (callable verbatim) and points at an existing workflow (`ultragoal`, `team`, or `none`).
- Clean-room credit is preserved.

If any Pass 2 check fails, Oracle MUST loop back to Pass 1. Cap Pass 1↔Pass 2 cycles at **3**; on cycle 3 failure, emit the plan with failing gates annotated as carried-forward and escalate to the user.

### 5. Post-Plan Gap Check (Metis Re-Invocation)
Before handing off, re-invoke the **Metis** Agent on the finalized Oracle plan: identify ambiguities that surfaced only after rendering (overlapping lane assignments, verification gaps revealed by stop conditions, acceptance criteria contradicting rollback). If any blocking gap surfaces, return to §4 Pass 1. Otherwise proceed to §6.

### 6. Handoff
Prometheus Strict stops with a plan unless the user explicitly invokes/authorizes the next workflow. Prefer:
```
ultragoal "<Oracle plan summary or .omw/prometheus-strict/<slug>.md>"
team <N>:executor "execute the approved story in parallel lanes"   # only when warranted
```

## Tool Usage
- Use read-only repository inspection to verify referenced files, commands, and conventions.
- Treat Metis research fan-out as planning, not execution: dispatch Explore / Agent research before question generation for non-trivial intents, then ask only surviving CRITICAL gaps.
- Use the Metis, Momus, and Oracle Agent voices sequentially; do not fan out implementation work.
- Use `ultragoal` only as the recommended execution handoff after the plan is ready.
- Use `team` only when parallel lanes are independent and verifiable.

## State Management
Prometheus Strict does not own a long-running runtime loop. If a durable planning artifact is needed, write the final plan to `.omw/prometheus-strict/<slug>.md`. Draft-only/inline plans may set the artifact path to `N/A - inline plan only`.

Do not create hook state, Sisyphus state, or `start-work` compatibility state.

## Final Checklist
- [ ] Target result explicit; scope and non-goals explicit; acceptance criteria measurable.
- [ ] Metis loop reached clearance only after the two gap-fill passes and (if questions emitted) the two-round gate; else 5-round cap with UNKNOWN carried forward.
- [ ] Momus objections resolved or carried forward; ≤3 Momus→Oracle cycles.
- [ ] Oracle plan includes a verification matrix.
- [ ] Oracle Pass 2 self-verification completed; every contract item passes or annotated carried-forward.
- [ ] Post-plan Metis gap check produced no blocking objections (or all carried forward).
- [ ] Handoff recommends `ultragoal` and `team` only when warranted.
- [ ] Clean-room credit preserved; no hook/Sisyphus/start-work introduced.

## Advanced
### Output Contract
If writing a durable plan file, store this markdown at `.omw/prometheus-strict/<slug>.md`:

```markdown
## Prometheus Strict Plan
### Target Result
- <one-sentence objective>
### Clarified Requirements (Metis)
- <requirement / acceptance criterion>
### Critique Resolved (Momus)
- <risk or objection> -> <resolution>
### Oracle Execution Plan
1. <sequenced step or lane>
### Verification Matrix
| Claim | Required evidence | Owner/lane |
| --- | --- | --- |
| <claim> | <test/build/lint/e2e/doc evidence> | <owner> |
### Artifact
- Durable plan path: `.omw/prometheus-strict/<slug>.md` or `N/A - inline plan only`
### Handoff
- Recommended next workflow: <ultragoal / team / direct execution / none>
- Stop condition: <what proves the plan is ready or why blocked>
### Clean-Room Credit
Inspired by OMO Prometheus (`code-yeongyu/oh-my-openagent`), reimplemented from concept under MIT.
```

### Failure and Escalation
Escalate instead of planning when a necessary answer cannot be inferred safely, the next step is destructive/credential-gated, required repository context is unavailable, or the user asks for behavior outside the non-goals.
