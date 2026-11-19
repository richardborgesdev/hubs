import { Agent } from '@mastra/core/agent';

export const contentAgent = new Agent({
  // Required in Mastra 1.x; the course snippet omits it
  id: 'content-agent',
  name: 'Content Agent',
  description: 'AI agent for analyzing and improving content',
  instructions: `
    You are a professional content analyst. Your role is to:
    1. Analyze content for clarity and engagement
    2. Identify the main themes and topics
    3. Provide a quality score from 1-10
    4. Suggest specific improvements

    Always provide constructive, actionable feedback.
  `,
  // The course uses 'openai/gpt-5.4'; we use the Gemini free tier (see README)
  model: 'google/gemini-3.5-flash-lite',
});
