---
name: tdd
category: build
status: deprecated
description: Deprecated TDD shim. Keep test-first discipline inside the active implementation workflow (folded into `plan`).
agent_created: true
triggers: ["tdd", "test driven development", "test first"]
---

> Ported from oh-my-codex `tdd`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# TDD — deprecated

Hard-deprecated as a standalone skill. Do not invoke or route this skill.

Keep test-first discipline inside the active implementation workflow (the `plan` skill and normal implementation flow). The discipline is the value; here it is for reference:

**The Iron Law:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST. Write code before the test? Delete it and start over.

**Red-Green-Refactor cycle:**
1. **RED** — Write the next failing test; run it; it MUST fail. If it passes, the test is wrong.
2. **GREEN** — Write only enough code to pass. No extras. Run; it MUST pass.
3. **REFACTOR** — Improve quality; run tests after every change; must stay green.
4. **REPEAT** — Next failing test.

**Enforcement:** code-before-test → stop and write the test; test-passes-first → fix it to fail; multiple features per cycle → one test, one feature; skipping refactor → go back and clean up.

For durable multi-goal execution that should keep this discipline, use `ultragoal`; for the implementation workflow itself, use `plan`.
