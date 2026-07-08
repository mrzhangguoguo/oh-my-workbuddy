# oh-my-workbuddy hook adapter (P3)

Deterministic `UserPromptSubmit` routing layer that turns oh-my-workbuddy into a **self-routing** skill library. Integrated from the official **oh-my-codebuddy** (OMC) plugin's `skill-activation-prompt` (MIT, CodeBuddy Team), adapted to cover all our active skills via the WorkBuddy plugin hook model.

## Status: working routing hook
- `src/lib/hook-io.mjs` — stdin/stdout contract + fail-safe wrapper.
- `src/lib/skill-rules.mjs` — matchSkill logic (keywords + intentPatterns), ported from OMC.
- `src/hooks/user-prompt-submit.mjs` — entry point, emits `suggestedSkills` as injected context.
- `src/hooks/pre-tool-use.mjs` — **Bash destructive-op guardrail** (denies `rm -rf` on personal/system dirs); Agent/DeferExecuteTool passthrough.
- `src/hooks/stop.mjs` — opt-in progress persistence (`OMW_HOOK_PERSIST=1` appends a session marker to `.workbuddy/memory/YYYY-MM-DD.md`; default no-op).
- `src/lib/guardrail.mjs` — destructive-op detection.
- `data/skill-rules.json` — **generated** from `skills/*/SKILL.md` frontmatter triggers, covers all 30 active skills (OMC's covered ~5).

## Install
```bash
bash plugin/install.sh      # copies plugin to ~/.workbuddy/plugins/marketplaces/oh-my-workbuddy/,
                            # registers the local marketplace, enables it in settings.json
bash plugin/uninstall.sh    # revert (idempotent)
```
Then **restart WorkBuddy** to load the hooks. Verified: install/uninstall are idempotent and reversible; the installed `UserPromptSubmit` hook routes correctly (e.g. `analyze`/`team`/`plan` prompts hit the right skill).
- `hooks/hooks.json` — registers `UserPromptSubmit` / `PreToolUse` / `Stop` (WorkBuddy plugin model, `${CODEBUDDY_PLUGIN_ROOT}` + `timeout`).

## Attribution
The skill-activation routing concept and `matchSkill` logic are adapted from the **oh-my-codebuddy** plugin by CodeBuddy Team (MIT, https://cnb.cool/codebuddy/marketplace). Adaptations: re-registered via the WorkBuddy plugin hook model (`hooks/hooks.json` + `${CODEBUDDY_PLUGIN_ROOT}`) instead of OMC's `$CLAUDE_PROJECT_DIR` project-hook model; routing table auto-generated from our frontmatter triggers to cover all 30 active skills.

## Contract
Hook = a command (node .mjs) that reads JSON on stdin, writes `hookSpecificOutput` on stdout:
- `UserPromptSubmit` → inject `context` (the suggested-skills routing hint)
- `PreToolUse` → `permissionDecision: allow/deny` + `updatedInput` (shallow-merged)
- `Stop` → side effects only

## Hard constraints
- **fail-safe**: a hook crash must NEVER block the user → `runHook` emits empty allow on exception.
- **fast**: hooks run on every prompt/tool call → <100ms; `codebase-map` (future) must cache.
- **shallow-merge trap**: `updatedInput` replaces top-level keys; inject nested fields only after spreading originals.

## Develop
```bash
npm run generate-skill-rules   # regenerate data/skill-rules.json after editing frontmatter triggers
npm run verify-skill-rules      # CI gate: committed rules must match frontmatter
# test a hook locally:
echo '{"prompt":"analyze this repo","session_id":"s1"}' | node plugin/src/hooks/user-prompt-submit.mjs
```

## Remaining (per docs/HOOK_ADAPTER_DESIGN.md §9.4)
- `triage` / `session` / `prompt-guidance-contract` in `user-prompt-submit.mjs` (TODO).
- `PreToolUse` overlays (agents-overlay / explore-routing) and `Stop` persistence (TODO).
- Deployment: package as an installable WorkBuddy plugin (marketplace or local).
