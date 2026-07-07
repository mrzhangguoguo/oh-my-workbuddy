# oh my workbuddy (omw)

> 🇨🇳 [中文文档](README.zh-CN.md)

An **oh-my-codex (OMX)-style** skill pack for [WorkBuddy](https://www.codebuddy.cn/).

Start WorkBuddy stronger: a curated set of workflow skills, a catalog-driven
enable/disable system, dual-scope install (user / project), and **zero runtime
dependency**. No Rust, no tmux — WorkBuddy's built-in **Skill** tool and
**Agent** orchestration replace OMX's hook-injection and Rust crates.

---

## Why this exists

`oh-my-codex` makes OpenAI Codex CLI better by shipping Markdown skills, agent
prompts, and a `setup` CLI that wires them into Codex. WorkBuddy already has the
same primitive — the **Skill** (`SKILL.md` + frontmatter) — plus user-level
(`~/.workbuddy/skills`) and project-level (`.workbuddy/skills`) scopes. So a
faithful OMX-for-WorkBuddy is mostly: **keep the content, swap the wiring.**

| oh-my-codex | oh my workbuddy |
|---|---|
| `skills/<name>/SKILL.md` | `skills/<name>/SKILL.md` (same) |
| `~/.codex/skills` / `./.codex/skills` | `~/.workbuddy/skills` / `./.workbuddy/skills` |
| `src/catalog/manifest.json` + `schema.ts` | `catalog/manifest.json` + `lib/manifest.js` |
| `omx setup` moves files + registers Codex hook | `omw setup` copies skills to target scope |
| `codex-native-hook.mjs` runtime injection | `AGENTS.md` guidance + Skill tool load |
| HUD preset `minimal/focused/full` | `profile: minimal/focused/full` |

See [`docs/architecture-analysis.md`](docs/architecture-analysis.md) for the full
OMX teardown, and [`docs/design.md`](docs/design.md) for the mapping.

---

## Install

```bash
git clone https://github.com/mrzhangguoguo/oh-my-workbuddy.git
cd oh-my-workbuddy
chmod +x omw
cp omw.config.example.json omw.config.json   # then edit scope/profile
./omw setup                                   # installs enabled skills
```

`omw setup` copies every `active` skill in `catalog/manifest.json` (minus
anything in `skills.disabled`) into the target scope:

- `scope: "user"` → `~/.workbuddy/skills/<name>/` (available in **all** projects)
- `scope: "project"` → `./.workbuddy/skills/<name>/` (run from your project root)

After install, the skills are loadable in WorkBuddy via the **Skill** tool
(`skill: <name>`), exactly like any other installed skill.

> **Note:** installing into `scope: "user"` only *adds* new directories under
> `~/.workbuddy/skills`. Your existing skills (e.g. the official `obsidian`
> skills) are left untouched.

---

## Commands

```bash
./omw setup [--with-guidance]   # install enabled skills (optionally write AGENTS.md)
./omw doctor                    # verify installed set matches the catalog
./omw list                      # list all catalog skills + install state
./omw enable  <name>            # take a skill out of the disabled set
./omw disable <name>            # add a skill to the disabled set
./omw info                      # scope / profile / counts
```

---

## Bundled skills

This is a **full 1:1 rewrite of all 46 `oh-my-codex` skills** (see
[`catalog/manifest.json`](catalog/manifest.json) for the source of truth). Every
skill is a *port* of the OMX original: OMX runtime conventions (`$macro`
invocation, `omx` CLI, `.omx/` state) are replaced with WorkBuddy idioms (Skill
tool, Agent tool, task list, `.workbuddy/memory`). See
[`docs/PORTING_GUIDE.md`](docs/PORTING_GUIDE.md) for the translation spec.

`omw setup` installs the **30 `active`** skills by default; the **16
`deprecated`** shims (e.g. `swarm` → `team`, `tdd` → active workflow, `review` →
`code-review`) are registered in the catalog but intentionally not installed.

### Active skills by category (30)

| Category | Skills |
|---|---|
| planning (8) | `autopilot` · `deep-interview` · `design` · `pipeline` · `plan` · `prometheus-strict` · `ralplan` · `ultragoal` |
| execution (7) | `ai-slop-cleaner` · `git-master` · `performance-goal` · `ralph` · `team` · `ultrawork` · `worker` |
| research (4) | `analyze` · `autoresearch` · `autoresearch-goal` · `best-practice-research` |
| utility (5) | `ask` · `cancel` · `configure-notifications` · `skill` · `wiki` |
| review (2) | `code-review` · `ultraqa` |
| infra (2) | `doctor` · `omx-setup` |
| build (1) | `visual-ralph` |
| display (1) | `hud` |

### Deprecated compatibility shims (registered, not installed — 16)

`ask-claude` · `ask-gemini` · `build-fix` · `deepsearch` · `ecomode` ·
`frontend-ui-ux` · `help` · `note` · `ralph-init` · `review` · `security-review` ·
`swarm` · `tdd` · `trace` · `visual-verdict` · `web-clone`

### Role prompts

OMX's `prompts/` live in `agents/` as focus-mode references:
`executor.md`, `architect.md`, `reviewer.md`.

---

## Project structure

```
oh-my-workbuddy/
├── omw                      # launcher (zero-dep Node, mirrors OMX's bin.omx)
├── catalog/manifest.json    # skill/agent catalog (single source of truth)
├── lib/                     # core framework (plain Node ESM)
│   ├── manifest.js          # manifest load + category validation
│   ├── config.js            # config resolution (scope/profile/enabled/disabled)
│   ├── install.js           # install dispatch to user/project scope
│   └── cli.js               # command entrypoint
├── skills/                  # 46 ported skills (each = SKILL.md + frontmatter)
├── agents/                  # 3 role prompts (executor/architect/reviewer)
├── AGENTS.md                # top-level orchestration contract
├── omw.config.example.json  # config system sample
├── validate_frontmatter.js  # contributor tool: validates all SKILL.md frontmatter
├── docs/                    # architecture-analysis / design / PORTING_GUIDE
└── README.md · README.zh-CN.md · LICENSE
```

---

## Configuration

`omw.config.json` (copy from `omw.config.example.json`):

```json
{
  "schemaVersion": 1,
  "scope": "user",
  "profile": "focused",
  "skills": {
    "enabled":  ["*"],
    "disabled": []
  },
  "guidance": {
    "injectAgentsMd": true
  }
}
```

- `scope`: `"user"` (global `~/.workbuddy/skills`) or `"project"` (`./.workbuddy/skills`).
- `profile`: `minimal` / `focused` / `full` (HUD-style guidance hint).
- `skills.enabled`: `"*"` for all, or an explicit name list.
- `skills.disabled`: names to skip even if enabled.
- `guidance.injectAgentsMd`: write the top-level `AGENTS.md` contract into the target scope on `setup --with-guidance`.

---

## Extend

1. Add `skills/<name>/SKILL.md` with `name` + `description` frontmatter.
2. Register it in `catalog/manifest.json` (`skills[]`): `category`, `status`, `core`.
3. Run `./omw setup --force`.

No build step. The framework is plain Node ESM under `lib/` (manifest validation,
config resolution, install dispatch) — a faithful, dependency-free port of OMX's
`schema.ts` / `setup.ts` / `index.ts`.

---

## Development

```bash
npm install            # installs js-yaml for the validator
npm run validate       # check all SKILL.md frontmatter parses
./omw doctor           # check installed set == catalog
```

---

## License

[MIT](LICENSE) © 2026 oh-my-workbuddy contributors.
