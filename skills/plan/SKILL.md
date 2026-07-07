---
name: plan
description: "Strategic planning with optional interview, consensus (Planner→Architect→Critic), and review modes. Use to scope vague ideas, produce quality-gated work plans, or review an existing plan before implementation. Triggers: 'plan this', 'let's plan', 'ralplan', 'review this plan', 'plan --consensus', 'plan --review'."
agent_created: true
triggers: ["plan this", "let's plan", "ralplan", "review this plan", "plan --consensus"]
---

> Ported from oh-my-codex `plan`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Plan Skill

Plan creates comprehensive, actionable work plans through structured interaction. It auto-detects whether to interview the user (broad requests) or plan directly (detailed requests), and supports **consensus mode** (iterative Planner/Architect/Critic loop with RALPLAN-DR structured deliberation) and **review mode** (Critic evaluation of existing plans).

## Use When
- User wants to plan before implementing — "plan this", "let's plan".
- User wants structured requirements gathering for a vague idea.
- User wants an existing plan reviewed — "review this plan", `--review`.
- User wants multi-perspective consensus — `--consensus`, "ralplan".
- Task is broad or vague and needs scoping before code.

## Do Not Use When
- User wants autonomous end-to-end execution — use an execution workflow instead.
- User wants to start coding immediately on a clear task — just do it.
- User asks a simple question answerable directly.
- Task is a single focused fix with obvious scope.

## Why This Exists
Jumping into code without understanding requirements leads to rework and missed edge cases. Plan provides structured requirements gathering, expert analysis, and quality-gated plans so execution starts from a solid foundation. Consensus mode adds multi-perspective validation for high-stakes work.

## Execution Policy
- Auto-detect interview vs direct mode based on request specificity.
- Ask one question at a time during interviews — never batch multiple interview rounds into one form.
- Gather codebase facts via the **Explore** subagent (Agent tool, `subagent_type: Explore`) before asking the user about them. Use normal repository inspection (Read/Grep/Glob/Bash) for read-only lookups; reserve heavier shell evidence for explicit native commands.
- Plans must meet quality standards: 80%+ claims cite file/line, 90%+ criteria are testable.
- Implementation step count must be right-sized to task scope; avoid defaulting to exactly five steps.
- Consensus mode outputs the final plan by default; add `--interactive` to enable execution handoff.
- Consensus mode uses RALPLAN-DR short mode by default; switch to deliberate mode with `--deliberate` or when the request explicitly signals high risk (auth/security, data migration, destructive/irreversible changes, production incident, compliance/PII, public API breakage).
- Apply the shared workflow guidance pattern: outcome-first framing, concise visible updates for multi-step planning, local overrides for the active branch, evidence-backed planning, explicit stop rules, and automatic continuation for safe reversible steps. Ask only for material, destructive, credentialed, external-production, or preference-dependent branches.

## Steps

### Mode Selection

| Mode | Trigger | Behavior |
|------|---------|----------|
| Interview | Default for broad requests | Interactive requirements gathering |
| Direct | `--direct`, or detailed request | Skip interview, generate plan directly |
| Consensus | `--consensus`, "ralplan" | Planner → Architect → Critic loop until agreement with RALPLAN-DR (short by default, `--deliberate` for high-risk); outputs plan by default |
| Consensus Interactive | `--consensus --interactive` | Same but pauses for user feedback at draft and approval, then hands off to execution |
| Review | `--review`, "review this plan" | Critic evaluation of existing plan |

### Interview Mode (broad/vague requests)
1. **Classify the request**: Broad (vague verbs, no specific files, touches 3+ areas) triggers interview mode.
2. **Ask one focused question** via `AskUserQuestion` for preferences, scope, and constraints. Use plain text only as a last fallback.
3. **Gather codebase facts first**: Before asking "what patterns does your code use?", spawn an **Explore** subagent to find out, then ask informed follow-ups.
4. **Build on answers**: Each question builds on the previous answer.
5. **Consult Analyst** (THOROUGH tier) via the Agent tool for hidden requirements, edge cases, risks.
6. **Create plan** when the user signals readiness: "create the plan", "I'm ready".

### Direct Mode (detailed requests)
1. **Quick Analysis**: optional Analyst consultation via Agent tool.
2. **Create plan**: generate comprehensive work plan immediately.
3. **Review** (optional): Critic review if requested.

### Consensus Mode (`--consensus` / "ralplan")

**RALPLAN-DR modes**: **Short** (default, bounded) and **Deliberate** (for `--deliberate` or explicit high-risk). Both keep Planner → Architect → Critic sequence and auto-proceed through planning, outputting the final plan without executing.

1. **Planner** (invoke the Agent tool framed as the Planner role) creates the initial plan and a compact **RALPLAN-DR summary** before any Architect review. The summary **MUST** include:
   - **Principles** (3-5)
   - **Decision Drivers** (top 3)
   - **Viable Options** (≥2) with bounded pros/cons
   - If only one viable option remains, an explicit **invalidation rationale** for rejected alternatives
   - In **deliberate mode**: a **pre-mortem** (3 failure scenarios) and an **expanded test plan** (unit/integration/e2e/observability)
2. **User feedback** *(--interactive only)*: use `AskUserQuestion` to present the draft plan **plus the RALPLAN-DR Principles / Drivers / Options** with options: Proceed to review / Request changes / Skip review. Without `--interactive`, auto-proceed to review.
3. **Architect** (invoke the Agent tool framed as the Architect role, in a separate call) reviews for soundness and **MUST** include: strongest steelman counterargument (antithesis), at least one meaningful tradeoff tension, and (when possible) a synthesis path. In deliberate mode, flag principle violations. **Wait for this step before step 4.** Do NOT run steps 3 and 4 in parallel.
4. **Critic** (invoke the Agent tool framed as the Critic role, in a separate call, only after step 3) evaluates against quality criteria and **MUST** verify principle-option consistency, fair alternative exploration, risk mitigation clarity, testable acceptance criteria, and concrete verification steps. **MUST** reject shallow alternatives, driver contradictions, vague risks, weak verification. In deliberate mode, **MUST** reject missing/weak pre-mortem or expanded test plan. Do NOT let the Architect response self-approve the Critic gate.
5. **Re-review loop** (max 5 iterations): If Critic rejects/iterates, collect feedback → Planner revises → return to step 3 (Architect) → step 4 (Critic). Repeat until Critic approves or 5 iterations reached; if max reached, present the best version via `AskUserQuestion` noting consensus was not reached.
6. **Apply improvements**: When reviewers approve with suggestions, merge accepted improvements into the plan file under `.omw/plan/<slug>.md` and add a brief changelog. Final consensus output **MUST** include an **ADR** (Decision, Drivers, Alternatives considered, Why chosen, Consequences, Follow-ups). Also derive an explicit **available-agent-types roster** and add concrete **follow-up staffing guidance** for Ultragoal and Team (recommended roles, counts, reasoning levels by lane, why each lane exists), plus an explicit **Ralph** fallback note only when persistent single-owner verification is intentionally selected.
7. **Goal-Mode Follow-up Suggestions**: recommend **Ultragoal** by default for goal-oriented follow-up, **autoresearch-goal** only for research projects with a research deliverable/evaluator, and **performance-goal** for optimization/performance. Keep these alongside the Team path and any explicit Ralph fallback. For durable-goal work that is also parallelizable, recommend **Team + Ultragoal**. For ordinary pre-planning best-practice lookup, invoke `best-practice-research` and synthesize it into the plan.
8. *(--interactive only)* Present the plan via `AskUserQuestion` with options: Approve durable goal execution / Approve and implement via team / Start goal-mode follow-up / Request changes / Reject. Without `--interactive`, output the final approved plan and stop. Do NOT auto-execute.
9. *(--interactive only)* On approval: invoke the selected follow-up skill with the approved plan path from `.omw/plan/` plus the roster/staffing/launch hints:
   - **Approve durable goal execution** → invoke `ultragoal` (optionally `team` for parallel lanes). Do NOT implement directly.
   - **Approve and implement via team** → invoke `team` with the plan + staffing guidance. Do NOT implement directly.
   - **Start goal-mode follow-up** → invoke `ultragoal` (default), `autoresearch-goal`, or `performance-goal` per context. Do NOT implement directly.

### Review Mode (`--review`)
0. Treat as a reviewer-only pass; the context that wrote the plan must NOT approve it. If the current context authored it, hand the review to `code-review`, `critic`, `quality-reviewer`, or `verifier`.
1. Read the plan file from `.omw/plan/`.
2. Evaluate via the Agent tool framed as the Critic role.
3. For cleanup/refactor/anti-slop work, verify the artifact includes a cleanup plan, regression tests or explicit test gap, smell-by-smell passes, and quality gates.
4. Return verdict: APPROVED, REVISE (with feedback), or REJECT (replanning required).

### Plan Output Format
Every plan includes:
- Requirements Summary
- Acceptance Criteria (testable)
- Implementation Steps (with file references)
- Adaptive step count sized to actual scope
- Risks and Mitigations
- Verification Steps
- Consensus/ralplan: **RALPLAN-DR summary** (Principles, Drivers, Options)
- Consensus final: **ADR** (Decision, Drivers, Alternatives considered, Why chosen, Consequences, Follow-ups)
- Consensus handoff: **Available-Agent-Types Roster**, **Follow-up Staffing Guidance**, **Goal-Mode Follow-up Suggestions** (`ultragoal` / `autoresearch-goal` / `performance-goal`), **Team Launch Hints**, **Team Verification Path**
- Deliberate mode: **Pre-mortem (3 scenarios)** + **Expanded Test Plan** (unit/integration/e2e/observability)

Plans are saved to `.omw/plan/<slug>.md`. Drafts may be inline.

## Tool Usage
- Use `AskUserQuestion` for preference questions (scope, priority, timeline, risk tolerance).
- Use the **Explore** subagent (Agent tool, `subagent_type: Explore`) to gather codebase facts before asking the user.
- Use the Agent tool framed as `planner` / `analyst` / `critic` roles for planning validation and review. If a lighter model is available for planning, prefer it.
- **CRITICAL — Consensus mode agent calls MUST be sequential.** Always await the Architect result before the Critic call.
- In consensus mode, default to RALPLAN-DR short; enable deliberate on `--deliberate` or high-risk signals.
- With `--interactive`, use `AskUserQuestion` at the feedback (step 2) and approval (step 8) steps.
- On user approval (--interactive), MUST invoke the selected follow-up skill — never implement directly in the planning agent.

## Scenario Examples
**Good:** User says `continue` after a clear next step — continue that branch instead of restarting.
**Good:** User changes only output shape (e.g. "make a PR") — preserve non-conflicting constraints, apply locally.
**Bad:** `continue` restarts discovery or stops before missing verification is gathered.

**Adaptive interview (facts before asking):**
```
Planner: [spawns Explore subagent: "find authentication implementation"]
Planner: [receives: "Auth is in src/auth/ using JWT with passport.js"]
Planner: "I see JWT auth with passport.js in src/auth/. Extend existing auth or add a separate flow?"
```
**Single question at a time:** Q1 goal → Q2 latency vs throughput → Q3 p50 vs p99. Build progressively.

## Escalation And Stop Conditions
- Stop interviewing when requirements are clear enough to plan.
- In consensus mode, stop after 5 Planner/Architect/Critic iterations and present the best version.
- Consensus outputs the plan by default; with `--interactive`, user can approve and hand off. Ralph only as an explicit legacy/persistent single-owner lane.
- If user says "just do it" / "skip planning", **MUST** invoke `ultragoal` to transition to durable goal execution by default; use `ralph` only when explicitly requested. Do NOT implement directly.
- Escalate to the user for irreconcilable trade-offs needing a business decision.

## Final Checklist
- [ ] Plan has testable acceptance criteria (90%+ concrete)
- [ ] Plan references specific files/lines where applicable (80%+ claims)
- [ ] All risks have mitigations
- [ ] No vague terms without metrics ("fast" → "p99 < 200ms")
- [ ] Plan saved to `.omw/plan/<slug>.md`
- [ ] Consensus: RALPLAN-DR summary (3-5 principles, top 3 drivers, ≥2 options or invalidation rationale)
- [ ] Consensus final: ADR section
- [ ] Deliberate: pre-mortem (3) + expanded test plan
- [ ] Interactive: user explicitly approved before execution; non-interactive: final plan output, no auto-execution

## Advanced
### Design Option Presentation
Chunk design choices: Overview (2-3 sentences) → Option A with trade-offs → [wait] → Option B → [wait] → Recommendation (only after discussion). Per option: `**Approach:**`, `**Pros:**`, `**Cons:**`, then "What's your reaction?".

### Question Classification
| Type | Examples | Action |
|------|----------|--------|
| Codebase Fact | "What patterns exist?" | Explore first, don't ask user |
| User Preference | "Priority?", "Timeline?" | Ask via `AskUserQuestion` |
| Scope Decision | "Include feature Y?" | Ask user |
| Requirement | "Performance constraints?" | Ask user |

### Review Quality Criteria
| Criterion | Standard |
|-----------|----------|
| Clarity | 80%+ claims cite file/line |
| Testability | 90%+ criteria concrete |
| Verification | All file refs exist |
| Specificity | No vague terms |

> Note: the separate `/planner`, `/ralplan`, and `/review` skills are merged into `plan`. All workflows (interview, direct, consensus, review) are available through `plan`.
