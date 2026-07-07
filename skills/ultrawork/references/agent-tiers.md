# Agent Tiers (WorkBuddy)

Practical tier/role guidance for deciding how to delegate work to the Agent tool inside
WorkBuddy. This replaces OMX's `agentModels` routing — there is no `omx` CLI or model-pin
config here. Pick a tier; if a lighter model is available in your environment, prefer it for
LOW-tier lookups and planning.

## Mental Model

Separate three concepts:

- `role`: what the agent is responsible for (`executor`, `planner`, `architect`, `researcher`,
  `reviewer`, ...).
- `tier`: how much reasoning/cost to spend (`LOW`, `STANDARD`, `THOROUGH`).
- `posture`: how the role behaves (`frontier-orchestrator`, `deep-worker`, `fast-lane`).

Use role to choose responsibility, tier to choose depth, and posture to choose operating style.

## Tiers

- `LOW`:
  Fast lookups and narrow checks.
  Use for simple exploration, style checks, and lightweight doc edits.
  Typical roles: `explore`, `style-reviewer`, `writer`.

- `STANDARD`:
  Default tier for implementation, debugging, and normal verification.
  Typical roles: `executor`, `debugger`, `test-engineer`, `quality-reviewer`.

- `THOROUGH`:
  Use for architectural, security-sensitive, or high-impact multi-file work.
  Typical roles: `architect`, `critic`, `security-reviewer`, `executor`.

## Selection Rules

1. Start at `STANDARD` for most code changes.
2. Use `LOW` only when the task is bounded and non-invasive.
3. Escalate to `THOROUGH` for:
   - security/auth/trust-boundary changes
   - architectural decisions with system-wide impact
   - large refactors across many files
4. For completion/verification checks, use at least `STANDARD` architect verification.

## Posture Guidance

- `frontier-orchestrator`:
  - Best for leader-style roles: intent classification, delegation, verification, architectural
    judgment.
  - Typical roles: `planner`, `analyst`, `architect`, `critic`, `code-reviewer`.

- `deep-worker`:
  - Best for implementation-heavy roles that should carry work to completion.
  - Prioritizes direct execution, minimal diffs, and strict verification.
  - Typical roles: `executor`, `debugger`, `test-engineer`, `build-fixer`.

- `fast-lane`:
  - Best for cheap/fast agents used for triage, search, and narrow synthesis.
  - Prioritizes quick routing, concise search, and escalation over deep autonomous work.
  - Typical roles: `explore`, `writer`, and lightweight research/search specialists.
