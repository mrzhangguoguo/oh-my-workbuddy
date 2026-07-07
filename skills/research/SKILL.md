---
name: research
description: Run a structured deep-research workflow with outline generation, parallel source gathering, and a cited report. This skill should be used when the user needs verified, well-sourced findings on a topic before planning or implementation.
agent_created: true
triggers: ["research", "deep research", "find out", "gather sources", "literature review"]
---

# Research

Structured investigation that ends in a cited, decision-ready report.

## Steps
1. Clarify the question and the decision it supports (use `deep-interview` if fuzzy).
2. Generate a 4-7 point outline of what must be known.
3. For each point, gather sources: official docs first, then reputable references.
4. Extract claims + citations; separate fact from opinion.
5. Synthesize; flag uncertainty and conflicting sources.
6. Output the report with inline citations and a "what's still unknown" section.

## Output shape
```
## Question
<the decision this informs>

## Findings
- <claim> — [source](url)
## Conflicts / uncertainty
- <topic>: <disagreement>
## Recommended next step
<plan | ultragoal>
```

## Constraints
- Prefer primary/official sources; note the retrieval date.
- Do not fabricate URLs or attributes. If a claim is unverified, label it.
- Feed findings into `plan` for architecture synthesis.
