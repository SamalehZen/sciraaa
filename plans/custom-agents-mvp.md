# Custom Agents MVP — Plan

## Issues to Address
- Users need to define lightweight, private “Custom Agents” consisting of:
  - A name, description, and required system prompt
  - Optional user-provided .txt knowledge files used as in-context reference
- Agents are private per-user; no tool execution for MVP; Gemini default model only
- Integrate agent execution into existing chat/search streaming pipeline

## Important Notes
- Visibility fixed to `private` (no other modes in MVP)
- File constraints:
  - Only `.txt`
  - Per-file cap: 200 KB
  - Total per-agent cap: 1 MB
- Execution context cap: first 200 KB of concatenated `.txt` files
- Prompt-injection guard: treat uploaded text as untrusted; redact phrases like “ignore system prompt”
- Observability: log execution metadata (duration, status, token usage if available, total context bytes)

## Implementation Strategy
1) Data model and migrations (Drizzle)
- Tables:
  - `custom_agent` (id, user_id, name, description, system_prompt, visibility, created_at, updated_at)
  - `agent_knowledge_file` (id, agent_id, title, blob_url, size_bytes, created_at)
  - `agent_execution` (id, agent_id, user_id, chat_id, input, output_summary, tokens, duration_ms, status, created_at)
- Add SQL migration to `drizzle/migrations/0008_minimal_custom_agents.sql`
- Add schema to `lib/db/schema.ts`

2) DB accessors (`lib/db/queries.ts`)
- CRUD for agents with ownership checks
- Knowledge file add/list/delete with ownership enforced
- `logAgentExecution` for minimal run logging

3) API endpoints (Next.js App Router)
- `app/api/agents/route.ts`: GET (list), POST (create)
- `app/api/agents/[id]/route.ts`: GET (one + files), PATCH (update), DELETE (remove)
- `app/api/agents/upload/route.ts`: POST `.txt` upload via Vercel Blob, DELETE to remove file
  - Enforce type and size caps; enforce per-agent total cap
- `app/api/agents/[id]/execute/route.ts`: streaming execution using Gemini + `createUIMessageStream`
  - Build system = systemPrompt + capped, sanitized knowledge excerpt
  - On finish, log to `agent_execution`

4) Search/Chat integration
- Add `getCustomAgentConfig(agentId)` in `app/actions.ts` returning `{ instructions, tools: [] }`
- Extend `/app/api/search/route.ts` to accept `{ group: 'custom', agentId }` and build instructions via `getCustomAgentConfig`
- Extend `SearchGroupId` with `'custom'`

5) UI
- Pages:
  - `/agents`: list current user’s agents with create/edit links
  - `/agents/new`: create form (name, description, systemPrompt, optional .txt upload)
  - `/agents/[id]`: edit form + file manager (list, add, delete)
- Chat integration:
  - Add an Agent selector (dropdown) in the chat toolbar
  - When an agent is selected, next send uses `{ group: 'custom', agentId }`
  - Show a small badge: “Agent: {name}”

6) AuthZ & Security
- Ownership checks on every agent/knowledge/file operation
- Visibility always `private`
- File type/size validation on upload; total-per-agent cap
- Prompt injection guard when inlining knowledge

7) Observability
- `agent_execution` log on completion (status, duration, tokens if available)
- Execution endpoint notes when context cap hits

## Tests
- API unit-ish: 
  - Agent CRUD with ownership checks
  - Upload validation (.txt only, size caps) and deletion
- Integration (minimal): 
  - `/api/search` with `{ group: 'custom', agentId }` streams and returns text using custom instructions

Non-goals (MVP): tools execution, web/connectors search, per-agent model override, sharing/public visibility, versioning UI, embeddings.
