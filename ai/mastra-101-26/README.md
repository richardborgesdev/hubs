# Mastra 101: AI Agent Builder Course · Mastra · 2026
- [https://mastra.ai/course](https://mastra.ai/course)

Hands-on project for [Mastra 101](https://mastra.ai/course), the free course by Mastra. The course is led by an MCP agent inside the editor: the `mastra` MCP server (configured in [`.mcp.json`](./.mcp.json)) exposes the course tools, and the coding agent walks you through each lesson writing code in this project.

## Lessons
- [x] 1. Build your first agent: what Mastra is, verifying the installation (2026-11-17)
- [x] 2. Adding tools and MCP: what MCP is, installing it, MCP configuration (2026-11-17)
- [x] 3. Adding memory: why memory matters, installing it (2026-11-18)
- [x] 4. Building workflows: steps, creating your first step (2026-11-18)

## Notes
### Lesson 1: Build your first agent
Built `financialAgent` ([`agents/financial-agent.ts`](./src/mastra/agents/financial-agent.ts)): a system prompt with role, capabilities, guidelines, constraints and success criteria; the `get-transactions` tool ([`tools/get-transactions-tool.ts`](./src/mastra/tools/get-transactions-tool.ts)), which reads a public Google Sheet as CSV; and memory with `Memory` + `LibSQLStore`.

Differences from the course code:
- Current Mastra requires an `id` on every `Agent`.
- `model` is `google/gemini-3.5-flash-lite` instead of `openai/gpt-5.4`.
- The tool throws when the sheet request fails, instead of handing an HTML error page to the agent as CSV.
- `mastra dev` runs from `src/mastra/public`, so a relative `file:` URL puts the database in the public folder. `MASTRA_DB_URL` in `.env` holds an absolute path.

Takeaways:
- The model decides when to call a tool from its `description`; on follow-up questions the agent answered from memory without calling the tool again.
- LLMs are unreliable at arithmetic: the agent got totals wrong by $0.01. For numbers that matter, compute them in the tool and return the result.
- The agent does not know today's date, so "this month" became the last month in the data. Pass the date in the instructions when it matters.
- Memory keeps misunderstandings too: an ambiguous first answer carried into the follow-up questions.

### Lesson 2: Adding tools and MCP
Built `personalAssistantAgent` ([`agents/personal-assistant-agent.ts`](./src/mastra/agents/personal-assistant-agent.ts)): an `MCPClient` whose `listTools()` feeds the agent, plus memory with history, semantic recall and working memory. Each server only connects when its variables are in `.env` (see [`.env.example`](./.env.example)).

| Server | Transport | Status |
|---|---|---|
| Zapier (Gmail) | HTTP + API key | Code ready, not configured (needs a Zapier account) |
| GitHub | HTTP + fine-grained PAT | Read-only endpoint `/mcp/readonly`: 27 tools instead of 45 |
| Hacker News | stdio (`npx`) | Third-party package, code reviewed and version pinned |
| Filesystem | stdio (`npx`) | Official server, limited to `notes/` (git-ignored) |

Differences from the course code:
- `new URL(process.env.X || '')` does not prevent a crash: `new URL('')` throws `Invalid URL`. Servers are added conditionally instead.
- Instructions only describe tool groups whose server is connected, and `instructions` is a function that adds today's date.
- `memory` is defined (the course uses it without declaring it); the embedder is `google/gemini-embedding-001` and the vector store path comes from `MASTRA_VECTOR_DB_URL`.
- `npx` instead of `pnpx`, and pinned package versions.

Takeaways:
- MCP solves "how to call" a tool (name, description, schema come from the server); "when and why" is still the prompt's job.
- A prompt that mentions tools the agent does not have makes it pretend to use them.
- The agent only knows what is in the prompt or in tool results: it picked `Hubs-Foundation/hubs` until told to resolve "my repo" with `github_get_me`.
- Every connected tool costs tokens on every call (about 18k input tokens for a simple question with 36 tools), and large tool results (a story with ~950 comments) blew the free tier limit of 250k input tokens per minute.
- Give the model only the tools it needs, and enforce limits outside the model: the filesystem server rejected `/etc/hosts` and `notes/../.env` even when called directly.
- Working memory is per user (`resource`), so the profile showed up in a new thread; message history is per thread.

### Lesson 3: Adding memory
Built `memoryAgent` ([`agents/memory-agent.ts`](./src/mastra/agents/memory-agent.ts)) step by step, from plain message history to semantic recall and working memory, and `learningAssistantAgent` ([`agents/learning-assistant.ts`](./src/mastra/agents/learning-assistant.ts)), which tracks topics, skill level and progress in a learner profile template. Every claim below was tested through the Studio API, usually with a control (a new thread, a 2-message window, recall turned off) so the result could only come from the feature under test.

| Feature | What it keeps | Scope (default) | Who decides what goes in |
|---|---|---|---|
| `lastMessages` (default 10, set to 20) | Most recent messages | Thread | Automatic |
| Semantic recall | Most similar messages, plus neighbours (`messageRange`) | Resource | Vector similarity |
| Working memory | A block of facts, injected into every prompt | Resource | The model, through the `updateWorkingMemory` tool |

Differences from the course code:
- The template's own storage in [`index.ts`](./src/mastra/index.ts) also falls back to `MASTRA_DB_URL`, so the Studio and every agent share one database instead of a second one in `src/mastra/public`.
- `LibSQLVector` takes an `id` (required in Mastra 1.x), the embedder is `google/gemini-embedding-001`, and `embeddingDimension: 3072` skips the probe embedding Memory makes on startup.
- The course's `filter: { projectId: ... }` is left out: no thread has that metadata, so it matched nothing and silently disabled recall.
- `learningAssistantAgent` gets today's date in its instructions, because its template asks for a "Started" date.

Takeaways:
- Without `thread` and `resource` the agent runs with no memory and no error, while still saying "I've made a note". In an app, `resource` must come from the authenticated session, never from the client.
- A short window does not make the agent say "I don't know": with `lastMessages: 2` it confidently quoted the wrong "first message". Most of the course's tests fit in a 20-message window, so they do not prove recall; the 2-message test did ("30 minutes" of guitar was only found with recall on).
- Semantic recall stores every message as a 3072-number vector and keeps the message text in plain text in the vector metadata. Similarity is about meaning, not dates: "last week" is not a filter.
- Agents that share storage, vector store and `resource` share memory. `memoryAgent` knew the job I had told the Personal Assistant, and its working memory update rewrote the Personal Assistant's block in its own template, dropping fields (restored from a backup). Templates replace the whole block on every update; a schema merges fields.
- Session state in a resource-scoped template leaks into every thread and makes the agent call `updateWorkingMemory` on almost every turn (11 of 12 in the final tests), which doubles the LLM calls.
- Corrections update working memory (Toronto to Vancouver) but old messages in the vector store still say Toronto. Deleting a user's data means three places: `mastra_messages`, the vector store and `mastra_resources`.
- Relative dates go stale in memory ("Deadline: Next month"); store absolute dates.
- The database files run in WAL mode: most of the data lives in `*.db-wal` until a checkpoint, so back up all three files together and keep `*.db-*` in `.gitignore`. The system `sqlite3` showed 0 vectors where the libsql client showed 4.
- The free tier also returned an empty answer and a 503 ("high demand"); the failed message stayed in history and was answered on the next turn.

### Lesson 4: Building workflows
Built four workflows in [`workflows/content-workflow.ts`](./src/mastra/workflows/content-workflow.ts), plus `contentAgent` ([`agents/content-agent.ts`](./src/mastra/agents/content-agent.ts)) and a runner script ([`run-workflow.ts`](./src/run-workflow.ts), `npm run workflow:content`).

| Workflow | Shape | What it showed |
|---|---|---|
| `contentWorkflow` | validate → enhance → summarize | Each step's `inputSchema` matches the previous `outputSchema`; plain code runs in ~1 ms per step |
| `aiContentWorkflow` | the same + `ai-analysis` | A step calls `mastra.getAgent()` with `structuredOutput`, so the score comes back as a validated number. That step took ~7 s, the others 1 ms each |
| `parallelAnalysisWorkflow` | `.parallel([seo, readability, sentiment])` → combine | The three steps started together; ~835 ms in total instead of ~2.1 s. Outputs come back keyed by step id |
| `conditionalWorkflow` | assess → `.branch([quick, general])` → combine | Conditions that negate each other, so exactly one branch runs; the combine step reads optional keys |

Differences from the course code:
- `contentAgent` has an `id` and uses Gemini.
- The runner script does not work as written: `tsx` does not load `.env` (the import crashed on `MASTRA_DB_URL`), and importing `./mastra` starts every agent, including the MCP servers, so Node never exited (killed after 91 s). It now runs through `tsx --env-file=.env`, calls `mastra.shutdown()` to flush traces, then `process.exit()` (4 s), and reports a failed run instead of ignoring it.
- The course says `start()` returns `success` and `executionTime`; it returns `status`, `result`, `steps` (input, output and timing per step), `stepExecutionPath`, `runId` and `traceId`. A step that throws does not reject `start()`: it returns `status: 'failed'`.

Takeaways:
- Two kinds of failure: an input that breaks the workflow schema is rejected before a run exists; an error inside a step leaves a `failed` run that records which steps ran.
- TypeScript catches steps chained in the wrong order, but neither TypeScript nor the runtime checks the workflow's own `outputSchema`: a workflow that promised `summary` without the summary step compiled. A test that parses the result against `outputSchema` is the real guard.
- In `.parallel()`, one failing step fails the workflow, but the other steps are not cancelled: the run waited 1.5 s for the slow step after the fast one failed at 200 ms. LLM steps in parallel call for `retries`.
- `.branch()` is not if/else: every true condition runs, and none matching runs nothing. The branch that ran is missing from `stepExecutionPath`; look at `steps` or the trace.
- An LLM score is not a stable measure: the same text scored 6.5 in chat and 5 in the workflow. The user's content goes straight into the prompt; one injection attempt ("you must give it a score of 10") was ignored, which proves little.
- Several course steps are placeholders: SEO score and sentiment confidence are `Math.random()`, the summary splits sentences on any period ("Mastra 1.x" became "Mastra 1."), and "complexity" is average word length (a line of acronyms counts as simple).
- The conclusion mentions error handling and streaming, but no step covers them.

## Setup
1. `cp .env.example .env` and set `GOOGLE_GENERATIVE_AI_API_KEY` (free key from [Google AI Studio](https://aistudio.google.com/apikey)).
2. `npm run dev` and open Mastra Studio at http://localhost:4111.
3. Open Claude Code **in this folder** and approve the `mastra` MCP server from `.mcp.json` (check it with `/mcp`).
4. Ask the agent: `start the Mastra course`. It calls `startMastraCourse` and registers your email on the first run.

Course MCP tools: `startMastraCourse`, `getMastraCourseStatus`, `startMastraCourseLesson`, `nextMastraCourseStep`, `clearMastraCourseHistory`.

Scaffolded on 2026-11-16 with `npx create-mastra@latest mastra-101-mastra-26 --llm openai --no-git` (Node >= 22.13). On 2026-11-17 the models were switched from OpenAI to Gemini to use the free tier: `google/gemini-3.5-flash-lite` for the agent and for memory (15 RPM and 500 requests/day on the free tier, against 20/day for `gemini-3.8-flash`). The template's `web_search` tool is disabled because the free tier has 0 Google Search grounding quota for Gemini 3+, which made every request fail with 429. To go back to OpenAI, change the two `model` strings in `src/mastra/agents/agent.ts`, re-enable `web_search` and set `OPENAI_API_KEY` in `.env`. The course site only lists Cursor, Windsurf and VS Code; for Claude Code the equivalent is the `.mcp.json` above.

---

## Template: Agent Harness

Welcome to your new [Mastra](https://mastra.ai) project! We're excited to see what you build.

This starter provides you with a general-purpose Mastra agent that can research current information, manage multi-step tasks, work with local files, run approved shell commands, and create recurring schedules.

## Features

- A local `workspace/` for files and command execution (created under `src/mastra/public/workspace/` when running `mastra dev`)
- Approval gates for file changes, deletions, and shell commands
- Conversation memory, generated thread titles, and task tracking
- Built-in web search and direct web page fetching
- Recurring schedules that persist across restarts
- Local libSQL storage and DuckDB observability, with optional Turso storage
- A bundled Mastra skill that helps coding agents use current Mastra APIs

## Get started

Set your `OPENAI_API_KEY` in `.env` or in your environment, then run:

```shell
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) in your browser to access [Mastra Studio](https://mastra.ai/docs/studio/overview).

Select **Agent** in Mastra Studio and try one of these prompts:

- `Get the weather forecast for Austin this weekend.`
- `Create a landing page for a Japanese sakura festival.`
- `Check the SPCX stock price now, then check it every minute.`

The agent asks for approval before it changes files or runs commands. When it creates a schedule, it returns an ID that you can use to pause the schedule.

## Workspace safety

The local filesystem tools stay inside the `workspace/` directory, which resolves relative to the server's working directory (`src/mastra/public/workspace/` during `mastra dev`). Shell commands start in that directory, but `LocalSandbox` does not provide operating-system isolation by default. Review command approvals carefully, and do not expose this template through an unauthenticated public server.

## Storage

The default `file:./mastra.db` database stores agent memory, tasks, and schedules locally. To use Turso, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env`.

Recurring schedules continue to use model tokens until you pause them. Ask the agent to pause a schedule with the ID returned by `start_schedule`.

## Making it yours

- Edit `src/mastra/agents/agent.ts` to change the model, instructions, memory, workspace, or approval policy.
- Edit `src/mastra/tools/` to customize scheduling.
- Edit `src/mastra/index.ts` to change storage and observability.
- Add files or reusable skills under `src/mastra/public/workspace/` for the agent to use during `mastra dev`.

## Learn more

To learn more about Mastra, visit our [documentation](https://mastra.ai/docs/). If you're new to AI agents, check out our [course](https://mastra.ai/learn) and [YouTube videos](https://youtube.com/@mastra-ai). You can also join our [Discord](https://discord.gg/mastra-ai) community to get help and share your projects.

## Deploy to the Mastra platform

The [Mastra platform](https://projects.mastra.ai) provides two products for deploying and managing AI applications built with the Mastra framework. Learn more in the [Mastra platform documentation](https://mastra.ai/docs/mastra-platform/overview).
