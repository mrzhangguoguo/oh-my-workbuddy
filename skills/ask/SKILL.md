---
name: ask
description: Ask a locally installed external advisor CLI (Claude or Gemini) for focused questions, reviews, brainstorming, or second opinions, and capture a reusable artifact. Use when the user wants a Claude/Gemini second opinion, "ask claude", or "ask gemini".
agent_created: true
triggers: ["ask claude", "ask gemini", "ask an advisor", "second opinion", "external review"]
---

> Ported from oh-my-codex `ask`. OMX runtime conventions (`$macro` invocation, `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Ask (Local Advisor CLI)

Use a locally installed external advisor CLI for focused questions, reviews, brainstorming, or second opinions. This skill replaces the separate `ask-claude` and `ask-gemini` skills.

## Usage

Invoke with a backend and a question or task, for example:

```
ask claude <question or task>
ask gemini <question or task>
```

## Backend selection

- Use `claude` when the user asks for Claude, Anthropic, or the previous `ask-claude` behavior.
- Use `gemini` when the user asks for Gemini or the previous `ask-gemini` behavior.
- If no backend is specified, choose the installed backend that best matches the user request; if neither is clearly available, explain that a local CLI is required.

## Local CLI commands

Claude:

```bash
claude -p "{{ARGUMENTS}}"
```

Gemini:

```bash
gemini -p "{{ARGUMENTS}}"
```

If needed, adapt to the user's installed CLI variant while keeping local execution as the default path. Do not silently switch to an MCP or remote provider when the local binary is missing.

## Artifact requirement

After local execution, save a markdown artifact under a project-relative path:

```text
.omw/ask/ask-<backend>-<slug>-<timestamp>.md
```

Minimum artifact sections:
1. Original user task
2. Backend and final prompt sent to the CLI
3. Raw CLI output
4. Concise summary
5. Action items / next steps

Task: {{ARGUMENTS}}
