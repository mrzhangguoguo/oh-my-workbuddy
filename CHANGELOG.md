# Changelog

All notable changes to oh-my-workbuddy. Versions follow the catalog `catalogVersion` in `catalog/manifest.json`.

## [0.2.0] — 2026-07-08

### Added
- `omw sync` — incremental sync from `skills/` to the installed scope (`--prune` to mirror-remove). Preserves symlinks, tolerates broken entries.
- `omw sync` registered as an `omw` subcommand and a `package.json` script.
- Unit tests for `sync` (`lib/__tests__/sync.test.js`, `node --test`): incremental copy, idempotency, content-change detection, prune, no-prune retention, broken-symlink tolerance, missing-source skip.
- `scripts/verify-catalog.js` — drift guard: checks `skills/` dirs ↔ manifest `skills` ↔ `agents/*.md` consistency. Wired into CI and `npm run verify-catalog`.
- `CONTRIBUTING.md` — contribution workflow, frontmatter contract, validator gates.
- `templates/skill-template/SKILL.md` — scaffold for new skills.
- `.github/workflows/validate.yml` — CI running `validate` + `verify-catalog` + `test` on push/PR.

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
