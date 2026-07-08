---
name: best-practice-research
category: research
status: active
description: Bounded best-practice research using official/upstream evidence first; produces a cited, reusable recommendation and a handoff to planning/execution
agent_created: true
triggers: ["best practice", "recommended approach", "current guidance", "official recommendation", "version-aware guidance"]
---

> Ported from oh-my-codex `best-practice-research`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Best-Practice Research

Use this skill when a task depends on current external best practices, version-aware guidance,
standards, official recommendations, or upstream behavior. This is a workflow wrapper: it routes
evidence gathering and synthesis; it is not a new research authority and it does not replace
`WebSearch`/`WebFetch` work.

## Purpose

Produce a cited, reusable best-practice answer or handoff that separates current external evidence
from repo-local facts and dependency-selection decisions. For pre-planning investigation, this is
the ordinary first research wrapper: gather official/upstream evidence, then hand it to the `plan`
skill or the caller as planning input. Do not present `best-practice-research` as a final
architecture component or as a validator-gated research loop.

## Terminal By Default

This skill is terminal and read-only by default. It gathers evidence and produces a cited
recommendation with a handoff, then stops. Do not write or edit files, create or amend commits, run
mutating commands, or otherwise modify repository state under this skill — even when the question has
clear implementation implications. When implementation is warranted, stop and hand off rather than
continuing: name the `plan` skill for planning and the Agent tool (or `team`/`deep-interview` skills)
for execution, and resume only after the user explicitly switches to that workflow.

## Activate When

- The user asks for best practices, recommended approach, current guidance, official recommendations, standards, or version-aware external behavior.
- The `plan`, `deep-interview`, or `team` skill (or another workflow) needs current external evidence before planning or execution can be correct.
- The task involves an already chosen technology and needs authoritative usage guidance, migration notes, API behavior, lifecycle rules, or current safety guidance.

## Do Not Activate When

- The answer is fully repo-local; use Read/Grep/Glob/Bash for codebase facts.
- The main question is whether to adopt, replace, upgrade, or compare dependencies; this skill only covers an already-chosen technology, so advise a dependency-decision pass instead (and note that adoption/comparison is out of scope here).
- The user only needs implementation against already-grounded requirements; hand off to execution via the Agent tool or a `team`/`plan` skill as appropriate.
- The task can be answered from stable local project conventions without current external lookup.

## Specialist Routing

1. Use repo inspection tools (Read, Grep, Glob, Bash) first for brownfield facts: current code usage, local constraints, versions, config, and integration points.
2. Use `WebSearch` / `WebFetch` for official/upstream docs, release notes, standards, migration guides, source-backed examples, and current best-practice evidence for an already chosen technology.
3. For adoption/upgrade/replacement/comparison decisions, state explicitly that this skill does not decide those; recommend a dependency-decision step before continuing.
4. Return to the caller with explicit evidence, uncertainty, and any implementation handoff constraints.

## Source-Quality Rules

- Prefer official documentation, upstream source, release notes, changelogs, standards, and maintainer guidance.
- Include source URLs for material claims.
- State date/version context for current best-practice claims.
- Label third-party summaries as supplemental; do not use them before official/upstream sources.
- Flag stale, conflicting, undocumented, or version-mismatched evidence.
- Do not over-fetch: gather the smallest evidence set that can support the decision.

## Workflow

1. Classify the question: conceptual best practice, implementation guidance, migration/version guidance, standards/compliance guidance, or mixed local + external guidance.
2. Gather repo-local facts with repo inspection tools when local usage or constraints affect the answer.
3. Gather external evidence with `WebSearch` / `WebFetch` when current or version-aware practice affects correctness.
4. Synthesize a concise answer with source quality, version/date context, caveats, and an implementation or planning handoff.
5. Stop when the answer is grounded enough for the caller; otherwise report the exact blocker or specialist handoff needed.

## Output Contract

```md
## Best-Practice Research: <question>

### Direct Recommendation
<actionable guidance or decision support>

### Evidence Used
- Official/upstream: <source URL> — <what it establishes>
- Supplemental, if any: <source URL> — <why it is secondary>

### Version / Date Context
<versions, dates, release channels, or unknowns>

### Repo-Local Context
<facts from inspection, or "not needed">

### Boundaries / Non-goals
<what this research does not decide>

### Handoff
<planning/execution/test implications; name the next workflow — `plan` for planning,
Agent tool / `team` / `deep-interview` for execution — and note that this skill stops
here unless the user explicitly switches workflows>
```

## Stop Rules

- Stop after a source-backed recommendation is reusable by the caller.
- Stop and route upward if the task becomes dependency comparison, broad architecture, or implementation.
- Do not continue researching when remaining work would only polish wording rather than change the recommendation.
- This skill never implements. After delivering the recommendation and handoff, stop; do not modify repo files or repo state. Resume only when the user explicitly switches to a planning or implementation workflow named in the handoff.
