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
The catalog lives in `catalog/manifest.json` (an array of entries: `name`, `category`, `status`, `core`, `description`).
The agent definitions live in `agents/*.md` and are also registered in the manifest `agents` array.

**Frontmatter is the contract.** Every `SKILL.md` must start with:

```yaml
---
name: my-skill            # MUST equal the directory name
description: One-line what it does, with trigger phrases.
agent_created: true        # REQUIRED — lets SkillManage own the file
triggers: ["my skill", "run my-skill"]   # optional, aids routing
---
```

## 3. Adding a skill

1. Create `skills/<name>/SKILL.md` with the frontmatter above and a body that follows the porting rules in `docs/PORTING_GUIDE.md`.
2. Register it in `catalog/manifest.json` under `skills`:
   ```json
   { "name": "my-skill", "category": "execution", "status": "active", "core": false,
     "description": "Short catalog description" }
   ```
   `category` ∈ `execution|planning|shortcut|utility|research|review|build|infra|display`;
   `status` ∈ `active|alias|merged|deprecated|internal`.
3. Run **both** validators (they are the CI gates):
   ```bash
   npm run validate        # frontmatter: name/description/agent_created, name==dir
   npm run verify-catalog  # skills/ dirs  ↔  manifest skills  ↔  agents/ files  (no drift)
   ```
4. If the skill has WorkBuddy-native equivalents, prefer WorkBuddy idioms (Skill tool, Agent tool, `TeamCreate`, `SendMessage`, Task tools, `.workbuddy/memory`). Do **not** leave Codex/tmux/`omx` CLI instructions — see the "no OMX-primitive leakage" rule.
5. Use `templates/skill-template/SKILL.md` as a starting point.

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
