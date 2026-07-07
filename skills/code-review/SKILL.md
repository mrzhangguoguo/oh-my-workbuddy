---
name: code-review
description: Run a comprehensive, severity-rated code review for quality, security, and maintainability, with a deterministic merge-readiness verdict
agent_created: true
triggers: ["code review", "review this code", "review my PR", "review changes", "merge readiness"]
---

> Ported from oh-my-codex `code-review`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Code Review Skill

Conduct a thorough code review for quality, security, and maintainability with severity-rated feedback.

## When to Use

- User requests "review this code", "code review".
- Before merging a pull request.
- After implementing a major feature.
- User wants a quality assessment.

## Behavior

- Default to outcome-first reporting: state the target result, evidence, validation status, and stop condition before adding process detail.
- If correctness depends on additional inspection, retrieval, execution, or verification, keep using the relevant tools until the review is grounded; stop once enough evidence exists.
- Continue through clear, low-risk, reversible next steps automatically; ask the user only when the next step is materially branching, destructive, credentialed, external-production, or preference-dependent.

## Workflow — Two Parallel Lanes

Delegate to two independent agents via the **Agent tool**, run in parallel, for a two-lane review:

1. **Identify Changes**
   - Run `git diff` to find changed files.
   - Determine scope of review (specific files or entire PR).

2. **Launch Parallel Review Lanes** (use the Agent tool, two calls in one message)
   - **Code-reviewer lane** — owns spec compliance, security, code quality, performance, and maintainability findings. Prompt it to act as a senior code reviewer.
   - **Architect lane** — owns the devil's-advocate / design-tradeoff perspective. Prompt it to act as a skeptical architect.
   - Both lanes run on a clean context with explicit scope and artifacts, and produce distinct outputs before final synthesis.
   - If either lane cannot be launched or does not return evidence, report `independent review unavailable`; do **not** substitute your own authoring lane, and do **not** approve or mark the review merge-ready.

3. **Review Categories**
   - **Security** — hardcoded secrets, injection risks, XSS, CSRF.
   - **Code Quality** — function size, complexity, nesting depth.
   - **Performance** — algorithm efficiency, N+1 queries, caching.
   - **Best Practices** — naming, documentation, error handling.
   - **Maintainability** — duplication, coupling, testability.

4. **Severity Rating**
   - **CRITICAL** — security vulnerability (must fix before merge).
   - **HIGH** — bug or major code smell (should fix before merge).
   - **MEDIUM** — minor issue (fix when possible).
   - **LOW** — style/suggestion (consider fixing).

5. **Architectural Status Contract**
   - **CLEAR** — no unresolved architectural blocker was found.
   - **WATCH** — non-blocking design/tradeoff concern that must appear in the final synthesis.
   - **BLOCK** — unresolved design concern that prevents a merge-ready verdict.

6. **Specific Recommendations**
   - File:line locations for each issue.
   - Concrete fix suggestions.
   - Code examples where applicable.

7. **Final Synthesis**
   - Combine the code-reviewer recommendation and the architect status into one final verdict.
   - Approval requires explicit evidence from both independent lanes; missing or failed delegation is a blocking unavailable-review state, not an approval fallback.
   - Deterministic merge gating rules:
     - If architect status is **BLOCK**, final recommendation is **REQUEST CHANGES**.
     - Else if code-reviewer recommendation is **REQUEST CHANGES**, final recommendation is **REQUEST CHANGES**.
     - Else if architect status is **WATCH**, final recommendation is **COMMENT**.
     - Else final recommendation follows the code-reviewer lane.
   - The final report must make architect blockers impossible to miss.

## Agent Delegation

Do not self-review as a fallback. If a lane is missing, unavailable, skipped, or fails, emit a clear unavailable-review result and block approval until independent lane evidence exists.

Spawn the two lanes like this (parallel Agent tool calls):

```
Agent(code-reviewer lane):
  "Act as a senior code reviewer. Review the changes in <git diff / specific files> for
   quality, security, and maintainability.
   Checklist: OWASP Top 10 security, complexity/duplication, N+1/efficiency, naming/docs/
   error handling, coupling/testability.
   Output: files reviewed count, issues by severity (CRITICAL/HIGH/MEDIUM/LOW), specific
   file:line locations, fix recommendations, and an approval recommendation
   (APPROVE / REQUEST CHANGES / COMMENT)."

Agent(architect lane):
  "Act as a skeptical architect reviewing the same changes from the architecture/tradeoff
   perspective. Focus on system boundaries/interfaces, hidden coupling, long-term
   maintainability risks, and the strongest counterargument against approving as-is.
   Output: Architectural Status (CLEAR / WATCH / BLOCK), file:line evidence, and a concrete
   tradeoff/design recommendation."
```

Run both lanes in parallel, then synthesize with the deterministic rules above.

## Output Format

```
CODE REVIEW REPORT
==================

Files Reviewed: 8
Total Issues: 12
Architectural Status: WATCH

CRITICAL (0)
-----------
(none)

HIGH (0)
--------

MEDIUM (7)
----------
1. src/api/auth.ts:42
   Issue: Email normalization logic is duplicated instead of reusing the shared helper
   Risk: Validation rules can drift between authentication paths
   Fix: Route both paths through the shared normalization helper
...

LOW (5)
-------

ARCHITECTURE WATCHLIST
----------------------
- src/review/orchestrator.ts:88
  Concern: Review result synthesis relies on implicit ordering rather than an explicit blocker contract
  Status: WATCH
  Recommendation: Define deterministic merge gating before expanding reviewers

SYNTHESIS
---------
- code-reviewer recommendation: COMMENT
- architect status: WATCH
- final recommendation: COMMENT

RECOMMENDATION: COMMENT

Address any WATCH concerns before treating the change as merge-ready.
```

## Review Checklists

**Code-reviewer lane:**
- Security: no hardcoded secrets; inputs sanitized; SQL/NoSQL injection prevented; XSS escaped; CSRF on state-changing ops; authz enforced.
- Code Quality: functions < 50 lines (guideline); cyclomatic complexity < 10; no nesting > 4 levels; DRY; clear naming.
- Performance: no N+1; appropriate caching; efficient algorithms; no unnecessary re-renders.
- Best Practices: error handling; logging; public-API docs; tests for critical paths; no commented-out code.

**Architect lane:**
- Boundary/interface changes are explicit.
- New coupling/tradeoff risks are surfaced.
- Long-horizon maintainability concerns are evidence-backed.
- Architectural status is CLEAR / WATCH / BLOCK.
- Any BLOCK cites why merge-ready status should be withheld.

## Approval Criteria

- **APPROVE** — code-reviewer returns APPROVE, architect status is CLEAR, and both independent lanes returned evidence.
- **REQUEST CHANGES** — code-reviewer returns REQUEST CHANGES, architect status is BLOCK, or required independent review delegation is unavailable/skipped/failed.
- **COMMENT** — code-reviewer returns COMMENT with architect status CLEAR, architect status is WATCH, or only LOW/MEDIUM improvements remain.

## Best Practices

- Review early and often; small frequent reviews beat huge ones.
- Address CRITICAL/HIGH first.
- Consider context — some "issues" may be intentional trade-offs.
- Learn from reviews to improve coding practices.

> Note: `code-review` itself is read-only and does **not** auto-fix. To fix findings, hand off to execution via the Agent tool or a `team` skill.
