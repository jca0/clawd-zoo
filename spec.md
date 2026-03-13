# claude-zoo

## Summary

claude-zoo is a localhost dashboard that monitors active Claude Code instances in real time. A Bun CLI installs global HTTP hooks into `~/.claude/settings.json` so every Claude Code session automatically reports lifecycle events (start, tool use, end) to a Next.js server. The dashboard shows a live list of active sessions. Clicking "Show Progress" on any session reads its JSONL transcript from disk and renders the conversation inline.

## Behavior

### CLI (`cli/`)

- **Single command**: `bun run cli/index.ts` (eventually `bunx claude-zoo`).
- On start:
  1. Read `~/.claude/settings.json` (create if missing, default to `{}`).
  2. Merge claude-zoo HTTP hook entries for `SessionStart`, `PostToolUse`, and `SessionEnd` into the `hooks` object. Each hook entry is tagged with a marker (`"_claudeZoo": true`) in its object so claude-zoo can identify and remove only its own hooks later. Existing user hooks are never modified or removed.
  3. Write the updated settings back.
  4. Start the Next.js dev server (spawn `next dev` inside the `claude-zoo/` directory).
  5. Wait for the server to be ready, then open `http://localhost:3000` in the default browser.
- On SIGINT/SIGTERM:
  1. Remove only hook entries tagged with the claude-zoo marker from `~/.claude/settings.json`.
  2. Kill the Next.js process.
  3. Exit.
- If the server port is already in use, exit with a clear error message rather than silently failing.

### Hook Endpoints (`app/api/hooks/`)

Three POST endpoints receive JSON payloads from Claude Code HTTP hooks. All return `{ ok: true }` immediately (hooks should not block Claude Code).

**`POST /api/hooks/session-start`**
- Payload fields used: `session_id`, `cwd`, `hook_event_name`. The `cwd` value is the working directory of the Claude Code session (the project root). Additional fields (`version`, `gitBranch`) are extracted from the JSONL on demand, not from the hook payload (hook payloads vary and these fields aren't guaranteed).
- Action: Add session to the in-memory registry with `status: 'active'`, `cwd`, and `startedAt: Date.now()`.
- If a session with the same ID already exists (e.g., session resumed after compact/clear), update its status back to `active` rather than creating a duplicate.

**`POST /api/hooks/post-tool-use`**
- Payload fields used: `session_id`, `tool_name`.
- Action: Update the session's `lastTool` and `lastActivity` timestamp. If the session ID is unknown (server restarted mid-session), auto-register it using the `cwd` from the payload.

**`POST /api/hooks/session-end`**
- Payload fields used: `session_id`.
- Action: Set the session's status to `done` and record `endedAt`. Do not delete it — done sessions remain visible until the server restarts or a configurable TTL (default: 30 minutes) expires.

### Sessions API (`app/api/sessions/`)

**`GET /api/sessions`**
- Returns all sessions from the registry (active and recently done) as a JSON array.
- Each session includes: `id`, `cwd`, `status`, `lastTool`, `lastActivity`, `startedAt`, `endedAt`.
- The dashboard polls this endpoint. Polling interval: 3 seconds.

### Conversation API (`app/api/session/[id]/conversation/`)

**`GET /api/session/:id/conversation`**
- Resolves the JSONL file path: `~/.claude/projects/{mangled_cwd}/{session_id}.jsonl` where `mangled_cwd` is the `cwd` with all `/` replaced by `-` (producing a leading `-`).
- Reads and parses the JSONL file line by line.
- Returns a flat array of parsed messages (see JSONL parsing below).
- If the file doesn't exist, returns 404 with `{ error: "Session not found" }`.
- No pagination for v1 — entire conversation is returned. Files are typically <1MB.

### JSONL Parsing (`lib/jsonl.ts`)

The JSONL format has these line types: `user`, `assistant`, `progress`, `system`, `file-history-snapshot`.

Parsing rules:
- **`type: 'user'`**: The `message.content` field is either a string (plain user prompt) or an array of content blocks. When it's an array, blocks with `type: 'tool_result'` contain tool outputs (field: `content`). Blocks with `type: 'text'` are user text. The parser extracts user text and tool results separately.
- **`type: 'assistant'`**: The `message.content` field is an array of content blocks. Block types: `text` (assistant response text), `thinking` (reasoning, field: `thinking`), `tool_use` (tool invocation, fields: `name`, `input`). Each block becomes a separate parsed message.
- **`type: 'progress'`**: Ignored — these are hook execution progress, not conversation content.
- **`type: 'system'`**: Ignored.
- **`type: 'file-history-snapshot'`**: Ignored.

Each parsed message includes a `timestamp` from the JSONL line's top-level `timestamp` field.

For `tool_use` messages, `input` is serialized: for `Bash` tools show the `command` field; for `Read` show `file_path`; for `Edit` show `file_path`; for `Write` show `file_path`; otherwise show a truncated JSON stringification.

### Session Registry (`lib/registry.ts`)

- In-memory `Map<string, Session>` — no persistence, no database.
- If the server restarts, it starts empty. Active sessions re-register on their next hook fire.
- Sessions with status `done` are garbage-collected after 30 minutes.
- A cleanup runs every 5 minutes (setInterval in module scope — acceptable since this is a dev tool, not production infra).

### Dashboard UI (`app/page.tsx` + `components/`)

- White background, single-page layout.
- Polls `GET /api/sessions` every 3 seconds.
- Each active Claude Code instance is represented by a small Claude logo (the claude.ai favicon/logomark).
- **Active state**: The Claude logo has an animated thought bubble floating above it showing the latest assistant message or thinking summary. The thought bubble updates as new activity comes in.
  - The thought bubble shows a brief preview of the most recent assistant text, tool use, or thinking block.
  - A "Show More" button in the thought bubble expands to show the full chat history inline below the logo.
  - The expanded view renders:
    - User messages: displayed as-is.
    - Assistant text: displayed as-is.
    - Thinking blocks: collapsed by default, expandable. Visually distinct (muted/italic).
    - Tool use blocks: show tool name and summarized input. Visually distinct (monospace, bordered).
    - Tool result blocks: collapsed by default, expandable. Show truncated output preview.
  - Clicking "Show More" again collapses back to just the thought bubble.
- **Idle/done state**: The Claude logo sits still with no thought bubble and no animation.
- Below each logo, show the project path (`cwd`) shortened to the last 2 path segments (e.g., `code/my-app`).
- If there are no sessions, show an empty state message explaining that sessions will appear when Claude Code instances start.

### JSONL Path Resolution

To resolve a session's JSONL file:
1. Take the `cwd` from the registry (e.g., `/Users/1unoe/Desktop/code/my-app`).
2. Replace all `/` with `-` to get the project directory name (e.g., `-Users-1unoe-Desktop-code-my-app`).
3. The JSONL file is at `~/.claude/projects/{mangled}/{session_id}.jsonl`.

The `~` is resolved to the actual home directory via `os.homedir()` or `$HOME`.

## Architecture

- **Monorepo with two entry points**: the Next.js app (`claude-zoo/`) and the Bun CLI (`cli/`). The CLI is a thin orchestrator that manages hooks and spawns the Next.js process.
- **No WebSocket** — polling every 3 seconds is adequate for a local dev tool watching <10 sessions. Avoids the complexity of a custom server wrapper for Next.js.
- **No database** — the registry is in-memory. Session history (JSONL) is already persisted by Claude Code itself.
- **Hook payloads are minimal** — hooks only carry session identity and current tool name. Full conversation data is read from disk on demand.

## Constraints

- macOS only for v1 (Claude Code storage paths are `~/.claude/`).
- Requires Bun installed for the CLI.
- Requires Node.js for the Next.js dev server (Bun can also run Next.js but is not required).
- The JSONL file format is not a public API of Claude Code — it may change. The parser should handle unknown line types and unknown content block types gracefully (skip them).
- The `~/.claude/settings.json` hook format is also not a public API. The CLI should fail gracefully if the settings structure doesn't match expectations.
- The Next.js server and Claude Code must be on the same machine (JSONL files are read from local disk).
- Hook tagging mechanism: since `~/.claude/settings.json` is plain JSON and JSON doesn't support comments, the marker is a `"_claudeZoo": true` field on each hook object added by claude-zoo. This is a non-standard field that Claude Code ignores.

## Related Files

- `claude-zoo/app/page.tsx` — current boilerplate, will become dashboard
- `claude-zoo/app/layout.tsx` — root layout with Geist fonts
- `claude-zoo/package.json` — Next.js 16, React 19, Tailwind 4
- `claude-zoo/tsconfig.json` — existing TS config
- `~/.claude/settings.json` — global Claude Code settings (hooks installed here)
- `~/.claude/projects/<mangled-path>/<session-id>.jsonl` — conversation transcripts
