# Contributing to oh-my-workbuddy

Thanks for helping improve this WorkBuddy port of oh-my-codex. This guide covers the two most common contributions: **adding/fixing a skill** and **working on the `omw` installer**.

## 1. Prerequisites

- Node.js ≥ 20 (developed on 22; the managed runtime is preferred)
- `npm install` once to pull the `js-yaml` devDependency (used by the validator)

```bash
npm install
```

## 2. The source of truth

A skill lives in `skills/<name>/SKILL.md` (optionally with `references/` files).
The catalog lives in `catalog/manifest.json` — **it is generated**, do not hand-edit it.
The sources of truth are: `catalog/meta.json` (top-level `schemaVersion`/`catalogVersion`/`port`) and each skill/agent's frontmatter. Run `npm run generate-catalog` to regenerate the manifest after editing frontmatter.
The agent definitions live in `agents/*.md` (frontmatter carries `category`/`status`; name = filename).

**Frontmatter is the contract.** Every `SKILL.md` must start with:

```yaml
---
name: my-skill            # MUST equal the directory name
category: execution        # REQUIRED — execution|planning|shortcut|utility|research|review|build|infra|display
status: active             # REQUIRED — active|alias|merged|deprecated|internal
description: One-line what it does, with trigger phrases.  # becomes the catalog description
agent_created: true        # REQUIRED — lets SkillManage own the file
triggers: ["my skill", "run my-skill"]   # optional, aids routing
core: true                 # optional, defaults false — marks foundational skills
---
```

## 3. Adding a skill

1. Create `skills/<name>/SKILL.md` from `templates/skill-template/SKILL.md`, filling in `category`/`status`/`description`/`triggers` and a body that follows `docs/PORTING_GUIDE.md`.
2. Regenerate the manifest:
   ```bash
   npm run generate-catalog   # writes catalog/manifest.json from frontmatter
   ```
3. Run the gates (CI enforces all three):
   ```bash
   npm run validate          # frontmatter: name/description/agent_created/category/status, name==dir
   npm run verify-catalog    # generate --check: committed manifest must match frontmatter
   npm test                  # lib/ unit tests
   ```
4. If the skill has WorkBuddy-native equivalents, prefer WorkBuddy idioms (Skill tool, Agent tool, `TeamCreate`, `SendMessage`, Task tools, `.workbuddy/memory`). Do **not** leave Codex/tmux/`omx` CLI instructions — see the "no OMX-primitive leakage" rule.
5. Commit `skills/<name>/SKILL.md` **and** the regenerated `catalog/manifest.json`.

## 4. Working on `omw`

- Code is ESM in `lib/` (`cli.js`, `install.js`, `manifest.js`, `config.js`).
- `omw` is a 6-line bash launcher that forwards to `lib/cli.js` — no build step.
- Add unit tests under `lib/__tests__/` (use `node --test`). Inject `manifest`/`config`/`target`/`skillsDir` into `sync()` to keep tests isolated from the real global install.
- Run the suite: `npm test`.

## 5. Before opening a PR

```bash
npm run validate        # must pass
npm run verify-catalog  # must pass
npm test               # must pass
./omw doctor           # must report "All enabled skills installed"
```

CI (`.github/workflows/validate.yml`) runs the first three on every push/PR.

## 6. Conventions

- Self-reference in skill docs is **oh-my-workbuddy**, never `oh-my-codex` (that is the upstream we port from).
- Keep the runtime-dir convention consistent: skill artifacts go under `.workbuddy/` (see `docs/PORTING_GUIDE.md`). Do not introduce `.omx/`.
- One skill per PR is easiest to review, but not required.
