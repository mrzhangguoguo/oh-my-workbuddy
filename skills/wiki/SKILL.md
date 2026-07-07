---
name: wiki
description: 'Persistent markdown project wiki with keyword + tag search, lifecycle capture, and cross-references. Triggers: "wiki add", "wiki query", "wiki read", "wiki lint", "wiki delete", "project wiki", "add to wiki".'
agent_created: true
triggers: ["wiki add", "wiki query", "wiki read", "wiki lint", "wiki delete", "project wiki", "add to wiki"]
---

> Ported from oh-my-codex `wiki`. OMX runtime conventions (`$macro` invocation,
> `omx` CLI, `.omx/` state directory) are replaced with WorkBuddy idioms
> (Skill tool, Agent tool, task list, `.workbuddy/memory`).

# Wiki

Persistent, self-maintained markdown knowledge base for project and session knowledge. There is
no `omx` binary; every operation below is implemented with the WorkBuddy file tools (Write, Read,
Edit, Grep, Glob, Bash). The wiki lives under `.omw/wiki/` so it is co-located with other
WorkBuddy artifacts and easy to gitignore or commit as desired.

## Storage layout

- Pages: `.omw/wiki/<slug>.md`
- Index: `.omw/wiki/index.md`
- Log: `.omw/wiki/log.md`

`<slug>` is a kebab-case page id derived from the title (e.g. `auth-architecture`).

## Categories

`architecture`, `decision`, `pattern`, `debugging`, `environment`, `session-log`, `reference`,
`convention`

## Operations

### Add / Ingest a page

1. Derive the slug from the title.
2. Write `.omw/wiki/<slug>.md` with this shape:

   ```markdown
   ---
   title: <Title>
   category: <category>
   tags: [tag1, tag2]
   created: <YYYY-MM-DD>
   updated: <YYYY-MM-DD>
   ---

   <content in markdown>
   ```

3. Append a one-line entry to `.omw/wiki/index.md`:
   `- [<Title>](<slug>.md) — <category> — tags: tag1, tag2`
4. Append to `.omw/wiki/log.md`: `<YYYY-MM-DD> ADD <slug> (<category>)`.

Use the Write tool for new pages. For an existing page, use Edit to update `content` and bump
`updated:`.

### Query

Keyword + tag search (no vector embeddings — exact substring/tag match only):

- By tag/category: `Grep` for `tags:.*<tag>` or `category: <category>` across `.omw/wiki/`.
- By keyword: `Grep` for the phrase across `.omw/wiki/*.md` (use `output_mode: files_with_matches`).
- Read `index.md` first for a fast directory of all pages.
- When multiple candidates match, open the most relevant page with Read and summarize to the user.

### Lint

Check the wiki for consistency:

- Every page under `.omw/wiki/*.md` (except `index.md`/`log.md`) has valid frontmatter
  (`title`, `category`, `tags`).
- Every `index.md` entry points to a page that exists; every page is listed in `index.md`.
- `[[page-name]]` wiki-links resolve to an existing `<slug>.md`.
- Report or fix (via Edit) any orphan pages, missing index entries, or broken links.

### Read

Open `.omw/wiki/<slug>.md` with Read and present the content. Resolve any `[[page-name]]`
cross-references by linking to the corresponding `<slug>.md`.

### Delete

1. Delete `.omw/wiki/<slug>.md` (Bash `rm`).
2. Remove its line from `index.md` (Edit).
3. Append to `log.md`: `<YYYY-MM-DD> DELETE <slug>`.

### Refresh

Rebuild `index.md` from the current set of pages (useful after many manual edits): list
`.omw/wiki/*.md`, parse each page's frontmatter, and regenerate the index entries.

## Cross-References

Use `[[page-name]]` wiki-link syntax inside page content to create cross-references between
pages. During lint/read, resolve `[[page-name]]` to the matching `<slug>.md` (match on title or
slug).

## Auto-Capture

At session end, you may capture discoveries as `session-log-*` pages (category `session-log`)
following the Add steps above. Do this proactively when the user learned something durable
(debugging fix, environment quirk, decision rationale). No config file is required — just follow
the Add workflow.

## Hard Constraints

- No vector embeddings — query uses keyword + tag matching only.
- Wiki files are repository project knowledge under `.omw/wiki/`; treat them as the canonical
  knowledge base for the project.
