import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import {
  MastraStorageExporter,
  MastraPlatformExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { agent } from './agents/agent';
import { financialAgent } from './agents/financial-agent';
import { personalAssistantAgent } from './agents/personal-assistant-agent';
import { memoryAgent } from './agents/memory-agent';
import { learningAssistantAgent } from './agents/learning-assistant';
import { startScheduleTool, stopScheduleTool } from './tools/schedule-tools';

export const mastra = new Mastra({
  bundler: {
    externals: ['@duckdb/node-bindings'],
  },
  agents: { agent, financialAgent, personalAssistantAgent, memoryAgent, learningAssistantAgent },
  tools: { startScheduleTool, stopScheduleTool },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      // The template falls back to 'file:./mastra.db', which mastra dev resolves against src/mastra/public.
      // MASTRA_DB_URL is absolute, so this is the same file the agents' memory uses
      url: process.env.TURSO_DATABASE_URL || process.env.MASTRA_DB_URL || 'file:./mastra.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
