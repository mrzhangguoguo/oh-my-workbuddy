---
name: doctor
category: infra
status: active
description: Diagnose and fix oh-my-workbuddy skill installation issues — missing or duplicate skill roots, stale package versions, broken AGENTS.md/memory. Trigger "doctor", "fix skill install", "why is my skill missing", "diagnose skills".
agent_created: true
triggers: ["doctor", "fix skill install", "skill missing", "diagnose oh-my-workbuddy"]
---

> Ported from oh-my-codex `doctor`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Doctor Skill

You are the oh-my-workbuddy Doctor — diagnose and fix installation issues for this
skill package. WorkBuddy loads skills from a **user skill root** (`~/.workbuddy/skills/`)
and an optional **project skill root** (`.workbuddy/skills/` in the repo). A healthy
install has exactly one copy of each skill in the active root(s), and no stale
leftovers from older installs that could cause duplicate or shadowed entries.

> Note: OMX/Codex-specific surfaces (`~/.codex/config.toml`, `~/.codex/hooks/*.sh`,
> `.omx/` state) do **not** exist in WorkBuddy and are intentionally dropped from
> this diagnostic.

## Canonical skill roots

- **User scope (recommended):** `~/.workbuddy/skills/`
- **Project scope:** `.workbuddy/skills/` (repo-relative)

If both a legacy path (e.g. an old `~/.codebuddy/skills/` or `~/.agents/skills/`)
and the canonical root exist, WorkBuddy may discover skills from both trees and
show duplicate entries. Archive or remove the legacy tree once you have confirmed
`~/.workbuddy/skills/` is your active root.

## Task: Run Installation Diagnostics

Use the task list (TaskCreate/TaskUpdate) to track the six checks below as you go,
and append a short summary to `.workbuddy/memory/YYYY-MM-DD.md` when done.

### Step 1: Check Package Version

```bash
# Installed location(s) of oh-my-workbuddy skills
find ~/.workbuddy/skills -maxdepth 2 -name SKILL.md 2>/dev/null | head
# Latest published version (if distributed via npm)
LATEST=$(npm view oh-my-workbuddy version 2>/dev/null)
echo "Latest npm: ${LATEST:-<not published via npm>}"
```

**Diagnosis:**
- If `~/.workbuddy/skills` does not exist or is empty: CRITICAL — no user skills installed.
- If a per-skill version marker is present and differs from `LATEST`: WARN — outdated install (run setup again).

### Step 2: Check for Duplicate / Legacy Skill Roots

```bash
ls -la ~/.workbuddy/skills/ 2>/dev/null
ls -la .workbuddy/skills/ 2>/dev/null
# Look for legacy leftovers from older tooling
ls -la ~/.codebuddy/skills/ 2>/dev/null
ls -la ~/.agents/skills/ 2>/dev/null
```

**Diagnosis:**
- If `~/.workbuddy/skills` and `.workbuddy/skills` both contain the same skill:
  WARN — same skill present in two scopes (project copy shadows user copy).
- If a legacy tree (`~/.codebuddy/skills`, `~/.agents/skills`) exists with
  oh-my-workbuddy skills: WARN — legacy root can cause duplicate entries; remove it.

### Step 3: Check AGENTS.md / Project Wiring

```bash
ls -la ~/.workbuddy/AGENTS.md 2>/dev/null
ls -la .workbuddy/AGENTS.md 2>/dev/null
ls -la AGENTS.md 2>/dev/null
```

**Diagnosis:**
- If a project `AGENTS.md` exists but lacks the oh-my-workbuddy marker: WARN —
  outdated project guidance. Refresh it (see Fix below).
- Missing `AGENTS.md` is OK unless the project expects orchestration wiring.

### Step 4: Check Memory Directory

```bash
ls -la ~/.workbuddy/memory/ 2>/dev/null
ls -la .workbuddy/memory/ 2>/dev/null
```

**Diagnosis:**
- If the memory directory is missing: INFO — memory is optional; create it if you
  want durable cross-session notes (used by `note`/`hud` idioms).

### Step 5: Check for Stale Leftover Scripts

```bash
# Any old hook/wrapper scripts left by previous installs
ls -la ~/.workbuddy/hooks/ 2>/dev/null
ls -la .workbuddy/hooks/ 2>/dev/null
```

**Diagnosis:**
- If legacy `*.sh` wrappers exist (e.g. `keyword-detector.sh`, `session-start.sh`):
  WARN — stale scripts from an older install; safe to remove.

### Step 6: Verify a Known Skill Loads

```bash
test -f ~/.workbuddy/skills/doctor/SKILL.md && echo "doctor: OK" || echo "doctor: MISSING"
test -f ~/.workbuddy/skills/omx-setup/SKILL.md && echo "omx-setup: OK" || echo "omx-setup: MISSING"
```

**Diagnosis:**
- If a known skill is missing from the active root: CRITICAL — install is incomplete.

---

## Report Format

After running all checks, output:

```
## oh-my-workbuddy Doctor Report

### Summary
[HEALTHY / ISSUES FOUND]

### Checks

| Check | Status | Details |
|-------|--------|---------|
| Package Version | OK/WARN/CRITICAL | ... |
| Skill Roots (dup/legacy) | OK/WARN | ... |
| AGENTS.md | OK/WARN | ... |
| Memory Dir | OK/INFO | ... |
| Legacy Scripts | OK/WARN | ... |
| Known Skill Loads | OK/CRITICAL | ... |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommended Fixes
[List fixes based on issues]
```

---

## Auto-Fix (if user confirms)

If issues are found, ask the user: "Would you like me to fix these automatically?"
Use the AskUserQuestion tool for a clean yes/no. If yes, apply fixes:

### Fix: Missing / Incomplete Install
Re-run setup:
```bash
./omw setup --force --verbose
# or, for a single user: install skills to ~/.workbuddy/skills
```
See the `omx-setup` skill for details.

### Fix: Legacy / Duplicate Skill Roots
```bash
# Remove legacy trees only if they contain oh-my-workbuddy skills.
# Back up first if unsure:
# mv ~/.codebuddy/skills ~/.codebuddy/skills.bak
rm -rf ~/.codebuddy/skills
rm -rf ~/.agents/skills
```

### Fix: Stale Leftover Scripts
```bash
rm -f ~/.workbuddy/hooks/keyword-detector.sh
rm -f ~/.workbuddy/hooks/persistent-mode.sh
rm -f ~/.workbuddy/hooks/session-start.sh
```

### Fix: Outdated AGENTS.md
Refresh the project guidance. If a `AGENTS.md` exists, prefer merging rather than
overwriting user-authored content; otherwise write the oh-my-workbuddy-managed block.
Do not delete unrelated project documentation.

---

## Post-Fix

After applying fixes, inform the user:
> Fixes applied. Restart the WorkBuddy session / reload skills for changes to take effect.
