---
name: deep-interview
description: Socratic deep interview with mathematical ambiguity gating that turns vague ideas into execution-ready specifications before planning or implementation
agent_created: true
triggers: ["deep interview", "interview me", "ask me everything", "don't assume", "clarify requirements", "ouroboros"]
---

> Ported from oh-my-codex `deep-interview`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

<Purpose>
Deep Interview is an intent-first Socratic clarification loop before planning or implementation. It turns vague ideas into execution-ready specifications by asking targeted questions about why the user wants a change, how far it should go, what should stay out of scope, and what WorkBuddy may decide without confirmation.
</Purpose>

<Use_When>
- The request is broad, ambiguous, or missing concrete acceptance criteria.
- The user says "deep interview", "interview me", "ask me everything", "don't assume", or "ouroboros".
- The user wants to avoid misaligned implementation from underspecified requirements.
- You need a requirements artifact before handing off to `plan`, `team`, or an execution workflow.
</Use_When>

<Do_Not_Use_When>
- The request already has concrete file/symbol targets and clear acceptance criteria.
- The user explicitly asks to skip planning/interview and execute immediately.
- The user asks for lightweight brainstorming only (use `plan` instead).
- A complete spec/plan already exists and execution should start.
</Do_Not_Use_When>

<Why_This_Exists>
Execution quality is usually bottlenecked by intent clarity, not just missing implementation detail. A single expansion pass often misses why the user wants a change, where the scope should stop, which tradeoffs are unacceptable, and which decisions still require user approval. This workflow applies Socratic pressure + quantitative ambiguity scoring so downstream work begins with an explicit, testable, intent-aligned spec.
</Why_This_Exists>

<Depth_Profiles>
- **Quick (`--quick`)**: fast pre-spec pass; target threshold `<= 0.30`; max rounds 5.
- **Standard (`--standard`, default)**: full requirement interview; target threshold `<= 0.20`; max rounds 12.
- **Deep (`--deep`)**: high-rigor exploration; target threshold `<= 0.15`; max rounds 20.

Profile `max rounds` is a hard cap, not a target. Do not continue only to reach a numbered round count.

If no flag is provided, use **Standard**.
</Depth_Profiles>

<Execution_Policy>
- Ask ONE question per round (never batch multiple interview rounds into one AskUserQuestion call).
- Ask about intent and boundaries before implementation detail.
- Target the weakest clarity dimension each round (see stage-priority rules below).
- Treat every answer as a claim to pressure-test before moving on: the next question should usually demand evidence or examples, expose a hidden assumption, force a tradeoff or boundary, or reframe root cause vs symptom.
- Do not rotate to a new clarity dimension just for coverage when the current answer is still vague; stay on the same thread until one layer deeper, one assumption clearer, or one boundary tighter.
- Before crystallizing, complete at least one explicit pressure pass that revisits an earlier answer with a deeper, assumption-focused, or tradeoff-focused follow-up.
- Gather codebase facts via repo inspection tools (Read, Grep, Glob, Bash) before asking the user about internals.
- Always run a preflight context intake before the first interview question.
- For brownfield work, preflight must include doc/context grounding before user-facing questions: inspect applicable `AGENTS.md` / `CLAUDE.md` files, README/getting-started docs, relevant `docs/` contracts/plans/ADRs, and any project-local glossary/context files such as `CONTEXT.md` or `CONTEXT-MAP.md` when present.
- Treat existing repo language as evidence, not authority: if the user uses a fuzzy, overloaded, or conflicting term, surface the specific doc/code wording and ask which meaning should govern.
- Cross-check user claims about current behavior against code or documented contracts when discoverable. If docs and code disagree, ask a confirmation question that names both sources.
- Use scenario-based edge-case grilling when relationships, boundaries, or handoff behavior are unclear: invent one concrete scenario that stresses the ambiguous boundary, then ask one focused question about the expected outcome.
- Durable docs, glossary, ADR, or memory updates are opt-in and public-safe only. Recommend such updates in the handoff summary, but do not automatically create public docs from interview transcripts unless the user explicitly chooses that as in-scope.
- Reduce user effort: ask only the highest-leverage unresolved question, and never ask the user for codebase facts that can be discovered directly.
- When unresolved ambiguity depends on current external best practices, invoke the `best-practice-research` skill as the bounded evidence wrapper before crystallizing requirements or handing off.
- Use these transcript/spec labels:
  - `[from-code][auto-confirmed]` — exact, high-confidence codebase facts from manifests/configs or direct source evidence, with no prescription attached.
  - `[from-code]` — codebase findings that are useful but inferred, pattern-based, or low/medium confidence and therefore need a confirmation-style user-facing round.
  - `[from-research]` — externally sourced facts (API limits, compatibility, public docs); facts only, not decisions.
  - `[from-user]` — goals, preferences, business logic, scope, non-goals, acceptance criteria, tradeoffs, and any decision-bearing interpretation.
- Treat `[from-code][auto-confirmed]` and other non-user fact discoveries as context/transcript updates, not interview rounds: do not increment the user-facing round number for facts the agent can safely establish.
- Auto-confirm only descriptive facts. If a finding implies what the feature should do, which pattern to follow, which tradeoff to accept, or what should stay in/out of scope, route the entire decision-bearing question to the user as `[from-user]`.
- Use the AskUserQuestion tool for every structured interview round. If it is unavailable, ask exactly one concise plain-text question in chat and wait for the answer.
- Re-score ambiguity after each answer and show progress transparently.
- Once ambiguity is at or below the active profile threshold, stop ordinary questioning. Run the practical closure audit: crystallize/handoff when readiness gates pass; otherwise ask only the final closure question needed to satisfy a named gate.
- Treat `max_rounds` as a stop cap, not evidence that more rounds are needed.
- Do not hand off to execution while ambiguity remains above threshold unless the user explicitly opts to proceed with warning.
- Do not crystallize or hand off while `Non-goals` or `Decision Boundaries` remain unresolved, even if the weighted ambiguity threshold is met.
- Persist progress with the task list (TaskCreate/TaskUpdate) and/or append to `.workbuddy/memory/YYYY-MM-DD.md`; do not rely on any persistent "mode" file.
</Execution_Policy>

<Steps>

## Phase 0: Preflight Context Intake

1. Parse `{{ARGUMENTS}}` and derive a short task slug.
2. Inspect the repo for an existing context snapshot under `.omw/deep-interview/context-{slug}-*.md`; load it if present.
3. If the provided initial context is too large for safe prompt use, the first interview round must ask for a concise prompt-safe summary instead of scoring ambiguity or continuing to downstream handoff.
4. If no snapshot exists, create a minimum context snapshot with: task statement, desired outcome, stated solution, probable intent hypothesis, known facts/evidence, constraints, unknowns, decision-boundary unknowns, likely codebase touchpoints, relevant repo docs/rules inspected, terminology or doc/code conflicts, and summary status (`not_needed` / `needed` / `recorded`).
5. For brownfield tasks, inspect the applicable documentation/rule surface before the first user-facing round: governing `AGENTS.md`/`CLAUDE.md`, README/docs (especially contracts, plans, ADRs), existing `.omw/` snapshots and planning artifacts, and project-local glossary/context files.
6. Save the snapshot to `.omw/deep-interview/context-{slug}-{timestamp}.md` (UTC `YYYYMMDDTHHMMSSZ`).

## Phase 1: Initialize

1. Parse `{{ARGUMENTS}}` and depth profile (`--quick|--standard|--deep`).
2. Detect project context: use repo inspection tools to classify **brownfield** (existing codebase target) vs **greenfield**. For brownfield, collect relevant codebase context before questioning.
3. Create a task list entry for the interview (e.g. "Deep interview: <slug>") to track progress. Announce kickoff with profile, threshold, and current ambiguity (start `1.0`).

## Phase 2: Socratic Interview Loop

Repeat until ambiguity `<= threshold`, the pressure pass is complete, the readiness gates are explicit, the user exits with warning, or max rounds are reached.

### 2a) Generate next question
If the initial context is oversized and no prompt-safe summary has been recorded yet, the next question must be only a summary request.

Target the lowest-scoring dimension, respecting stage priority:
- **Stage 1 — Intent-first:** Intent, Outcome, Scope, Non-goals, Decision Boundaries.
- **Stage 2 — Feasibility:** Constraints, Success Criteria.
- **Stage 3 — Brownfield grounding:** Context Clarity (brownfield only).

Follow-up pressure ladder after each answer:
1. Ask for a concrete example, counterexample, or evidence signal behind the latest claim.
2. Probe the hidden assumption, dependency, or belief that makes the claim true.
3. Force a boundary or tradeoff: what would you explicitly not do, defer, or reject?
4. Challenge fuzzy or conflicting terms against the repo's documented language and current code behavior.
5. Stress-test the boundary with one concrete scenario or edge case.
6. If the answer still describes symptoms, reframe toward essence / root cause.

Prefer staying on the same thread for multiple rounds when it has the highest leverage.

Maintain a **Breadth Ledger** across independent ambiguity tracks (scope, constraints, outputs, verification, brownfield integration, deliverables). Stay deep on the current thread until pressure-tested, then zoom out only when another material track remains unresolved.

Maintain a **Docs/Terminology Ledger** for brownfield interviews (sources inspected, canonical vs conflicting terms, doc/code mismatches, opt-in durable-doc follow-ups).

Detailed dimensions:
- Intent Clarity — why the user wants this.
- Outcome Clarity — what end state they want.
- Scope Clarity — how far the change should go.
- Constraint Clarity — technical or business limits that must hold.
- Success Criteria Clarity — how completion will be judged.
- Context Clarity — existing codebase understanding (brownfield only).

`Non-goals` and `Decision Boundaries` are mandatory readiness gates. Ask about them early and keep revisiting them until explicit.

### 2b) Ask the question
Use the AskUserQuestion tool for every interview round (one question per round). Present:

```
Round {n} | Target: {weakest_dimension} | Ambiguity: {score}%

{question}
```

For bounded single-choice rounds (e.g. handoff lane selection), provide 2–4 options via AskUserQuestion. For bounded multi-select (e.g. out-of-scope items, acceptance checks), enable multi-select. Keep options concrete; only allow a free-text "Other" when the answer genuinely cannot be enumerated.

### 2c) Score ambiguity
Score each weighted dimension in `[0.0, 1.0]` with justification + gap.

Greenfield: `ambiguity = 1 - (intent × 0.30 + outcome × 0.25 + scope × 0.20 + constraints × 0.15 + success × 0.10)`

Brownfield: `ambiguity = 1 - (intent × 0.25 + outcome × 0.20 + scope × 0.20 + constraints × 0.15 + success × 0.10 + context × 0.10)`

Readiness gate:
- `Non-goals` must be explicit.
- `Decision Boundaries` must be explicit.
- A pressure pass must be complete (at least one earlier answer revisited with an evidence/assumption/tradeoff follow-up).
- A practical closure audit must pass: another question would change execution materially, not merely polish wording.
- If either gate is unresolved, continue below threshold only with a final closure question that names the unresolved gate.
- If ambiguity is `<= 0.10`, another user-facing question is allowed only as that final closure question; otherwise crystallize immediately.

### 2d) Report progress
Show weighted breakdown table, readiness-gate status (`Non-goals`, `Decision Boundaries`), and the next focus dimension. Append a short note to `.workbuddy/memory/YYYY-MM-DD.md` if useful.

### 2e) Round controls
- Do not offer early exit before the first explicit assumption probe and one persistent follow-up have happened.
- **Dialectic Rhythm Guard:** after 3 consecutive non-user or confirmation answers (`[from-code][auto-confirmed]`, `[from-code]`, or `[from-research]`), the next material user-facing round must solicit direct human judgment (`[from-user]`).
- Round 4+: allow explicit early exit with risk warning.
- Hard cap at profile `max_rounds`; never treat this cap as a desired interview length.

## Phase 3: Challenge Modes (assumption stress tests)

Use each mode once when applicable:
- **Contrarian** (round 2+ or immediately when an answer rests on an untested assumption): challenge core assumptions.
- **Terminologist** (brownfield, when a key term is fuzzy/overloaded/conflicts): force a canonical meaning against existing project language.
- **Simplifier** (round 4+ or when scope expands faster than outcome clarity): probe minimal viable scope.
- **Ontologist** (round 5+ and ambiguity > 0.25, or when the user keeps describing symptoms): ask for essence-level reframing.

Track used modes in the task list / memory to prevent repetition.

## Phase 4: Crystallize Artifacts

When threshold is met (or user exits with warning / hard cap):

1. Write interview transcript summary to `.omw/deep-interview/interview-{slug}-{timestamp}.md`.
2. Write execution-ready spec to `.omw/deep-interview/spec-{slug}.md`.

Spec should include:
- Metadata (profile, rounds, final ambiguity, threshold, context type).
- Context snapshot reference/path.
- Prompt-safe initial-context summary when oversized context was provided.
- Clarity breakdown table.
- Intent, Desired Outcome, In-Scope, Out-of-Scope / Non-goals, Decision Boundaries (what WorkBuddy may decide without confirmation), Constraints, Testable acceptance criteria.
- Assumptions exposed + resolutions.
- Pressure-pass findings.
- Brownfield evidence vs inference notes.
- Docs/Terminology Ledger.
- Scenario/edge-case pressure findings.
- Optional durable documentation recommendations (opt-in, public-safe).
- Technical context findings.
- Full or condensed transcript.

## Phase 5: Execution Bridge

Present execution options after artifact generation using explicit handoff contracts. Treat the deep-interview spec as the current requirements source of truth.

1. **`plan` (Recommended when architecture/test-shape review is still needed)** — Input: `.omw/deep-interview/spec-{slug}.md`. Invoke the `plan` skill (`skill: plan`). Do not repeat the interview; refine architecture/feasibility around the clarified intent.
2. **`team` (Coordinated parallel implementation)** — Invoke the `team` skill (`skill: team`) or spawn parallel agents via the Agent tool, using the spec as shared execution context. Best for large, multi-lane, blocker-sensitive tasks.
3. **Direct execution (single owner)** — Spawn one Agent to implement against the spec's acceptance criteria, or continue in-session. Use the task list to track completion checkpoints.
4. **Refine further** — Re-enter the interview loop to resolve the highest-leverage remaining uncertainty.

**Residual-Risk Rule:** If the interview ended via early exit, hard-cap completion, or above-threshold proceed-with-warning, explicitly preserve that residual-risk state in the handoff.

**IMPORTANT:** Deep-interview is a requirements mode. On handoff, invoke the selected skill using the contract above. **Do NOT implement directly** inside deep-interview.

</Steps>

<Escalation_And_Stop_Conditions>
- User says stop/cancel/abort -> preserve state in memory and stop (or invoke the `cancel` skill).
- Ambiguity stalls for 3 rounds (+/- 0.05) -> force Ontologist mode once.
- Max rounds reached -> proceed with explicit residual-risk warning.
- All dimensions >= 0.9 -> allow early crystallization even before max rounds.
</Escalation_And_Stop_Conditions>

<Final_Checklist>
- [ ] Preflight context snapshot exists under `.omw/deep-interview/context-{slug}-{timestamp}.md`.
- [ ] Oversized initial context, if present, has a prompt-safe summary recorded before scoring or handoff.
- [ ] Ambiguity score shown each round.
- [ ] Intent-first stage priority used before implementation detail.
- [ ] Weakest-dimension targeting used within the active stage.
- [ ] At least one explicit assumption probe happened before crystallization.
- [ ] At least one persistent follow-up / pressure pass deepened a prior answer.
- [ ] Challenge modes triggered at thresholds (when applicable).
- [ ] Transcript written to `.omw/deep-interview/interview-{slug}-{timestamp}.md`.
- [ ] Spec written to `.omw/deep-interview/spec-{slug}.md`.
- [ ] Brownfield questions use evidence-backed confirmation when applicable.
- [ ] Fuzzy or conflicting terminology was challenged against repo language/code behavior when applicable.
- [ ] Scenario-based edge-case grilling was used when boundary ambiguity would materially affect implementation.
- [ ] Handoff options provided (`plan`, `team`, direct execution, refine further).
- [ ] No direct implementation performed in this mode.
</Final_Checklist>

<Advanced>
## Resume

If interrupted, rerun the `deep-interview` skill with the same arguments. Resume from the
context snapshot under `.omw/deep-interview/context-{slug}-*.md` and continue the round log
recorded in `.workbuddy/memory/YYYY-MM-DD.md`.

## Recommended Pipeline

```
deep-interview -> plan -> execution (Agent tool / team)
```

- Stage 1 (deep-interview): clarity gate.
- Stage 2 (plan): feasibility + architecture gate.
- Stage 3 (execution): implementation + verification.
</Advanced>
