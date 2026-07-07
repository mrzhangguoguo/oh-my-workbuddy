---
name: omx-setup
description: Install or refresh the oh-my-workbuddy skill package into user or project scope. Trigger "omx setup", "install skills", "set up oh-my-workbuddy", "refresh skills".
agent_created: true
triggers: ["omx setup", "install skills", "set up oh-my-workbuddy", "refresh skills"]
---

> Ported from oh-my-codex `omx-setup`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# oh-my-workbuddy Setup

Use this skill when the user wants to install or refresh the oh-my-workbuddy skill
package for the **current project and/or the user-level skill root**.

## Command

```bash
./omw setup [--force] [--merge-agents] [--dry-run] [--verbose] [--scope <user|project>]
```

If you only want lightweight `AGENTS.md` scaffolding for an existing repo or subtree,
edit/seed `AGENTS.md` directly instead of running full setup.

Supported setup flags:

- `--force`: overwrite/reinstall managed artifacts where applicable.
- `--merge-agents`: if `AGENTS.md` already exists, preserve user-authored content and
  only insert/refresh oh-my-workbuddy-managed sections between explicit
  `<!-- OMW:AGENTS:START -->` / `<!-- OMW:AGENTS:END -->` markers.
- `--dry-run`: print actions without mutating files.
- `--verbose`: print per-file/per-step details.
- `--scope`: choose install scope (`user` or `project`).

## Canonical skill roots

WorkBuddy loads skills from:

- **User scope (recommended):** `~/.workbuddy/skills/`
- **Project scope:** `.workbuddy/skills/` (repo-relative)

Legacy paths from other tools (e.g. `~/.codebuddy/skills`, `~/.agents/skills`) are
not valid WorkBuddy roots; if they exist alongside the canonical root, remove them to
avoid duplicate skill entries (see the `doctor` skill).

## What setup actually does

1. **Resolve scope:**
   - explicit `--scope` value, else
   - a persisted preference (when present), else
   - interactive prompt on TTY (default `user`), else default `user` (safe for CI).
   On a TTY with a persisted choice, summarize it and ask **keep / review-change /
   reset** before proceeding.
2. Create the target skill-root directories if missing.
3. Copy/refresh the bundled skills into the resolved root:
   - user scope → `~/.workbuddy/skills/<name>/`
   - project scope → `.workbuddy/skills/<name>/`
4. Optionally seed `AGENTS.md` / project guidance (only when selected/allowed, or
   with `--merge-agents` to refresh managed sections idempotently).
5. Create the memory directory (`.workbuddy/memory/`) if missing so skills that use
   durable notes have a home.

## Important behavior notes

- Setup prompts for scope when none is provided and stdin/stdout are a TTY. In
  non-interactive (CI) runs it stays deterministic and never blocks.
- If `AGENTS.md` exists and neither `--force` nor `--merge-agents` is used:
  - interactive TTY runs ask whether to overwrite;
  - non-interactive runs preserve the file.
- Use `--merge-agents` to keep existing project guidance while letting setup refresh
  oh-my-workbuddy-managed `AGENTS.md` sections.
- Project orchestration file is `./AGENTS.md` (project root). Do not delete unrelated
  project documentation when refreshing.

## Setup-owned surfaces (for debugging a confusing install)

| Surface | Owner | Notes |
| --- | --- | --- |
| `~/.workbuddy/skills/` / `.workbuddy/skills/` | setup | The canonical user/project skill roots. |
| `AGENTS.md` | setup (overwrite-safe) | Generated defaults or managed refreshes guarded by force/merge checks. |
| `.workbuddy/memory/` | setup / skills | Durable cross-session notes used by `note`/`hud` idioms. |
| scope preference | setup | Persisted choice summarized on rerun (keep/review/reset). |

OMX/Codex surfaces such as `~/.codex/config.toml`, `~/.codex/hooks.json`, and
`.omx/setup-scope.json` do **not** exist in WorkBuddy and are intentionally dropped.

## If this skill is missing or stale

Treat a missing `omx-setup` as an installation/discovery problem, not a missing source
file:

1. Run `./omw setup --verbose` in the intended scope.
2. Run the `doctor` skill and check the reported skill root, scope, and AGENTS.md
   status.
3. If using project scope, confirm `.workbuddy/skills/omx-setup/SKILL.md` exists.
4. If using user scope, confirm `~/.workbuddy/skills/omx-setup/SKILL.md` exists.
5. If duplicate/stale skills appear, check for legacy root overlap (`~/.codebuddy`,
   `~/.agents`) and remove the legacy tree.

## Recommended workflow

1. Install/refresh:
   ```bash
   ./omw setup --force --verbose
   ```
2. Verify the install:
   ```bash
   # run the doctor skill
   ```
   (invoke the `doctor` skill).
3. Reload skills / restart the WorkBuddy session for the new skills to be available.

## Expected verification indicators

After setup, expect:
- Skills present in the resolved root (`~/.workbuddy/skills/` or `.workbuddy/skills/`).
- `AGENTS.md` found in the project root (when seeded/merged).
- `.workbuddy/memory/` present.
- No duplicate entries from leftover legacy skill roots.

## Troubleshooting

- If using local source changes, build first per the package's build instructions, then
  run `./omw setup --force --verbose`.
- If a global `omw` points elsewhere, run the local entrypoint:
  ```bash
  node lib/cli.js setup --force --verbose
  # then verify with the doctor skill
  ```
- If `AGENTS.md` was not overwritten during `--force`, stop any active session holding
  the file and rerun setup.
- If `AGENTS.md` was not merged during `--merge-agents`, stop the active session and
  rerun.
