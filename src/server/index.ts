import { loadConfig } from '../utils/config';
import { createApp } from './app';

const config = loadConfig();

const portEnv = process.env.PORT;
if (portEnv !== undefined && portEnv !== '') {
  const parsed = parseInt(portEnv, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    console.error(`[server] Invalid PORT value: ${portEnv}`);
    process.exit(1);
  }
  config.port = parsed;
}

const { app, reload } = createApp(config);

const server = app.listen(config.port, () => {
  console.log(`[server] API Mock Gateway listening on port ${config.port}`);
});

// Handle SIGHUP for hot reload
process.on('SIGHUP', () => {
  console.log('[server] Received SIGHUP, reloading mocks...');
  reload();
});

export { app, server };
