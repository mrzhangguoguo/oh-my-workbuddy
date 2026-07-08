# Changelog

All notable changes to oh-my-workbuddy. Versions follow the catalog `catalogVersion` in `catalog/manifest.json`.

## [0.3.0] — 2026-07-08

### Added — P3 hook adapter (integrated from oh-my-codebuddy)
- `plugin/` — WorkBuddy plugin providing a `UserPromptSubmit` routing hook. The `matchSkill` logic and `skill-rules.json` format are adapted from the official **oh-my-codebuddy** plugin (MIT, CodeBuddy Team), re-registered via the WorkBuddy plugin hook model (`hooks/hooks.json` + `${CODEBUDDY_PLUGIN_ROOT}`).
- `plugin/src/lib/{hook-io,skill-rules}.mjs` — I/O contract + fail-safe + skill matching.
- `plugin/src/hooks/{user-prompt-submit,pre-tool-use,stop}.mjs` — entry points.
- `plugin/data/skill-rules.json` — **generated** from frontmatter triggers; covers all 30 active skills (OMC covered ~5). Drift-guarded by `npm run verify-skill-rules`.
- `scripts/generate-skill-rules.js` — regenerates the routing table from `skills/*/SKILL.md`.
- CI now runs `verify-skill-rules` (4 gates: validate / verify-catalog / verify-skill-rules / test).
- Verified end-to-end: prompts route to the right skill (analyze/team/plan…); no-match passes; fail-safe on bad input.

### Changed
- `plugin/src/hooks/user-prompt-submit.mjs` switched from the prototype `keyword-router.mjs` (removed) to the OMC-derived `skill-rules.mjs` (richer: keywords + intentPatterns + enforcement + priority).

## [0.2.0] — 2026-07-08

### Added
- `omw sync` — incremental sync from `skills/` to the installed scope (`--prune` to mirror-remove). Preserves symlinks, tolerates broken entries.
- `omw sync` registered as an `omw` subcommand and a `package.json` script.
- Unit tests for `sync` (`lib/__tests__/sync.test.js`, `node --test`): incremental copy, idempotency, content-change detection, prune, no-prune retention, broken-symlink tolerance, missing-source skip.
- `scripts/generate-catalog.js` — **catalog is now generated, not hand-maintained.** Reads `catalog/meta.json` (top-level `schemaVersion`/`catalogVersion`/`port`) + each `SKILL.md`/agent frontmatter and emits `catalog/manifest.json`. `npm run generate-catalog` regenerates; `npm run verify-catalog` (= `--check`) is the CI drift gate. Replaces the earlier `verify-catalog.js` drift guard.
- `CONTRIBUTING.md` — contribution workflow, frontmatter contract, validator gates.
- `templates/skill-template/SKILL.md` — scaffold for new skills (with `category`/`status`).
- `.github/workflows/validate.yml` — CI running `validate` + `verify-catalog` + `test` on push/PR.

### Changed (catalog generation)
- Frontmatter is now the **single source of truth**: every `SKILL.md` gained `category` + `status` (and `core: true` where applicable); `agents/*.md` gained `category` + `status`. The manifest's per-skill `description` now equals the frontmatter `description` (richer, trigger-bearing) instead of a separate curated blurb.
- `catalog/meta.json` added — holds the static top-level catalog fields that are not derivable from frontmatter.
- `validate_frontmatter.js` now requires `category` and `status`.

### Fixed
- **`sync` silently dropped all files in subdirectories** (e.g. `references/`). `walkFiles` produced paths relative to the immediate subdir instead of the skill root, so `skills/foo/refs/a.md` was read as `a.md` and skipped. Now paths are root-relative; round-trip verified against `skills/ultrawork/references/`.

### Changed
- Thickened `autopilot` (214 lines, ~OMX parity) and `team` (472 lines, depth-aligned to WorkBuddy primitives `TeamCreate`/`Agent`/`SendMessage`/Task tools).
- `lib/install.js` `sync()` now accepts injectable `manifest`/`config`/`target`/`skillsDir` for isolated testing (backward compatible).

### Removed
- Self-written `skills/research/` and `skills/retro/` (not OMX ports, unregistered) — the package is now a pure 46-skill mirror of oh-my-codex. Global copies removed too.

## [0.1.0] — 2026-07-07

### Added
- Initial port: 46 skills (30 active + 16 deprecated shims) 1:1 with oh-my-codex skills layer.
- `omw` installer: `setup` / `doctor` / `list` / `enable` / `disable` / `info` / `help`.
- `catalog/manifest.json` + `lib/manifest.js` schema validation; `validate_frontmatter.js`.
- `agents/` (executor, architect, reviewer) with manifest registration.
- Bilingual `README.md` / `README.zh-CN.md`, `docs/PORTING_GUIDE.md`, `docs/video-script.md`.
- Open-sourced at https://github.com/mrzhangguoguo/oh-my-workbuddy.
