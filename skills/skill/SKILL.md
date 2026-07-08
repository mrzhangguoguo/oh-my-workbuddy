---
name: skill
category: utility
status: active
description: Manage local WorkBuddy skills - list, add, remove, search, edit, info, sync, setup. Use for skill authoring and inventory.
agent_created: true
triggers: ["skill list", "create a skill", "add skill", "remove skill", "search skills", "skill management"]
---

> Ported from oh-my-codex `skill`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Skill Management

Meta-skill for managing WorkBuddy skills via CLI-like subcommands. WorkBuddy skills are just directories containing a `SKILL.md` with YAML frontmatter.

Two scopes:
- **user** — `~/.workbuddy/skills/<name>/SKILL.md` (available across all projects)
- **project** — `.workbuddy/skills/<name>/SKILL.md` (committed with the repo, team-shared)

## Subcommands

### /skill list
Show all local skills organized by scope.
1. Scan `~/.workbuddy/skills/` and `.workbuddy/skills/` with `Glob` (`**/SKILL.md`).
2. For each file, read the frontmatter (`name`, `description`, `triggers`).
3. Display an organized table (Name | Triggers | Description | Scope).
4. If metadata is missing, show "N/A".

### /skill add [name]
Interactive wizard for creating a new skill.
1. Ask for the skill name if not provided — validate: lowercase, hyphens only, no spaces.
2. Ask for a one-line `description`.
3. Ask for `triggers` (comma-separated keywords).
4. Ask for scope: `user` or `project`.
5. Create the file with this template:

```yaml
---
name: <name>
description: <one sentence: what it does + when to use + trigger keywords>
agent_created: true
triggers: ["<trigger1>", "<trigger2>"]
---

# <Name> Skill

## Purpose
[Describe what this skill does]

## When to Activate
[Describe triggers and conditions]

## Workflow
1. [Step 1]
2. [Step 2]

## Examples
[Usage examples]
```

6. Report success with the file path.
7. Suggest: "Edit with `/skill edit <name>` to customize content."

### /skill remove <name>
Remove a skill by name.
1. Search both scopes for `<name>/SKILL.md`.
2. If found, show its info and **ask for confirmation** ("Delete '<name>'? (yes/no)") via the AskUserQuestion tool or chat.
3. If confirmed, delete the whole skill directory.
4. If not found, report: "Skill '<name>' not found in user or project scope."
**Safety:** never delete without explicit confirmation.

### /skill edit <name>
Edit an existing skill interactively.
1. Find the skill by name (search both scopes).
2. Read current content with the Read tool.
3. Show current values (description, triggers, content).
4. Ask what to change: `description` | `triggers` | `content` | `rename` | `cancel`.
5. For the selected field, show current value, ask for new value, update via Edit/Write.
6. Report a summary of changes.

### /skill search <query>
Search skills by name, description, triggers, or full content (case-insensitive).
- Use `Grep` with the query across both skill directories.
- Rank name/trigger matches above content matches.
- Show each match with context (where the query matched).

### /skill info <name>
Show detailed info about one skill: scope, description, triggers, file path, and full content (read the file).

### /skill sync
Compare user and project scopes and report sync opportunities (user-only, project-only, common). For any desired copy, ask for confirmation before moving files between scopes. Never overwrite without confirmation.

### /skill setup
Guided wizard.
1. Ensure both skill directories exist (create with `Bash` `mkdir -p` if missing).
2. Run the `/skill list` scan and show the inventory.
3. Offer a quick-actions menu via AskUserQuestion:
   - Add new skill → invoke `/skill add`
   - List skills → invoke `/skill list`
   - Scan conversation for skill-worthy patterns → look for non-obvious debugging solutions, codebase-specific workarounds, repeated error patterns; offer to extract one as a skill
   - Import skill → accept a URL or pasted markdown, ask for scope, validate and save
   - Done

### /skill scan
Quick scan of both skill directories (subset of `/skill setup` without the wizard).

## Skill Templates
When creating a skill, you may reuse these proven shapes (express frontmatter in WorkBuddy format — `name`, `description`, `agent_created: true`, `triggers`):

- **Error Solution** — The Insight / Why It Matters / Recognition Pattern / The Approach (step-by-step with file:line refs) / Example.
- **Workflow** — Insight / Why It Matters / Recognition Pattern / Approach / Gotchas.
- **Code Pattern** — Principle / Recognition / Approach (heuristic, not just code) / Example / Anti-Pattern.
- **Integration** — Insight / Recognition / Approach (config + setup + verification) / Gotchas.

## Skill Quality Guidelines
Good skills are: **Non-Googleable** (codebase-specific), **Context-Specific** (real files/errors), **Actionable with Precision** (exact what + where), and **Hard-Won** (required real debugging effort).

## Error Handling
Every command must handle: missing directory, permission errors, malformed YAML, duplicate names, invalid names (spaces/special chars). Report clearly:
```
✗ Error: <clear message>
→ Suggestion: <helpful next step>
```

## Notes
- Use Read/Edit/Write tools for file operations; use Glob/Grep for discovery.
- Always confirm destructive operations (remove, overwrite on sync).
- Validate naming (lowercase, hyphens only) on `add`/`edit`.
