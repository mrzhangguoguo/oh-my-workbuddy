---
name: security-review
category: review
status: deprecated
description: Deprecated standalone security review skill. Use `code-review` when security concerns are in scope.
agent_created: true
triggers: ["security review", "security audit", "vulnerability review"]
---

> Ported from oh-my-codex `security-review`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Security Review — deprecated

Hard-deprecated. Do not invoke or route this skill.

When security concerns are in scope, invoke the `code-review` skill (`skill: code-review`) and ask it to emphasize security/OWASP checks (injection, authn/authz, secrets, input validation, dependency CVEs). The `code-review` skill runs inside WorkBuddy with no `omx` binary and no `.omx/` directory.
