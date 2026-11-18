// Run with `npm run workflow:content`: tsx doesn't load .env on its own, and without MASTRA_DB_URL
// the agents' LibSQLStore crashes while ./mastra is being imported
import { mastra } from './mastra';

async function runContentWorkflow() {
  console.log('🚀 Running workflow programmatically...\n');

  try {
    // Get the workflow instance
    const workflow = mastra.getWorkflow('contentWorkflow');

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Create a run instance
    const run = await workflow.createRun();

    // Execute with test data
    const result = await run.start({
      inputData: {
        content:
          'Climate change is one of the most pressing challenges of our time, requiring immediate action from governments, businesses, and individuals worldwide.',
        type: 'blog',
      },
    });

    if (result.status === 'success') {
      console.log('✅ Success!');
      console.log('📊 Reading time:', result.result.metadata.readingTime, 'minutes');
      console.log('🎯 Difficulty:', result.result.metadata.difficulty);
      console.log('📅 Processed at:', result.result.metadata.processedAt);
    } else {
      // Not in the course: a step that throws doesn't reject start(), it returns status 'failed'
      console.error('❌ Workflow', result.status, result.status === 'failed' ? result.error : '');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exitCode = 1;
  }
}

// shutdown() flushes traces and closes storage. Importing ./mastra also loads every agent, and the
// Personal Assistant starts MCP servers (npx child processes) that keep Node alive, so exit after it
runContentWorkflow()
  .then(() => mastra.shutdown())
  .finally(() => process.exit());
