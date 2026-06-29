import express from 'express';
import { GatewayConfig, MockDefinition } from '../utils/types';
import { RequestLogger } from '../middleware/logger';
import { createDashboardRouter } from '../dashboard/routes';
import { createMockRouter } from './router';
import { loadMocks } from '../mocks/loader';

export function createApp(config: GatewayConfig) {
  const app = express();
  const startTime = new Date();
  const logger = new RequestLogger(config.logCapacity);

  let definitions: MockDefinition[] = loadMocks(config.mockDir);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(logger.middleware());

  // Admin dashboard routes
  app.use(createDashboardRouter(logger, startTime, () => definitions.length));

  // Mock routes
  app.use(createMockRouter(definitions, config.chaosEnabled));

  // Reload handler
  const reload = () => {
    const newDefinitions = loadMocks(config.mockDir);
    definitions = newDefinitions;
    console.log(`[server] Reloaded ${definitions.length} mock definitions`);
  };

  return { app, reload };
}
