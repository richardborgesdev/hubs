# Mastra 101: AI Agent Builder Course · Mastra · 2026

Hands-on project for [Mastra 101](https://mastra.ai/course), the free course by Mastra. The course is led by an MCP agent inside the editor: the `mastra` MCP server (configured in [`.mcp.json`](./.mcp.json)) exposes the course tools, and the coding agent walks you through each lesson writing code in this project.

## Lessons
- [x] 1. Build your first agent: what Mastra is, verifying the installation (2026-11-17)
- [ ] 2. Adding tools and MCP: what MCP is, installing it, MCP configuration
- [ ] 3. Adding memory: why memory matters, installing it
- [ ] 4. Building workflows: steps, creating your first step

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
