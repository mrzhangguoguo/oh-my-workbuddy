---
name: retro
description: Run a concise post-task retrospective that captures what worked, what didn't, and durable lessons-learned. This skill should be used when a task is complete and the user wants to record improvements or feed learnings back into the wiki.
agent_created: true
triggers: ["retro", "retrospective", "lessons learned", "what went well", "post-mortem"]
---

# Retro

Short, forward-looking retrospective. Captures learnings, not blame.

## Steps
1. Recap what was delivered and how it was verified.
2. What went well (keep doing).
3. What didn't (root cause, not symptom).
4. Concrete improvements: process, tooling, or docs.
5. Optionally persist durable lessons to the `wiki` (`omw_wiki/decision-*.md`).

## Output shape
```
## Delivered
- <outcome> (verified by <evidence>)

## Kept
- <practice>

## Fixed
- <issue> -> <root cause> -> <change>

## Action items
- [ ] <owner>: <action>
```

## Constraints
- No performance reviews of people; review the work and the system.
- Keep it under a page; link details to the wiki if needed.
