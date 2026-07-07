# Agent Tiers (model-depth guidance)

Ported from OMX `ecomode/references/agent-tiers.md`. OMX-specific model names
(`gpt-5.5`, `exactModel` pins) and OMX role routing are dropped; the mental model
below is model-agnostic and applies whenever you spawn teammates with the Agent tool.

## Mental Model

Separate three concerns when choosing how to delegate:

- `role`: what the teammate is responsible for (`executor`, `planner`, `architect`,
  `explorer`, `writer`, `reviewer`).
- `depth`: how much reasoning/cost to spend (`cheap`, `standard`, `thorough`).
- `posture`: how the role behaves (`orchestrator`, `deep-worker`, `fast-lane`).

Use role to choose responsibility, depth to choose reasoning budget, and posture to
choose operating style. If a lighter model is available in your environment, prefer
it for `cheap`/`fast-lane` work.

## Depths

- `cheap`:
  Fast lookups and narrow checks. Simple exploration, style checks, lightweight doc
  edits. Typical roles: `explorer`, `style-reviewer`, `writer`.

- `standard`:
  Default depth for implementation, debugging, and normal verification. Typical
  roles: `executor`, `debugger`, `test-engineer`, `quality-reviewer`.

- `thorough`:
  Architectural, security-sensitive, or high-impact multi-file work. Typical roles:
  `architect`, `critic`, `security-reviewer`, `executor`.

## Selection Rules

1. Start at `standard` for most code changes.
2. Use `cheap` only when the task is bounded and non-invasive.
3. Escalate to `thorough` for:
   - security / auth / trust-boundary changes
   - architectural decisions with system-wide impact
   - large refactors across many files
4. For completion/verification checks, use at least `standard` depth.

## Posture Guidance

- `orchestrator`: steerable frontier models, leader-style roles. Prioritizes intent
  classification, delegation, verification, architectural judgment. Typical roles:
  `planner`, `analyst`, `architect`, `critic`, `code-reviewer`.

- `deep-worker`: implementation-heavy roles carried to completion. Prioritizes direct
  execution, minimal diffs, strict verification. Typical roles: `executor`,
  `debugger`, `test-engineer`, `build-fixer`.

- `fast-lane`: cheap/fast models for triage, search, narrow synthesis. Prioritizes
  quick routing, concise search, escalation over deep autonomous work. Typical roles:
  `explorer`, `writer`, lightweight research/search specialists.
