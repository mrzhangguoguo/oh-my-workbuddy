---
name: git-master
category: execution
status: active
core: true
description: Git expert for atomic commits, interactive rebasing, branch management, and history cleanup. Trigger "git rebase", "atomic commits", "clean git history", "squash commits", "branch strategy".
agent_created: true
triggers: ["git rebase", "atomic commits", "clean git history", "squash commits", "branch strategy"]
---

> Ported from oh-my-codex `git-master`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Git Master

Git operations expert. Use this skill whenever the user needs precise, safe git
work: atomic commits, interactive rebasing, branch management, history cleanup, or
style-consistent commit messages.

## Usage

Invoke the `git-master` skill and describe the git task, e.g.:
"rebase my feature branch onto main", "squash these 5 commits", "write a conventional
commit for these changes".

## Capabilities

- **Atomic commits** with conventional-commit format
  (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **Interactive rebasing** (`rebase -i`) for reordering, squashing, fixing up.
- **Branch management**: create/rename/delete, branch-point detection, divergence check.
- **History cleanup**: prune stray commits, rewrite messages, split/join commits.
- **Style detection**: read the repo's existing commit history to match its convention
  before writing new commits.

## Workflow

1. **Assess the working tree.** Run read-only checks first:
   ```bash
   git status
   git log --oneline -10
   git diff --stat
   ```
   Detect the repo's commit style from recent history before composing messages.

2. **Plan the operation.** For anything destructive (rebase, reset, branch delete,
   amend of already-pushed commits), use the task list (TaskCreate) to outline steps,
   and surface a short plan to the user. If the operation rewrites shared/pushed
   history, ask for explicit confirmation before proceeding (use AskUserQuestion for
   a clean yes/no).

3. **Execute safely.**
   - Prefer `--autosquash` when queuing fixups.
   - For atomic commits, stage narrowly: `git add -p` or stage specific paths rather
     than `git add -A`.
   - Write messages that match the detected style; default to Conventional Commits
     when the repo has no clear convention.

4. **Verify.** After the operation:
   ```bash
   git status
   git log --oneline -5
   ```
   Confirm the tree matches intent and there are no leftover staged/unstaged changes
   unless expected.

## Safety rules

- Never rewrite history that has already been pushed to a shared branch without
  explicit user confirmation.
- Always check `git status` and `git log` before mutating.
- For large/risky history rewrites, suggest creating a backup branch first
  (`git branch backup/<name>`).
- If unsure about intent, ask the user rather than guessing.

## Handoff

When the git task is part of a larger flow (e.g. a `ralph`/`ultrawork` loop or a
PR prep), record the resulting commit range and branch state in the task list and/or
append a short note to `.workbuddy/memory/YYYY-MM-DD.md` so downstream steps can pick
up where this left off.
