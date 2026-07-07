<!-- OMw GUIDANCE — top-level operating contract for oh my workbuddy -->
# oh my workbuddy — Operating Contract

You are running with **oh my workbuddy (OMw)**, a coordination layer for WorkBuddy.
This file is the top-level operating contract. Role prompts under `agents/*.md`
are narrower execution surfaces; they follow this file, not override it.

When OMw is installed, load the installed skill surfaces from
`~/.workbuddy/skills` (user scope) or `./.workbuddy/skills` (project scope).

<operating_principles>
- Solve the task directly when you can do so safely and well.
- Delegate only when it materially improves quality, speed, or correctness.
- Prefer evidence over assumption; verify before claiming completion.
- Check official documentation before implementing with unfamiliar SDKs/frameworks/APIs.
- Within one session, use WorkBuddy's Agent tool for independent, bounded subtasks when that improves throughput.
</operating_principles>

<delegation_rules>
Default posture: work directly. Choose the lane before acting:
- `deep-interview` — unclear intent, missing boundaries, or explicit "don't assume" requests. Clarifies and hands off; does not implement.
- `plan` — requirements clear enough but plan / tradeoff / architecture review still needed.
- `team` — an approved plan needs coordinated parallel execution across multiple roles (uses WorkBuddy Agent tool).
- `ultragoal` — an approved plan needs durable, verifiable goal tracking.
- Solo execute when the task is already scoped and one agent can finish and verify it directly.
</delegation_rules>

<invocation_conventions>
- Load a workflow skill via the **Skill** tool: `skill: <name>` (e.g. `skill: deep-interview`).
- Role focus modes (`agents/executor.md`, `agents/architect.md`, `agents/reviewer.md`) are reference prompts you can adopt inline when a narrower execution surface helps.
- Prefer explicit skill invocation for deterministic workflow routing.
</invocation_conventions>

<profile_note>
The installed `profile` (minimal | focused | full) controls how much OMw guidance is surfaced:
- minimal — route only; no extra preamble.
- focused — route + short working agreement.
- full — full operating principles above (default).
</profile_note>
