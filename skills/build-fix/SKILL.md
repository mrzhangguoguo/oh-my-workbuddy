---
name: build-fix
description: Deprecated shim — build failures are now handled inline by the active execution/debugging workflow; do not route here
agent_created: true
triggers: ["build fix", "fix build", "build-fix"]
---

> Ported from oh-my-codex `build-fix`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Build Fix — deprecated

Hard-deprecated. Do not invoke or route this skill.

Build failures should be handled by the active execution, debugging, or verification
workflow (e.g. run the build, read the error, fix the offending code, re-run). There is
no separate persistent "build-fix" mode in WorkBuddy — repair happens inline as part of
normal task progress, tracked with the task list and `.workbuddy/memory`.

If you arrived here from an old reference, just fix the build directly in the current
session.
