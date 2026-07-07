---
name: ralplan
description: "Alias for plan --consensus. Triggers iterative Planner→Architect→Critic consensus planning with RALPLAN-DR structured deliberation. Use when you want multi-perspective sign-off on a plan before execution. Triggers: 'ralplan', 'consensus plan', 'plan --consensus'."
agent_created: true
triggers: ["ralplan", "consensus plan", "plan --consensus"]
---

> Ported from oh-my-codex `ralplan`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ralplan (Consensus Planning Alias)

Ralplan is a shorthand alias for `plan --consensus`. It triggers iterative planning with Planner, Architect, and Critic roles until consensus is reached, with **RALPLAN-DR structured deliberation** (short mode by default, deliberate mode for high-risk work). An advisory ontology reviewer (Scholastic-style) may inform the plan for ontology-heavy evidence but is not part of the durable consensus gate.

## Usage
```
ralplan "task description"
ralplan --interactive "task description"
ralplan --deliberate "task description"
```

## Flags
- `--interactive`: Enables user prompts at key decision points (draft review and final approval). Without it the workflow runs fully automated and outputs the final plan.
- `--deliberate`: Forces deliberate mode for high-risk work (adds pre-mortem + expanded test planning). Can also auto-enable when the request signals high risk (auth/security, migrations, destructive changes, production incidents, compliance/PII, public API breakage).

## Behavior
This skill simply invokes the `plan` skill in consensus mode:

```
skill: plan   (with consensus; add --interactive / --deliberate as requested)
```

The consensus workflow (full detail in the `plan` skill):
1. **Planner** creates an adaptive plan (right-sized, not exactly five steps) and a compact **RALPLAN-DR summary** (Principles 3-5, Decision Drivers top 3, Viable Options ≥2 with bounded pros/cons; invalidation rationale if only one remains; deliberate mode adds pre-mortem + expanded test plan).
2. **User feedback** *(--interactive only)*: present the draft + Principles/Drivers/Options via `AskUserQuestion` (Proceed to review / Request changes / Skip review). Otherwise auto-proceed.
3. **Architect** reviews for soundness via a separate Agent call (strongest steelman antithesis, a real tradeoff tension, synthesis); **await completion before step 4**.
4. **Critic** evaluates via a separate Agent call, only after step 3 (principle-option consistency, fair alternatives, risk clarity, testable criteria, verification steps).
5. **Re-review loop** (max 5): any non-APPROVE verdict re-runs Planner→Architect→Critic until APPROVE or 5 iterations; then present the best version.
6. On Critic approval *(--interactive only)*: present approval options via `AskUserQuestion` (ultragoal / team / explicit ralph fallback / specialized goal-mode follow-up / Request changes / Reject). Final plan includes ADR, available-agent-types roster, staffing guidance, team launch hints, team verification path, Goal-Mode Follow-up Suggestions. Otherwise output the final plan and stop.
7. *(--interactive only)* On approval: invoke `ultragoal` (default), `team`, the selected specialized goal-mode follow-up (`autoresearch-goal` / `performance-goal`), or `ralph` only when explicitly selected — never implement directly.

> Steps 3 and 4 MUST run sequentially as role-specific Agent calls. Always await the Architect result before the Critic call.

## Planning / Execution Boundary
Ralplan is a planning mode. While active with no explicit execution handoff, implementation write tools are out of scope. It may inspect the repo and write only planning artifacts (`.omw/context/`, `.omw/plan/`, `.omw/specs/`, task-list/state records).

Canonical flow: `ralplan -> durable consensus artifact -> explicit execution lane -> ultragoal | team | ralph`.

## Durable Consensus Handoff Contract
Ralplan is not complete merely because `.omw/plan/prd-*.md` and `.omw/plan/test-spec-*.md` exist — those are planning artifacts, not consensus evidence. Before any execution handoff, persist a durable handoff record distinguishing:
- `planning_artifacts`: PRD/test-spec paths.
- `ralplan_architect_review`: completed Architect review with approving verdict.
- `ralplan_critic_review`: completed Critic review with approving verdict, recorded only after Architect.
- `ralplan_consensus_gate.complete: true` only when both reviews are present, approving, and in Architect→Critic order.

If Architect is missing/blocked, stay in Architect review or report the blocker. If Critic is missing/blocked/non-approving, stay in Critic/re-review or report the max-iteration outcome.

## Goal-Mode Follow-up Suggestions
When ralplan outputs a handoff, include:
- `ultragoal` — default goal-mode follow-up for durable sequential completion tracking.
- `autoresearch-goal` — research projects with a research deliverable/evaluator.
- `performance-goal` — optimization/performance work with measurable criteria.
- `team` — first-class parallel execution option.
- `ralph` — explicit fallback only when persistent single-owner verification is intentionally selected.

For parallelizable durable-goal delivery, recommend `ultragoal` + `team` together.

## Pre-context Intake
Before consensus planning or execution handoff, ensure a grounded context snapshot exists at `.omw/ralph/context-{slug}-{timestamp}.md` (task statement, outcome, known facts, constraints, unknowns, touchpoints). Reuse the latest relevant snapshot when available. If ambiguity is high, gather brownfield facts via repository inspection, then run `deep-interview --quick <task>`. For external/official docs, invoke `best-practice-research` before finalizing the handoff. Do not hand off to execution until intake is complete; if urgency forces progress, document risk tradeoffs explicitly.

## Pre-Execution Gate
Execution modes spin up heavy multi-agent orchestration and waste cycles on vague requests. Ralplan-first intercepts underspecified execution requests (e.g. "ralph add authentication") and redirects them through consensus planning. The gate auto-passes when any concrete signal is present (file path, issue/PR number, camelCase/snake_case symbol, test runner, numbered steps, acceptance criteria, error reference, code block, or an explicit `force:`/`!` override). One signal is enough.
