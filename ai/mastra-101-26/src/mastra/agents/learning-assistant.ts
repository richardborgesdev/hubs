import { Agent } from '@mastra/core/agent';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

// Create a specialized memory configuration for the learning assistant
const learningMemory = new Memory({
  storage: new LibSQLStore({
    id: 'learning-memory-storage',
    // Absolute path from .env: a relative file: URL resolves against src/mastra/public under mastra dev
    url: process.env.MASTRA_DB_URL!,
  }),
  vector: new LibSQLVector({
    // Required in Mastra 1.x; the course snippet omits it
    id: 'learning-memory-vector',
    url: process.env.MASTRA_VECTOR_DB_URL!,
  }),
  // The course uses 'openai/text-embedding-3-small'; Gemini embeddings are on the free tier
  embedder: 'google/gemini-embedding-001',
  // Skips the startup probe embedding (see memory-agent.ts)
  embeddingDimension: 3072,
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 3,
      messageRange: {
        before: 2,
        after: 1,
      },
    },
    // Same storage and default scope ('resource') as the other agents: a resource that also talks to
    // them gets its working memory rewritten in this template's format, and vice versa
    workingMemory: {
      enabled: true,
      template: `
# Learner Profile

## Personal Info
- Name:
- Learning Style: [Visual, Auditory, Reading/Writing, Kinesthetic]

## Learning Journey
- Current Topics:
  - [Topic 1]:
    - Skill Level: [Beginner, Intermediate, Advanced]
    - Started: [Date]
    - Goals:
    - Resources:
    - Progress Notes:
  - [Topic 2]:
    - Skill Level: [Beginner, Intermediate, Advanced]
    - Started: [Date]
    - Goals:
    - Resources:
    - Progress Notes:

## Session State
- Current Focus:
- Questions to Revisit:
- Recommended Next Steps:
`,
    },
  },
});

// Create the learning assistant agent
export const learningAssistantAgent = new Agent({
  id: 'learning-assistant',
  name: 'Learning Assistant',
  // A function, so the date is computed on every request: the template asks for a "Started" date,
  // and the model doesn't know today's date on its own (not in the course)
  instructions: () => `
    Today is ${new Date().toISOString().slice(0, 10)}. Use it for dates in your working memory.

    You are a personal learning assistant that helps users learn new skills and tracks their progress.

    ## Your Capabilities

    - You help users set learning goals and track their progress
    - You provide explanations and resources tailored to their skill level
    - You remember what topics they're learning and their progress in each
    - You adapt your teaching style to match their learning preferences

    ## Guidelines for Using Memory

    - When the user shares information about their learning style or preferences,
      update your working memory.

    - When the user asks about a topic they've mentioned before, use your semantic
      recall to provide continuity in your teaching.

    - When explaining concepts, check your working memory to understand their
      current skill level and provide an explanation at the appropriate depth.

    Always be encouraging and supportive. Focus on building the user's confidence
    and celebrating their progress.
  `,
  // The course uses 'openai/gpt-5.4'; we use the Gemini free tier (see README)
  model: 'google/gemini-3.5-flash-lite',
  memory: learningMemory,
});
