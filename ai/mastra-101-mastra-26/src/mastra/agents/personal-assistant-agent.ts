import { Agent } from '@mastra/core/agent';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { MCPClient } from '@mastra/mcp';
import { Memory } from '@mastra/memory';
import { isAbsolute } from 'node:path';

// The only folder the filesystem server may read and write. It must be absolute: mastra dev
// runs from src/mastra/public, so a relative ./notes would point to the wrong place
const notesDir = process.env.NOTES_DIR;
if (notesDir && !isAbsolute(notesDir)) {
  throw new Error('Set NOTES_DIR to the absolute path of your notes directory');
}

const mcp = new MCPClient({
  // A fixed id avoids duplicate clients when mastra dev hot-reloads this file
  id: 'personal-assistant-mcp',
  servers: {
    // Only connect to Zapier when both values are in .env; otherwise listTools() would fail
    // and the whole agent would stop loading
    ...(process.env.ZAPIER_MCP_URL && process.env.ZAPIER_MCP_API_KEY
      ? {
          zapier: {
            url: new URL(process.env.ZAPIER_MCP_URL),
            requestInit: {
              headers: {
                Authorization: `Bearer ${process.env.ZAPIER_MCP_API_KEY}`,
              },
            },
          },
        }
      : {}),
    // GitHub's hosted MCP server (Streamable HTTP). The course uses /mcp/; /mcp/readonly exposes only
    // the 27 read tools instead of 45, so the model never sees merge, push or delete
    ...(process.env.GITHUB_PERSONAL_ACCESS_TOKEN
      ? {
          github: {
            url: new URL('https://api.githubcopilot.com/mcp/readonly'),
            requestInit: {
              headers: {
                Authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
              },
            },
          },
        }
      : {}),
    // Local stdio server run with npx; no auth needed. Pinned (the course uses the latest
    // version) because it's a single-maintainer package that runs on this machine
    hackernews: {
      command: 'npx',
      args: ['-y', '@devabdultech/hn-mcp-server@1.2.2'],
    },
    // Official filesystem server, limited to notesDir: it rejects any path outside it.
    // The course uses pnpx; this project uses npm, so npx
    ...(notesDir
      ? {
          textEditor: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem@2.3.0', notesDir],
          },
        }
      : {}),
  },
});

// Connects to every server above and returns their tools, keyed as `<server>_<tool>`
const mcpTools = await mcp.listTools();

// Describe each tool group only when its server is connected: a prompt that mentions tools the
// agent doesn't have makes it pretend to use them
const isConnected = (server: string) =>
  Object.keys(mcpTools).some((name) => name.startsWith(`${server}_`));

const toolSections = [
  isConnected('zapier')
    ? `Gmail:
       - Use these tools for reading and categorizing emails from Gmail
       - You can categorize emails by priority, identify action items, and summarize content
       - You can also use this tool to send emails`
    : `Gmail: not connected yet. If asked to read or send emails, say so instead of pretending.`,
  isConnected('github')
    ? `GitHub:
       - Use these tools for monitoring and summarizing GitHub activity
       - You can summarize recent commits, pull requests, issues, and development patterns
       - Access is read-only: you cannot merge, push, comment or change anything
       - "My repo" or a repo name without an owner means a repo of the authenticated user:
         call github_get_me to get their login before searching, and never pick another
         owner's repo just because the name matches`
    : `GitHub: not connected yet. If asked about repositories, say so instead of pretending.`,
  isConnected('hackernews')
    ? `Hackernews:
       - Use this tool to search for stories on Hackernews
       - You can use it to get the top stories or specific stories
       - You can use it to retrieve comments for stories`
    : `Hackernews: not connected yet. If asked for tech news, say so instead of pretending.`,
  isConnected('textEditor')
    ? `Filesystem:
       - You also have filesystem read/write access to a notes directory.
       - You can use that to store info for later use or organize info for the user.
       - You can use this notes directory to keep track of to-do list items for the user.
       - Notes dir: ${notesDir}`
    : `Filesystem: not connected yet. If asked to save notes or to-dos, say so instead of pretending.`,
];

const memory = new Memory({
  storage: new LibSQLStore({
    id: 'learning-memory-storage',
    url: process.env.MASTRA_DB_URL!,
  }),
  vector: new LibSQLVector({
    id: 'learning-memory-vector',
    url: process.env.MASTRA_VECTOR_DB_URL!,
  }),
  // The course uses 'openai/text-embedding-3-small'; Gemini embeddings are on the free tier
  embedder: 'google/gemini-embedding-001',
  options: {
    // Keep last 20 messages in context
    lastMessages: 20,
    // Enable semantic search to find relevant past conversations
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    // Enable working memory to remember user information
    workingMemory: {
      enabled: true,
      template: `
      <user>
         <first_name></first_name>
         <username></username>
         <preferences></preferences>
         <interests></interests>
         <conversation_style></conversation_style>
       </user>`,
    },
  },
});

export const personalAssistantAgent = new Agent({
  id: 'personal-assistant',
  name: 'Personal Assistant',
  // A function, so the date is computed on every request instead of once at startup
  instructions: () => `
    Today is ${new Date().toISOString().slice(0, 10)}. Use it for "today", "this week" and similar.

    You are a helpful personal assistant that can help with various tasks such as email,
    monitoring github activity, scheduling social media posts, providing tech news,
    and managing notes and to-do lists.

    You have access to the following tools:

    ${toolSections.map((section, i) => `${i + 1}. ${section}`).join('\n\n    ')}

    You have access to conversation memory and can remember details about users.
    When you learn something about a user, update their working memory using the appropriate tool.
    This includes:
    - Their interests
    - Their preferences
    - Their conversation style (formal, casual, etc.)
    - Any other relevant information that would help personalize the conversation

    Always maintain a helpful and professional tone.
    Use the stored information to provide more personalized responses.

    Keep your responses concise and friendly.
  `,
  // The course uses 'openai/gpt-5.4'; we use the Gemini free tier (see README)
  model: 'google/gemini-3.5-flash-lite',
  tools: { ...mcpTools }, // Add MCP tools to your agent
  memory,
});
