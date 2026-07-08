---
name: web-clone
category: build
status: deprecated
description: 'Deprecated. Live-URL website cloning is now handled by the `visual-ralph` skill (visual implementation + visual QA). Do not invoke this skill directly. Triggers: "clone website", "clone this URL", "web clone".'
agent_created: true
triggers: ["clone website", "clone this URL", "web clone"]
---

> Ported from oh-my-codex `web-clone`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Web Clone — deprecated

Hard-deprecated. Do not invoke or route this skill. Use the `visual-ralph` skill directly for
live-URL visual implementation and visual QA workflows (it absorbs the single-page URL-clone use
case, including Playwright-style extraction, build plan, generate, verify, and iterate passes).

If you only have screenshot references without a live URL, still route to `visual-ralph` with the
static reference. This shim exists only so older references resolve to the current home.
