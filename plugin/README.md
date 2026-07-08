# oh-my-workbuddy hook adapter (P3)

Deterministic hook layer that turns oh-my-workbuddy from a skill library into a **self-routing** skill library. Ports oh-my-codex's 22 hooks to WorkBuddy's plugin hook system. See `docs/HOOK_ADAPTER_DESIGN.md` for the full design.

## Status: skeleton (not wired)
- `src/lib/hook-io.mjs` — **real**: stdin parse + stdout emit + fail-safe (exceptions never block the user).
- `src/lib/keyword-router.mjs` — **real**: keyword→skill routing table.
- `src/hooks/*.mjs` — entry points with the I/O contract in place; per-hook logic is TODO (mapped to OMX hooks).
- `hooks/hooks.json` — registers `UserPromptSubmit` / `PreToolUse` / `Stop`.

## Contract (discovered from builtin `weixinpay` plugin)
Hook = a command (node .mjs) that:
- reads JSON on stdin (`session_id`, `prompt`, `tool_name`, `tool_input`, ...)
- writes `hookSpecificOutput` JSON on stdout:
  - `UserPromptSubmit` → inject `context`
  - `PreToolUse` → `permissionDecision: allow/deny` + `updatedInput` (shallow-merged into tool input)
  - `Stop` → side effects only

## Hard constraints
- **fail-safe**: a hook crash must NEVER block the user → `runHook` emits empty allow on exception.
- **fast**: hooks run on every prompt/tool call → <100ms; `codebase-map` must cache.
- **shallow-merge trap**: `updatedInput` replaces top-level keys; inject nested fields only after spreading originals.

## Next (per design §6)
1. **P3-a**: verify local (non-builtin) plugin load path — the gating question.
2. **P3-b**: fill `keyword-router` from `catalog/manifest.json` triggers + test route injection.
3. **P3-c..f**: triage, session/Stop, PreToolUse overlays, codebase-map cache.
