import { Agent } from '@mastra/core/agent';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

// Memory with conversation history and semantic recall
const memory = new Memory({
  storage: new LibSQLStore({
    id: 'learning-memory-storage',
    // Absolute path from .env: a relative file: URL resolves against src/mastra/public under mastra dev
    url: process.env.MASTRA_DB_URL!,
  }),
  // Stores message embeddings for semantic recall. Absolute path from .env, like the storage above
  vector: new LibSQLVector({
    id: 'learning-memory-vector',
    url: process.env.MASTRA_VECTOR_DB_URL!,
  }),
  // The course uses 'openai/text-embedding-3-small'; Gemini embeddings are on the free tier
  embedder: 'google/gemini-embedding-001',
  // gemini-embedding-001 returns 3072 dimensions. Setting it skips the probe embedding Memory
  // would otherwise make on startup (one less call against the 1K requests/day free quota)
  embeddingDimension: 3072,
  options: {
    // Include the last 20 messages in the context instead of the default 10.
    // Tool calls and tool results count as messages too
    lastMessages: 20,
    semanticRecall: {
      // Retrieve the 3 most similar messages (default 4)
      topK: 3,
      // Include 2 messages before and 1 after each match, so the agent sees what it was answering
      messageRange: {
        before: 2,
        after: 1,
      },
      // Search every thread of this resource. It's the default, but explicit because it also reaches
      // messages other agents saved under the same resource in the same vector store
      scope: 'resource',
      // The course also sets filter: { projectId: { $eq: 'project-a' } }. Skipped: our threads have
      // no projectId metadata, so that filter would match nothing and silently disable recall
    },
    // Lets the agent keep a block of facts about the user, injected into every prompt.
    // Scope defaults to 'resource', so "Session State" is shared by every thread of the user too.
    // Template mode replaces the whole block on each update: agents that share a resource and
    // storage must use the same template, or each one rewrites the other's block in its own format
    workingMemory: {
      enabled: true,
      template: `
# User Profile

## Personal Info
- Name:
- Location:
- Timezone:
- Occupation:

## Preferences
- Communication Style:
- Topics of Interest:
- Learning Goals:

## Project Information
- Current Projects:
  - [Project 1]:
    - Deadline:
    - Status:
  - [Project 2]:
    - Deadline:
    - Status:

## Session State
- Current Topic:
- Open Questions:
- Action Items:
`,
    },
  },
});

// Create an agent with memory
export const memoryAgent = new Agent({
  id: 'memory-agent',
  name: 'MemoryAgent',
  instructions: `
    You are a helpful assistant with advanced memory capabilities.
    You can remember previous conversations and user preferences.

    IMPORTANT: You have access to working memory to store persistent information about the user.
    When you learn something important about the user, update your working memory according to the template.

    Always refer to your working memory before asking for information the user has already provided.
    Use the information in your working memory to provide personalized responses.

    When the user shares personal information such as their name, location, or preferences,
    acknowledge it and update your working memory accordingly.
  `,
  // The course uses 'openai/gpt-5.4'; we use the Gemini free tier (see README)
  model: 'google/gemini-3.5-flash-lite',
  memory: memory,
});
