---
name: ultragoal
description: Create and execute durable repo-native multi-goal plans. Break a brief into tracked goals, drive them to verified completion, and steer as findings change.
agent_created: true
triggers: ["ultragoal", "create-goals", "complete-goals", "durable plan", "multi-goal", "sequential goals"]
---

> Ported from oh-my-codex `ultragoal`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ultragoal Workflow

Use when the user asks for durable multi-goal planning or sequential execution over a set of stories/objectives. Ultragoal turns a brief into repo-native artifacts and drives them to verified completion. There is no Codex `/goal` mode or `omx ultragoal` CLI — tracking is the **task list** (the live goal board), **memory** (durable brief/ledger), and optional files under `.omw/ultragoal/`.

## Durable artifacts

- `.omw/ultragoal/brief.md` — the original brief and constraints.
- `.omw/ultragoal/ledger.jsonl` — checkpoint and structured steering audit events (append-only).
- The **task list** is the live source of truth for goal/story state.

Write the brief once at creation via the Write tool. Append every checkpoint/steering decision to `ledger.jsonl`.

## Create goals

1. Capture the brief (from argument, a pasted file, or a `brief.md` path) into `.omw/ultragoal/brief.md`.
2. Decompose into goals/stories. For each, create a task with `TaskCreate`:
   - `subject`: short goal title
   - `description`: objective, acceptance criteria, constraints
   - `owner`: `leader` (Ultragoal stays leader-owned)
   - `addBlockedBy`/`addBlocks` for dependencies
3. Set the first story `in_progress`; keep the rest `pending`.
4. Inspect the board and refine if needed (reorder, split, reword).

## Complete goals

Loop until the task list reports all goals complete:

1. Run `ultragoal complete-goals` (i.e. pick the next `in_progress` story).
2. Read the printed handoff (the story description).
3. If the story benefits from parallel execution, invoke the `team` skill (`skill: team`) and pass Team the evidence; the leader stays Ultragoal owner.
4. Complete ONLY the current story. Use a lighter model for planning if available; use the appropriate execution skills (`plan`, `skill: tdd` discipline, etc.).
5. Run a completion audit against the story objective and real artifacts/tests.
6. In aggregate mode, do **not** mark sibling stories done from one story; checkpoint only the finished story. On the final story only, first run the **mandatory final cleanup/review gate** below, then mark complete.
7. Checkpoint the durable ledger with evidence: append to `.omw/ultragoal/ledger.jsonl`:
   `{"goal_id":"<id>","status":"complete","evidence":"<tests/files/review evidence>","at":"<now>"}`
8. If blocked/failed, checkpoint failure:
   `{"goal_id":"<id>","status":"failed","evidence":"<blocker/evidence>","at":"<now>"}`
9. Resume failed goals by re-opening the task (`TaskUpdate` → `in_progress`) and re-running.

## Dynamic steering

Use steering when real findings/blockers prove the decomposition should change while the brief's aggregate objective and constraints stay fixed. Steering is explicit-only and evidence-backed; broad natural-language requests are rejected instead of guessed.

Allowed mutation kinds (apply via `TaskCreate`/`TaskUpdate`/`Edit` on the board + brief):
- `add_subgoal` — add a new task.
- `split_subgoal` — split a pending task.
- `reorder_pending` — reorder `addBlockedBy`/order.
- `revise_pending_wording` — edit a pending task description.
- `annotate_ledger` — append a note to `ledger.jsonl`.
- `mark_blocked_superseded` — mark a task `deleted` with steering metadata retained in the brief.

Steering invariants:
- Do not edit the original brief constraints, quality gates, or completion status carelessly. The brief is the stable pointer; `.omw/ultragoal/ledger.jsonl` is the audit trail.
- Do not hard-delete goals, auto-complete work, weaken verification, or silently mutate state.
- Accepted/rejected steering attempts append structured audit entries to `ledger.jsonl`.
- Superseded goals remain in the brief with steering metadata and are skipped for scheduling.
- Blocked goals without replacements are skipped but still block final completion until replaced/superseded.

## Use Ultragoal and Team together

Use both for a story that benefits from parallel execution. Ultragoal stays leader-owned (task list + `ledger.jsonl`); `team` is the parallel execution engine and returns task/evidence status to the leader. The leader checkpoints Ultragoal from Team evidence. Workers do not own Ultragoal goal state and do not checkpoint Ultragoal.

## Mandatory final cleanup and review gate

The final story is not complete until the active agent has run the final quality gate:

1. Run targeted verification for the story (project test/build/lint commands).
2. Run `ai-slop-cleaner` on changed files only (`skill: ai-slop-cleaner`); if no relevant edits, it still runs and records a passed/no-op report.
3. Rerun verification after the cleaner pass.
4. Run the architecture-invariant audit: derive non-negotiable architecture/domain invariants from the brief/spec/accepted steering; list source artifacts; prove each required invariant with implementation, test, and independent review evidence.
5. Run `code-review` through the independent review path (`skill: code-review`). Clean means an `APPROVE` recommendation, `CLEAR` architect status, distinct completed `code-reviewer` and `architect` evidence, and every required architecture invariant proved. `COMMENT`/`WATCH`/`REQUEST CHANGES`/`BLOCK`, missing subagent evidence, or unproved invariants are non-clean.
6. If review or invariant proof is non-clean, do **not** mark the goal complete. Record durable blocker work instead: add a pending blocker-resolution task and mark the current story `review_blocked`, keeping the board open so the next cycle starts the blocker.
7. If review and invariant proof are clean, mark the goal complete (`TaskUpdate` → `completed`) and checkpoint with a structured final gate entry in `ledger.jsonl` that includes the quality-gate summary:

```json
{
  "aiSlopCleaner": { "status": "passed", "evidence": "cleaner report" },
  "verification": { "status": "passed", "commands": ["npm test"], "evidence": "post-cleaner verification" },
  "codeReview": {
    "recommendation": "APPROVE",
    "architectStatus": "CLEAR",
    "evidence": "final review synthesis",
    "independentReview": {
      "codeReviewer": { "agentRole": "code-reviewer", "evidence": "code-reviewer APPROVE evidence" },
      "architect": { "agentRole": "architect", "evidence": "architect CLEAR evidence" }
    }
  },
  "architectureInvariantGate": {
    "status": "passed",
    "sourceArtifacts": [".omw/ultragoal/brief.md"],
    "evidence": "final invariant audit proved all required invariants",
    "invariants": [
      { "invariant": "Preserve the existing parser boundary.", "source": "brief.md#architecture-invariants", "status": "proved", "implementationEvidence": "...", "testEvidence": "...", "reviewEvidence": "..." }
    ]
  }
}
```

## Constraints

- Ultragoal does not clear or mutate hidden external goal state; it uses the task list + memory only.
- Never mark a goal complete unless it is actually complete (verification + review gate clean).
- Treat `ledger.jsonl` as the durable audit trail; checkpoint after every success or failure.
- On completion of all goals, set the board to done and append a final `complete` entry.
