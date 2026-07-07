# Porting Guide: oh-my-codex → oh-my-workbuddy

This document is the canonical spec for rewriting each of oh-my-codex's 46 skills
into a WorkBuddy-native skill. Every ported skill MUST follow these rules so the
package stays consistent and actually *runs* inside WorkBuddy.

## 1. Frontmatter (WorkBuddy format — required, exact)

```yaml
---
name: <kebab-case-skill-name>
description: <one sentence: WHAT it does + WHEN to use + a few trigger keywords>
agent_created: true
triggers: ["<phrase>", "<another phrase>"]
---
```

- `name` must equal the directory name (`skills/<name>/SKILL.md`).
- `description` should make the Skill tool's auto-matching work: state the use-case
  and include trigger phrases (e.g. "autonomous loop", "code review", "git rebase").
- Do NOT include OMX-only fields. `agent_created: true` is mandatory (this package
  is model-authored).

## 2. Header note (add right after frontmatter)

```
> Ported from oh-my-codex `<name>`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).
```

## 3. Translation table (OMX construct → WorkBuddy idiom)

| OMX construct | WorkBuddy equivalent |
|---|---|
| `$foo` macro (e.g. `$deep-interview`) | Invoke the `foo` skill via the **Skill tool**: `skill: foo`. In prose: "invoke the `deep-interview` skill". |
| `$foo --flag arg` | `skill: foo` then pass the argument as a normal instruction in your message. |
| `omx state write/read/clear --json '<json>'` | Track progress with **TaskCreate/TaskUpdate** (task list) and/or append a short note to `.workbuddy/memory/YYYY-MM-DD.md`. Never shell out to `omx`. |
| `.omx/context/{slug}.md`, `.omx/plans/prd-{slug}.md`, `.omx/state/...`, `.omx/interviews/...` | For artifacts that must persist (PRD, plans, specs): write to a project-relative path under `.omw/<skill>/<file>.md`. Prefer the **task list + memory** for ephemeral progress. Never reference `.omx/`. |
| `omx question` | Ask the user a clarifying question in chat, or use the **AskUserQuestion** tool for clean multiple-choice. |
| `omx team` / `$team` | Spawn teammates with the **Agent tool** for parallel/coordinated execution. Describe the role and handoff. |
| `omx hud` / HUD presets | Drop. WorkBuddy has a built-in status display. If a skill is *about* status (e.g. `hud`), rewrite it as a short note explaining how to inspect progress via the task list / memory. |
| `agentModels.planner`, `o4-mini`, `*-mini` lanes, model routing | Drop OMX/Codex-specific model config. Optionally note "if a lighter model is available, use it for planning" — but never reference OMX config keys. |
| `config.toml`, `[tui] status_line`, Codex hooks (7-event) | Drop. WorkBuddy loads skills on demand via the Skill tool; there is no equivalent hook lifecycle to configure. |
| `omx setup` | Replace with `./omw setup` (this package's installer) or just "install this skill to `~/.workbuddy/skills`". |
| `omx sparkshell` / `omx explore` | Use normal repo-inspection tools (Read, Grep, Glob, Bash for read-only checks). |
| `omx ralph --prd ...` | Invoke the `ralph` skill (`skill: ralph`) and pass the PRD path as a normal argument. |

## 4. Preserve the *value*, drop the *coupling*

- Keep the workflow phases, gates, handoff artifacts, and decision rules — that is
  the actual intellectual content worth porting.
- Express every phase in WorkBuddy terms (Skill tool / Agent tool / task list / memory).
- Do NOT invent a new execution framework; reuse WorkBuddy's built-ins.

## 5. references/ and scripts/

- If the OMX skill ships `references/*.md`, port them too (they are pure guidance).
  Apply the same `$macro` / `.omx/` rewrites.
- If it ships `scripts/*.sh` that call `omx`: either (a) drop them with a one-line
  note, or (b) adapt to WorkBuddy tools only if trivial. Do NOT keep `omx`-calling
  scripts — they would fail at runtime.

## 6. Deprecated shims

Skills explicitly marked deprecated in OMX (e.g. `swarm` → use `team`; `tdd` →
folded into `plan`) get a SHORT SKILL.md that says "deprecated; use `<x>` instead"
and points to the replacement. Set `status: "deprecated"` in the manifest.

## 7. Category taxonomy (for manifest registration)

Pick ONE best-fit category per skill:
`planning` · `execution` · `review` · `research` · `build` · `utility` ·
`display` · `infra` · `shortcut`

## 8. Quality bar

- Practical and actionable, not bloated. Aim for the same information density as
  the OMX original, just expressed in WorkBuddy idioms.
- Every instruction in the ported skill must be *executable* inside WorkBuddy with
  no `omx` binary and no `.omx/` directory present.
