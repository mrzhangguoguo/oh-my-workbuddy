---
name: frontend-ui-ux
description: DEPRECATED compatibility shim for frontend UI/UX work. Do not route here; use the `design` skill for design/UX context or `visual-ralph` for measured visual implementation.
agent_created: true
triggers: ["frontend ui ux", "frontend design", "ui ux"]
---

> Ported from oh-my-codex `frontend-ui-ux`. OMX runtime conventions (`$macro`
> invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy
> idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Frontend UI/UX (deprecated)

**Hard-deprecated. Do not invoke or route this skill for new work.**

- Use the `design` skill when the task needs product/design context, UX guidance,
  frontend planning, design-system alignment, or a repo-local `DESIGN.md` source of
  truth.
- Use the `visual-ralph` skill when the task needs implementation against an approved
  generated/static/live-URL visual reference with screenshot capture and
  pixel-diff evidence.

This file exists only to preserve the catalog-visible `frontend-ui-ux` compatibility
contract while canonical design guidance is handled by `design` and measured visual
implementation by `visual-ralph`.
