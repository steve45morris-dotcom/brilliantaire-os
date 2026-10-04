# Knowledge: notes

The Knowledge page keeps each user's notes: decisions, ideas, checklists, anything worth
remembering. A note has a title, a body (up to 20,000 characters), an optional project and a pin.

- **List and search** (`GET /api/knowledge?q=`): pinned notes first, then the most recently
  changed, at most 200. A search keeps notes whose title or body contains the text. It ignores
  case, and characters like `%` are matched literally.
- **Add** (`POST /api/knowledge`), **change** (`PATCH /api/knowledge/[id]`: only the fields sent;
  `projectId: null` removes the link) and **delete** (`DELETE /api/knowledge/[id]`).
- **Read one** (`GET /api/knowledge/[id]`).
- **Limits:** 2,000 notes per user.
- **Projects:** deleting a project keeps its notes and removes the link.
- **Unsaved changes:** the page asks before switching notes and losing them.

All of these routes accept personal access tokens (see `API_TOKENS.md`).

## How it's stored

Notes live in `memory_entries`, a table from migration 09 that nothing used until now.
`supabase/migrations/26_knowledge_notes.sql` adds its title, project, pin and update time, and
these functions:

- `create_note`, `update_note` and `delete_note` check that the note and any project belong to the
  caller. Someone else's note or project, and a missing one, give the same "not found" (404).
- `search_notes` runs as the caller, so row-level security limits it to their own notes.
- Users have no direct insert, update or delete rights on the table.

## Setup

Apply `26_knowledge_notes.sql` after 25 before deploying this version, or the Knowledge page can't
load.
